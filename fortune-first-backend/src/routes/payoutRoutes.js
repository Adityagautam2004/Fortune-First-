const { Router } = require('express');
const Joi = require('joi');
const payoutController = require('../controllers/payoutController');
const { requireAuth } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/role.middleware');
const validate = require('../middleware/validate');
const { USER_ROLES, PAYOUT_STATUS } = require('../utils/constants');

const router = Router();

// All payout routes require authentication
router.use(requireAuth);

// ── Validation schemas ─────────────────────────────────────────

const recordPayoutSchema = Joi.object({
  investment_id: Joi.string().uuid().required(),
  month: Joi.number().integer().min(1).max(12).required(),
  year: Joi.number().integer().min(2020).max(2100).required(),
  return_pct: Joi.number().min(0).max(100).required(),
  payout_amount: Joi.number().min(0).required(),
});

const updatePayoutStatusSchema = Joi.object({
  payout_status: Joi.string()
    .valid(...Object.values(PAYOUT_STATUS))
    .required(),
  payout_date: Joi.date().iso().allow(null),
});

// ── Routes ─────────────────────────────────────────────────────

// POST /payouts — record a new monthly return (investment_head, super_admin)
router.post(
  '/',
  requireRole(USER_ROLES.INVESTMENT_HEAD, USER_ROLES.SUPER_ADMIN),
  validate(recordPayoutSchema),
  payoutController.recordPayout
);

// GET /payouts/summary — aggregated dashboard data (business_head, super_admin)
// NOTE: This route must be before /:id routes to avoid conflicts
router.get(
  '/summary',
  requireRole(USER_ROLES.BUSINESS_HEAD, USER_ROLES.SUPER_ADMIN),
  payoutController.getPayoutSummary
);

// GET /payouts/investment/:investmentId — list returns for an investment
router.get('/investment/:investmentId', payoutController.getPayoutsByInvestment);

// PATCH /payouts/:id/status — update payout status (business_head, super_admin)
router.patch(
  '/:id/status',
  requireRole(USER_ROLES.BUSINESS_HEAD, USER_ROLES.SUPER_ADMIN),
  validate(updatePayoutStatusSchema),
  payoutController.updatePayoutStatus
);

module.exports = router;
