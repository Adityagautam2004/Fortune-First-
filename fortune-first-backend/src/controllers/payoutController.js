const payoutService = require('../services/payout.service');
const ApiResponse = require('../utils/apiResponse');

/**
 * POST /api/v1/payouts
 * Record a new monthly return / payout entry.
 */
const recordPayout = async (req, res, next) => {
  try {
    const data = { ...req.body, processed_by: req.user.id };
    const payout = await payoutService.recordPayout(data);
    return ApiResponse.created(res, { payout }, 'Payout recorded successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/payouts/investment/:investmentId
 * List all monthly returns for a given investment.
 */
const getPayoutsByInvestment = async (req, res, next) => {
  try {
    const payouts = await payoutService.getPayoutsByInvestment(req.params.investmentId);
    return ApiResponse.ok(res, { payouts });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/v1/payouts/:id/status
 * Update a payout's status (pending → paid / skipped).
 */
const updatePayoutStatus = async (req, res, next) => {
  try {
    const data = { ...req.body, processed_by: req.user.id };
    const payout = await payoutService.updatePayoutStatus(req.params.id, data);
    return ApiResponse.ok(res, { payout }, 'Payout status updated successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/payouts/summary
 * Aggregated payout dashboard data.
 */
const getPayoutSummary = async (req, res, next) => {
  try {
    const summary = await payoutService.getPayoutSummary();
    return ApiResponse.ok(res, { summary });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  recordPayout,
  getPayoutsByInvestment,
  updatePayoutStatus,
  getPayoutSummary,
};
