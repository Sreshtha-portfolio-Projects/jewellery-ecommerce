const express = require('express');
const router = express.Router();
const { getProductReviews, createReview, deleteReview } = require('../controllers/reviewController');
const { authenticateToken } = require('../middleware/auth');

// Public routes
router.get('/product/:productId', getProductReviews);

// Protected routes (require authentication)
router.post('/product/:productId', authenticateToken, createReview);
router.delete('/:reviewId', authenticateToken, deleteReview);

module.exports = router;

