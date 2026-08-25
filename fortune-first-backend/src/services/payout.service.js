const db = require('../models/db');

/**
 * FR-ADMIN-15: aggregated payout dashboard data — total paid, pending count,
 * and how much has been paid out in the current calendar month.
 */
const getPayoutSummary = async () => {
  const result = await db.query(
    `SELECT
       COALESCE(SUM(payout_amount) FILTER (WHERE payout_status = 'paid'), 0) AS total_paid,
       COUNT(*) FILTER (WHERE payout_status = 'pending') AS pending_count,
       COALESCE(SUM(payout_amount) FILTER (
         WHERE payout_status = 'paid'
           AND month = EXTRACT(MONTH FROM CURRENT_DATE)
           AND year = EXTRACT(YEAR FROM CURRENT_DATE)
       ), 0) AS paid_this_month
     FROM monthly_returns`
  );
  return result.rows[0];
};

/**
 * Get all monthly_returns for a given investment, oldest first.
 * @param {string} investmentId
 */
const getPayoutsByInvestment = async (investmentId) => {
  const { rows } = await db.query(
    `SELECT * FROM monthly_returns WHERE investment_id = $1 ORDER BY year ASC, month ASC`,
    [investmentId]
  );
  return rows;
};

/**
 * Flat, paginated payout list across all clients (with an optional
 * investmentId/customerId/status filter) — replaces the old per-investment-only
 * getInvestmentPayoutsAdmin endpoint, and is scoped the same way as the
 * investment/withdrawal lists (assigned_to_id for investment_head).
 * @param {{ investment_id?: string, customer_id?: string, status?: string, assigned_to_id?: string, page?: number, limit?: number }} options
 */
const getAllPayouts = async ({ investment_id, customer_id, status, assigned_to_id, page = 1, limit = 20 } = {}) => {
  const offset = (page - 1) * limit;
  const conditions = [];
  const values = [];
  let paramIndex = 1;

  if (investment_id) {
    conditions.push(`mr.investment_id = $${paramIndex++}`);
    values.push(investment_id);
  }
  if (customer_id) {
    conditions.push(`i.customer_id = $${paramIndex++}`);
    values.push(customer_id);
  }
  if (status) {
    conditions.push(`mr.payout_status = $${paramIndex++}`);
    values.push(status);
  }
  if (assigned_to_id) {
    conditions.push(`u.assigned_to = $${paramIndex++}`);
    values.push(assigned_to_id);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const joins = `FROM monthly_returns mr
     JOIN investments i ON i.id = mr.investment_id
     JOIN users u ON u.id = i.customer_id`;

  const countResult = await db.query(`SELECT COUNT(*) ${joins} ${whereClause}`, values);

  const { rows } = await db.query(
    `SELECT mr.*, i.customer_id, u.name AS customer_name, u.email AS customer_email
     ${joins}
     ${whereClause}
     ORDER BY mr.year DESC, mr.month DESC
     LIMIT $${paramIndex++} OFFSET $${paramIndex}`,
    [...values, limit, offset]
  );

  const total = parseInt(countResult.rows[0].count, 10);
  return {
    payouts: rows,
    pagination: { total, page, limit, totalPages: Math.max(1, Math.ceil(total / limit)) },
  };
};

/**
 * Update a payout's status (e.g. correcting pending → paid/skipped).
 * @param {string} id
 * @param {{ payout_status: string, payout_date?: string, processed_by?: string }} data
 */
const updatePayoutStatus = async (id, data) => {
  const ApiError = require('../utils/apiError');
  const { payout_status, payout_date, processed_by } = data;

  const { rows } = await db.query(
    `UPDATE monthly_returns
     SET payout_status = $1, payout_date = $2, processed_by = COALESCE($3, processed_by)
     WHERE id = $4 RETURNING *`,
    [payout_status, payout_date || null, processed_by || null, id]
  );

  if (!rows[0]) {
    throw ApiError.notFound('Payout not found');
  }

  return rows[0];
};

/**
 * Pure function to calculate payout based on Fortune First rules.
 * No database calls, no side effects. Highly testable.
 */
const calculatePayout = (amount, returnPct, investmentWeek, exitWeek = null, isFirstMonth = false) => {
  let applicableReturnPct = returnPct;

  // Investment Proration Rules (First Month Only)
  if (isFirstMonth) {
    if (investmentWeek === 1) applicableReturnPct = returnPct;
    else if (investmentWeek === 2) applicableReturnPct = 1.0; 
    else if (investmentWeek === 3) applicableReturnPct = 0.0; // Payout starts next month at 2%
    else if (investmentWeek === 4) applicableReturnPct = 0.0; // Payout starts next month normally
  }

  // Exit Proration Rules (Final Month)
  if (exitWeek) {
    if (exitWeek === 1) applicableReturnPct = 0.0;
    else if (exitWeek === 2) applicableReturnPct = 0.5;
    else if (exitWeek === 3) applicableReturnPct = 1.0;
    else if (exitWeek === 4) applicableReturnPct = returnPct;
  }

  // Calculate actual monetary payout
  const decimalReturn = applicableReturnPct / 100;
  const rawPayout = amount * decimalReturn;

  // Return to 2 decimal places (financial precision)
  return parseFloat(rawPayout.toFixed(2));
};

module.exports = {
  calculatePayout,
  getPayoutSummary,
  getPayoutsByInvestment,
  getAllPayouts,
  updatePayoutStatus,
};