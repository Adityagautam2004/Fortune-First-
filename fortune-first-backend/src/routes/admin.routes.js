const express= require('express');
const router= express.Router();

const {getUsers, createUser, getJoinRequests, updateJoinRequestStatus, getDashboardStats, removePosition, getAllSupportTickets, resolveSupportTicket}= require('../controllers/admin.controller');
const { processPayout, getChatHistory, getPendingPayouts } = require('../controllers/board.controller');
const { requireAuth } = require('../middleware/auth.middleware');
const {requireRole}=require('../middleware/role.middleware')
const { USER_ROLES } = require('../utils/constants');

router.use(requireAuth)
router.use(requireRole(USER_ROLES.SUPER_ADMIN))

router.get('/dashboard', getDashboardStats);
router.get('/users', getUsers);
router.post('/users', createUser);
router.get('/join-requests', getJoinRequests);
router.put('/join-requests/:id/status', updateJoinRequestStatus);
router.delete('/portfolio/:id', removePosition);
router.get('/support', getAllSupportTickets);
router.patch('/support/:id/resolve', resolveSupportTicket);

// Reuse the board controllers directly — same real payout/chat logic, just also
// reachable by super_admin via its own routes (board.routes.js stays untouched
// so investment_head/business_head's existing access isn't widened further).
router.get('/payouts/pending', getPendingPayouts);
router.post('/payouts/process', processPayout);
router.get('/chat/:conversationId', getChatHistory);

module.exports = router;