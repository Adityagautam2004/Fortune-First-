const express = require('express');
const router = express.Router();
const { getAssignedClients, addInvestment , processPayout} = require('../controllers/board.controller');
const { requireAuth } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/role.middleware');

router.use(requireAuth);
// Allow both board roles through the main gate
router.use(requireRole('investment_head', 'business_head'));

router.get('/clients', getAssignedClients);
router.post('investments', addInvestment)
router.post('process-payouts', processPayout)
module.exports = router;