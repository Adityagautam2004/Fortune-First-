const express = require('express');
const router = express.Router();
const Joi = require('joi');
const { getDashboardStats, getInvestmentHistory, getCustomerTransactions } = require('../controllers/customer.controller');
const { requireAuth } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/role.middleware');
const { getProfile, createSupportTicket, getSupportTickets } = require('../controllers/customer.controller');
const {downloadFullReport, downloadMonthlyReport} = require('../controllers/customer.controller');
const { submitKYC, uploadKYCDocument } = require('../controllers/customer.controller');
const { upload } = require('../middleware/upload.middleware');
const validate = require('../middleware/validate');

// UPI VPA format: identifier@handle (e.g. 9876543210@ybl) — the two new
// fields get real validation; the pre-existing PAN/bank/account/IFSC ones
// are left as loose required strings so this doesn't tighten (and risk
// breaking) a submission shape that's already working in production.
const kycSchema = Joi.object({
  panNumber: Joi.string().required(),
  bankName: Joi.string().required(),
  accountNumber: Joi.string().required(),
  ifscCode: Joi.string().required(),
  upiId: Joi.string().pattern(/^[\w.-]+@[\w.-]+$/).required().messages({
    'string.pattern.base': 'UPI ID must be in the format username@bank',
  }),
  dateOfBirth: Joi.date().iso().max('now').required(),
});

router.use(requireAuth);
router.use(requireRole('customer'));

router.get('/dashboard', getDashboardStats);
router.get('/investments', getInvestmentHistory);
router.get('/transactions', getCustomerTransactions);
router.get('/profile', getProfile);
router.post('/support', createSupportTicket);
router.get('/support', getSupportTickets);
router.get('/report/full', downloadFullReport);
router.get('/report/monthly', downloadMonthlyReport);
router.post('/kyc', validate(kycSchema), submitKYC);
router.post('/kyc/document', upload.single('document'), uploadKYCDocument);

module.exports = router;