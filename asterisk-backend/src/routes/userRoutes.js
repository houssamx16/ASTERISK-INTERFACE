const express = require('express');
const router = express.Router();
const usersController = require('../controllers/usersController');
const { authenticateToken } = require('../middleware/auth');

router.get('/', authenticateToken, usersController.getAll);
router.post('/', authenticateToken, usersController.create);
router.delete('/:id', authenticateToken, usersController.delete);

module.exports = router;

