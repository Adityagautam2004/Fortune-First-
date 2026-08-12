const express = require('express');
const router = express.Router();
const { getAssignedClients, addInvestment , processPayout, getChatHistory, getBoardDashboardStats } = require('../controllers/board.controller');
const { getLivePortfolio, addPosition, removePosition } = require('../controllers/portfolio.controller');
const { requireAuth } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/role.middleware');

router.use(requireAuth);
// Allow both board roles through the main gate
router.use(requireRole('investment_head', 'business_head'));

router.get('/dashboard', getBoardDashboardStats);
router.get('/clients', getAssignedClients);
router.post('investments', addInvestment)
router.post('process-payouts', processPayout)
router.get('/chat/:conversationId', getChatHistory);
router.get('/portfolio', getLivePortfolio);
router.post('/portfolio', addPosition);
router.delete('/portfolio/:id', removePosition);
module.exports = router;