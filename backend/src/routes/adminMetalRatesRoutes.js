const express = require('express');
const router  = express.Router();
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const {
  getCurrentRates,
  triggerRateUpdate,
  getRatesHistory,
  recalculateProductPrices,
} = require('../controllers/adminMetalRatesController');

// All routes require admin authentication
router.use(authenticateToken);
router.use(requireAdmin);

// GET  /api/admin/metal-rates               – current stored rates
router.get('/', getCurrentRates);

// POST /api/admin/metal-rates/update        – trigger live fetch & store
router.post('/update', triggerRateUpdate);

// GET  /api/admin/metal-rates/history       – ?metal=gold&limit=30
router.get('/history', getRatesHistory);

// POST /api/admin/metal-rates/recalculate-products – bulk reprice products
router.post('/recalculate-products', recalculateProductPrices);

module.exports = router;
