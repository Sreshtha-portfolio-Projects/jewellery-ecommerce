const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../../middleware/auth');
const {
  registerToken,
  unregisterToken,
  trackClick
} = require('./push.controller');

/**
 * @swagger
 * /api/push/register:
 *   post:
 *     summary: Register a push notification token
 *     tags: [Push Notifications]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *             properties:
 *               token:
 *                 type: string
 *               device:
 *                 type: string
 *               browser:
 *                 type: string
 *               os:
 *                 type: string
 *     responses:
 *       200:
 *         description: Token registered successfully
 */
router.post('/register', registerToken);

/**
 * @swagger
 * /api/push/unregister:
 *   post:
 *     summary: Unregister a push notification token
 *     tags: [Push Notifications]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *             properties:
 *               token:
 *                 type: string
 *     responses:
 *       200:
 *         description: Token unregistered successfully
 */
router.post('/unregister', unregisterToken);

/**
 * @swagger
 * /api/push/click/{campaignId}:
 *   post:
 *     summary: Track push notification click
 *     tags: [Push Notifications]
 *     parameters:
 *       - in: path
 *         name: campaignId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Click tracked successfully
 */
router.post('/click/:campaignId', trackClick);

module.exports = router;
