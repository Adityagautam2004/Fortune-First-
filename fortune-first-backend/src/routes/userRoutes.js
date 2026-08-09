const { Router } = require('express');
const userController = require('../controllers/userController');
const { requireAuth } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/role.middleware');
const { USER_ROLES } = require('../utils/constants');

const router = Router();

// All user routes require authentication
router.use(requireAuth);

// GET /users — list users (super_admin, business_head)
router.get(
  '/',
  requireRole(USER_ROLES.SUPER_ADMIN, USER_ROLES.BUSINESS_HEAD),
  userController.getAllUsers
);

// GET /users/:id — single user (super_admin, business_head, investment_head)
router.get(
  '/:id',
  requireRole(USER_ROLES.SUPER_ADMIN, USER_ROLES.BUSINESS_HEAD, USER_ROLES.INVESTMENT_HEAD),
  userController.getUserById
);

// PUT /users/:id — update user (super_admin only)
router.put(
  '/:id',
  requireRole(USER_ROLES.SUPER_ADMIN),
  userController.updateUser
);

// PATCH /users/:id/toggle-active — soft enable/disable (super_admin only)
router.patch(
  '/:id/toggle-active',
  requireRole(USER_ROLES.SUPER_ADMIN),
  userController.toggleUserActive
);

module.exports = router;
