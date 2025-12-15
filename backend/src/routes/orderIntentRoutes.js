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
 *     description: Creates an order intent from the user's cart. This locks prices, stock, and discount codes. The intent expires after a configurable time period.
 *     tags: [Order Intents]
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
 *                 description: Shipping address ID
 *               billingAddressId:
 *                 type: string
 *                 format: uuid
 *                 description: Billing address ID (optional, defaults to shipping address)
 *               discountCode:
 *                 type: string
 *                 description: Optional discount code to apply
 *     responses:
 *       201:
 *         description: Order intent created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 order_intent:
 *                   $ref: '#/components/schemas/OrderIntent'
 *                 pricing:
 *                   type: object
 *                   properties:
 *                     subtotal:
 *                       type: number
 *                     discount:
 *                       type: number
 *                     tax:
 *                       type: number
 *                     shipping:
 *                       type: number
 *                     total:
 *                       type: number
 *       400:
 *         description: Cart validation failed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 errors:
 *                   type: array
 *                   items:
 *                     type: string
 *                 requiresRefresh:
 *                   type: boolean
 *       503:
 *         description: Checkout disabled or maintenance mode
 */
router.post('/', createOrderIntent);

/**
 * @swagger
 * /api/order-intents:
 *   get:
 *     summary: Get user's order intents
 *     description: Retrieves all order intents for the authenticated user, optionally filtered by status
 *     tags: [Order Intents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [DRAFT, INTENT_CREATED, EXPIRED, CONVERTED, CANCELLED]
 *         description: Filter by order intent status
 *     responses:
 *       200:
 *         description: List of order intents
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 order_intents:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/OrderIntent'
 */
router.get('/', getUserOrderIntents);

/**
 * @swagger
 * /api/order-intents/{id}:
 *   get:
 *     summary: Get order intent by ID
 *     description: Retrieves a specific order intent by its ID. Automatically expires if past expiry time.
 *     tags: [Order Intents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Order intent ID
 *     responses:
 *       200:
 *         description: Order intent details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 order_intent:
 *                   $ref: '#/components/schemas/OrderIntent'
 *       404:
 *         description: Order intent not found
 */
router.get('/:id', getOrderIntent);

/**
 * @swagger
 * /api/order-intents/{id}/cancel:
 *   post:
 *     summary: Cancel order intent
 *     description: Cancels an order intent and releases locked inventory and discount codes. Can be called by the user or admin.
 *     tags: [Order Intents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Order intent ID
 *     responses:
 *       200:
 *         description: Order intent cancelled successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       400:
 *         description: Cannot cancel order intent (invalid status)
 *       403:
 *         description: Access denied (not owner or admin)
 *       404:
 *         description: Order intent not found
 */
router.post('/:id/cancel', cancelOrderIntent);

module.exports = router;

