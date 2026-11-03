const express = require('express');
const router = express.Router();
const extensionsController = require('../controllers/extensionsController');
const { authenticateToken } = require('../middleware/auth');

router.get('/', authenticateToken, extensionsController.getAll);
router.post('/', authenticateToken, extensionsController.create);
router.put('/:id', authenticateToken, extensionsController.update);
router.patch('/:id/toggle', authenticateToken, extensionsController.toggleStatus);
router.delete('/:id', authenticateToken, extensionsController.delete);
router.post('/apply-config', authenticateToken, extensionsController.applyConfig);

module.exports = router;

