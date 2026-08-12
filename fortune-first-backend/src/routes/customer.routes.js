const express = require('express');
const router = express.Router();
const { getDashboardStats, getInvestmentHistory } = require('../controllers/customer.controller');
const { requireAuth } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/role.middleware');
const { getProfile, createSupportTicket, getSupportTickets } = require('../controllers/customer.controller');
const {downloadFullReport} = require('../controllers/customer.controller');
const { submitKYC } = require('../controllers/customer.controller');

router.use(requireAuth);
router.use(requireRole('customer'));

router.get('/dashboard', getDashboardStats);
router.get('/investments', getInvestmentHistory);
router.get('/profile', getProfile);
router.post('/support', createSupportTicket);
router.get('/support', getSupportTickets);
router.get('/report/full', downloadFullReport);
router.post('/kyc', submitKYC);

module.exports = router;