const express = require('express');
const router = express.Router();
const dialplanController = require('../controllers/dialplanController');
const { authenticateToken } = require('../middleware/auth');

router.get('/ranges', authenticateToken, dialplanController.getRanges);
router.put('/ranges/:id', authenticateToken, dialplanController.updateRange);
router.get('/rules', authenticateToken, dialplanController.getRules);
router.post('/rules', authenticateToken, dialplanController.createRule);
router.delete('/rules/:id', authenticateToken, dialplanController.deleteRule);
router.get('/forwarding', authenticateToken, dialplanController.getForwardingList);
router.put('/forwarding/:ext', authenticateToken, dialplanController.updateForwarding);
router.post('/reload', authenticateToken, dialplanController.reloadDialplan);

module.exports = router;

