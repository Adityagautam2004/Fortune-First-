const express = require('express');
const router = express.Router();
const { login, refresh, logout, changeInitialPassword } = require('../controllers/auth.controller');
const { loginRateLimiter } = require('../middleware/rateLimit.middleware');
const { requireAuth } = require('../middleware/auth.middleware');

router.post('/login', loginRateLimiter, login);
router.post('/refresh', refresh);
router.post('/logout', requireAuth, logout);
router.post('/change-password', requireAuth, changeInitialPassword);

module.exports = router;