const express = require('express');
const router = express.Router();
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { checkHealth } = require('../controllers/adminController');
const { getDashboardKPIs, getRevenueByMetalType, getSalesComparison, getLowStockProducts } = require('../controllers/adminAnalyticsController');
const { getAllOrders, getOrderDetails } = require('../controllers/adminOrderController');
const {
  updateShippingStatus,
  createShipment,
  updateShipmentDetails,
  getShippingHistory,
  getNextValidStatuses
} = require('../controllers/adminShippingController');

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

/**
 * @swagger
 * /api/admin/orders/{id}/shipping/status:
 *   post:
 *     summary: Update shipping status
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [PROCESSING, SHIPPED, IN_TRANSIT, OUT_FOR_DELIVERY, DELIVERED, RETURNED]
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Shipping status updated
 */
router.post('/orders/:id/shipping/status', updateShippingStatus);

/**
 * @swagger
 * /api/admin/orders/{id}/shipping/create:
 *   post:
 *     summary: Create shipment (add courier and tracking)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - courier_name
 *               - tracking_number
 *             properties:
 *               courier_name:
 *                 type: string
 *               tracking_number:
 *                 type: string
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Shipment created
 */
router.post('/orders/:id/shipping/create', createShipment);

/**
 * @swagger
 * /api/admin/orders/{id}/shipping/details:
 *   put:
 *     summary: Update shipment details
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               courier_name:
 *                 type: string
 *               tracking_number:
 *                 type: string
 *               notes:
 *                 type: string
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Shipment details updated
 */
router.put('/orders/:id/shipping/details', updateShipmentDetails);

/**
 * @swagger
 * /api/admin/orders/{id}/shipping/history:
 *   get:
 *     summary: Get shipping status history
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Shipping history
 */
router.get('/orders/:id/shipping/history', getShippingHistory);

/**
 * @swagger
 * /api/admin/orders/{id}/shipping/next-statuses:
 *   get:
 *     summary: Get next valid shipping statuses
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Next valid statuses
 */
router.get('/orders/:id/shipping/next-statuses', getNextValidStatuses);

module.exports = router;
