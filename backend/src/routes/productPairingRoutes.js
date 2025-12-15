const express = require('express');
const router = express.Router();
const { getPairedProducts, createPairing, deletePairing } = require('../controllers/productPairingController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// Public routes
router.get('/product/:productId', getPairedProducts);

// Admin routes
router.post('/', authenticateToken, requireAdmin, createPairing);
router.delete('/:pairingId', authenticateToken, requireAdmin, deletePairing);

module.exports = router;

