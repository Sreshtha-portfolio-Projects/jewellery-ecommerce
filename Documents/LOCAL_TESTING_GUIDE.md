# Local Testing Guide - Order Confirmation Flow

This guide helps you test the complete checkout and order confirmation flow locally without deploying to production or using real Razorpay payments.

---

## ⚡ Quick Test (30 seconds)

1. **Enable test mode** – Add to `backend/.env`: `ENABLE_TEST_MODE=true`, `NODE_ENV=development`
2. **Restart backend:** `cd backend && npm start`
3. **Start frontend:** `cd frontend && npm run dev`
4. **Test:** Add items to cart → Checkout → Click **"🧪 Test Payment"** (yellow button) → You should be redirected to the confirmation page.

**Endpoints:**  
- `POST http://localhost:3000/api/payments/test/simulate-payment` (Body: `{ "orderIntentId": "uuid" }`, Header: `Authorization: Bearer <token>`)  
- `GET http://localhost:3000/api/orders/{orderId}/confirmation`

**Quick verification:** Redirected to `/orders/{id}/confirmation`, success message, order ID, items and price breakdown, address, timeline "Processing", estimated delivery, page refresh and direct URL work.

**Troubleshooting:** Test button not showing → check Vite dev mode (`import.meta.env.DEV`), restart frontend. 403 on test endpoint → ensure `ENABLE_TEST_MODE=true` and `NODE_ENV=development`, restart backend. Order not found → check backend logs and order ID in URL.

For full test scenarios and STR, see below.

---

## 🎯 Quick Setup for Local Testing

### Step 1: Enable Test Mode

Add this to your `backend/.env` file:

```env
# Test Mode (only for local development)
ENABLE_TEST_MODE=true
NODE_ENV=development
```

**⚠️ IMPORTANT**: Never set `ENABLE_TEST_MODE=true` in production!

### Step 2: Update Checkout.jsx for Test Mode

You can modify the checkout flow to use test mode when available. Here's how:

**Option A: Automatic Test Mode Detection (Recommended)**

The frontend will automatically detect if test mode is available and show a "Test Payment" button.

**Option B: Manual Test Mode Toggle**

Add a test mode toggle in your checkout page (only visible in development).

## 🧪 Testing Methods

### Method 1: Using Test Payment Endpoint (Recommended)

This method bypasses Razorpay completely and directly creates orders.

#### Steps:

1. **Start your backend server:**
   ```bash
   cd backend
   npm start
   ```

2. **Start your frontend:**
   ```bash
   cd frontend
   npm run dev
   ```

3. **Add items to cart and proceed to checkout**

4. **Instead of clicking "Proceed to Payment", use the test endpoint:**

   You can either:
   - Add a test button in Checkout.jsx (see example below)
   - Use browser console or Postman to call the test endpoint

5. **Test endpoint call:**
   ```javascript
   // In browser console (after logging in):
   const token = localStorage.getItem('token'); // or wherever you store the token
   const orderIntentId = 'YOUR_ORDER_INTENT_ID'; // Get this from checkout flow
   
   fetch('http://localhost:3000/api/payments/test/simulate-payment', {
     method: 'POST',
     headers: {
       'Content-Type': 'application/json',
       'Authorization': `Bearer ${token}`
     },
     body: JSON.stringify({ orderIntentId })
   })
   .then(res => res.json())
   .then(data => {
     console.log('Test payment result:', data);
     // Navigate to confirmation page
     window.location.href = `/orders/${data.order_id}/confirmation`;
   });
   ```

### Method 2: Add Test Button to Checkout (Easier)

Add this to your `Checkout.jsx`:

