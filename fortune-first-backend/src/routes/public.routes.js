const express = require('express');
const router = express.Router();
const {
  submitJoinRequest, getPublicReturns, getPublicTestimonials,
  getPublishedBlogPosts, getBlogPostBySlug,
  sipCalculator, emiCalculator, retirementCalculator,
} = require('../controllers/public.controller');

// Notice: We do NOT use requireAuth or requireRole here.
router.post('/join-request', submitJoinRequest);
router.get('/returns', getPublicReturns);
router.get('/testimonials', getPublicTestimonials);
router.get('/blog', getPublishedBlogPosts);
router.get('/blog/:slug', getBlogPostBySlug);
router.get('/calculators/sip', sipCalculator);
router.get('/calculators/emi', emiCalculator);
router.get('/calculators/retirement', retirementCalculator);

module.exports = router;