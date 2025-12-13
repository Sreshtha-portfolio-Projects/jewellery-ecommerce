const express = require('express');
const router = express.Router();
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { checkHealth } = require('../controllers/adminController');
const { getDashboardKPIs, getRevenueByMetalType, getSalesComparison, getLowStockProducts } = require('../controllers/adminAnalyticsController');
const { getAllOrders, getOrderDetails } = require('../controllers/adminOrderController');

// All admin routes require authentication
router.use(authenticateToken);
router.use(requireAdmin);

router.get('/health', checkHealth);
router.get('/dashboard/kpis', getDashboardKPIs);
router.get('/analytics/revenue-by-metal', getRevenueByMetalType);
router.get('/analytics/sales-comparison', getSalesComparison);
router.get('/products/low-stock', getLowStockProducts);
router.get('/orders', getAllOrders);
router.get('/orders/:id', getOrderDetails);

module.exports = router;
