const Razorpay = require('razorpay');

// Initialize Razorpay instance (optional - only if keys are provided)
const razorpayKeyId = process.env.RAZORPAY_KEY_ID;
const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET;

// Razorpay is optional - only initialize if keys are provided
let razorpay = null;

if (razorpayKeyId && razorpayKeySecret) {
  // Validate keys in production
  if (process.env.NODE_ENV === 'production') {
    if (!razorpayKeyId.startsWith('rzp_')) {
      console.error('FATAL: Invalid RAZORPAY_KEY_ID format in production');
      process.exit(1);
    }
    if (razorpayKeySecret.length < 20) {
      console.error('FATAL: RAZORPAY_KEY_SECRET appears invalid (too short)');
      process.exit(1);
    }
    // Warn if using test keys in production
    if (razorpayKeyId.startsWith('rzp_test_')) {
      console.warn('WARNING: Using Razorpay TEST keys in production! Switch to live keys.');
    }
  }
  
  razorpay = new Razorpay({
    key_id: razorpayKeyId,
    key_secret: razorpayKeySecret
  });
} else {
  console.warn('Razorpay not configured - payment features will be unavailable');
}

module.exports = razorpay;

