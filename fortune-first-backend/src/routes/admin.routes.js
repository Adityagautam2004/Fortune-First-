const express= require('express');
const router= express.Router();
const Joi = require('joi');
const validate = require('../middleware/validate');

const {
  getUsers, createUser, getUserByIdAdmin, updateUserAdmin, toggleUserActiveAdmin,
  getUserKYC, verifyUserKYC,
  getJoinRequests, updateJoinRequestStatus, getDashboardStats,
  getAllSupportTickets, resolveSupportTicket, assignSupportTicket,
  getAllInvestmentsAdmin, getInvestmentByIdAdmin, updateInvestmentStatusAdmin,
  getAdminWithdrawals, updateWithdrawalStatusAdmin, getAdminPayouts, getAdminTransactions,
  updatePayoutStatusAdmin, getFinancialsSummary, getAuditLogs, getReturnRate, setReturnRate,
  getAllBlogPostsAdmin, createBlogPost, updateBlogPost, deleteBlogPost,
  getAllTestimonialsAdmin, createTestimonial, updateTestimonial, deleteTestimonial,
  getAllPublicReturnsAdmin, getPublicReturnYears, getYearlyPayoutSummary,
  createPublicReturn, updatePublicReturn, deletePublicReturn,
}= require('../controllers/admin.controller');
const { getChatHistory, getChatContacts } = require('../controllers/board.controller');
const { deleteFundsTransaction } = require('../controllers/stockPortfolio.controller');
const {
  createReport, updateReport, deleteReport,
} = require('../controllers/monthlyReport.controller');
const { requireAuth } = require('../middleware/auth.middleware');
const {requireRole}=require('../middleware/role.middleware')
const { upload, uploadImage } = require('../middleware/upload.middleware');
const { USER_ROLES, INVESTMENT_STATUS, WITHDRAWAL_STATUS, PAYOUT_STATUS } = require('../utils/constants');

router.use(requireAuth)
router.use(requireRole(USER_ROLES.SUPER_ADMIN))

router.get('/dashboard', getDashboardStats);

// ── Users (FR-ADMIN-04..09) ───────────────────────────────
router.get('/users', getUsers);
router.post(
  '/users',
  // multer must run before validate() — it's what actually populates req.body
  // for a multipart request; Joi would see an empty body otherwise.
  uploadImage.single('picture'),
  validate(Joi.object({
    name: Joi.string().max(100).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(8).required(),
    role: Joi.string().valid(...Object.values(USER_ROLES)).required(),
    phone: Joi.string().max(15).allow('', null),
    assignedTo: Joi.string().uuid().when('role', { is: USER_ROLES.CUSTOMER, then: Joi.required(), otherwise: Joi.optional().allow('', null) }),
  })),
  createUser
);
router.get('/users/:id', getUserByIdAdmin);
// uploadImage no-ops on a plain JSON request (multer only intercepts
// multipart/form-data) — existing non-file callers of this route are
// unaffected; a request that does attach a 'picture' file now gets parsed.
router.patch('/users/:id', uploadImage.single('picture'), updateUserAdmin);
router.patch('/users/:id/toggle-active', toggleUserActiveAdmin);
router.get('/users/:id/kyc', getUserKYC);
router.patch(
  '/users/:id/kyc/verify',
  validate(Joi.object({ verified: Joi.boolean().required() })),
  verifyUserKYC
);

// ── Join requests (FR-ADMIN-10..12) ───────────────────────
router.get('/join-requests', getJoinRequests);
router.patch(
  '/join-requests/:id',
  validate(Joi.object({ status: Joi.string().valid('Approved', 'Rejected').required() })),
  updateJoinRequestStatus
);

// ── Investments & payouts (FR-ADMIN-14..16) ───────────────
router.get('/investments', getAllInvestmentsAdmin);
router.get('/investments/:id', getInvestmentByIdAdmin);
router.patch(
  '/investments/:id/status',
  // Legal transitions (pending->active|rejected, active->exited|suspended)
  // are enforced in investmentService — this just validates the value shape.
  validate(Joi.object({
    status: Joi.string().valid(
      INVESTMENT_STATUS.ACTIVE, INVESTMENT_STATUS.REJECTED,
      INVESTMENT_STATUS.EXITED, INVESTMENT_STATUS.SUSPENDED
    ).required(),
    exit_date: Joi.date().iso().allow(null),
  })),
  updateInvestmentStatusAdmin
);
router.patch(
  '/payouts/:id/status',
  validate(Joi.object({
    payout_status: Joi.string().valid(...Object.values(PAYOUT_STATUS)).required(),
    payout_date: Joi.date().iso().allow(null),
  })),
  updatePayoutStatusAdmin
);
router.get('/payouts', getAdminPayouts);
router.get('/financials', getFinancialsSummary);

