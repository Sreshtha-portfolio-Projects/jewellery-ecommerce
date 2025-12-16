# Razorpay Payment Integration Guide

**Aldorado Jewells – Local → Production Ready Payment Setup**

This document provides a complete, step-by-step guide for integrating Razorpay payments into the Aldorado Jewells e-commerce platform. It assumes the project is running locally (backend on Node.js/Express, frontend on React) and is not yet deployed to production.

---

## SECTION 1: OVERVIEW

### Why Razorpay?

Razorpay is chosen for this project because:

1. **Indian Market Leader**: Razorpay is the most popular payment gateway in India, supporting all major payment methods (UPI, cards, net banking, wallets)
2. **Developer-Friendly**: Well-documented APIs, comprehensive SDKs, and excellent developer support
3. **Reliable Webhooks**: Robust webhook system for payment verification
4. **Compliance**: PCI-DSS compliant, handles sensitive payment data securely
5. **Cost-Effective**: Competitive transaction fees with transparent pricing
6. **Feature-Rich**: Supports subscriptions, refunds, international payments, and more

### What Problems Payment Integration Solves

Payment integration enables:

- **Revenue Generation**: Customers can complete purchases and pay for orders
- **Order Completion**: Converts order intents into confirmed, paid orders
- **Inventory Deduction**: Automatically reduces stock when payment succeeds
- **Financial Tracking**: Records payment transactions for accounting and analytics
- **Customer Trust**: Secure payment processing builds confidence in the platform

### Why Payments Should Be Integrated After Order Intent & Inventory Locking

The order intent system (already implemented) provides a critical foundation:

1. **Price Locking**: Order intents lock prices at checkout time, preventing price changes during payment
2. **Inventory Reservation**: Stock is reserved when order intent is created, preventing overselling
3. **Discount Protection**: Coupon codes are locked to prevent abuse
4. **Expiry Management**: Order intents expire after a set time, automatically releasing locked resources
5. **Validation**: Cart is validated before payment, ensuring all items are still available

**Payment integration should happen AFTER order intent creation** because:
- Order intent validates everything is still valid
- Inventory is already locked, so payment just confirms the reservation
- If payment fails, inventory is released when intent expires
- This prevents race conditions and ensures data consistency

---

## SECTION 2: RAZORPAY ACCOUNT SETUP

### Step 1: Create Razorpay Account

