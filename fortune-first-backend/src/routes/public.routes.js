const express = require('express');
const router = express.Router();
const {
  submitJoinRequest, getPublicDashboard,
  getPublishedBlogPosts, getBlogPostBySlug,
} = require('../controllers/public.controller');

// Notice: We do NOT use requireAuth or requireRole here.
router.post('/join-request', submitJoinRequest);
router.get('/dashboard', getPublicDashboard);
router.get('/blog', getPublishedBlogPosts);
router.get('/blog/:slug', getBlogPostBySlug);

module.exports = router;
