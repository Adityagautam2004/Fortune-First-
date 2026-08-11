const { Router } = require('express');

const authRoutes = require('./auth.routes');
const userRoutes = require('./userRoutes');
const investmentRoutes = require('./investmentRoutes');
const payoutRoutes = require('./payoutRoutes');
const customerRoutes = require('./customer.routes');
const boardRoutes = require('./board.routes');
const adminRoutes = require('./admin.routes');
const publicRoutes = require('./public.routes');

const router = Router();

/**
 * Central route aggregator.
 * All sub-routers are mounted under /api/v1 (set in app.js).
 */
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/investments', investmentRoutes);
router.use('/payouts', payoutRoutes);
router.use('/customers', customerRoutes);
router.use('/board', boardRoutes);
router.use('/admin', adminRoutes);
router.use('/public', publicRoutes);
module.exports = router;
