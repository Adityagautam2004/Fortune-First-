const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const redis = require('./redis');

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'local_dev_access_secret_32chars_min';
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'local_dev_refresh_secret_32chars_min';

// Hash raw passwords securely
const hashPassword = async (password) => {
  return await bcrypt.hash(password, 12);
};

// Compare raw password with hashed string
const comparePassword = async (password, hash) => {
  return await bcrypt.compare(password, hash);
};

// Generate 15-minute Access Token
const generateAccessToken = (user) => {
  return jwt.sign(
    {
      userId: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    },
    ACCESS_SECRET,
    { expiresIn: '15m' }
  );
};

// Generate Refresh Token and store key in Redis
const generateRefreshToken = async (user) => {
  // Customers get 7 days, Board/Admin get 1 day
  const expiresInStr = user.role === 'customer' ? '7d' : '1d';
  const ttlSeconds = user.role === 'customer' ? 7 * 24 * 60 * 60 : 24 * 60 * 60;

  const refreshToken = jwt.sign(
    { userId: user.id, role: user.role },
    REFRESH_SECRET,
    { expiresIn: expiresInStr }
  );

  // Store token in Redis: key = refresh_token:{userId}, value = refreshToken
  await redis.set(`refresh_token:${user.id}`, refreshToken, 'EX', ttlSeconds);

  return refreshToken;
};

// Verify Access Token
const verifyAccessToken = (token) => {
  return jwt.verify(token, ACCESS_SECRET);
};

// Verify Refresh Token against Redis
const verifyRefreshToken = async (token) => {
  const decoded = jwt.verify(token, REFRESH_SECRET);
  const storedToken = await redis.get(`refresh_token:${decoded.userId}`);

  if (!storedToken || storedToken !== token) {
    throw new Error('Refresh token invalid or revoked');
  }

  return decoded;
};

// Invalidate Refresh Token on Logout
const revokeRefreshToken = async (userId) => {
  await redis.del(`refresh_token:${userId}`);
};

module.exports = {
  hashPassword,
  comparePassword,
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  revokeRefreshToken
};