// ── Withdrawals (FR-WD-04/05) — admin settles what investment_head requested ──
router.get('/withdrawals', getAdminWithdrawals);
router.patch(
  '/withdrawals/:id/status',
  uploadImage.single('screenshot'),
  validate(Joi.object({ status: Joi.string().valid(WITHDRAWAL_STATUS.COMPLETED, WITHDRAWAL_STATUS.REJECTED).required() })),
  updateWithdrawalStatusAdmin
);

// ── Unified transactions (FR-TXN-01) ──────────────────────
router.get('/transactions', getAdminTransactions);

// ── Global return rate (FR-ADMIN-13) ──────────────────────
router.get('/return-rate', getReturnRate);
router.patch('/return-rate', setReturnRate);

// ── Support, chat (reused board logic) ─────────────────────
// Viewing/adding portfolio positions has no separate /admin/* mount — super_admin
// already reaches those via /board/* (its role gate includes super_admin).
// Deleting a funds-transaction log entry is admin-exclusive, so it lives here.
router.delete('/funds-transactions/:id', deleteFundsTransaction);
router.get('/support', getAllSupportTickets);
router.patch('/support/:id/resolve', resolveSupportTicket);
router.patch(
  '/support/:id/assign',
  validate(Joi.object({ boardMemberId: Joi.string().uuid().required() })),
  assignSupportTicket
);

// board.routes.js's role gate now includes super_admin, so the pending/process
// payout actions are reachable directly at /board/payouts/pending and
// /board/payouts — the duplicate /admin/payouts/pending + /admin/payouts/process
// mounts that used to exist purely to work around that gate have been removed.
router.get('/payouts/yearly-summary', getYearlyPayoutSummary);
router.get('/chat/contacts', getChatContacts);
router.get('/chat/:conversationId', getChatHistory);

// ── Audit logs (FR-ADMIN-20..23, read-only/immutable) ─────
router.get('/audit-logs', getAuditLogs);

// ── Content management (FR-ADMIN-17..19) ──────────────────
router.get('/blog', getAllBlogPostsAdmin);
router.post(
  '/blog',
  validate(Joi.object({ title: Joi.string().max(200).required(), content: Joi.string().required(), isPublished: Joi.boolean() })),
  createBlogPost
);
router.patch('/blog/:id', updateBlogPost);
router.delete('/blog/:id', deleteBlogPost);

router.get('/testimonials', getAllTestimonialsAdmin);
router.post(
  '/testimonials',
  validate(Joi.object({
    clientName: Joi.string().max(100).required(),
    city: Joi.string().max(100).allow('', null),
    content: Joi.string().required(),
    rating: Joi.number().integer().min(1).max(5),
    isVisible: Joi.boolean(),
  })),
  createTestimonial
);
router.patch(
  '/testimonials/:id',
  validate(Joi.object({
    clientName: Joi.string().max(100),
    city: Joi.string().max(100).allow('', null),
    content: Joi.string(),
    rating: Joi.number().integer().min(1).max(5),
    isVisible: Joi.boolean(),
  })),
  updateTestimonial
);
router.delete('/testimonials/:id', deleteTestimonial);

// ── Public returns (FR-ADMIN-19) — one entry per calendar month, including
// backfilled past months. returnPct is deliberately constrained to the
// 1.5-2% band this product actually pays out, not an arbitrary 0-100 range.
router.get('/public-returns/years', getPublicReturnYears);
router.get('/public-returns', getAllPublicReturnsAdmin);
router.post(
  '/public-returns',
  validate(Joi.object({
    month: Joi.number().integer().min(1).max(12).required(),
    year: Joi.number().integer().min(2020).max(2100).required(),
    returnPct: Joi.number().min(1.5).max(2).required(),
    notes: Joi.string().max(500).allow('', null),
  })),
  createPublicReturn
);
router.patch(
  '/public-returns/:id',
  validate(Joi.object({
    returnPct: Joi.number().min(1.5).max(2),
    notes: Joi.string().max(500).allow('', null),
  })),
  updatePublicReturn
);
router.delete('/public-returns/:id', deletePublicReturn);

// ── Monthly Reports (FR-REPORTS-01) — simple by design: month/year, three
// headline numbers, and an uploaded PDF as the actual artifact. Every
// non-client role can view (mounted read-side on /board/reports), only
// super_admin can create/edit/delete. ─────────────────────────────────────
const monthlyReportSchema = Joi.object({
  month: Joi.number().integer().min(1).max(12).required(),
  year: Joi.number().integer().min(2000).max(2100).required(),
  operatingCapitalTotal: Joi.number().default(0),
  totalPayout: Joi.number().default(0),
  totalProfit: Joi.number().default(0),
});

router.post(
  '/reports',
  // multer before validate — same ordering rule as every other multipart
  // route: multer is what populates req.body at all.
  upload.single('pdf'),
  validate(monthlyReportSchema),
  createReport
);
router.patch(
  '/reports/:id',
  upload.single('pdf'),
  validate(monthlyReportSchema),
  updateReport
);
router.delete('/reports/:id', deleteReport);

module.exports = router;