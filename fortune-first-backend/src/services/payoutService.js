const db = require('../models/db');
const ApiError = require('../utils/apiError');

/**
 * Record a new monthly return / payout entry.
 * @param {{ investment_id: string, month: number, year: number, return_pct: number, payout_amount: number, processed_by?: string }} data
 * @returns {Promise<object>}
 */
const recordPayout = async (data) => {
  const { investment_id, month, year, return_pct, payout_amount, processed_by } = data;

  const { rows } = await db.query(
    `INSERT INTO monthly_returns (investment_id, month, year, return_pct, payout_amount, processed_by)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [investment_id, month, year, return_pct, payout_amount, processed_by || null]
  );

  return rows[0];
};

/**
 * Get all monthly returns for a given investment.
 * @param {string} investmentId
 * @returns {Promise<object[]>}
 */
const getPayoutsByInvestment = async (investmentId) => {
  const { rows } = await db.query(
    `SELECT mr.*, i.amount AS investment_amount, u.name AS customer_name
     FROM monthly_returns mr
     LEFT JOIN investments i ON i.id = mr.investment_id
     LEFT JOIN users u ON u.id = i.customer_id
     WHERE mr.investment_id = $1
     ORDER BY mr.year DESC, mr.month DESC`,
    [investmentId]
  );

  return rows;
};

/**
 * Update a payout's status (pending → paid / skipped).
 * @param {string} id
 * @param {{ payout_status: string, payout_date?: string, processed_by?: string }} data
 * @returns {Promise<object>}
 */
const updatePayoutStatus = async (id, data) => {
  const { payout_status, payout_date, processed_by } = data;

  const { rows } = await db.query(
    `UPDATE monthly_returns
     SET payout_status = $1, payout_date = $2, processed_by = $3
     WHERE id = $4
     RETURNING *`,
    [payout_status, payout_date || null, processed_by || null, id]
  );

  if (!rows[0]) {
    throw ApiError.notFound('Payout record not found');
  }

  return rows[0];
};

/**
 * Get an aggregated payout summary for the dashboard.
 * Returns total payouts, total amount, and breakdown by status.
 * @returns {Promise<object>}
 */
const getPayoutSummary = async () => {
  const { rows } = await db.query(`
    SELECT
      COUNT(*)::int                                                   AS total_records,
      COALESCE(SUM(payout_amount), 0)::numeric                       AS total_amount,
      COUNT(*) FILTER (WHERE payout_status = 'pending')::int          AS pending_count,
      COALESCE(SUM(payout_amount) FILTER (WHERE payout_status = 'pending'), 0)::numeric   AS pending_amount,
      COUNT(*) FILTER (WHERE payout_status = 'paid')::int             AS paid_count,
      COALESCE(SUM(payout_amount) FILTER (WHERE payout_status = 'paid'), 0)::numeric      AS paid_amount,
      COUNT(*) FILTER (WHERE payout_status = 'skipped')::int          AS skipped_count,
      COALESCE(SUM(payout_amount) FILTER (WHERE payout_status = 'skipped'), 0)::numeric   AS skipped_amount
    FROM monthly_returns
  `);

  return rows[0];
};

module.exports = {
  recordPayout,
  getPayoutsByInvestment,
  updatePayoutStatus,
  getPayoutSummary,
};
