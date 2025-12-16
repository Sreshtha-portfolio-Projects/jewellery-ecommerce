const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const {
  createOrderIntent,
  getOrderIntent,
  getUserOrderIntents,
  cancelOrderIntent
} = require('../controllers/orderIntentController');

// All routes require authentication
router.use(authenticateToken);

/**
 * @swagger
 * /api/order-intents:
 *   post:
 *     summary: Create order intent from cart
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - shippingAddressId
 *             properties:
 *               shippingAddressId:
 *                 type: string
 *                 format: uuid
 *               billingAddressId:
 *                 type: string
 *                 format: uuid
 *               discountCode:
 *                 type: string
 *     responses:
 *       201:
 *         description: Order intent created
 *       400:
 *         description: Cart validation failed
 *       503:
 *         description: Checkout disabled
 */
router.post('/', createOrderIntent);

/**
 * @swagger
 * /api/order-intents:
 *   get:
 *     summary: Get user's order intents
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [DRAFT, INTENT_CREATED, EXPIRED, CONVERTED, CANCELLED]
 *     responses:
 *       200:
 *         description: List of order intents
 */
router.get('/', getUserOrderIntents);

/**
 * @swagger
 * /api/order-intents/{id}:
 *   get:
 *     summary: Get order intent by ID
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Order intent details
 */
router.get('/:id', getOrderIntent);

/**
 * @swagger
 * /api/order-intents/{id}/cancel:
 *   post:
 *     summary: Cancel order intent
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Order intent cancelled
 */
router.post('/:id/cancel', cancelOrderIntent);

module.exports = router;

