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

module.exports = { calculatePayout, getPayoutSummary, getPayoutsByInvestment, updatePayoutStatus };