const express = require('express');
const router = express.Router();
const { createShipment, updateTracking, getShipment } = require('../controllers/shipmentController');
const { authenticate } = require('../middleware/auth');

router.post('/:orderId/create', authenticate, createShipment);
router.get('/:orderId/tracking', authenticate, updateTracking);
router.get('/:orderId', authenticate, getShipment);

module.exports = router;