1. Go to [https://razorpay.com](https://razorpay.com)
2. Click **"Sign Up"** or **"Get Started"**
3. Enter your business details:
   - Business name: "Aldorado Jewells"
   - Business type: E-commerce / Retail
   - Email address
   - Mobile number
4. Complete email verification
5. Complete KYC (Know Your Customer) verification as required

### Step 2: Access Dashboard

1. Log in to [https://dashboard.razorpay.com](https://dashboard.razorpay.com)
2. You'll see the Razorpay dashboard with test mode enabled by default

### Step 3: Understanding Test Mode vs Live Mode

**Test Mode** (Default):
- Use for development and testing
- No real money is processed
- Test cards and UPI IDs are available
- Webhooks can be tested with local tunnels
- Switch: Dashboard → Settings → API Keys → Toggle "Test Mode"

**Live Mode**:
- Use for production
- Real money is processed
- Requires KYC completion
- Real payment methods only
- Switch: Dashboard → Settings → API Keys → Toggle "Live Mode"

**⚠️ Important**: Always develop and test in Test Mode first. Only switch to Live Mode after thorough testing and deployment.

### Step 4: Finding Your API Keys

1. Go to **Dashboard → Settings → API Keys**
2. You'll see two sets of keys (Test and Live):

   **Key ID** (also called "Key" or "Publishable Key"):
   - Starts with `rzp_test_` (Test Mode) or `rzp_live_` (Live Mode)
   - This is safe to use in frontend code
   - Example: `rzp_test_1234567890abcdef`

   **Key Secret** (also called "Secret Key"):
   - Long alphanumeric string
   - This is **NEVER** exposed to frontend
   - Only used in backend
   - Example: `abcdef1234567890abcdef1234567890`

3. Click **"Reveal"** to see the Secret Key (you'll need to enter your password)
4. Copy both keys immediately (Secret Key is shown only once)

### Step 5: Understanding Client Key vs Secret Key

**Client Key (Key ID)**:
- Used in frontend to initialize Razorpay Checkout
- Safe to expose in browser/client code
- Identifies your Razorpay account
- Cannot perform sensitive operations

**Secret Key**:
- Used ONLY in backend
- Can create orders, verify payments, handle webhooks
- **MUST NEVER** be exposed to frontend
- If exposed, immediately regenerate it in dashboard

**⚠️ CRITICAL SECURITY WARNING**:
- Secret key in frontend = anyone can create fake orders, steal money
- Secret key in Git = public exposure, security breach
- Secret key in logs = potential data leak
- Always store in `.env` file, never commit to Git

---

## SECTION 3: LOCAL DEVELOPMENT CHALLENGE (IMPORTANT)

### Why Razorpay Webhooks Cannot Hit Localhost

**The Problem**:
- Razorpay webhooks are HTTP POST requests sent by Razorpay servers to your backend
- Razorpay servers are on the internet
- They cannot reach `http://localhost:3000` because:
  - `localhost` is not accessible from the internet
  - Your local machine is behind a router/firewall
  - Razorpay has no way to route to your private IP

**Why This Is a Problem**:
- Payment verification requires webhook confirmation
- Frontend success callback is NOT enough (user can close browser, payment can fail after callback)
- Webhook is the **source of truth** for payment status
- Without webhooks, you cannot reliably confirm payments

### Solutions for Local Development

#### Solution 1: Use ngrok (Recommended)

**ngrok** creates a secure tunnel from the internet to your localhost.

1. **Install ngrok**:
   - Download from [https://ngrok.com/download](https://ngrok.com/download)
   - Or use: `npm install -g ngrok` (if you have Node.js)

2. **Start your backend**:
   ```bash
   cd backend
   npm run dev
   # Backend runs on http://localhost:3000
   ```

3. **Start ngrok tunnel**:
   ```bash
   ngrok http 3000
   ```

4. **Copy the HTTPS URL**:
   - ngrok will show: `Forwarding https://abc123.ngrok.io -> http://localhost:3000`
   - Copy the `https://abc123.ngrok.io` URL

5. **Use this URL in Razorpay webhook settings**:
   - Dashboard → Settings → Webhooks
   - Add webhook URL: `https://abc123.ngrok.io/api/payments/webhook`
   - Save
   <!-- secret- ?U5stGz6B9yejT@S -->

6. **⚠️ Note**: Free ngrok URLs change every time you restart. For testing, you can:
   - Use paid ngrok for static URLs
   - Or update webhook URL each time you restart

#### Solution 2: Use cloudflared (Cloudflare Tunnel)

**cloudflared** is Cloudflare's tunneling solution (free, more stable than free ngrok).

1. **Install cloudflared**:
   - Download from [https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/](https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/)

2. **Start tunnel**:
   ```bash
   cloudflared tunnel --url http://localhost:3000
   ```

3. **Use the provided HTTPS URL** in Razorpay webhook settings

#### Solution 3: Temporary Webhook Testing Strategies

For quick testing without tunnels:

1. **Manual Webhook Testing**:
   - Use Razorpay Dashboard → Payments → Select a payment → "Send Webhook" button
   - This manually triggers webhook to your configured URL

2. **Razorpay Webhook Testing Tool**:
   - Dashboard → Settings → Webhooks → "Test Webhook"
   - Sends sample webhook payloads

3. **⚠️ Limitation**: These methods don't test real-time webhook delivery during actual payments

### Why Frontend Success Callback Is Not Enough

**Common Mistake**: Relying only on frontend success callback to mark order as paid.

**Why This Fails**:
1. **User closes browser**: Payment succeeds, but frontend callback never runs
2. **Network issues**: Frontend loses connection before callback
3. **Payment failure after callback**: Rare but possible - payment fails after frontend thinks it succeeded
4. **Fraud**: Malicious users can fake frontend callbacks
5. **Race conditions**: Multiple callbacks, duplicate orders

**Correct Approach**:
- Frontend success = "Payment initiated, waiting for confirmation"
- Webhook = "Payment confirmed, order is paid"
- Always wait for webhook before marking order as paid

---

## SECTION 4: ENVIRONMENT VARIABLES SETUP

### Required Environment Variables

Add these to your **backend** `.env` file (NOT frontend):

```env
# Razorpay Configuration
RAZORPAY_KEY_ID=rzp_test_1234567890abcdef
RAZORPAY_KEY_SECRET=abcdef1234567890abcdef1234567890
RAZORPAY_WEBHOOK_SECRET=whsec_abcdef1234567890
```

### Variable Descriptions

**RAZORPAY_KEY_ID**:
- Your Razorpay Key ID (Client Key)
- Format: `rzp_test_...` (Test) or `rzp_live_...` (Live)
- Used to initialize Razorpay SDK in backend
- Can also be used in frontend (but we'll get it from backend API)

**RAZORPAY_KEY_SECRET**:
- Your Razorpay Secret Key
- Long alphanumeric string
- **BACKEND ONLY** - Never expose to frontend
- Used to create orders and verify webhooks

**RAZORPAY_WEBHOOK_SECRET**:
- Webhook signing secret (optional but recommended)
- Found in: Dashboard → Settings → Webhooks → Webhook Secret
- Used to verify webhook authenticity
- If not set, webhook verification will use a different method

### Where They Live

**Backend Only**:
- All Razorpay secrets stay in backend `.env`
- Frontend never sees secret keys
- Frontend gets Key ID from backend API (or can use it directly, it's safe)

### How to Rotate Keys Safely

If keys are compromised or you need to rotate:

1. **Generate New Keys**:
   - Dashboard → Settings → API Keys → "Regenerate Key"
   - This invalidates old keys immediately

2. **Update `.env`**:
   - Replace old keys with new keys
   - Restart backend server

3. **Update Webhook Secret** (if changed):
   - Dashboard → Settings → Webhooks → "Regenerate Secret"
   - Update `RAZORPAY_WEBHOOK_SECRET` in `.env`

4. **Test**:
   - Verify payments still work
   - Verify webhooks still work

5. **⚠️ Important**: Old keys stop working immediately. Update all environments (dev, staging, production) before regenerating.

---

## SECTION 5: PAYMENT FLOW (END-TO-END)

### Complete Payment Flow

This section describes the exact payment flow used in this project, from user clicking "Place Order" to order confirmation.

#### Step 1: User Clicks "Place Order"

- User is on checkout page
- Cart is validated
- User clicks "Place Order" button

#### Step 2: Backend Validates Order Intent

**Backend receives request** to create order intent:
- Endpoint: `POST /api/order-intents`
- Backend validates:
  - Cart items are still available
  - Stock is sufficient
  - Prices haven't changed
  - Discount code is valid (if applied)
  - Checkout is enabled (not in maintenance mode)

**If validation fails**:
- Return errors to frontend
- User sees error message
- Flow stops here

**If validation succeeds**:
- Continue to next step

#### Step 3: Backend Recalculates Final Amount

**Backend calculates final price**:
- Uses `pricingEngine` service
- Reads from `admin_settings` (no hardcoded values)
- Calculates:
  - Subtotal (product prices)
  - Discount (if coupon applied)
  - Tax (GST percentage from settings)
  - Shipping (based on free shipping threshold)
  - Total amount

**All calculations are logged** in `pricing_calculation_logs` for audit.

#### Step 4: Backend Creates Order Intent

**Backend creates order intent**:
- Stores cart snapshot
- Locks inventory (creates `inventory_locks`)
- Locks discount code (if used)
- Sets expiry time (from `admin_settings`)
- Status: `INTENT_CREATED`

**Order intent contains**:
- `intent_number`: Unique identifier
- `total_amount`: Final calculated amount
- `expires_at`: When intent expires
- `cart_snapshot`: Full cart data at time of creation

#### Step 5: Backend Creates Razorpay Order

**Backend creates Razorpay order**:
- Endpoint: `POST /api/payments/create-order`
- Backend calls Razorpay API to create order
- Passes:
  - `amount`: Order intent total amount (in paise, e.g., ₹1000 = 100000 paise)
  - `currency`: "INR"
  - `receipt`: Order intent number
  - `notes`: Order intent ID, user ID, etc.

**Razorpay returns**:
- `id`: Razorpay Order ID (e.g., `order_ABC123`)
- `amount`: Amount in paise
- `currency`: "INR"
- `status`: "created"

**Backend stores**:
- Razorpay Order ID in order intent (or separate `payment_orders` table)
- Links order intent to Razorpay order

#### Step 6: Frontend Receives Razorpay Order ID

**Backend responds to frontend**:
```json
{
  "razorpay_order_id": "order_ABC123",
  "amount": 100000,
  "currency": "INR",
  "key_id": "rzp_test_1234567890abcdef"
}
```

**Frontend receives**:
- Razorpay Order ID
- Amount (for display)
- Key ID (to initialize Razorpay Checkout)

#### Step 7: Frontend Opens Razorpay Checkout

**Frontend initializes Razorpay Checkout**:
- Loads Razorpay Checkout script
- Creates checkout instance with:
  - `key`: Key ID from backend
  - `amount`: Amount from backend
  - `currency`: "INR"
  - `order_id`: Razorpay Order ID from backend
  - `name`: "Aldorado Jewells"
  - `description`: Order intent number
  - `handler`: Success callback function
  - `prefill`: User email, phone (if available)

**Razorpay Checkout opens**:
- Payment modal/popup appears
- User selects payment method (UPI, card, wallet, etc.)
- User enters payment details
- User confirms payment

#### Step 8: Razorpay Handles Payment

**Razorpay processes payment**:
- Validates payment method
- Processes transaction with bank/payment provider
- Returns success or failure

**If payment succeeds**:
- Razorpay captures payment
- Payment status: `captured`
- Razorpay triggers webhook (if configured)

**If payment fails**:
- Payment status: `failed`
- Razorpay may trigger webhook (depending on failure reason)

#### Step 9: Razorpay Calls Webhook

**Razorpay sends webhook** (if payment succeeded or failed):
- POST request to: `https://your-backend-url.com/api/payments/webhook`
- Contains payment details:
  - `event`: `payment.captured` or `payment.failed`
  - `payload`: Payment object with all details
  - `signature`: HMAC signature for verification

**Webhook is sent asynchronously**:
- May arrive before or after frontend callback
- May arrive multiple times (Razorpay retries)
- Must be idempotent (handle duplicates safely)

#### Step 10: Backend Verifies Webhook Signature

**Backend receives webhook**:
- Endpoint: `POST /api/payments/webhook`
- Extracts signature from headers
- Verifies signature using `RAZORPAY_WEBHOOK_SECRET`
- If signature invalid: Reject webhook, return 400

**Signature verification**:
- Prevents fake webhooks
- Ensures webhook came from Razorpay
- Critical for security

#### Step 11: Backend Confirms Payment

**Backend processes webhook**:
- Checks if payment already processed (idempotency)
- Verifies payment amount matches order intent
- Verifies payment status: `captured` = success, `failed` = failure

**If payment succeeded**:
- Update order intent status: `INTENT_CREATED` → `PAYMENT_CONFIRMED`
- Create order from order intent
- Deduct inventory (convert locks to actual stock deduction)
- Release discount code lock (mark as used)
- Clear user's cart
- Log audit trail

**If payment failed**:
- Update order intent status: `INTENT_CREATED` → `PAYMENT_FAILED`
- Keep inventory locked (will release on expiry)
- Keep discount code locked (will release on expiry)
- Log payment failure

#### Step 12: Frontend Reacts to Payment

**Frontend success callback** (when user completes payment):
- Shows "Payment processing..." message
- Polls backend for payment status
- Or waits for backend to push status update
- Once webhook confirms, shows "Order confirmed!"

**Frontend failure callback** (if payment fails):
- Shows error message
- Allows user to retry payment
- Order intent remains valid (until expiry)

### ⚠️ Critical Emphasized Points

**Frontend Success ≠ Payment Confirmed**:
- Frontend success callback means "payment initiated"
- Webhook confirmation means "payment confirmed"
- Always wait for webhook before marking order as paid

**Webhook Is the Source of Truth**:
- Webhook is the only reliable confirmation
- Frontend callbacks can be faked, skipped, or lost
- Backend must verify webhook signature
- Backend must check idempotency

---

## SECTION 6: BACKEND IMPLEMENTATION STEPS

This section explains the backend implementation logic (no code, only concepts and steps).

### Step 1: Razorpay SDK Initialization

**Install Razorpay SDK**:
- Run: `npm install razorpay` in backend directory
- Import: `const Razorpay = require('razorpay')`

**Initialize Razorpay instance**:
- Create Razorpay instance with Key ID and Secret Key from `.env`
- Store instance in a config file or service
- Use this instance for all Razorpay API calls

**Best Practice**: Create a `razorpayService.js` or `razorpayConfig.js` to centralize Razorpay initialization.

### Step 2: Creating Payment Order

**Create endpoint**: `POST /api/payments/create-order`

**Logic**:
1. Receive order intent ID from frontend
2. Verify order intent exists and belongs to user
3. Verify order intent status is `INTENT_CREATED` (not expired, not already paid)
4. Get order intent total amount
5. Call Razorpay API: `razorpay.orders.create()`
   - Amount: Convert rupees to paise (multiply by 100)
   - Currency: "INR"
   - Receipt: Order intent number
   - Notes: Order intent ID, user ID
6. Store Razorpay Order ID in database (link to order intent)
7. Return Razorpay Order ID, amount, and Key ID to frontend

**Error Handling**:
- If order intent invalid: Return 400
- If Razorpay API fails: Return 500, log error
- If order intent expired: Return 400, suggest creating new intent

### Step 3: Storing Razorpay Order ID

**Database Design Options**:

**Option 1**: Add column to `order_intents` table:
- `razorpay_order_id`: VARCHAR, nullable
- Simple, direct link

**Option 2**: Create separate `payment_orders` table:
- `id`: UUID
- `order_intent_id`: Foreign key to order_intents
- `razorpay_order_id`: VARCHAR
- `amount`: DECIMAL
- `status`: VARCHAR (created, captured, failed)
- `created_at`: TIMESTAMP
- More flexible, supports multiple payment attempts

**Recommendation**: Option 2 is better for production (supports retries, multiple payment methods).

### Step 4: Handling Webhook Route

**Create endpoint**: `POST /api/payments/webhook`

**Important**: This endpoint must:
- NOT require authentication (Razorpay can't authenticate)
- Accept raw request body (for signature verification)
- Be publicly accessible (or accessible via tunnel in dev)

**Logic Flow**:
1. Extract webhook signature from headers (`X-Razorpay-Signature`)
2. Get raw request body (as string, not parsed JSON)
3. Verify signature using `RAZORPAY_WEBHOOK_SECRET`
4. If signature invalid: Return 400, log security warning
5. Parse request body as JSON
6. Extract event type (`event` field)
7. Route to appropriate handler based on event type

### Step 5: Signature Verification Logic

**Why Verify**:
- Prevents fake webhooks from attackers
- Ensures webhook came from Razorpay
- Critical security step

**How to Verify**:
1. Get webhook secret from `.env` (`RAZORPAY_WEBHOOK_SECRET`)
2. Get signature from request header (`X-Razorpay-Signature`)
3. Get raw request body (as string)
4. Compute HMAC SHA256: `HMAC-SHA256(webhook_secret, request_body)`
5. Compare computed signature with received signature
6. If match: Webhook is authentic
7. If no match: Reject webhook

**Razorpay SDK Method**:
- Razorpay SDK provides: `razorpay.validateWebhookSignature()`
- Use this method for verification (handles edge cases)

### Step 6: Idempotency Handling

**Why Idempotency**:
- Razorpay may send same webhook multiple times
- Network issues can cause duplicate deliveries
- Must handle duplicates safely (don't process payment twice)

**How to Implement**:
1. Extract payment ID from webhook payload (`payload.payment.entity.id`)
2. Check if payment already processed:
   - Query database for payment ID
   - If found and status is `captured`: Skip processing, return 200
3. If not processed:
   - Process payment
   - Store payment ID in database
   - Mark as processed
4. Always return 200 to Razorpay (even if duplicate)
   - Razorpay stops retrying on 200
   - Returning 500 causes Razorpay to retry

**Database Design**:
- Store `razorpay_payment_id` in payment_orders table
- Add unique constraint or check before processing

### Step 7: Converting Order Intent to Order

**When Payment Succeeds**:
1. Verify payment amount matches order intent total
2. Update order intent status: `PAYMENT_CONFIRMED`
3. Create order from order intent:
   - Copy cart snapshot to order items
   - Set order status: `CONFIRMED` or `PAID`
   - Set payment status: `PAID`
   - Link to order intent
4. Deduct inventory:
   - Convert inventory locks to actual stock deduction
   - Update variant stock levels
   - Mark inventory locks as `CONVERTED`
5. Release discount code:
   - Mark discount as used (if applicable)
   - Release lock
6. Clear user's cart
7. Log audit trail

**Error Handling**:
- If payment amount mismatch: Log warning, but still process (amounts may differ due to rounding)
- If inventory deduction fails: Rollback, log error, alert admin
- If order creation fails: Rollback, log error, alert admin

---

## SECTION 7: FRONTEND IMPLEMENTATION STEPS

This section explains the frontend implementation logic.

### Step 1: Requesting Payment Order from Backend

**After Order Intent Created**:
- Frontend has order intent ID
- Frontend calls: `POST /api/payments/create-order`
- Request body: `{ order_intent_id: "..." }`
- Backend returns: `{ razorpay_order_id, amount, currency, key_id }`

**Error Handling**:
- If order intent expired: Show error, redirect to cart
- If API fails: Show error, allow retry
- If amount is 0: Show error (should not happen)

### Step 2: Opening Razorpay Checkout

**Load Razorpay Checkout Script**:
- Add to `index.html`: `<script src="https://checkout.razorpay.com/v1/checkout.js"></script>`
- Or load dynamically in component

**Initialize Checkout**:
```javascript
const options = {
  key: keyId, // From backend response
  amount: amount, // From backend response (in paise)
  currency: "INR",
  order_id: razorpayOrderId, // From backend response
  name: "Aldorado Jewells",
  description: `Order ${orderIntentNumber}`,
  handler: handlePaymentSuccess,
  prefill: {
    email: userEmail,
    contact: userPhone
  },
  theme: {
    color: "#B8860B" // Rose gold color
  }
};

const razorpay = new Razorpay(options);
razorpay.open();
```

**Checkout Opens**:
- Modal/popup appears
- User selects payment method
- User completes payment

### Step 3: What Data Frontend Should Send

**✅ SHOULD Send**:
- Order intent ID (to create Razorpay order)
- User email/phone (for prefill, optional)

**❌ SHOULD NOT Send**:
- Payment amount (backend calculates and sends)
- Secret keys (never exposed to frontend)
- Payment details (handled by Razorpay)

**Best Practice**: Frontend only sends order intent ID. Backend handles all calculations and Razorpay order creation.

### Step 4: Reacting to Success (Pending Confirmation)

**Success Callback** (`handlePaymentSuccess`):
- Receives payment object from Razorpay
- Contains: `razorpay_payment_id`, `razorpay_order_id`, `razorpay_signature`
- **⚠️ Do NOT mark order as paid yet**

**What to Do**:
1. Show "Payment processing..." message
2. Call backend: `POST /api/payments/verify-payment`
   - Send: `razorpay_payment_id`, `razorpay_order_id`, `razorpay_signature`
3. Backend verifies payment (checks with Razorpay API)
4. Backend returns: `{ verified: true/false, order_id: "..." }`
5. If verified: Show "Order confirmed!" message
6. Redirect to order confirmation page
7. If not verified: Show "Payment verification pending" message
8. Poll backend for status update

**Alternative (Webhook-Driven)**:
- Don't verify immediately
- Show "Payment initiated, waiting for confirmation..."
- Poll backend: `GET /api/order-intents/:id`
- Check order intent status
- When status becomes `PAYMENT_CONFIRMED`: Show success, redirect

### Step 5: Reacting to Failure

**Failure Callback** (`handlePaymentFailure`):
- Receives error object from Razorpay
- Error codes: `BAD_REQUEST_ERROR`, `GATEWAY_ERROR`, `NETWORK_ERROR`, etc.

**What to Do**:
1. Show error message to user
2. Explain what went wrong (user-friendly message)
3. Allow user to retry payment:
   - Call backend again: `POST /api/payments/create-order`
   - Get new Razorpay order ID
   - Open checkout again
4. If order intent expired: Redirect to cart, show message
5. Don't clear order intent (it's still valid until expiry)

**Error Messages**:
- `BAD_REQUEST_ERROR`: "Invalid payment details. Please try again."
- `GATEWAY_ERROR`: "Payment gateway error. Please try again later."
- `NETWORK_ERROR`: "Network error. Please check your connection and try again."
- Generic: "Payment failed. Please try again or contact support."

---

## SECTION 8: WEBHOOK SETUP (LOCAL + PROD)

### Creating Webhook in Razorpay Dashboard

**Step 1: Access Webhook Settings**:
1. Log in to Razorpay Dashboard
2. Go to **Settings → Webhooks**
3. Click **"Add New Webhook"**

**Step 2: Configure Webhook**:
- **Webhook URL**: 
  - Local: `https://your-ngrok-url.ngrok.io/api/payments/webhook`
  - Production: `https://your-backend-domain.com/api/payments/webhook`
- **Active Events**: Select:
  - `payment.captured` (payment succeeded)
  - `payment.failed` (payment failed)
  - `order.paid` (optional, if using orders API)
- **Secret**: 
  - Razorpay generates a webhook secret
  - Copy this to `RAZORPAY_WEBHOOK_SECRET` in `.env`
  - Or generate your own secret

**Step 3: Save Webhook**:
- Click **"Save"**
- Webhook is now active
- Razorpay will send webhooks to this URL

### Required Events

**payment.captured**:
- Triggered when payment is successfully captured
- Contains payment details, order ID, amount
- **Most important event** - confirms payment success

**payment.failed**:
- Triggered when payment fails
- Contains failure reason, error code
- Useful for analytics and user notifications

**Optional Events** (for advanced use cases):
- `order.paid`: When order is fully paid
- `refund.created`: When refund is initiated
- `refund.processed`: When refund is completed

### Webhook Secret Usage

**What It Is**:
- Secret key used to sign webhooks
- Ensures webhook authenticity
- Prevents fake webhooks

**How to Use**:
1. Copy webhook secret from Razorpay dashboard
2. Store in `.env`: `RAZORPAY_WEBHOOK_SECRET=whsec_...`
3. Use in backend to verify webhook signature
4. Never expose to frontend

**If Secret Changes**:
- Update `.env` immediately
- Restart backend
- Test webhook to ensure it works

### Testing Webhooks Locally Using Tunnel URLs

**Using ngrok**:
1. Start backend: `npm run dev` (runs on `http://localhost:3000`)
2. Start ngrok: `ngrok http 3000`
3. Copy HTTPS URL: `https://abc123.ngrok.io`
4. Update Razorpay webhook URL: `https://abc123.ngrok.io/api/payments/webhook`
5. Make a test payment
6. Check backend logs for webhook receipt
7. Verify webhook is processed correctly

**Using cloudflared**:
1. Start backend: `npm run dev`
2. Start cloudflared: `cloudflared tunnel --url http://localhost:3000`
3. Copy HTTPS URL
4. Update Razorpay webhook URL
5. Test payment and verify webhook

**⚠️ Important Notes**:
- Free ngrok URLs change on restart - update webhook URL each time
- Paid ngrok provides static URLs
- cloudflared URLs are more stable (but may still change)
- In production, use your actual domain (no tunnel needed)

**Testing Webhook Manually**:
1. Razorpay Dashboard → Payments → Select a payment
2. Click **"Send Webhook"** button
3. This manually triggers webhook to your configured URL
4. Useful for testing without making actual payments

---

## SECTION 9: SECURITY RULES (NON-NEGOTIABLE)

These security rules are **mandatory** and **non-negotiable**. Violating them can lead to financial loss, fraud, and security breaches.

### Rule 1: Never Trust Frontend Amount

**❌ WRONG**:
- Frontend sends amount to backend
- Backend uses frontend amount to create Razorpay order

**✅ CORRECT**:
- Backend calculates amount from order intent
- Backend uses calculated amount (never frontend amount)
- Frontend amount is only for display

**Why**: Users can modify frontend code and send fake amounts. Always recalculate on backend.

### Rule 2: Always Verify Webhook Signature

**❌ WRONG**:
- Accept webhook without signature verification
- Trust webhook payload blindly

**✅ CORRECT**:
- Extract signature from `X-Razorpay-Signature` header
- Verify signature using `RAZORPAY_WEBHOOK_SECRET`
- Reject webhook if signature invalid
- Log security warnings for invalid signatures

**Why**: Attackers can send fake webhooks to mark unpaid orders as paid. Signature verification ensures webhook came from Razorpay.

### Rule 3: Never Mark Order Paid from Frontend

**❌ WRONG**:
- Frontend success callback marks order as paid
- Frontend calls API to update order status

**✅ CORRECT**:
- Frontend success callback only shows "processing" message
- Only webhook can mark order as paid
- Backend verifies payment before updating status

**Why**: Frontend callbacks can be faked, skipped, or lost. Webhook is the only reliable confirmation.

### Rule 4: Use Backend Timestamps

**❌ WRONG**:
- Use frontend timestamps for payment time
- Trust client-side time

**✅ CORRECT**:
- Use backend database timestamps (`created_at`, `updated_at`)
- Use server time for all payment records
- Never trust client-side time

**Why**: Client time can be manipulated. Server time is authoritative.

### Rule 5: Prevent Duplicate Webhook Execution

**❌ WRONG**:
- Process webhook without checking if already processed
- Allow same payment to be processed multiple times

**✅ CORRECT**:
- Check if payment ID already exists in database
- If exists and processed: Skip, return 200
- If not exists: Process, store payment ID
- Use idempotency keys or unique constraints

**Why**: Razorpay may send same webhook multiple times. Processing duplicates can create duplicate orders or deduct inventory twice.

### Rule 6: Store Secrets in Environment Variables

**❌ WRONG**:
- Hardcode secrets in code
- Commit `.env` to Git
- Log secrets in console

**✅ CORRECT**:
- Store all secrets in `.env` file
- Add `.env` to `.gitignore`
- Never log secrets
- Use `.env.example` for documentation (without real values)

**Why**: Exposed secrets allow attackers to create fake orders, steal money, and compromise your account.

### Rule 7: Validate Payment Amount Matches Order Intent

**❌ WRONG**:
- Accept any payment amount
- Don't verify amount consistency

**✅ CORRECT**:
- When webhook received, verify payment amount matches order intent total
- If mismatch: Log warning, investigate
- Consider small rounding differences (1-2 paise) as acceptable
- Reject if difference is significant

**Why**: Prevents partial payments or overpayments from being accepted incorrectly.

### Rule 8: Use HTTPS in Production

**❌ WRONG**:
- Use HTTP for webhook endpoint
- Expose payment endpoints over unencrypted connection

**✅ CORRECT**:
- Always use HTTPS in production
- Webhook URL must be HTTPS
- Use SSL/TLS certificates

**Why**: HTTP allows man-in-the-middle attacks. HTTPS encrypts data in transit.

---

## SECTION 10: COMMON MISTAKES TO AVOID

This section lists common mistakes developers make when integrating Razorpay, and how to avoid them.

### Mistake 1: Using Frontend Success Callback as Confirmation

**The Mistake**:
```javascript
razorpay.on('payment.success', function(response) {
  // Mark order as paid immediately
  updateOrderStatus('PAID');
});
```

**Why It's Wrong**:
- User can close browser before callback runs
- Network issues can prevent callback
- Malicious users can fake callbacks
- Payment can fail after callback

**Correct Approach**:
- Show "processing" message on success
- Wait for webhook confirmation
- Poll backend for payment status
- Only mark paid when webhook confirms

### Mistake 2: Hardcoding Amounts

**The Mistake**:
```javascript
const amount = 100000; // Hardcoded ₹1000
```

**Why It's Wrong**:
- Amounts change with products, discounts, taxes
- Cannot handle dynamic pricing
- Breaks when prices change

**Correct Approach**:
- Always calculate amount on backend
- Use order intent total amount
- Read from database, never hardcode

### Mistake 3: Skipping Webhook Verification

**The Mistake**:
```javascript
app.post('/webhook', (req, res) => {
  // No signature verification
  const payment = req.body.payload.payment.entity;
  markOrderAsPaid(payment.order_id);
});
```

**Why It's Wrong**:
- Anyone can send fake webhooks
- Attackers can mark unpaid orders as paid
- No way to verify authenticity

**Correct Approach**:
- Always verify webhook signature
- Reject if signature invalid
- Log security warnings

### Mistake 4: Forgetting Idempotency

**The Mistake**:
```javascript
app.post('/webhook', (req, res) => {
  // Process payment without checking duplicates
  processPayment(req.body);
});
```

**Why It's Wrong**:
- Razorpay may send same webhook multiple times
- Processing duplicates creates duplicate orders
- Inventory deducted multiple times

**Correct Approach**:
- Check if payment already processed
- Use payment ID as idempotency key
- Skip if already processed, return 200

### Mistake 5: Committing .env Files

**The Mistake**:
```bash
git add .env
git commit -m "Add environment variables"
git push
```

**Why It's Wrong**:
- Secrets exposed in Git history
- Anyone with repo access can see secrets
- Even if removed later, history still contains secrets

**Correct Approach**:
- Add `.env` to `.gitignore`
- Use `.env.example` for documentation
- Never commit `.env` files
- Rotate secrets if accidentally committed

### Mistake 6: Using Test Keys in Production

**The Mistake**:
- Forgetting to switch from test keys to live keys
- Using `rzp_test_...` in production

**Why It's Wrong**:
- Test keys don't process real payments
- Orders appear successful but no money received
- Financial loss

**Correct Approach**:
- Use test keys in development
- Use live keys in production
- Set keys via environment variables
- Verify keys match environment

### Mistake 7: Not Handling Payment Failures

**The Mistake**:
- Only handling success case
- Ignoring payment failures
- Not releasing inventory on failure

**Why It's Wrong**:
- Inventory remains locked forever
- Users can't retry payment
- Poor user experience

**Correct Approach**:
- Handle both success and failure webhooks
- Release inventory on failure (or let it expire)
- Allow users to retry payment
- Show clear error messages

### Mistake 8: Not Logging Payment Events

**The Mistake**:
- No logging of payment events
- No audit trail
- Cannot debug payment issues

**Why It's Wrong**:
- Cannot track payment flow
- Hard to debug issues
- No audit trail for compliance

**Correct Approach**:
- Log all payment events (create, success, failure)
- Store payment logs in database
- Include timestamps, user IDs, amounts
- Log webhook receipts and processing

### Mistake 9: Exposing Secret Keys to Frontend

**The Mistake**:
```javascript
// Frontend code
const RAZORPAY_SECRET = "sk_live_..."; // NEVER DO THIS
```

**Why It's Wrong**:
- Secret keys visible in browser
- Anyone can see and use your secret key
- Can create fake orders, steal money

**Correct Approach**:
- Secret keys only in backend `.env`
- Frontend only gets Key ID (safe to expose)
- Never send secret keys to frontend

### Mistake 10: Not Testing Webhooks Locally

**The Mistake**:
- Only testing in production
- Not setting up webhook testing locally
- Assuming webhooks will work

**Why It's Wrong**:
- Webhooks may not work as expected
- Hard to debug in production
- May miss issues until live

**Correct Approach**:
- Use ngrok/cloudflared for local webhook testing
- Test webhook signature verification
- Test idempotency handling
- Test all webhook scenarios before production

---

## SECTION 11: WHEN TO DEPLOY (RECOMMENDED ORDER)

This section explains the recommended sequence for deploying the payment integration, from local development to production.

### Phase 1: Finish Pre-Payment Features

**Complete Before Payment Integration**:
- ✅ Order intent system (already implemented)
- ✅ Inventory locking (already implemented)
- ✅ Cart revalidation (already implemented)
- ✅ Pricing engine (already implemented)
- ✅ Admin settings (already implemented)
- ✅ Product management
- ✅ User authentication
- ✅ Address management

**Why**: Payment integration depends on these features. Order intents must work correctly before adding payments.

### Phase 2: Integrate Razorpay Locally

**Local Development Steps**:
1. Create Razorpay test account
2. Get test API keys
3. Set up `.env` with test keys
4. Install Razorpay SDK in backend
5. Implement payment order creation endpoint
6. Implement webhook endpoint
7. Set up ngrok/cloudflared tunnel
8. Configure Razorpay webhook URL (tunnel URL)
9. Test payment flow locally:
   - Create order intent
   - Create Razorpay order
   - Open checkout
   - Complete test payment
   - Verify webhook received
   - Verify order created
10. Test all edge cases:
    - Payment success
    - Payment failure
    - Webhook retries (idempotency)
    - Order intent expiry
    - Invalid signatures

**Why**: Test everything locally before deploying. Fix issues in development environment.

### Phase 3: Deploy Backend (Render)

**Backend Deployment Steps**:
1. Create Render account (or your preferred hosting)
2. Create new Web Service
3. Connect GitHub repository
4. Set build command: `cd backend && npm install`
5. Set start command: `cd backend && npm start`
6. Add environment variables in Render dashboard:
   - `RAZORPAY_KEY_ID` (test keys first)
   - `RAZORPAY_KEY_SECRET` (test keys first)
   - `RAZORPAY_WEBHOOK_SECRET` (test webhook secret)
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `JWT_SECRET`
   - `PORT` (Render sets this automatically)
   - `NODE_ENV=production`
7. Deploy backend
8. Verify backend is running
9. Test health check endpoint
10. **Update Razorpay webhook URL** to production backend URL:
    - `https://your-backend.onrender.com/api/payments/webhook`
11. Test webhook from Razorpay dashboard

**Why**: Backend must be deployed first because webhooks need a public URL. Frontend can work with local backend, but webhooks cannot.

### Phase 4: Deploy Frontend (Vercel)

**Frontend Deployment Steps**:
1. Create Vercel account (or your preferred hosting)
2. Import GitHub repository
3. Set root directory: `frontend`
4. Set build command: `npm run build`
5. Set output directory: `dist` (or `build`, depending on your setup)
6. Add environment variables in Vercel dashboard:
   - `VITE_API_BASE_URL=https://your-backend.onrender.com`
7. Deploy frontend
8. Verify frontend is accessible
9. Test payment flow:
   - Create order intent
   - Complete test payment
   - Verify webhook received on backend
   - Verify order created

**Why**: Frontend needs to point to deployed backend. Users need a public URL to access the application.

### Phase 5: Update Webhook URL

**After Backend Deployment**:
1. Go to Razorpay Dashboard → Settings → Webhooks
2. Update webhook URL to production backend:
   - Old: `https://abc123.ngrok.io/api/payments/webhook` (local)
   - New: `https://your-backend.onrender.com/api/payments/webhook` (production)
3. Save webhook settings
4. Test webhook manually from Razorpay dashboard
5. Verify webhook is received on production backend

**Why**: Webhooks must point to production backend, not local tunnel. Update after backend is deployed and stable.

### Phase 6: Switch to Live Mode

**Before Going Live**:
1. Complete Razorpay KYC (if not already done)
2. Verify all test payments work correctly
3. Test all edge cases in production (with test keys)
4. Update environment variables in Render:
   - Replace test `RAZORPAY_KEY_ID` with live key
   - Replace test `RAZORPAY_KEY_SECRET` with live secret
   - Update `RAZORPAY_WEBHOOK_SECRET` (if changed for live mode)
5. Restart backend service
6. Verify backend is using live keys
7. Make a small test payment with real money
8. Verify webhook received and order created
9. Monitor for issues

**⚠️ Critical**: Only switch to live mode after thorough testing. Real money is involved. Test with small amounts first.

**Why**: Live mode processes real payments. Must be 100% confident system works correctly.

### Recommended Timeline

**Week 1**: Local integration and testing
- Set up Razorpay test account
- Implement payment endpoints
- Test locally with ngrok
- Fix all bugs

**Week 2**: Backend deployment
- Deploy backend to Render
- Update webhook URL
- Test webhooks in production (test mode)
- Fix any deployment issues

**Week 3**: Frontend deployment
- Deploy frontend to Vercel
- Test end-to-end flow
- Test with real users (test mode)
- Gather feedback

**Week 4**: Go live
- Complete KYC
- Switch to live keys
- Monitor closely
- Be ready to rollback if issues

**Why Staged Approach**: Reduces risk. Fix issues at each stage before moving to next. Don't rush to production.

---

## SECTION 12: SUMMARY CHECKLIST

Use this checklist to verify your Razorpay payment integration is complete and working correctly.

### Account Setup
- [ ] Razorpay account created
- [ ] KYC completed (for live mode)
- [ ] Test API keys obtained
- [ ] Live API keys obtained (when ready)
- [ ] Webhook secret obtained

### Environment Variables
- [ ] `RAZORPAY_KEY_ID` added to backend `.env`
- [ ] `RAZORPAY_KEY_SECRET` added to backend `.env`
- [ ] `RAZORPAY_WEBHOOK_SECRET` added to backend `.env`
- [ ] `.env` file added to `.gitignore`
- [ ] `.env.example` created (without real values)

### Backend Implementation
- [ ] Razorpay SDK installed (`npm install razorpay`)
- [ ] Razorpay initialized with keys from `.env`
- [ ] Payment order creation endpoint implemented (`POST /api/payments/create-order`)
- [ ] Webhook endpoint implemented (`POST /api/payments/webhook`)
- [ ] Webhook signature verification implemented
- [ ] Idempotency handling implemented
- [ ] Payment amount calculated from order intent (not frontend)
- [ ] Order intent to order conversion implemented
- [ ] Inventory deduction on payment success
- [ ] Error handling and logging implemented

### Frontend Implementation
- [ ] Razorpay Checkout script loaded
- [ ] Payment order requested from backend
- [ ] Razorpay Checkout opened with correct parameters
- [ ] Success callback implemented (shows "processing" message)
- [ ] Failure callback implemented (shows error, allows retry)
- [ ] Payment status polling implemented (or webhook-driven updates)
- [ ] Order confirmation page created

### Webhook Setup
- [ ] Webhook created in Razorpay dashboard
- [ ] Webhook URL configured (local tunnel or production)
- [ ] Required events selected (`payment.captured`, `payment.failed`)
- [ ] Webhook secret configured
- [ ] Webhook tested manually from Razorpay dashboard
- [ ] Webhook signature verification tested

### Security
- [ ] Secret keys never exposed to frontend
- [ ] Webhook signature always verified
- [ ] Payment amount always calculated on backend
- [ ] Orders never marked paid from frontend
- [ ] Idempotency implemented (duplicate webhook handling)
- [ ] Payment amount validated against order intent
- [ ] All payment events logged

### Testing (Local)
- [ ] Test payment with test card/UPI
- [ ] Payment success flow tested
- [ ] Payment failure flow tested
- [ ] Webhook received and processed correctly
- [ ] Order created from order intent
- [ ] Inventory deducted correctly
- [ ] Duplicate webhook handled (idempotency)
- [ ] Invalid webhook signature rejected
- [ ] Order intent expiry handled
- [ ] Error scenarios tested

### Testing (Production - Test Mode)
- [ ] Backend deployed to production
- [ ] Frontend deployed to production
- [ ] Webhook URL updated to production
- [ ] Test payment in production (test mode)
- [ ] Webhook received on production backend
- [ ] Order created in production database
- [ ] All flows working in production

### Production Readiness
- [ ] All local tests passed
- [ ] All production tests passed (test mode)
- [ ] Monitoring and logging set up
- [ ] Error alerts configured
- [ ] Rollback plan prepared
- [ ] KYC completed
- [ ] Live API keys ready
- [ ] Team trained on payment flow

### Go Live
- [ ] Switch to live API keys in production
- [ ] Update webhook secret (if changed)
- [ ] Restart backend service
- [ ] Make small test payment with real money
- [ ] Verify payment received in Razorpay dashboard
- [ ] Verify webhook received
- [ ] Verify order created
- [ ] Monitor for 24-48 hours
- [ ] Be ready to switch back to test mode if issues

---

## Additional Resources

### Razorpay Documentation
- [Razorpay API Documentation](https://razorpay.com/docs/api/)
- [Razorpay Node.js SDK](https://github.com/razorpay/razorpay-node)
- [Razorpay Checkout Integration](https://razorpay.com/docs/payments/payment-gateway/web-integration/standard/)
- [Razorpay Webhooks Guide](https://razorpay.com/docs/webhooks/)

### Support
- Razorpay Support: [support@razorpay.com](mailto:support@razorpay.com)
- Razorpay Dashboard: [https://dashboard.razorpay.com](https://dashboard.razorpay.com)

### Project-Specific Notes
- This integration aligns with the existing order intent system
- All pricing is admin-configurable (no hardcoded values)
- Backend-first architecture (frontend never directly accesses Supabase)
- Inventory locking prevents overselling
- System is production-ready after completing this integration

---

**Document Version**: 1.0  
**Last Updated**: 2024  
**Project**: Aldorado Jewells E-commerce Platform  
**Status**: Ready for Implementation


