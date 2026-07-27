const userService = require('../services/userService');
const ApiResponse = require('../utils/apiResponse');

/**
 * GET /api/v1/users
 * Paginated user list with optional role filtering.
 */
const getAllUsers = async (req, res, next) => {
  try {
    const { role, page, limit } = req.query;
    const result = await userService.getAllUsers({
      role,
      page: parseInt(page, 10) || 1,
      limit: parseInt(limit, 10) || 20,
    });

    return ApiResponse.ok(res, {
      users: result.users,
      pagination: {
        total: result.total,
        page: parseInt(page, 10) || 1,
        limit: parseInt(limit, 10) || 20,
        totalPages: Math.ceil(result.total / (parseInt(limit, 10) || 20)),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/users/:id
 * Single user lookup by UUID.
 */
const getUserById = async (req, res, next) => {
  try {
    const user = await userService.getUserById(req.params.id);
    return ApiResponse.ok(res, { user });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/v1/users/:id
 * Update user fields (admin operation).
 */
const updateUser = async (req, res, next) => {
  try {
    const user = await userService.updateUser(req.params.id, req.body);
    return ApiResponse.ok(res, { user }, 'User updated successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/v1/users/:id/toggle-active
 * Soft enable/disable a user account (admin operation).
 */
const toggleUserActive = async (req, res, next) => {
  try {
    const user = await userService.toggleUserActive(req.params.id);
    const statusLabel = user.is_active ? 'activated' : 'deactivated';
    return ApiResponse.ok(res, { user }, `User ${statusLabel} successfully`);
  } catch (error) {
    next(error);
  }
};

module.exports = { getAllUsers, getUserById, updateUser, toggleUserActive };
