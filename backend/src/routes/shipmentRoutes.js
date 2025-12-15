const express = require('express');
const router = express.Router();
const { createShipment, updateTracking, getShipment } = require('../controllers/shipmentController');
const { authenticateToken } = require('../middleware/auth');

router.post('/:orderId/create', authenticateToken, createShipment);
router.get('/:orderId/tracking', authenticateToken, updateTracking);
router.get('/:orderId', authenticateToken, getShipment);

module.exports = router;

