const { Router } = require('express');

const authRoutes = require('./auth.routes');
const customerRoutes = require('./customer.routes');
const boardRoutes = require('./board.routes');
const adminRoutes = require('./admin.routes');
const publicRoutes = require('./public.routes');

const router = Router();

/**
 * Central route aggregator.
 * All sub-routers are mounted under /api/v1 (set in app.js).
 *
 * Everything lives under the SRS's role-namespaced structure (3.1.2):
 * /auth, /customer/*, /board/*, /admin/*, /public/*. The older flat
 * /users, /investments, /payouts routes were folded into /admin/* —
 * see admin.controller.js (getUserByIdAdmin, getAllInvestmentsAdmin, etc.),
 * which reuse the same userService/investmentService/payout.service logic.
 */
router.use('/auth', authRoutes);
router.use('/customer', customerRoutes);
router.use('/board', boardRoutes);
router.use('/admin', adminRoutes);
router.use('/public', publicRoutes);
module.exports = router;
