const express = require('express');
const router = express.Router();
const { login, refresh, logout, getMe, updateMyProfilePicture, changeInitialPassword, forgotPassword, resetPassword } = require('../controllers/auth.controller');
const { loginRateLimiter } = require('../middleware/rateLimit.middleware');
const { requireAuth } = require('../middleware/auth.middleware');
const { uploadImage } = require('../middleware/upload.middleware');

router.post('/login', loginRateLimiter, login);
router.post('/refresh', refresh);
router.get('/me', requireAuth, getMe);
router.patch('/me/profile-picture', requireAuth, uploadImage.single('picture'), updateMyProfilePicture);
router.post('/logout', requireAuth, logout);
router.post('/change-password', requireAuth, changeInitialPassword);

// Unauthenticated public routes
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

module.exports = router;