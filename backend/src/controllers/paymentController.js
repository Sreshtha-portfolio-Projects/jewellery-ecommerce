const razorpay = require('../config/razorpay');
const supabase = require('../config/supabase');
const crypto = require('crypto');
const { convertIntentToOrder } = require('../services/orderIntentToOrderConverter');

/**
 * Create Razorpay order for payment from order intent
 * POST /api/payments/create-order
 */
const createPaymentOrder = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { orderIntentId } = req.body;

    if (!orderIntentId) {
      return res.status(400).json({ message: 'Order intent ID is required' });
    }

    // Get order intent details
    const { data: orderIntent, error: intentError } = await supabase
      .from('order_intents')
      .select('*')
      .eq('id', orderIntentId)
      .eq('user_id', userId)
      .single();

    if (intentError || !orderIntent) {
      return res.status(404).json({ message: 'Order intent not found' });
    }

    // Check if intent is already converted
    if (orderIntent.status === 'CONVERTED') {
      return res.status(400).json({ message: 'Order intent has already been converted to order' });
    }

    // Check if intent is expired
    if (new Date(orderIntent.expires_at) < new Date()) {
      return res.status(400).json({ message: 'Order intent has expired' });
    }

    // Check if intent status is valid
    if (orderIntent.status !== 'INTENT_CREATED') {
      return res.status(400).json({ message: `Cannot create payment for order intent with status: ${orderIntent.status}` });
    }

    // Check if Razorpay order already exists
    if (orderIntent.razorpay_order_id) {
      // Return existing Razorpay order details
      return res.json({
        razorpay_order_id: orderIntent.razorpay_order_id,
        amount: Math.round(orderIntent.total_amount * 100), // Convert to paise
        currency: 'INR',
        key_id: process.env.RAZORPAY_KEY_ID
      });
    }

    // Create Razorpay order
    const razorpayOrder = await razorpay.orders.create({
      amount: Math.round(orderIntent.total_amount * 100), // Convert rupees to paise
      currency: 'INR',
      receipt: orderIntent.intent_number,
      notes: {
        order_intent_id: orderIntent.id,
        user_id: userId,
        intent_number: orderIntent.intent_number
      }
    });

    // Update order intent with Razorpay order ID
    // Note: If razorpay_order_id column doesn't exist, store in metadata
    const updateData = {};
    try {
      // Try to update razorpay_order_id column directly
      const { error: updateError } = await supabase
        .from('order_intents')
        .update({ razorpay_order_id: razorpayOrder.id })
        .eq('id', orderIntentId);

      if (updateError) {
        // Column might not exist, store in metadata instead
        const metadata = orderIntent.metadata || {};
        metadata.razorpay_order_id = razorpayOrder.id;
        const { error: metadataError } = await supabase
          .from('order_intents')
          .update({ metadata })
          .eq('id', orderIntentId);
        
        if (metadataError) {
          console.error('Error updating order intent with Razorpay order ID:', metadataError);
          return res.status(500).json({ message: 'Error creating payment order' });
        }
      }
    } catch (error) {
      console.error('Error updating order intent:', error);
      // Store in metadata as fallback
      const metadata = orderIntent.metadata || {};
      metadata.razorpay_order_id = razorpayOrder.id;
      await supabase
        .from('order_intents')
        .update({ metadata })
        .eq('id', orderIntentId);
    }

    res.json({
      razorpay_order_id: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      key_id: process.env.RAZORPAY_KEY_ID
    });
  } catch (error) {
    console.error('Error creating Razorpay order:', error);
    const errorMessage = process.env.NODE_ENV === 'production'
      ? 'Error creating payment order'
      : error.message || 'Error creating payment order';
    res.status(500).json({ message: errorMessage });
  }
};

/**
 * Verify payment signature and convert order intent to order
 * POST /api/payments/verify-payment
 */
const verifyPayment = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { orderIntentId, razorpay_payment_id, razorpay_order_id, razorpay_signature } = req.body;

    if (!orderIntentId || !razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
      return res.status(400).json({ message: 'Missing required payment details' });
    }

    // Get order intent
    const { data: orderIntent, error: intentError } = await supabase
      .from('order_intents')
      .select('*')
      .eq('id', orderIntentId)
      .eq('user_id', userId)
      .single();

    if (intentError || !orderIntent) {
      return res.status(404).json({ message: 'Order intent not found' });
    }

    // Verify signature
    const text = `${razorpay_order_id}|${razorpay_payment_id}`;
    const generatedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(text)
      .digest('hex');

    if (generatedSignature !== razorpay_signature) {
      return res.status(400).json({ message: 'Invalid payment signature' });
    }

    // Fetch payment details from Razorpay
    const payment = await razorpay.payments.fetch(razorpay_payment_id);

    if (payment.status !== 'captured') {
      return res.status(400).json({ message: 'Payment not captured' });
    }

    // Convert order intent to order
    const paymentDetails = {
      razorpay_payment_id: razorpay_payment_id,
      razorpay_order_id: razorpay_order_id,
      razorpay_signature: razorpay_signature,
      method: payment.method || 'online'
    };

    const order = await convertIntentToOrder(orderIntentId, paymentDetails);

    res.json({
      verified: true,
      order_id: order.id,
      order_number: order.order_number,
      message: 'Payment verified successfully and order created'
    });
  } catch (error) {
    console.error('Error verifying payment:', error);
    const errorMessage = process.env.NODE_ENV === 'production'
      ? 'Error verifying payment'
      : error.message || 'Error verifying payment';
    res.status(500).json({ message: errorMessage });
  }
};

