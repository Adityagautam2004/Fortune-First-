const express = require('express');
const router = express.Router();
const { login, refresh, logout, getMe, changeInitialPassword, forgotPassword, resetPassword } = require('../controllers/auth.controller');
const { loginRateLimiter } = require('../middleware/rateLimit.middleware');
const { requireAuth } = require('../middleware/auth.middleware');

router.post('/login', loginRateLimiter, login);
router.post('/refresh', refresh);
router.get('/me', requireAuth, getMe);
router.post('/logout', requireAuth, logout);
router.post('/change-password', requireAuth, changeInitialPassword);

// Unauthenticated public routes
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

module.exports = router;