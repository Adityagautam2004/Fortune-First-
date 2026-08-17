const crypto = require('crypto');
const db = require('../models/db');
const {
  comparePassword,
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  revokeRefreshToken,
  hashPassword
} = require('../utils/auth.utils');
const { sendPasswordResetEmail } = require('../utils/mailer');

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

    // Set Refresh Token in HTTP-Only Cookie. In production the frontend
    // (Vercel) and backend (Render) live on different domains, so the cookie
    // must be SameSite=None to be sent cross-site — which browsers only honor
    // alongside Secure. Locally, frontend/backend share the "localhost" site
    // (only the port differs) so Lax is enough and doesn't require HTTPS.
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
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
    // clearCookie must be called with the same attributes the cookie was set
    // with, or browsers silently keep the original cookie around.
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    });
    return res.status(200).json({ status: 'success', message: 'Logged out successfully' });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: 'Failed to logout' });
  }
};

const changeInitialPassword = async (req, res) => {
  try {
    const { newPassword } = req.body;
    const userId = req.user.userId;

    const hashedPassword = await hashPassword(newPassword);

    await db.query(
      `UPDATE users SET password_hash = $1, must_change_password = FALSE WHERE id = $2`,
      [hashedPassword, userId]
    );

    return res.status(200).json({ status: 'success', message: 'Password updated successfully' });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: 'Failed to update password' });
  }
};

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    // 1. Verify user exists
    const userRes = await db.query(`SELECT id FROM users WHERE email = $1`, [email]);
    if (userRes.rows.length === 0) {
      // Security best practice: Do not reveal if the email exists to prevent enumeration attacks
      return res.status(200).json({ status: 'success', message: 'If that email exists, a reset link has been sent.' });
    }

    // 2. Generate secure token & expiry (15 minutes from now)
    const resetToken = crypto.randomBytes(32).toString('hex');
    const expiryTime = new Date(Date.now() + 15 * 60 * 1000);

    // 3. Save token to database
    await db.query(
      `UPDATE users SET reset_token = $1, reset_token_expiry = $2 WHERE email = $3`,
      [resetToken, expiryTime, email]
    );

    // 4. Dispatch Email
    await sendPasswordResetEmail(email, resetToken);

    return res.status(200).json({ status: 'success', message: 'If that email exists, a reset link has been sent.' });
  } catch (error) {
    console.error('Forgot Password Error:', error);
    return res.status(500).json({ status: 'error', message: 'Failed to process request' });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    // 1. Find user with this token where the expiry is still in the future
    const userRes = await db.query(
      `SELECT id FROM users WHERE reset_token = $1 AND reset_token_expiry > NOW()`,
      [token]
    );

    if (userRes.rows.length === 0) {
      return res.status(400).json({ status: 'error', message: 'Invalid or expired reset token. Please request a new one.' });
    }

    const userId = userRes.rows[0].id;
    const hashedPassword = await hashPassword(newPassword);

    // 2. Update password and invalidate the token immediately
    await db.query(
      `UPDATE users SET password_hash = $1, reset_token = NULL, reset_token_expiry = NULL WHERE id = $2`,
      [hashedPassword, userId]
    );

    return res.status(200).json({ status: 'success', message: 'Password has been successfully reset. You may now log in.' });
  } catch (error) {
    console.error('Reset Password Error:', error);
    return res.status(500).json({ status: 'error', message: 'Failed to reset password' });
  }
};

module.exports = { login, refresh, logout, changeInitialPassword, forgotPassword, resetPassword };