const investmentService = require('../services/investmentService');
const ApiResponse = require('../utils/apiResponse');

/**
 * POST /api/v1/investments
 * Record a new investment (investment_head / super_admin).
 */
const createInvestment = async (req, res, next) => {
  try {
    // Auto-fill the recorder from the authenticated user
    const data = { ...req.body, recorded_by: req.user.userId };
    const investment = await investmentService.createInvestment(data);
    return ApiResponse.created(res, { investment }, 'Investment recorded successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/investments
 * Paginated investment list with optional filters.
 */
const getAllInvestments = async (req, res, next) => {
  try {
    const { customer_id, status, page, limit } = req.query;
    const result = await investmentService.getAllInvestments({
      customer_id,
      status,
      page: parseInt(page, 10) || 1,
      limit: parseInt(limit, 10) || 20,
    });

    return ApiResponse.ok(res, {
      investments: result.investments,
      pagination: {
        total: result.total,
        page: parseInt(page, 10) || 1,
        limit: parseInt(limit, 10) || 20,
        totalPages: Math.ceil(result.total / (parseInt(limit, 10) || 20)),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/investments/:id
 * Single investment lookup by UUID.
 */
const getInvestmentById = async (req, res, next) => {
  try {
    const investment = await investmentService.getInvestmentById(req.params.id);
    return ApiResponse.ok(res, { investment });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/v1/investments/:id/status
 * Update an investment's status (active/exited/suspended).
 */
const updateInvestmentStatus = async (req, res, next) => {
  try {
    const investment = await investmentService.updateInvestmentStatus(
      req.params.id,
      req.body
    );
    return ApiResponse.ok(res, { investment }, 'Investment status updated successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createInvestment,
  getAllInvestments,
  getInvestmentById,
  updateInvestmentStatus,
};
