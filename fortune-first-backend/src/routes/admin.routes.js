const express= require('express');
const router= express.Router();

const {getUsers, createUser, getJoinRequests, updateJoinRequestStatus, getDashboardStats, removePosition}= require('../controllers/admin.controller');
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

module.exports = router;