const express = require('express');
const router = express.Router();
const backupController = require('../controllers/backupController');
const { authenticateToken } = require('../middleware/auth');

router.get('/backups', authenticateToken, backupController.getAll);
router.post('/backups', authenticateToken, backupController.create);
router.post('/backups/:id/restore', authenticateToken, backupController.restore);
router.delete('/backups/:id', authenticateToken, backupController.delete);

module.exports = router;

