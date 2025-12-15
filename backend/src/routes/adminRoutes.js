const express = require('express');
const router = express.Router();
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { checkHealth } = require('../controllers/adminController');
const { getDashboardKPIs, getRevenueByMetalType, getSalesComparison, getLowStockProducts } = require('../controllers/adminAnalyticsController');
const { getAllOrders, getOrderDetails } = require('../controllers/adminOrderController');

// All admin routes require authentication
router.use(authenticateToken);
router.use(requireAdmin);

/**
 * @swagger
 * /api/admin/health:
 *   get:
 *     summary: Admin health check
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: API and database health status
 */
router.get('/health', checkHealth);

/**
 * @swagger
 * /api/admin/dashboard/kpis:
 *   get:
 *     summary: Get dashboard KPIs
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Dashboard KPIs
 */
router.get('/dashboard/kpis', getDashboardKPIs);

/**
 * @swagger
 * /api/admin/analytics/revenue-by-metal:
 *   get:
 *     summary: Get revenue breakdown by metal type
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Revenue by metal type
 */
router.get('/analytics/revenue-by-metal', getRevenueByMetalType);

/**
 * @swagger
 * /api/admin/analytics/sales-comparison:
 *   get:
 *     summary: Get sales comparison data
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [daily, weekly, monthly]
 *           default: monthly
 *     responses:
 *       200:
 *         description: Sales comparison data
 */
router.get('/analytics/sales-comparison', getSalesComparison);

/**
 * @swagger
 * /api/admin/products/low-stock:
 *   get:
 *     summary: Get low stock products
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: threshold
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Products with low stock
 */
router.get('/products/low-stock', getLowStockProducts);

/**
 * @swagger
 * /api/admin/orders:
 *   get:
 *     summary: Get all orders (admin view)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *     responses:
 *       200:
 *         description: List of orders
 */
router.get('/orders', getAllOrders);

/**
 * @swagger
 * /api/admin/orders/{id}:
 *   get:
 *     summary: Get order details (admin)
 *     tags: [Admin]
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
 *         description: Order details
 */
router.get('/orders/:id', getOrderDetails);

module.exports = router;
