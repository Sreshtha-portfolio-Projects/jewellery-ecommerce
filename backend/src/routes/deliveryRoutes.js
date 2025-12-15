const express = require('express');
const router = express.Router();
const { checkDelivery } = require('../controllers/deliveryController');

/**
 * @swagger
 * /api/delivery/check:
 *   get:
 *     summary: Check delivery availability by pincode
 *     tags: [Delivery]
 *     parameters:
 *       - in: query
 *         name: pincode
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[0-9]{6}$'
 *         description: 6-digit Indian pincode
 *         example: '110001'
 *     responses:
 *       200:
 *         description: Delivery information
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 available:
 *                   type: boolean
 *                 pincode:
 *                   type: string
 *                 city:
 *                   type: string
 *                 state:
 *                   type: string
 *                 estimatedDays:
 *                   type: integer
 *                 estimatedDate:
 *                   type: string
 *                   format: date-time
 *                 shippingCharge:
 *                   type: number
 *                 message:
 *                   type: string
 */
router.get('/check', checkDelivery);

module.exports = router;

