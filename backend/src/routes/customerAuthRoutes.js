const express = require('express');
const router = express.Router();
const { signup, login, getProfile } = require('../controllers/customerAuthController');
const { authenticateToken, rateLimit } = require('../middleware/auth');

router.post('/signup', rateLimit(15 * 60 * 1000, 5), signup);
router.post('/login', rateLimit(15 * 60 * 1000, 10), login);
router.get('/profile', authenticateToken, getProfile);

module.exports = router;

