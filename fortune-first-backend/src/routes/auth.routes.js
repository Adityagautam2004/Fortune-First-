const express = require('express');
const router = express.Router();
const { login, refresh, logout, getMe, updateMyProfilePicture, changeInitialPassword, forgotPassword, resetPassword } = require('../controllers/auth.controller');
const { loginRateLimiter } = require('../middleware/rateLimit.middleware');
const { requireAuth } = require('../middleware/auth.middleware');
const { uploadImage } = require('../middleware/upload.middleware');
const Joi = require('joi');
const validate = require('../middleware/validate');

router.post('/login', loginRateLimiter, login);
router.post('/refresh', refresh);
router.get('/me', requireAuth, getMe);
router.patch('/me/profile-picture', requireAuth, uploadImage.single('picture'), updateMyProfilePicture);
router.post('/logout', requireAuth, logout);
router.post(
  '/change-password',
  requireAuth,
  validate(Joi.object({ newPassword: Joi.string().min(8).max(128).required() })),
  changeInitialPassword
);

// Unauthenticated public routes
router.post('/forgot-password', forgotPassword);
router.post(
  '/reset-password',
  validate(Joi.object({
    token: Joi.string().required(),
    newPassword: Joi.string().min(8).max(128).required(),
  })),
  resetPassword
);

module.exports = router;