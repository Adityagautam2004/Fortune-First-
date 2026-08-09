const db = require('../models/db');
const { 
  comparePassword, 
  generateAccessToken, 
  generateRefreshToken, 
  verifyRefreshToken, 
  revokeRefreshToken 
} = require('../utils/auth.utils');

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ status: 'error', message: 'Email and password are required' });
    }

    // Raw SQL lookup
    const userResult = await db.query(
      'SELECT id, name, email, password_hash, role, is_active, must_change_password FROM users WHERE email = $1',
      [email.toLowerCase().trim()]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({ status: 'error', message: 'Invalid email or password' });
    }

    const user = userResult.rows[0];

    if (!user.is_active) {
      return res.status(403).json({ status: 'error', message: 'Account suspended. Contact administrator.' });
    }

    const isMatch = await comparePassword(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ status: 'error', message: 'Invalid email or password' });
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = await generateRefreshToken(user);

    // Set Refresh Token in HTTP-Only Cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: user.role === 'customer' ? 7 * 24 * 3600 * 1000 : 24 * 3600 * 1000
    });

    return res.status(200).json({
      status: 'success',
      data: {
        accessToken,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          mustChangePassword: user.must_change_password
        }
      }
    });
  } catch (error) {
    console.error('Login Error:', error);
    return res.status(500).json({ status: 'error', message: 'Internal server error during login' });
  }
};

const refresh = async (req, res) => {
  try {
    const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({ status: 'error', message: 'Refresh token missing' });
    }

    const decoded = await verifyRefreshToken(refreshToken);

    const userResult = await db.query('SELECT id, name, email, role, is_active FROM users WHERE id = $1', [decoded.userId]);
    if (userResult.rows.length === 0 || !userResult.rows[0].is_active) {
      return res.status(401).json({ status: 'error', message: 'User inactive or non-existent' });
    }

    const user = userResult.rows[0];
    const newAccessToken = generateAccessToken(user);

    return res.status(200).json({
      status: 'success',
      data: { accessToken: newAccessToken }
    });
  } catch (error) {
    return res.status(401).json({ status: 'error', message: 'Invalid or expired refresh token' });
  }
};

const logout = async (req, res) => {
  try {
    if (req.user?.userId) {
      await revokeRefreshToken(req.user.userId);
    }
    res.clearCookie('refreshToken');
    return res.status(200).json({ status: 'success', message: 'Logged out successfully' });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: 'Failed to logout' });
  }
};

module.exports = { login, refresh, logout };