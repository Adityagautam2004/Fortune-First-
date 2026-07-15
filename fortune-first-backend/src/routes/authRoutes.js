const { Router } = require('express');
const Joi = require('joi');
const authController = require('../controllers/authController');
const { authenticate, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { USER_ROLES } = require('../utils/constants');

const router = Router();

// ── Validation schemas ─────────────────────────────────────────

const registerSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(8).max(128).required(),
  role: Joi.string()
    .valid(...Object.values(USER_ROLES))
    .required(),
  phone: Joi.string().max(15).allow('', null),
  assigned_to: Joi.string().uuid().allow(null),
  shareholding_pct: Joi.number().min(0).max(100).allow(null),
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

const changePasswordSchema = Joi.object({
  current_password: Joi.string().required(),
  new_password: Joi.string().min(8).max(128).required(),
});

// ── Routes ─────────────────────────────────────────────────────

// Register a new user (super_admin only)
router.post(
  '/register',
  authenticate,
  authorize(USER_ROLES.SUPER_ADMIN),
  validate(registerSchema),
  authController.register
);

// Login (public)
router.post('/login', validate(loginSchema), authController.login);

// Get current user profile
router.get('/me', authenticate, authController.getMe);

// Change password
router.put(
  '/change-password',
  authenticate,
  validate(changePasswordSchema),
  authController.changePassword
);

module.exports = router;
