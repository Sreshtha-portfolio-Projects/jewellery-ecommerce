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
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Activity tracked
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
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *     responses:
 *       200:
 *         description: Abandoned carts
 */
adminRouter.get('/abandoned-carts', getAbandonedCarts);

/**
 * @swagger
 * /api/admin/abandoned-carts/stats:
 *   get:
 *     summary: Get abandoned cart statistics
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Abandoned cart stats
 */
adminRouter.get('/abandoned-carts/stats', getAbandonedCartStats);

module.exports = { cartActivityRouter: router, adminAbandonedCartRouter: adminRouter };

