const express = require('express');
const router = express.Router();
const { submitJoinRequest } = require('../controllers/public.controller');

// Notice: We do NOT use requireAuth or requireRole here.
router.post('/join-request', submitJoinRequest);

module.exports = router;