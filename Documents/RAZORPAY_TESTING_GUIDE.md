# Razorpay Payment Integration - Testing Guide

## ✅ What's Been Implemented

1. **Backend Payment Controller** (`backend/src/controllers/paymentController.js`)
   - `POST /api/payments/create-order` - Creates Razorpay order
   - `POST /api/payments/verify-payment` - Verifies payment signature
   - `POST /api/payments/webhook` - Handles Razorpay webhooks

2. **Frontend Payment Integration** (`frontend/src/pages/Checkout.jsx`)
   - Integrated Razorpay Checkout
   - Payment flow: Create Order → Create Razorpay Order → Open Checkout → Verify Payment

3. **Payment Service** (`frontend/src/services/paymentService.js`)
   - Methods to create payment orders and verify payments

## 🔧 Setup Required

### Step 1: Add Environment Variables

Add these to your `backend/.env` file:

```env
# Razorpay Configuration (Test Mode)
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxx
RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxxxxxxx
RAZORPAY_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
```

**Where to find these:**
1. Go to [Razorpay Dashboard](https://dashboard.razorpay.com)
2. **Settings → API Keys** → Copy Key ID and Key Secret (Test Mode)
3. **Settings → Webhooks** → Create webhook → Copy Webhook Secret

### Step 2: Install Razorpay SDK (if not already installed)

```bash
cd backend
npm install razorpay
```

### Step 3: Set Up Webhook URL (for local testing)

Since Razorpay webhooks can't hit `localhost`, you need a tunnel:

**Using ngrok (Recommended - you already have it installed):**
```bash
# In a separate terminal/PowerShell window
ngrok http 3000
```

You'll see output like:
```
Forwarding   https://abc123.ngrok-free.app -> http://localhost:3000
```

**Copy the HTTPS URL** (e.g., `https://abc123.ngrok-free.app`)

**Note:** If ngrok requires authentication:
```bash
ngrok config add-authtoken YOUR_AUTH_TOKEN
```
Get your authtoken from: https://dashboard.ngrok.com/get-started/your-authtoken

### Step 4: Configure Webhook in Razorpay Dashboard

1. Go to **Razorpay Dashboard → Settings → Webhooks**
2. Click **"Add New Webhook"**
3. Enter webhook URL: `https://your-tunnel-url.ngrok.io/api/payments/webhook`
4. Select events:
   - ✅ `payment.captured`
   - ✅ `payment.failed`
5. Save and copy the **Webhook Secret** to your `.env` file

## 🧪 Testing Steps

### Test 1: Create Order and Initiate Payment

1. **Start your backend:**
   ```bash
   cd backend
   npm run dev
   ```

2. **Start your frontend:**
   ```bash
   cd frontend
   npm run dev
   ```

3. **Start ngrok** (in a separate terminal/PowerShell):
   ```bash
   ngrok http 3000
   ```
   Copy the HTTPS URL shown (e.g., `https://abc123.ngrok-free.app`)

4. **Test the flow:**
   - Login to your app
   - Add items to cart
   - Go to checkout
   - Select address
   - Click "Proceed to Payment"
   - Razorpay checkout should open

### Test 2: Test Payment with Test Cards

Razorpay provides test cards for testing. Use these in the checkout:

**Success Cards:**
- **Card Number:** `4111 1111 1111 1111`
- **CVV:** Any 3 digits (e.g., `123`)
- **Expiry:** Any future date (e.g., `12/25`)
- **Name:** Any name

**Failure Cards:**
- **Card Number:** `4000 0000 0000 0002` (for failed payment)

**Test UPI IDs:**
- `success@razorpay` (for successful payment)
- `failure@razorpay` (for failed payment)

### Test 3: Verify Payment Flow

1. **Complete payment** with test card `4111 1111 1111 1111`
2. **Check backend logs** - Should see:
   - Order created
   - Razorpay order created
   - Payment verification
   - Stock deduction
   - Cart cleared

3. **Check database:**
   - `orders` table: `payment_status` should be `'paid'`
   - `orders` table: `razorpay_payment_id` should be populated
   - `carts` table: Should be empty for the user
   - `products` or `product_variants` table: Stock should be deducted

### Test 4: Test Webhook (Manual)

1. **Go to Razorpay Dashboard → Payments**
2. Find a test payment
3. Click **"Send Webhook"** button
4. Check backend logs - Should see webhook received and processed

### Test 5: Test Payment Failure

1. Use failure card: `4000 0000 0000 0002`
2. Payment should fail
3. Order status should be `'cancelled'` or `'pending'`
4. Stock should NOT be deducted

## 🔍 Debugging

### Check Backend Logs

Look for:
- `Error creating Razorpay order:` - Check API keys
- `Invalid webhook signature` - Check webhook secret
- `Order not found` - Check order creation

### Common Issues

1. **"Razorpay is not defined"**
   - Make sure Razorpay script is loaded in `index.html`
   - Check browser console for script loading errors

2. **"Invalid API Key"**
   - Verify `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` in `.env`
   - Make sure you're using Test Mode keys (start with `rzp_test_`)

3. **"Webhook not received"**
   - Check ngrok is running (should show "Forwarding" message)
   - Verify webhook URL in Razorpay dashboard matches your ngrok URL exactly
   - Make sure ngrok URL includes `/api/payments/webhook` at the end
   - Check webhook secret matches in `.env`
   - **Important:** Free ngrok URLs change each time you restart. Update webhook URL in Razorpay dashboard if you restart ngrok.

4. **"Payment verification failed"**
   - Check signature verification logic
   - Verify payment details are correct

## 📝 Test Checklist

- [ ] Environment variables set in `backend/.env`
- [ ] Razorpay SDK installed (`npm list razorpay`)
- [ ] Backend server running on port 3000
- [ ] Frontend running on port 5173
- [ ] ngrok/cloudflared tunnel active
- [ ] Webhook configured in Razorpay dashboard
- [ ] Can create order successfully
- [ ] Razorpay checkout opens
- [ ] Test payment succeeds
- [ ] Payment verified in backend
- [ ] Order status updated to 'paid'
- [ ] Stock deducted correctly
- [ ] Cart cleared after payment
- [ ] Webhook received and processed

## 🚀 Next Steps After Testing

Once testing is successful:

1. **Test with real payment methods** (still in Test Mode)
2. **Test webhook reliability** (send multiple webhooks)
3. **Test edge cases:**
   - Payment timeout
   - Browser closed during payment
   - Network failure
4. **Switch to Live Mode** (when ready for production):
   - Complete Razorpay KYC
   - Update environment variables with Live keys
   - Update webhook URL to production backend URL
   - Test with real payment (small amount)

## 📞 Support

- Razorpay Documentation: https://razorpay.com/docs/
- Razorpay Support: support@razorpay.com
- Test Cards: https://razorpay.com/docs/payments/test-cards/