/**
 * Handle Razorpay webhook
 * POST /api/payments/webhook
 * Note: This endpoint should NOT require authentication
 */
const handleWebhook = async (req, res) => {
  try {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    const signature = req.headers['x-razorpay-signature'];

    if (!signature || !webhookSecret) {
      return res.status(400).json({ message: 'Missing webhook signature or secret' });
    }

    // Verify webhook signature
    const text = JSON.stringify(req.body);
    const generatedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(text)
      .digest('hex');

    if (generatedSignature !== signature) {
      console.error('Invalid webhook signature');
      return res.status(400).json({ message: 'Invalid webhook signature' });
    }

    const event = req.body.event;
    const payment = req.body.payload.payment?.entity || req.body.payload.payment;

    if (!payment) {
      return res.status(400).json({ message: 'Invalid webhook payload' });
    }

    // Find order intent by Razorpay order ID
    // Try to find by razorpay_order_id column first, then fallback to metadata
    let orderIntent = null;
    let intentError = null;
    
    // Try direct column lookup
    const { data: intentByColumn, error: columnError } = await supabase
      .from('order_intents')
      .select('*')
      .eq('razorpay_order_id', payment.order_id)
      .maybeSingle();
    
    if (intentByColumn) {
      orderIntent = intentByColumn;
    } else {
      // Fallback: search in metadata
      const { data: intents, error: metadataError } = await supabase
        .from('order_intents')
        .select('*');
      
      if (!metadataError && intents) {
        orderIntent = intents.find(intent => 
          intent.metadata?.razorpay_order_id === payment.order_id ||
          intent.razorpay_order_id === payment.order_id
        );
      }
      
      if (!orderIntent) {
        intentError = { message: 'Order intent not found' };
      }
    }

    if (intentError || !orderIntent) {
      console.error('Order intent not found for Razorpay order ID:', payment.order_id);
      return res.status(404).json({ message: 'Order intent not found' });
    }

    // Handle payment events
    if (event === 'payment.captured' && payment.status === 'captured') {
      // Check if already converted (idempotency)
      if (orderIntent.status === 'CONVERTED') {
        // Check if order exists
        const { data: existingOrder } = await supabase
          .from('orders')
          .select('id')
          .eq('order_intent_id', orderIntent.id)
          .single();
        
        if (existingOrder) {
          return res.status(200).json({ message: 'Payment already processed' });
        }
      }

      // Convert order intent to order
      try {
        const paymentDetails = {
          razorpay_payment_id: payment.id,
          razorpay_order_id: payment.order_id,
          razorpay_signature: payment.signature || null,
          method: payment.method || 'online'
        };

        await convertIntentToOrder(orderIntent.id, paymentDetails);
      } catch (convertError) {
        console.error('Error converting intent to order:', convertError);
        return res.status(500).json({ message: 'Error processing webhook' });
      }
    } else if (event === 'payment.failed') {
      // Handle failed payment - cancel the order intent
      // This will release inventory locks
      try {
        const { cancelOrderIntent } = require('../controllers/orderIntentController');
        // We can't call the controller directly, so we'll update manually
        await supabase
          .from('order_intents')
          .update({
            status: 'CANCELLED',
            updated_at: new Date().toISOString()
          })
          .eq('id', orderIntent.id);

        // Release inventory locks
        const { data: locks } = await supabase
          .from('inventory_locks')
          .select('*')
          .eq('order_intent_id', orderIntent.id)
          .eq('status', 'LOCKED');

        for (const lock of locks || []) {
          // Restore stock
          await supabase.rpc('increment_stock', {
            variant_id: lock.variant_id,
            quantity: lock.quantity_locked
          });

          // Mark lock as released
          await supabase
            .from('inventory_locks')
            .update({
              status: 'RELEASED',
              released_at: new Date().toISOString()
            })
            .eq('id', lock.id);
        }

        // Release discount code
        if (orderIntent.discount_id) {
          await supabase
            .from('discounts')
            .update({
              locked_by_intent_id: null,
              locked_until: null
            })
            .eq('id', orderIntent.discount_id);
        }
      } catch (cancelError) {
        console.error('Error cancelling order intent for failed payment:', cancelError);
      }
    }

    // Always return 200 to Razorpay (even if processing fails)
    // This prevents Razorpay from retrying
    res.status(200).json({ received: true });
  } catch (error) {
    console.error('Error handling webhook:', error);
    // Still return 200 to prevent Razorpay retries
    res.status(200).json({ received: true, error: 'Webhook processing failed' });
  }
};

module.exports = {
  createPaymentOrder,
  verifyPayment,
  handleWebhook
};

