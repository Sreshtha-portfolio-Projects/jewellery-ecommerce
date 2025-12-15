const express = require('express');
const router = express.Router();
const { createOrder, handleWebhook } = require('../controllers/paymentController');
const { authenticate } = require('../middleware/auth');

// Create order and Razorpay order
router.post('/create-order', authenticate, createOrder);

// Webhook endpoint (no auth - Razorpay calls this)
router.post('/webhook', handleWebhook);

module.exports = router;

