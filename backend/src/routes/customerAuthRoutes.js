const express = require('express');
const router = express.Router();
const { 
  signup, 
  login, 
  getProfile,
  googleAuth,
  googleCallback,
  forgotPassword,
  logout
} = require('../controllers/customerAuthController');
const { authenticateToken, rateLimit } = require('../middleware/auth');

// Customer authentication routes
router.post('/signup', rateLimit(15 * 60 * 1000, 5), signup);
router.post('/login', rateLimit(15 * 60 * 1000, 10), login);
router.post('/google', rateLimit(15 * 60 * 1000, 10), googleAuth);
router.get('/google/callback', googleCallback);
router.post('/forgot-password', rateLimit(15 * 60 * 1000, 5), forgotPassword);
router.post('/logout', authenticateToken, logout);
router.get('/me', authenticateToken, getProfile);

// Legacy route for backward compatibility
router.get('/profile', authenticateToken, getProfile);

module.exports = router;

