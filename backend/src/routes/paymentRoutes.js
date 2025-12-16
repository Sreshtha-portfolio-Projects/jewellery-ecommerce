const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const {
  createPaymentOrder,
  verifyPayment,
  handleWebhook
} = require('../controllers/paymentController');

/**
 * @swagger
 * /api/payments/create-order:
 *   post:
 *     summary: Create Razorpay payment order
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - orderIntentId
 *             properties:
 *               orderIntentId:
 *                 type: string
 *                 format: uuid
 *                 description: Order intent ID to create payment for
 *     responses:
 *       200:
 *         description: Razorpay order created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 razorpay_order_id:
 *                   type: string
 *                 amount:
 *                   type: number
 *                 currency:
 *                   type: string
 *                 key_id:
 *                   type: string
 *       400:
 *         description: Invalid request
 *       404:
 *         description: Order not found
 *       500:
 *         description: Server error
 */
router.post('/create-order', authenticateToken, createPaymentOrder);

/**
 * @swagger
 * /api/payments/verify-payment:
 *   post:
 *     summary: Verify payment signature
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - orderIntentId
 *               - razorpay_payment_id
 *               - razorpay_order_id
 *               - razorpay_signature
 *             properties:
 *               orderIntentId:
 *                 type: string
 *                 format: uuid
 *               razorpay_payment_id:
 *                 type: string
 *               razorpay_order_id:
 *                 type: string
 *               razorpay_signature:
 *                 type: string
 *     responses:
 *       200:
 *         description: Payment verified successfully
 *       400:
 *         description: Invalid payment signature
 *       404:
 *         description: Order not found
 *       500:
 *         description: Server error
 */
router.post('/verify-payment', authenticateToken, verifyPayment);

/**
 * @swagger
 * /api/payments/webhook:
 *   post:
 *     summary: Handle Razorpay webhook
 *     tags: [Payments]
 *     description: This endpoint handles Razorpay webhooks for payment events. No authentication required.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Webhook received
 *       400:
 *         description: Invalid webhook signature
 */
router.post('/webhook', handleWebhook);

module.exports = router;

