const express = require('express');
const router = express.Router();
const { login, refresh, logout } = require('../controllers/auth.controller');
const { loginRateLimiter } = require('../middleware/rateLimit.middleware');
const { requireAuth } = require('../middleware/auth.middleware');

router.post('/login', loginRateLimiter, login);
router.post('/refresh', refresh);
router.post('/logout', requireAuth, logout);

module.exports = router;