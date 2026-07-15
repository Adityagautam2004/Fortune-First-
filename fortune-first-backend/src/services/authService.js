const db = require('../models/db');
const { hashPassword, comparePassword } = require('../utils/hashPassword');
const ApiError = require('../utils/apiError');

/**
 * Find a user by their email address.
 * @param {string} email
 * @returns {Promise<object|null>}
 */
const findUserByEmail = async (email) => {
  const { rows } = await db.query('SELECT * FROM users WHERE email = $1', [email]);
  return rows[0] || null;
};

/**
 * Find a user by their UUID.
 * @param {string} id
 * @returns {Promise<object|null>}
 */
const findUserById = async (id) => {
  const { rows } = await db.query('SELECT * FROM users WHERE id = $1', [id]);
  return rows[0] || null;
};

/**
 * Create a new user in the database.
 * @param {{ name: string, email: string, password: string, role: string, phone?: string, assigned_to?: string, shareholding_pct?: number }} data
 * @returns {Promise<object>} The newly created user (without password_hash)
 */
const createUser = async (data) => {
  const { name, email, password, role, phone, assigned_to, shareholding_pct } = data;

  // Check for duplicate email
  const existing = await findUserByEmail(email);
  if (existing) {
    throw ApiError.conflict('A user with this email already exists');
  }

  const password_hash = await hashPassword(password);

  const { rows } = await db.query(
    `INSERT INTO users (name, email, password_hash, role, phone, assigned_to, shareholding_pct)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING id, name, email, role, phone, is_active, must_change_password, assigned_to, shareholding_pct, created_at`,
    [name, email, password_hash, role, phone || null, assigned_to || null, shareholding_pct || 0]
  );

  return rows[0];
};

/**
 * Verify a plain-text password against a user's stored hash.
 * @param {string} plainPassword
 * @param {string} hashedPassword
 * @returns {Promise<boolean>}
 */
const verifyPassword = async (plainPassword, hashedPassword) => {
  return comparePassword(plainPassword, hashedPassword);
};

/**
 * Update a user's password and clear the must_change_password flag.
 * @param {string} userId
 * @param {string} newPassword
 * @returns {Promise<void>}
 */
const updatePassword = async (userId, newPassword) => {
  const password_hash = await hashPassword(newPassword);
  await db.query(
    `UPDATE users SET password_hash = $1, must_change_password = FALSE, updated_at = NOW() WHERE id = $2`,
    [password_hash, userId]
  );
};

module.exports = {
  findUserByEmail,
  findUserById,
  createUser,
  verifyPassword,
  updatePassword,
};
