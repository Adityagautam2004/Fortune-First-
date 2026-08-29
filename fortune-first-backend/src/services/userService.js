const db = require('../models/db');
const ApiError = require('../utils/apiError');

/**
 * Get all users with optional role/assigned-head/status filtering and pagination.
 * @param {{ role?: string, assigned_to?: string, is_active?: boolean, page?: number, limit?: number }} options
 * @returns {Promise<{ users: object[], total: number }>}
 */
const getAllUsers = async ({ role, assigned_to, is_active, page = 1, limit = 20 } = {}) => {
  const offset = (page - 1) * limit;
  const conditions = [];
  const values = [];
  let paramIndex = 1;

  if (role) {
    conditions.push(`role = $${paramIndex++}`);
    values.push(role);
  }

  if (assigned_to) {
    conditions.push(`assigned_to = $${paramIndex++}`);
    values.push(assigned_to);
  }

  if (is_active !== undefined) {
    conditions.push(`is_active = $${paramIndex++}`);
    values.push(is_active);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  // Get total count for pagination metadata
  const countResult = await db.query(
    `SELECT COUNT(*) FROM users ${whereClause}`,
    values
  );

  // Get the paginated rows (never expose password_hash)
  const { rows } = await db.query(
    `SELECT id, name, email, role, phone, is_active, must_change_password,
            assigned_to, shareholding_pct, profile_picture_url, client_code, created_at, updated_at
     FROM users ${whereClause}
     ORDER BY created_at DESC
     LIMIT $${paramIndex++} OFFSET $${paramIndex}`,
    [...values, limit, offset]
  );

  return {
    users: rows,
    total: parseInt(countResult.rows[0].count, 10),
  };
};

/**
 * Get a single user by UUID (without password_hash).
 * @param {string} id
 * @returns {Promise<object>}
 */
const getUserById = async (id) => {
  const { rows } = await db.query(
    `SELECT id, name, email, role, phone, is_active, must_change_password,
            assigned_to, shareholding_pct, profile_picture_url, client_code, created_at, updated_at
     FROM users WHERE id = $1`,
    [id]
  );

  if (!rows[0]) {
    throw ApiError.notFound('User not found');
  }

  return rows[0];
};

/**
 * Update user fields (admin operation).
 * @param {string} id
 * @param {{ name?: string, email?: string, role?: string, phone?: string, assigned_to?: string, shareholding_pct?: number }} data
 * @returns {Promise<object>} Updated user
 */
const updateUser = async (id, data) => {
  const allowedFields = ['name', 'email', 'role', 'phone', 'assigned_to', 'shareholding_pct'];
  const updates = [];
  const values = [];
  let paramIndex = 1;

  for (const field of allowedFields) {
    if (data[field] !== undefined) {
      updates.push(`${field} = $${paramIndex++}`);
      values.push(data[field]);
    }
  }

  if (updates.length === 0) {
    throw ApiError.badRequest('No valid fields to update');
  }

  updates.push(`updated_at = NOW()`);
  values.push(id);

  const { rows } = await db.query(
    `UPDATE users SET ${updates.join(', ')} WHERE id = $${paramIndex}
     RETURNING id, name, email, role, phone, is_active, must_change_password,
               assigned_to, shareholding_pct, profile_picture_url, client_code, created_at, updated_at`,
    values
  );

  if (!rows[0]) {
    throw ApiError.notFound('User not found');
  }

  return rows[0];
};

/**
 * Toggle a user's is_active status (soft enable/disable).
 * @param {string} id
 * @returns {Promise<object>} Updated user
 */
const toggleUserActive = async (id) => {
  const { rows } = await db.query(
    `UPDATE users SET is_active = NOT is_active, updated_at = NOW() WHERE id = $1
     RETURNING id, name, email, role, is_active`,
    [id]
  );

  if (!rows[0]) {
    throw ApiError.notFound('User not found');
  }

  return rows[0];
};

module.exports = {
  getAllUsers,
  getUserById,
  updateUser,
  toggleUserActive,
};
