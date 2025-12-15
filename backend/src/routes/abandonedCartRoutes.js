const express = require('express');
const router = express.Router();
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const {
  trackCartActivity,
  getAbandonedCarts,
  getAbandonedCartStats
} = require('../controllers/abandonedCartController');

/**
 * @swagger
 * /api/cart/activity:
 *   post:
 *     summary: Track cart activity
 *     description: Tracks user cart activity for abandoned cart detection. Updates or creates an abandoned cart record with current cart value and item count.
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Activity tracked successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 tracked:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                   description: Present if cart is empty
 */
router.post('/cart/activity', authenticateToken, trackCartActivity);

// Admin routes
const adminRouter = express.Router();
adminRouter.use(authenticateToken);
adminRouter.use(requireAdmin);

/**
 * @swagger
 * /api/admin/abandoned-carts:
 *   get:
 *     summary: Get abandoned carts
 *     description: Retrieves abandoned cart records, optionally filtered by status. Used for cart recovery campaigns.
 *     tags: [Abandoned Carts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [ACTIVE, ABANDONED, RECOVERED, EXPIRED]
 *         description: Filter by cart status
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *           minimum: 1
 *           maximum: 100
 *         description: Maximum number of records to return
 *     responses:
 *       200:
 *         description: List of abandoned carts
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 abandoned_carts:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/AbandonedCart'
 */
adminRouter.get('/abandoned-carts', getAbandonedCarts);

/**
 * @swagger
 * /api/admin/abandoned-carts/stats:
 *   get:
 *     summary: Get abandoned cart statistics
 *     description: Provides statistics about abandoned carts including total abandoned, abandonment rate, and cart values. Used for admin dashboard analytics.
 *     tags: [Abandoned Carts]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Abandoned cart statistics
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AbandonedCartStats'
 */
adminRouter.get('/abandoned-carts/stats', getAbandonedCartStats);

module.exports = { cartActivityRouter: router, adminAbandonedCartRouter: adminRouter };

