const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { authenticateToken } = require('../middleware/auth');

router.get('/summary', authenticateToken, dashboardController.getSummary);
router.get('/resources', authenticateToken, dashboardController.getResources);
router.post('/service/:name/:action', authenticateToken, dashboardController.controlService);

module.exports = router;

