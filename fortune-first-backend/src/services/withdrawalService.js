const db = require('../models/db');
const ApiError = require('../utils/apiError');
const { WITHDRAWAL_STATUS } = require('../utils/constants');

/**
 * A client's currently-invested position: active investments minus whatever
 * has already been completed as a withdrawal. There's no physical "balance"
 * column anywhere — this is always computed fresh, same spirit as the
 * SUM(...) FILTER(...) already used for board.controller.js's client list.
 * @param {string} customerId
 * @returns {Promise<number>}
 */
const getAvailableBalance = async (customerId) => {
  const { rows } = await db.query(
    `SELECT
       COALESCE((SELECT SUM(amount) FROM investments WHERE customer_id = $1 AND status = 'active'), 0)
       - COALESCE((SELECT SUM(amount) FROM withdrawals WHERE customer_id = $1 AND status = 'completed'), 0)
       AS balance`,
    [customerId]
  );
  return parseFloat(rows[0].balance);
};

/**
 * Create a withdrawal request — always starts 'pending' admin review, and is
 * rejected up front if it would take the client below zero invested.
 * @param {{ customer_id: string, recorded_by: string, amount: number, withdrawal_date: string, week_of_month?: number, notes?: string }} data
 * @returns {Promise<object>}
 */
const createWithdrawal = async (data, dbClient = db) => {
  const { customer_id, recorded_by, amount, withdrawal_date, week_of_month, notes } = data;

  const availableBalance = await getAvailableBalance(customer_id);
  if (amount > availableBalance) {
    throw ApiError.badRequest(
      `Withdrawal amount (₹${amount}) exceeds this client's currently invested balance (₹${availableBalance})`
    );
  }

  const { rows } = await dbClient.query(
    `INSERT INTO withdrawals (customer_id, recorded_by, amount, withdrawal_date, week_of_month, notes, status)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [customer_id, recorded_by, amount, withdrawal_date, week_of_month || null, notes || null, WITHDRAWAL_STATUS.PENDING]
  );

  return rows[0];
};

/**
 * @param {{ customer_id?: string, status?: string, assigned_to_id?: string, page?: number, limit?: number }} options
 */
const getAllWithdrawals = async ({ customer_id, status, assigned_to_id, page = 1, limit = 20 } = {}) => {
  const offset = (page - 1) * limit;
  const conditions = [];
  const values = [];
  let paramIndex = 1;

  if (customer_id) {
    conditions.push(`w.customer_id = $${paramIndex++}`);
    values.push(customer_id);
  }
  if (status) {
    conditions.push(`w.status = $${paramIndex++}`);
    values.push(status);
  }
  if (assigned_to_id) {
    conditions.push(`u.assigned_to = $${paramIndex++}`);
    values.push(assigned_to_id);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const countResult = await db.query(
    `SELECT COUNT(*) FROM withdrawals w LEFT JOIN users u ON u.id = w.customer_id ${whereClause}`,
    values
  );

  const { rows } = await db.query(
    `SELECT w.*, u.name AS customer_name, u.email AS customer_email
     FROM withdrawals w
     LEFT JOIN users u ON u.id = w.customer_id
     ${whereClause}
     ORDER BY w.created_at DESC
     LIMIT $${paramIndex++} OFFSET $${paramIndex}`,
    [...values, limit, offset]
  );

  const total = parseInt(countResult.rows[0].count, 10);
  return {
    withdrawals: rows,
    pagination: { total, page, limit, totalPages: Math.max(1, Math.ceil(total / limit)) },
  };
};

const getWithdrawalById = async (id) => {
  const { rows } = await db.query(
    `SELECT w.*, u.name AS customer_name, u.email AS customer_email
     FROM withdrawals w
     LEFT JOIN users u ON u.id = w.customer_id
     WHERE w.id = $1`,
    [id]
  );
  if (!rows[0]) {
    throw ApiError.notFound('Withdrawal not found');
  }
  return rows[0];
};

/**
 * Settle a pending withdrawal — 'completed' (optionally with a payment
 * screenshot as proof) or 'rejected'. Guarded the same way as
 * updateJoinRequestStatus: only a still-pending request can be decided.
 * @param {string} id
 * @param {{ status: 'completed'|'rejected', payment_screenshot_url?: string, reviewed_by?: string }} data
 */
const updateWithdrawalStatus = async (id, data) => {
  const { status, payment_screenshot_url, reviewed_by } = data;

  const existing = await db.query(`SELECT status FROM withdrawals WHERE id = $1`, [id]);
  if (existing.rows.length === 0) {
    throw ApiError.notFound('Withdrawal not found');
  }
  if (existing.rows[0].status !== WITHDRAWAL_STATUS.PENDING) {
    throw ApiError.conflict(`Withdrawal has already been ${existing.rows[0].status}`);
  }

  const { rows } = await db.query(
    `UPDATE withdrawals
     SET status = $1, payment_screenshot_url = COALESCE($2, payment_screenshot_url),
         reviewed_by = $3, reviewed_at = NOW()
     WHERE id = $4
     RETURNING *`,
    [status, payment_screenshot_url || null, reviewed_by || null, id]
  );

  return rows[0];
};

module.exports = {
  getAvailableBalance,
  createWithdrawal,
  getAllWithdrawals,
  getWithdrawalById,
  updateWithdrawalStatus,
};
