const express = require('express');
const router = express.Router();
const { getWishlist, addToWishlist, removeFromWishlist, isInWishlist } = require('../controllers/wishlistController');
const { authenticateToken } = require('../middleware/auth');

router.use(authenticateToken);

router.get('/', getWishlist);
router.post('/', addToWishlist);
router.delete('/:productId', removeFromWishlist);
router.get('/check/:productId', isInWishlist);

module.exports = router;

