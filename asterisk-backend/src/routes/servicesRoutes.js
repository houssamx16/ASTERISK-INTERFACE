const express = require('express');
const router = express.Router();
const servicesController = require('../controllers/servicesController');
const { authenticateToken } = require('../middleware/auth');

router.get('/voicemail', authenticateToken, servicesController.getVoicemails);
router.post('/voicemail', authenticateToken, servicesController.createVoicemail);
router.put('/voicemail/:num', authenticateToken, servicesController.updateVoicemail);
router.get('/conferences', authenticateToken, servicesController.getConferences);
router.post('/conferences', authenticateToken, servicesController.createConference);
router.delete('/conferences/:num', authenticateToken, servicesController.deleteConference);
router.get('/moh', authenticateToken, servicesController.getMOHList);
router.delete('/moh/:id', authenticateToken, servicesController.deleteMOH);

module.exports = router;

