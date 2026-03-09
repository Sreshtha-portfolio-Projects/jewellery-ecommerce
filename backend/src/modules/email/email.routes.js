const express = require('express');
const router = express.Router();
const {
  subscribe,
  unsubscribe
} = require('./email.controller');

/**
 * @swagger
 * /api/email/subscribe:
 *   post:
 *     summary: Subscribe to email newsletter
 *     tags: [Email Marketing]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *               source:
 *                 type: string
 *                 enum: [signup, newsletter, checkout, manual]
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Subscribed successfully
 */
router.post('/subscribe', subscribe);

/**
 * @swagger
 * /api/email/unsubscribe:
 *   post:
 *     summary: Unsubscribe from email newsletter
 *     tags: [Email Marketing]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *     responses:
 *       200:
 *         description: Unsubscribed successfully
 */
router.post('/unsubscribe', unsubscribe);

module.exports = router;
