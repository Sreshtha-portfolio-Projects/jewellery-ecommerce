const express = require('express');
const router = express.Router();
const { getDiscounts, validateDiscount, createDiscount, updateDiscount, deleteDiscount } = require('../controllers/discountController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// Public route for validation
router.post('/validate', validateDiscount);

// Authenticated routes
router.use(authenticateToken);

router.get('/', getDiscounts);

// Admin-only routes
router.post('/', requireAdmin, createDiscount);
router.put('/:id', requireAdmin, updateDiscount);
router.delete('/:id', requireAdmin, deleteDiscount);

module.exports = router;

