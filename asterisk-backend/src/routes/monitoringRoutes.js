const express = require('express');
const router = express.Router();
const monitoringController = require('../controllers/monitoringController');
const { authenticateToken } = require('../middleware/auth');

router.get('/live-channels', authenticateToken, monitoringController.getLiveChannels);
router.post('/hangup/:channelId', authenticateToken, monitoringController.hangupChannel);

module.exports = router;