```jsx
// Add this state
const [testMode, setTestMode] = useState(process.env.NODE_ENV === 'development');

// Add this function
const handleTestPayment = async () => {
  if (!selectedAddressId) {
    showError('Please select a delivery address');
    return;
  }

  setProcessing(true);

  try {
    // Step 1: Create order intent
    const orderIntentData = await orderIntentService.createOrderIntent(
      selectedAddressId,
      selectedAddressId,
      appliedCoupon?.code || null
    );

    const orderIntent = orderIntentData.order_intent;

    // Step 2: Simulate payment (test mode)
    const result = await paymentService.simulateTestPayment(orderIntent.id);
    
    showSuccess('Test payment successful! Order confirmed.');
    await refreshCart();
    setProcessing(false);
    
    // Navigate to confirmation page
    if (result.order_id) {
      navigate(`/orders/${result.order_id}/confirmation`);
    } else {
      navigate(`/account/orders`);
    }
  } catch (error) {
    console.error('Error in test payment:', error);
    showError(error.response?.data?.message || 'Test payment failed');
    setProcessing(false);
  }
};

// Add this button in your JSX (only show in development)
{testMode && (
  <button
    onClick={handleTestPayment}
    disabled={processing || !selectedAddressId}
    className="w-full py-3 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed mt-2"
  >
    {processing ? 'Processing...' : '🧪 Test Payment (Skip Razorpay)'}
  </button>
)}
```

### Method 3: Using Postman/Thunder Client

1. **Create Order Intent:**
   ```
   POST http://localhost:3000/api/order-intents
   Headers: Authorization: Bearer YOUR_JWT_TOKEN
   Body: {
     "shippingAddressId": "address-uuid",
     "billingAddressId": "address-uuid",
     "discountCode": null
   }
   ```

2. **Simulate Payment:**
   ```
   POST http://localhost:3000/api/payments/test/simulate-payment
   Headers: Authorization: Bearer YOUR_JWT_TOKEN
   Body: {
     "orderIntentId": "order-intent-uuid-from-step-1"
   }
   ```

3. **Get Order Confirmation:**
   ```
   GET http://localhost:3000/api/orders/{orderId}/confirmation
   Headers: Authorization: Bearer YOUR_JWT_TOKEN
   ```

## 📋 Complete Test Flow (STR - System Test Requirements)

### Test Scenario 1: Happy Path - Complete Checkout Flow

**Preconditions:**
- User is logged in
- User has items in cart
- User has at least one address saved
- Backend is running with `ENABLE_TEST_MODE=true`

**Test Steps:**

1. **Navigate to Cart**
   - Go to `/cart`
   - Verify items are displayed
   - Verify quantities and prices are correct

2. **Proceed to Checkout**
   - Click "Proceed to Checkout"
   - Verify redirect to `/checkout`

3. **Select Address**
   - Verify addresses are loaded
   - Select a delivery address
   - Verify address is highlighted

4. **Apply Coupon (Optional)**
   - Enter a valid coupon code
   - Click "Apply"
   - Verify discount is applied
   - Verify price breakdown updates

5. **Review Price Summary**
   - Verify subtotal matches cart total
   - Verify discount is shown (if applied)
   - Verify tax calculation (18% GST)
   - Verify shipping cost (should be 0 for free shipping)
   - Verify total amount is correct

6. **Create Order Intent (Test Mode)**
   - Click "🧪 Test Payment" button (or use test endpoint)
   - Verify order intent is created
   - Verify inventory is locked

7. **Simulate Payment**
   - Payment is automatically simulated
   - Verify order is created from intent
   - Verify order status is "paid"

8. **Navigate to Confirmation Page**
   - Verify redirect to `/orders/{orderId}/confirmation`
   - Verify URL contains valid order ID

9. **Verify Confirmation Page Content**
   - ✅ Success icon and message displayed
   - ✅ Order ID is displayed and copyable
   - ✅ Order date and time displayed
   - ✅ Payment method displayed
   - ✅ Total amount displayed
   - ✅ "View Order" button works
   - ✅ "Continue Shopping" button works

10. **Verify Order Summary Section**
    - ✅ All items from cart are displayed
    - ✅ Product images are shown
    - ✅ Product names are correct
    - ✅ Variant information displayed (size, color, finish) if applicable
    - ✅ Quantities are correct
    - ✅ Item prices are correct
    - ✅ Price breakdown shows:
      - Item subtotal
      - Discount (if applied)
      - Tax (GST 18%)
      - Shipping cost
      - Total amount (highlighted)

11. **Verify Delivery Address**
    - ✅ Address is displayed correctly
    - ✅ "Delivery Address Confirmed" indicator shown
    - ✅ Address is read-only (no edit option)

