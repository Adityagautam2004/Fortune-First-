const authService = require('../services/authService');
const { generateToken } = require('../utils/generateToken');
const ApiError = require('../utils/apiError');
const ApiResponse = require('../utils/apiResponse');

/**
 * POST /api/v1/auth/register
 * Creates a new user (admin-only operation).
 */
const register = async (req, res, next) => {
  try {
    const user = await authService.createUser(req.body);
    return ApiResponse.created(res, { user }, 'User registered successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/auth/login
 * Authenticates with email + password and returns a JWT.
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // 1. Check user exists
    const user = await authService.findUserByEmail(email);
    if (!user) {
      throw ApiError.unauthorized('Invalid email or password');
    }

    // 2. Check account is active
    if (!user.is_active) {
      throw ApiError.forbidden('Your account has been deactivated. Contact an administrator.');
    }

    // 3. Verify password
    const isMatch = await authService.verifyPassword(password, user.password_hash);
    if (!isMatch) {
      throw ApiError.unauthorized('Invalid email or password');
    }

    // 4. Issue JWT
    const token = generateToken({ id: user.id, email: user.email, role: user.role });

    return ApiResponse.ok(res, {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        must_change_password: user.must_change_password,
      },
    }, 'Login successful');
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/auth/me
 * Returns the currently authenticated user's profile.
 */
const getMe = async (req, res, next) => {
  try {
    const user = await authService.findUserById(req.user.id);
    if (!user) {
      throw ApiError.notFound('User not found');
    }

    // Strip password_hash from the response
    const { password_hash, ...safeUser } = user;
    return ApiResponse.ok(res, { user: safeUser });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/v1/auth/change-password
 * Lets an authenticated user change their password.
 */
const changePassword = async (req, res, next) => {
  try {
    const { current_password, new_password } = req.body;

    // 1. Fetch the full user (with hash)
    const user = await authService.findUserById(req.user.id);
    if (!user) {
      throw ApiError.notFound('User not found');
    }

    // 2. Verify current password
    const isMatch = await authService.verifyPassword(current_password, user.password_hash);
    if (!isMatch) {
      throw ApiError.unauthorized('Current password is incorrect');
    }

    // 3. Update to new password
    await authService.updatePassword(user.id, new_password);

    return ApiResponse.ok(res, null, 'Password changed successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = { register, login, getMe, changePassword };
