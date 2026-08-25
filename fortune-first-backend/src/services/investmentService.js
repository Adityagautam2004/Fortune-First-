const db = require('../models/db');
const ApiError = require('../utils/apiError');
const { INVESTMENT_STATUS } = require('../utils/constants');

/**
 * Create a new investment record — always starts 'pending' admin approval
 * (FR-INV-APPROVAL), regardless of what the DB column default says.
 * @param {{ customer_id: string, recorded_by: string, amount: number, investment_date: string, week_of_month: number, tenure_months?: number, notes?: string, payment_screenshot_url?: string }} data
 * @returns {Promise<object>}
 */
const createInvestment = async (data, dbClient = db) => {
  const {
    customer_id, recorded_by, amount, investment_date,
    week_of_month, tenure_months, notes, payment_screenshot_url,
  } = data;

  const { rows } = await dbClient.query(
    `INSERT INTO investments (customer_id, recorded_by, amount, investment_date, week_of_month, tenure_months, notes, payment_screenshot_url, status)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING *`,
    [customer_id, recorded_by, amount, investment_date, week_of_month, tenure_months || 3, notes || null, payment_screenshot_url || null, INVESTMENT_STATUS.PENDING]
  );

  return rows[0];
};

/**
 * Get all investments with optional filtering and pagination.
 * @param {{ customer_id?: string, status?: string, assigned_to_id?: string, page?: number, limit?: number }} options
 * @returns {Promise<{ investments: object[], total: number }>}
 */
const getAllInvestments = async ({ customer_id, status, assigned_to_id, page = 1, limit = 20 } = {}) => {
  const offset = (page - 1) * limit;
  const conditions = [];
  const values = [];
  let paramIndex = 1;

  if (customer_id) {
    conditions.push(`i.customer_id = $${paramIndex++}`);
    values.push(customer_id);
  }

  if (status) {
    conditions.push(`i.status = $${paramIndex++}`);
    values.push(status);
  }

  // investment_head scoping — only investments belonging to their assigned clients
  if (assigned_to_id) {
    conditions.push(`u.assigned_to = $${paramIndex++}`);
    values.push(assigned_to_id);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const countResult = await db.query(
    `SELECT COUNT(*) FROM investments i LEFT JOIN users u ON u.id = i.customer_id ${whereClause}`,
    values
  );

  const { rows } = await db.query(
    `SELECT i.*, u.name AS customer_name, u.email AS customer_email
     FROM investments i
     LEFT JOIN users u ON u.id = i.customer_id
     ${whereClause}
     ORDER BY i.created_at DESC
     LIMIT $${paramIndex++} OFFSET $${paramIndex}`,
    [...values, limit, offset]
  );

  const total = parseInt(countResult.rows[0].count, 10);
  return {
    investments: rows,
    pagination: { total, page, limit, totalPages: Math.max(1, Math.ceil(total / limit)) },
  };
};

/**
 * Get a single investment by UUID (with customer details).
 * @param {string} id
 * @returns {Promise<object>}
 */
const getInvestmentById = async (id) => {
  const { rows } = await db.query(
    `SELECT i.*, u.name AS customer_name, u.email AS customer_email
     FROM investments i
     LEFT JOIN users u ON u.id = i.customer_id
     WHERE i.id = $1`,
    [id]
  );

  if (!rows[0]) {
    throw ApiError.notFound('Investment not found');
  }

  return rows[0];
};

// Legal transitions: the approval decision (pending -> active|rejected) and the
// pre-existing lifecycle decision (active -> exited|suspended) are two
// separate, non-overlapping groups — anything else is rejected as a conflict
// rather than silently applied (mirrors updateJoinRequestStatus's guard).
const LEGAL_TRANSITIONS = {
  [INVESTMENT_STATUS.PENDING]: [INVESTMENT_STATUS.ACTIVE, INVESTMENT_STATUS.REJECTED],
  [INVESTMENT_STATUS.ACTIVE]: [INVESTMENT_STATUS.EXITED, INVESTMENT_STATUS.SUSPENDED],
};

/**
 * Update an investment's status, enforcing the legal transition graph above.
 * @param {string} id
 * @param {{ status: string, exit_date?: string, reviewed_by?: string }} data
 * @returns {Promise<object>}
 */
const updateInvestmentStatus = async (id, data) => {
  const { status, exit_date, reviewed_by } = data;

  const existing = await db.query(`SELECT status FROM investments WHERE id = $1`, [id]);
  if (existing.rows.length === 0) {
    throw ApiError.notFound('Investment not found');
  }

  const currentStatus = existing.rows[0].status;
  const allowedNextStatuses = LEGAL_TRANSITIONS[currentStatus] || [];
  if (!allowedNextStatuses.includes(status)) {
    throw ApiError.conflict(`Cannot change investment status from '${currentStatus}' to '${status}'`);
  }

  const isApprovalDecision = currentStatus === INVESTMENT_STATUS.PENDING;

  const { rows } = await db.query(
    `UPDATE investments
     SET status = $1, exit_date = $2, reviewed_by = $3, reviewed_at = CASE WHEN $4 THEN NOW() ELSE reviewed_at END
     WHERE id = $5
     RETURNING *`,
    [status, exit_date || null, reviewed_by || null, isApprovalDecision, id]
  );

  return rows[0];
};

module.exports = {
  createInvestment,
  getAllInvestments,
  getInvestmentById,
  updateInvestmentStatus,
};