12. **Verify Order Status Timeline**
    - ✅ Timeline shows 5 steps:
      - Order Placed (✓ completed)
      - Processing (⏳ in progress)
      - Shipped (⬜ pending)
      - Out for Delivery (⬜ pending)
      - Delivered (⬜ pending)
    - ✅ Current status is highlighted correctly

13. **Verify Estimated Delivery**
    - ✅ Estimated delivery date range is displayed
    - ✅ Format: "DD MMM YYYY - DD MMM YYYY"
    - ✅ Date is 3-5 business days from order date

14. **Verify Trust & Assurance Section**
    - ✅ Three assurance cards displayed:
      - Secure Payment
      - Easy Returns
      - 24/7 Support

### Test Scenario 2: Page Refresh on Confirmation Page

**Preconditions:**
- User has completed a test order
- User is on confirmation page: `/orders/{orderId}/confirmation`

**Test Steps:**

1. **Refresh the Page**
   - Press F5 or click browser refresh
   - Verify page reloads successfully
   - Verify all order data is still displayed
   - Verify no data is lost

2. **Direct URL Access**
   - Close browser tab
   - Open new tab
   - Navigate directly to `/orders/{orderId}/confirmation`
   - Verify page loads with all order details
   - Verify user authentication is checked

### Test Scenario 3: Edge Case - Payment Succeeded but Order Creation Delayed

**Preconditions:**
- Backend is running
- Test mode is enabled

**Test Steps:**

1. **Create Order Intent**
   - Complete checkout up to payment step
   - Note the order intent ID

2. **Simulate Payment Delay**
   - Manually delay order creation (temporarily break convertIntentToOrder)
   - Or use a very slow database connection

3. **Navigate to Confirmation Page**
   - Try to access confirmation page with order intent ID
   - Verify "Confirming your order..." message is shown
   - Verify polling starts automatically

4. **Wait for Order Creation**
   - Verify polling continues (every 5 seconds)
   - Verify order is eventually found
   - Verify confirmation page displays correctly

5. **Verify Polling Stops**
   - After order is found, verify polling stops
   - Verify no unnecessary API calls continue

### Test Scenario 4: Invalid Order ID

**Preconditions:**
- User is logged in

**Test Steps:**

1. **Access Invalid Order ID**
   - Navigate to `/orders/invalid-uuid/confirmation`
   - Verify 404 error is shown
   - Verify error message is user-friendly

2. **Access Another User's Order**
   - Get order ID from another user's account
   - Try to access `/orders/{other-user-order-id}/confirmation`
   - Verify 404 error (security check)
   - Verify order is not accessible

### Test Scenario 5: Variant Information Display

**Preconditions:**
- User has items with variants in cart (size, color, finish)

**Test Steps:**

1. **Complete Checkout with Variants**
   - Add items with variants to cart
   - Complete checkout flow

2. **Verify Variant Information**
   - On confirmation page, verify variant details are shown:
     - Size (if applicable)
     - Color (if applicable)
     - Finish (if applicable)
   - Verify variant info matches what was selected

3. **Verify Variant Snapshot**
   - Check database: `order_items.variant_snapshot`
   - Verify snapshot contains immutable variant data
   - Verify snapshot doesn't change even if product variant is updated later

### Test Scenario 6: Order Status Timeline Updates

**Preconditions:**
- User has completed an order
- Order is in "paid" status

**Test Steps:**

1. **Verify Initial Timeline**
   - Check confirmation page
   - Verify timeline shows "Processing" as in progress

2. **Update Order Status (Admin)**
   - As admin, update order status to "shipped"
   - Update shipment_status to "SHIPPED"

3. **Refresh Confirmation Page**
   - User refreshes confirmation page
   - Verify timeline updates:
     - "Processing" is completed
     - "Shipped" is in progress

4. **Update to Out for Delivery**
   - Admin updates shipment_status to "OUT_FOR_DELIVERY"
   - User refreshes page
   - Verify timeline shows "Out for Delivery" in progress

5. **Update to Delivered**
   - Admin updates to "delivered"
   - User refreshes page
   - Verify all timeline steps are completed

