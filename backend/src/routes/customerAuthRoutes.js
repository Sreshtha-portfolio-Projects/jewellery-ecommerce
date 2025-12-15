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

/**
 * @swagger
 * /api/auth/signup:
 *   post:
 *     summary: Customer signup
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - full_name
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 format: password
 *                 minLength: 6
 *               full_name:
 *                 type: string
 *               phone:
 *                 type: string
 *     responses:
 *       201:
 *         description: Signup successful
 *       400:
 *         description: Validation error
 */
router.post('/signup', rateLimit(15 * 60 * 1000, 5), signup);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Customer login
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 format: password
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                 user:
 *                   type: object
 *       401:
 *         description: Invalid credentials
 */
router.post('/login', rateLimit(15 * 60 * 1000, 10), login);

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Get current user profile
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile
 *       401:
 *         description: Unauthorized
 */
router.get('/me', authenticateToken, getProfile);

router.post('/google', rateLimit(15 * 60 * 1000, 10), googleAuth);
router.get('/google/callback', googleCallback);
router.post('/forgot-password', rateLimit(15 * 60 * 1000, 5), forgotPassword);
router.post('/logout', authenticateToken, logout);

// Legacy route for backward compatibility
router.get('/profile', authenticateToken, getProfile);

module.exports = router;

