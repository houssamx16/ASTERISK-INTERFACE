const express = require('express');
const router = express.Router();
const ivrController = require('../controllers/ivrController');
const { authenticateToken } = require('../middleware/auth');

router.get('/', authenticateToken, ivrController.getAll);
router.post('/', authenticateToken, ivrController.create);
router.delete('/:id', authenticateToken, ivrController.delete);

module.exports = router;

