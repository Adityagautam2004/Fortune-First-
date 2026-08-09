const { Router } = require('express');
const Joi = require('joi');
const investmentController = require('../controllers/investmentController');
const { requireAuth } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/role.middleware');
const validate = require('../middleware/validate');
const { USER_ROLES, INVESTMENT_STATUS, MIN_INVESTMENT_AMOUNT } = require('../utils/constants');

const router = Router();

// All investment routes require authentication
router.use(requireAuth);

// ── Validation schemas ─────────────────────────────────────────

const createInvestmentSchema = Joi.object({
  customer_id: Joi.string().uuid().required(),
  amount: Joi.number().min(MIN_INVESTMENT_AMOUNT).required(),
  investment_date: Joi.date().iso().required(),
  week_of_month: Joi.number().integer().min(1).max(4).required(),
  tenure_months: Joi.number().integer().min(1).default(3),
  notes: Joi.string().max(500).allow('', null),
});

const updateStatusSchema = Joi.object({
  status: Joi.string()
    .valid(...Object.values(INVESTMENT_STATUS))
    .required(),
  exit_date: Joi.date().iso().allow(null),
});

// ── Routes ─────────────────────────────────────────────────────

// POST /investments — create (investment_head, super_admin)
router.post(
  '/',
  requireRole(USER_ROLES.INVESTMENT_HEAD, USER_ROLES.SUPER_ADMIN),
  validate(createInvestmentSchema),
  investmentController.createInvestment
);

// GET /investments — list all (any authenticated user)
router.get('/', investmentController.getAllInvestments);

// GET /investments/:id — single lookup (any authenticated user)
router.get('/:id', investmentController.getInvestmentById);

// PATCH /investments/:id/status — update status (investment_head, super_admin)
router.patch(
  '/:id/status',
  requireRole(USER_ROLES.INVESTMENT_HEAD, USER_ROLES.SUPER_ADMIN),
  validate(updateStatusSchema),
  investmentController.updateInvestmentStatus
);

module.exports = router;
