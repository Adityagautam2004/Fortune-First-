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
const {
  searchStocks, getPortfolio, getBusinessHeads, addStock, buyMoreStock, sellStock, getFundsTransactions,
} = require('../controllers/stockPortfolio.controller');
const { getReports, getReportById } = require('../controllers/monthlyReport.controller');
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

const addStockSchema = Joi.object({
  symbol: Joi.string().trim().max(20).required(),
  companyName: Joi.string().trim().max(255).required(),
  quantity: Joi.number().greater(0).required(),
  price: Joi.number().greater(0).required(),
  orderType: Joi.string().valid('regular', 'mtf').default('regular'),
});

const stockTradeSchema = Joi.object({
  quantity: Joi.number().greater(0).required(),
  price: Joi.number().greater(0).required(),
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

// ── Investments (FR-INV-01/APPROVAL) — investment_head or super_admin may
// create one; business_head cannot (its own domain is the stock portfolio) ─
router.post(
  '/investments',
  requireRole('investment_head', 'super_admin'),
  uploadImage.single('screenshot'),
  validate(investmentSchema),
  addInvestment
);
router.get('/investments', getBoardInvestments);

// ── Withdrawals (FR-WD-01..03) — investment_head or super_admin only ──────
router.post('/withdrawals', requireRole('investment_head', 'super_admin'), validate(withdrawalSchema), addWithdrawal);
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

// ── Firm-wide stock portfolio (FR-PORTFOLIO-01) — everyone here can view;
// only business_head can add/buy-more/sell ────────────────────────────────
router.get('/stocks/search', requireRole('business_head'), searchStocks);
router.get('/portfolio/business-heads', getBusinessHeads);
router.get('/portfolio', getPortfolio);
router.post('/portfolio', requireRole('business_head'), validate(addStockSchema), addStock);
router.post('/portfolio/:id/buy', requireRole('business_head'), validate(stockTradeSchema), buyMoreStock);
router.post('/portfolio/:id/sell', requireRole('business_head'), validate(stockTradeSchema), sellStock);
router.get('/funds-transactions', getFundsTransactions);

// ── Monthly Reports (FR-REPORTS-01) — view-only here for all three board
// roles; create/edit/delete is super_admin-only, over on /admin/reports ───
router.get('/reports', getReports);
router.get('/reports/:id', getReportById);

module.exports = router;
