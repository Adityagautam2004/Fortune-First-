const db = require('../models/db');
const ApiError = require('../utils/apiError');

/**
 * Create a new investment record.
 * @param {{ customer_id: string, recorded_by: string, amount: number, investment_date: string, week_of_month: number, tenure_months?: number, notes?: string }} data
 * @returns {Promise<object>}
 */
const createInvestment = async (data) => {
  const {
    customer_id, recorded_by, amount, investment_date,
    week_of_month, tenure_months, notes,
  } = data;

  const { rows } = await db.query(
    `INSERT INTO investments (customer_id, recorded_by, amount, investment_date, week_of_month, tenure_months, notes)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [customer_id, recorded_by, amount, investment_date, week_of_month, tenure_months || 3, notes || null]
  );

  return rows[0];
};

/**
 * Get all investments with optional filtering and pagination.
 * @param {{ customer_id?: string, status?: string, page?: number, limit?: number }} options
 * @returns {Promise<{ investments: object[], total: number }>}
 */
const getAllInvestments = async ({ customer_id, status, page = 1, limit = 20 } = {}) => {
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

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const countResult = await db.query(
    `SELECT COUNT(*) FROM investments i ${whereClause}`,
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

  return {
    investments: rows,
    total: parseInt(countResult.rows[0].count, 10),
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

/**
 * Update an investment's status (and optionally set the exit_date).
 * @param {string} id
 * @param {{ status: string, exit_date?: string }} data
 * @returns {Promise<object>}
 */
const updateInvestmentStatus = async (id, data) => {
  const { status, exit_date } = data;

  const { rows } = await db.query(
    `UPDATE investments
     SET status = $1, exit_date = $2
     WHERE id = $3
     RETURNING *`,
    [status, exit_date || null, id]
  );

  if (!rows[0]) {
    throw ApiError.notFound('Investment not found');
  }

  return rows[0];
};

module.exports = {
  createInvestment,
  getAllInvestments,
  getInvestmentById,
  updateInvestmentStatus,
};
