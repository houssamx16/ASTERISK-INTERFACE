const express = require('express');
const router = express.Router();
const cdrController = require('../controllers/cdrController');
const { authenticateToken } = require('../middleware/auth');

router.get('/', authenticateToken, cdrController.getRecords);
router.get('/stats', authenticateToken, cdrController.getStats);
router.get('/export', authenticateToken, cdrController.exportCsv);

module.exports = router;

