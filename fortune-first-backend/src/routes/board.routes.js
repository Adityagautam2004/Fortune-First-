const express = require('express');
const router = express.Router();
const Joi = require('joi');
const {
  getAssignedClients, addInvestment, getBoardInvestments,
  addWithdrawal, getBoardWithdrawals, getBoardPayouts, getBoardTransactions,
  processPayout, getChatHistory, getChatContacts, getBoardDashboardStats, voidPayout,
  getClientActiveInvestments, getClientDetail, getPendingPayouts,
  sendClientReport, sendClientEmail, getBoardReturnRate,
} = require('../controllers/board.controller');
const { getLivePortfolio, addPosition, removePosition } = require('../controllers/portfolio.controller');
const { requireAuth } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/role.middleware');
const { uploadImage } = require('../middleware/upload.middleware');
const validate = require('../middleware/validate');

const investmentSchema = Joi.object({
  customerId: Joi.string().uuid().required(),
  amount: Joi.number().min(5000).required(),
  investmentDate: Joi.date().iso().required(),
  weekOfMonth: Joi.number().integer().min(1).max(4).required(),
  notes: Joi.string().max(500).allow('', null),
});

const withdrawalSchema = Joi.object({
  customerId: Joi.string().uuid().required(),
  amount: Joi.number().min(5000).required(),
  withdrawalDate: Joi.date().iso().required(),
  weekOfMonth: Joi.number().integer().min(1).max(4).allow(null),
  notes: Joi.string().max(500).allow('', null),
});

router.use(requireAuth);
// investment_head/business_head are the two board roles; super_admin is
// included too so super_admin doesn't need a second, duplicate mount of the
// same payout endpoints under /admin/* (that duplication has been removed).
router.use(requireRole('investment_head', 'business_head', 'super_admin'));

router.get('/dashboard', getBoardDashboardStats);
router.get('/clients', getAssignedClients);
router.get('/clients/:id', getClientDetail);
router.get('/clients/:id/investments/active', getClientActiveInvestments);
router.get('/return-rate', getBoardReturnRate);
router.post(
  '/clients/:id/send-report',
  (req, res, next) => (['investment_head', 'super_admin'].includes(req.user.role) ? next() : res.status(403).json({ status: 'error', message: 'Forbidden' })),
  sendClientReport
);
router.post(
  '/clients/:id/send-email',
  (req, res, next) => (['investment_head', 'super_admin'].includes(req.user.role) ? next() : res.status(403).json({ status: 'error', message: 'Forbidden' })),
  sendClientEmail
);

// ── Investments (FR-INV-01/APPROVAL) — only investment_head may create ────
router.post(
  '/investments',
  requireRole('investment_head'),
  uploadImage.single('screenshot'),
  validate(investmentSchema),
  addInvestment
);
router.get('/investments', getBoardInvestments);

// ── Withdrawals (FR-WD-01..03) — only investment_head may request one ─────
router.post('/withdrawals', requireRole('investment_head'), validate(withdrawalSchema), addWithdrawal);
router.get('/withdrawals', getBoardWithdrawals);

// ── Payouts ────────────────────────────────────────────────────────────────
router.get('/payouts/pending', getPendingPayouts);
router.get('/payouts', getBoardPayouts);
router.post('/payouts', processPayout);
router.patch('/payouts/:returnId/void', voidPayout);

// ── Unified transactions (FR-TXN-01) ────────────────────────────────────────
router.get('/transactions', getBoardTransactions);

router.get('/chat/contacts', getChatContacts);
router.get('/chat/:conversationId', getChatHistory);
router.get('/portfolio', getLivePortfolio);
router.post('/portfolio', addPosition);
router.delete('/portfolio/:id', removePosition);
module.exports = router;
