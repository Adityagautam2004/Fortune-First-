const express= require('express');
const router= express.Router();

const {getUsers, createUser, getJoinRequests, updateJoinRequestStatus}= require('../controllers/admin.controller');
const { requireAuth } = require('../middleware/auth.middleware');
const {requireRole}=require('../middleware/role.middleware')

router.use(requireAuth)
router.use(requireRole('admin'))

router.get('/users', getUsers);
router.post('/users', createUser);
router.get('/join-requests', getJoinRequests);
router.put('/join-requests/:id/status', updateJoinRequestStatus);

module.exports = router;