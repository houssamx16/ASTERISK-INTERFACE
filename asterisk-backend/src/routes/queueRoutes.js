const express = require('express');
const router = express.Router();
const queueController = require('../controllers/queueController');
const { authenticateToken } = require('../middleware/auth');

router.get('/queues', authenticateToken, queueController.getQueues);
router.post('/queues', authenticateToken, queueController.createQueue);
router.delete('/queues/:id', authenticateToken, queueController.deleteQueue);
router.post('/queues/:id/agents', authenticateToken, queueController.assignAgent);
router.delete('/queues/:id/agents/:agentId', authenticateToken, queueController.removeAgent);
router.get('/queues/:id/stats', authenticateToken, queueController.getStats);

module.exports = router;

