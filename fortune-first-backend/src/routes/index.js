const { Router } = require('express');

const authRoutes = require('./authRoutes');
const userRoutes = require('./userRoutes');
const investmentRoutes = require('./investmentRoutes');
const payoutRoutes = require('./payoutRoutes');

const router = Router();

/**
 * Central route aggregator.
 * All sub-routers are mounted under /api/v1 (set in app.js).
 */
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/investments', investmentRoutes);
router.use('/payouts', payoutRoutes);

module.exports = router;
