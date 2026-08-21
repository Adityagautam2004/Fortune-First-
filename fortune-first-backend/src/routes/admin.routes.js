const express= require('express');
const router= express.Router();
const Joi = require('joi');
const validate = require('../middleware/validate');

const {
  getUsers, createUser, getUserByIdAdmin, updateUserAdmin, toggleUserActiveAdmin,
  getUserKYC, verifyUserKYC,
  getJoinRequests, updateJoinRequestStatus, getDashboardStats, removePosition,
  getAllSupportTickets, resolveSupportTicket, assignSupportTicket,
  getAllInvestmentsAdmin, getInvestmentByIdAdmin, updateInvestmentStatusAdmin, getInvestmentPayoutsAdmin,
  updatePayoutStatusAdmin, getFinancialsSummary, getAuditLogs, getReturnRate, setReturnRate,
  getAllBlogPostsAdmin, createBlogPost, updateBlogPost, deleteBlogPost,
  getAllTestimonialsAdmin, createTestimonial, updateTestimonial, deleteTestimonial,
  getAllPublicReturnsAdmin, createPublicReturn, updatePublicReturn, deletePublicReturn,
}= require('../controllers/admin.controller');
const { processPayout, getChatHistory, getChatContacts, getPendingPayouts } = require('../controllers/board.controller');
const { requireAuth } = require('../middleware/auth.middleware');
const {requireRole}=require('../middleware/role.middleware')
const { USER_ROLES, INVESTMENT_STATUS, PAYOUT_STATUS } = require('../utils/constants');

router.use(requireAuth)
router.use(requireRole(USER_ROLES.SUPER_ADMIN))

router.get('/dashboard', getDashboardStats);

// ── Users (FR-ADMIN-04..09) ───────────────────────────────
router.get('/users', getUsers);
router.post(
  '/users',
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
router.patch('/users/:id', updateUserAdmin);
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
  validate(Joi.object({
    status: Joi.string().valid(...Object.values(INVESTMENT_STATUS)).required(),
    exit_date: Joi.date().iso().allow(null),
  })),
  updateInvestmentStatusAdmin
);
router.get('/investments/:id/payouts', getInvestmentPayoutsAdmin);
router.patch(
  '/payouts/:id/status',
  validate(Joi.object({
    payout_status: Joi.string().valid(...Object.values(PAYOUT_STATUS)).required(),
    payout_date: Joi.date().iso().allow(null),
  })),
  updatePayoutStatusAdmin
);
router.get('/financials', getFinancialsSummary);

// ── Global return rate (FR-ADMIN-13) ──────────────────────
router.get('/return-rate', getReturnRate);
router.patch('/return-rate', setReturnRate);

// ── Portfolio, support, chat (reused board logic) ─────────
router.delete('/portfolio/:id', removePosition);
router.get('/support', getAllSupportTickets);
router.patch('/support/:id/resolve', resolveSupportTicket);
router.patch(
  '/support/:id/assign',
  validate(Joi.object({ boardMemberId: Joi.string().uuid().required() })),
  assignSupportTicket
);

// Reuse the board controllers directly — same real payout/chat logic, just also
// reachable by super_admin via its own routes (board.routes.js stays untouched
// so investment_head/business_head's existing access isn't widened further).
router.get('/payouts/pending', getPendingPayouts);
router.post('/payouts/process', processPayout);
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

module.exports = router;