const express = require('express');
const router = express.Router();
const { getDashboardStats, getInvestmentHistory } = require('../controllers/customer.controller');
const { requireAuth } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/role.middleware');
const { getProfile, createSupportTicket, getSupportTickets } = require('../controllers/customer.controller');
const {downloadFullReport, downloadMonthlyReport} = require('../controllers/customer.controller');
const { submitKYC, uploadKYCDocument } = require('../controllers/customer.controller');
const upload = require('../middleware/upload.middleware');

router.use(requireAuth);
router.use(requireRole('customer'));

router.get('/dashboard', getDashboardStats);
router.get('/investments', getInvestmentHistory);
router.get('/profile', getProfile);
router.post('/support', createSupportTicket);
router.get('/support', getSupportTickets);
router.get('/report/full', downloadFullReport);
router.get('/report/monthly', downloadMonthlyReport);
router.post('/kyc', submitKYC);
router.post('/kyc/document', upload.single('document'), uploadKYCDocument);

module.exports = router;