### Test Scenario 7: Price Breakdown Accuracy

**Preconditions:**
- User has items in cart with known prices

**Test Steps:**

1. **Calculate Expected Values**
   - Note item prices
   - Calculate expected subtotal
   - Calculate expected discount (if coupon applied)
   - Calculate expected tax (18% of subtotal - discount)
   - Calculate expected total

2. **Complete Checkout**
   - Complete checkout flow

3. **Verify Price Breakdown**
   - On confirmation page, verify:
     - Item subtotal matches calculation
     - Discount matches (if applied)
     - Tax matches calculation (18% GST)
     - Shipping is 0 (free shipping)
     - Total matches expected total

4. **Verify Backend Snapshot**
   - Check database `orders` table
   - Verify all price fields match confirmation page
   - Verify prices are immutable (snapshot)

### Test Scenario 8: Multiple Items with Different Variants

**Preconditions:**
- User has multiple items in cart
- Some items have variants, some don't

**Test Steps:**

1. **Add Mixed Items**
   - Add item with variant (e.g., ring with size)
   - Add item without variant
   - Add another item with variant (different type)

2. **Complete Checkout**

3. **Verify Order Items**
   - On confirmation page, verify:
     - All items are displayed
     - Items with variants show variant info
     - Items without variants don't show variant info
     - All quantities are correct
     - All prices are correct

## 🔍 Verification Checklist

After completing all test scenarios, verify:

### Functional Requirements
- [ ] Order confirmation page loads correctly
- [ ] All order details are displayed accurately
- [ ] Page is reload-safe (works on refresh)
- [ ] Direct URL access works
- [ ] Polling works for delayed orders
- [ ] Variant information is displayed correctly
- [ ] Price breakdown is accurate
- [ ] Order status timeline is correct
- [ ] Estimated delivery date is shown
- [ ] All buttons and links work

### Security Requirements
- [ ] Users can only view their own orders
- [ ] Invalid order IDs return 404
- [ ] JWT authentication is required
- [ ] Order IDs are not guessable

### UI/UX Requirements
- [ ] Success message is clear
- [ ] Order ID is copyable
- [ ] Loading states are shown
- [ ] Error messages are user-friendly
- [ ] Trust & assurance section is visible
- [ ] Page feels premium and trustworthy

### Data Integrity
- [ ] Order snapshot is immutable
- [ ] Variant information is preserved
- [ ] Prices don't change after order creation
- [ ] All data comes from backend (not recalculated)

## 🐛 Troubleshooting

### Test Mode Not Working

**Issue**: Getting 403 error when calling test endpoint

**Solution**:
1. Check `backend/.env` has `ENABLE_TEST_MODE=true`
2. Check `NODE_ENV=development` (not production)
3. Restart backend server after changing .env

### Order Not Found After Test Payment

**Issue**: Test payment succeeds but order not found

**Solution**:
1. Check backend logs for errors
2. Verify order_intent was created successfully
3. Check database for order in `orders` table
4. Verify `convertIntentToOrder` function completed

### Confirmation Page Shows Loading Forever

**Issue**: Page keeps showing "Confirming your order..."

**Solution**:
1. Check browser console for errors
2. Check backend logs
3. Verify order was actually created
4. Check network tab for API calls
5. Verify order ID in URL is correct

### Variant Information Not Showing

**Issue**: Items with variants don't show variant details

**Solution**:
1. Check database migration was run
2. Verify `order_items.variant_snapshot` has data
3. Check backend logs for errors
4. Verify variant data was saved during order creation

## 📝 Notes

- Test mode is **ONLY** for local development
- Never enable test mode in production
- Test mode bypasses all payment security checks
- Always test with real Razorpay in staging before production
- Keep test orders separate from production data

## 🚀 Next Steps After Local Testing

Once local testing is complete:

1. **Disable Test Mode**: Remove `ENABLE_TEST_MODE=true` from production .env
2. **Test with Real Razorpay**: Use Razorpay test keys in staging
3. **Deploy to Staging**: Test full flow in staging environment
4. **Production Deployment**: Only after all tests pass
