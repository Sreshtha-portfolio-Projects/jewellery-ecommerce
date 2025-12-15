const express = require('express');
const router = express.Router();
const { createShipment, updateTracking, getShipment } = require('../controllers/shipmentController');
const { authenticateToken } = require('../middleware/auth');

/**
 * @swagger
 * /api/shipments/{orderId}/create:
 *   post:
 *     summary: Create shipment for order (admin only)
 *     tags: [Shipments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               courierProvider:
 *                 type: string
 *                 enum: [shiprocket, delhivery, bluedart, manual]
 *                 default: shiprocket
 *     responses:
 *       201:
 *         description: Shipment created
 */
router.post('/:orderId/create', authenticateToken, createShipment);

/**
 * @swagger
 * /api/shipments/{orderId}/tracking:
 *   get:
 *     summary: Update and get tracking status
 *     tags: [Shipments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Tracking information
 */
router.get('/:orderId/tracking', authenticateToken, updateTracking);

/**
 * @swagger
 * /api/shipments/{orderId}:
 *   get:
 *     summary: Get shipment details
 *     tags: [Shipments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Shipment details
 *       404:
 *         description: Shipment not found
 */
router.get('/:orderId', authenticateToken, getShipment);

module.exports = router;

