# System Test Requirements (STR) - Order Confirmation Flow

## Overview

This document provides a comprehensive test plan for the Post-Payment Order Confirmation feature (Phase 1).

## Test Environment Setup

### Prerequisites
- Backend server running on `http://localhost:3000`
- Frontend running on `http://localhost:5173` (or configured port)
- Database (Supabase) accessible
- Test mode enabled: `ENABLE_TEST_MODE=true` in `backend/.env`

### Test Data Requirements
- At least 2 user accounts (one for testing, one for security tests)
- Products with variants (size, color, finish)
- Products without variants
- Valid discount/coupon codes
- Saved addresses for test user

---

## Test Suite 1: Happy Path - Complete Checkout to Confirmation

### TC-001: Standard Checkout Flow with Single Item

**Objective**: Verify complete checkout flow works for single item order

**Preconditions**:
- User is logged in
- Cart contains 1 item (no variant)
- User has at least 1 saved address

**Test Steps**:
1. Navigate to `/cart`
2. Click "Proceed to Checkout"
3. Select delivery address
4. Review price summary
5. Click "🧪 Test Payment" (or use test endpoint)
6. Wait for order creation
7. Verify redirect to confirmation page

**Expected Results**:
- ✅ Order intent created successfully
- ✅ Order created from intent
- ✅ Redirect to `/orders/{orderId}/confirmation`
- ✅ Confirmation page displays all sections
- ✅ Order ID is displayed and copyable
- ✅ All order details are accurate

**Test Data**:
- Item: Any product without variant
- Address: Any saved address

---

### TC-002: Checkout Flow with Variant Item

**Objective**: Verify checkout flow works for items with variants

**Preconditions**:
- User is logged in
- Cart contains 1 item with variant (e.g., ring with size)
- User has saved address

**Test Steps**:
1. Navigate to `/cart`
2. Click "Proceed to Checkout"
3. Select delivery address
4. Review price summary
5. Click "🧪 Test Payment"
6. Verify redirect to confirmation page
7. Check variant information display

**Expected Results**:
- ✅ Order created successfully
- ✅ Confirmation page shows variant details
- ✅ Variant snapshot stored in database
- ✅ Variant info matches selected variant

**Test Data**:
- Item: Product with variant (size: 7, color: Gold)
- Address: Any saved address

---

### TC-003: Checkout Flow with Multiple Items

**Objective**: Verify checkout works with multiple items (mixed variants)

**Preconditions**:
- User is logged in
- Cart contains 3+ items:
  - 1 item with variant
  - 1 item without variant
  - 1 item with different variant type
- User has saved address

**Test Steps**:
1. Navigate to `/cart`
2. Click "Proceed to Checkout"
3. Select delivery address
4. Review price summary (verify totals)
5. Click "🧪 Test Payment"
6. Verify confirmation page

**Expected Results**:
- ✅ All items displayed on confirmation page
- ✅ Items with variants show variant info
- ✅ Items without variants don't show variant info
- ✅ Total price is sum of all items
- ✅ Quantities are correct

**Test Data**:
- Items: Mix of products with/without variants
- Quantities: Vary (1, 2, 3)

---

### TC-004: Checkout Flow with Discount Code

**Objective**: Verify discount application and display on confirmation

**Preconditions**:
- User is logged in
- Cart total meets minimum for discount
- Valid discount code available
- User has saved address

**Test Steps**:
1. Navigate to `/checkout`
2. Select delivery address
3. Enter valid discount code
4. Click "Apply"
5. Verify discount applied in price summary
6. Click "🧪 Test Payment"
7. Verify confirmation page shows discount

**Expected Results**:
- ✅ Discount code applied successfully
- ✅ Price summary shows discount amount
- ✅ Confirmation page shows discount in breakdown
- ✅ Total amount includes discount
- ✅ Discount snapshot stored in order

**Test Data**:
- Discount: 10% off or ₹500 flat discount
- Cart total: Above minimum threshold

---

## Test Suite 2: Confirmation Page Functionality

### TC-005: Confirmation Page - All Sections Display

**Objective**: Verify all required sections are displayed

**Preconditions**:
- User has completed a test order
- User is on confirmation page

**Test Steps**:
1. Navigate to `/orders/{orderId}/confirmation`
2. Scroll through page
3. Verify each section

**Expected Results**:
- ✅ Success section with icon and message
- ✅ Order ID, date, payment method displayed
- ✅ Order summary section with items
- ✅ Price breakdown section
- ✅ Delivery address section
- ✅ Order status timeline
- ✅ Estimated delivery section
- ✅ Trust & assurance section

---

### TC-006: Order ID Copy Functionality

**Objective**: Verify order ID can be copied

**Preconditions**:
- User is on confirmation page

**Test Steps**:
1. Click on order ID
2. Verify clipboard copy
3. Paste in text editor
4. Verify order ID matches

**Expected Results**:
- ✅ Order ID is clickable
- ✅ Copy icon visible
- ✅ Order ID copied to clipboard
- ✅ Pasted value matches displayed order ID

---

### TC-007: Price Breakdown Accuracy

**Objective**: Verify all price calculations are correct

**Preconditions**:
- User has completed order with known values
- User is on confirmation page

**Test Steps**:
1. Note item prices from cart
2. Calculate expected values:
   - Subtotal = sum of (item_price × quantity)
   - Discount = applied discount amount
   - Tax = (subtotal - discount) × 0.18
   - Shipping = 0 (free shipping)
   - Total = subtotal - discount + tax + shipping
3. Compare with confirmation page values

**Expected Results**:
- ✅ Item subtotal matches calculation
- ✅ Discount matches (if applied)
- ✅ Tax is 18% of (subtotal - discount)
- ✅ Shipping is 0
- ✅ Total matches calculation
- ✅ All values match backend snapshot

**Test Data**:
- Items: 2 items @ ₹5000 each = ₹10000
- Discount: ₹1000
- Tax: (₹10000 - ₹1000) × 0.18 = ₹1620
- Total: ₹10000 - ₹1000 + ₹1620 = ₹10620

---

### TC-008: Variant Information Display

**Objective**: Verify variant details are displayed correctly

**Preconditions**:
- Order contains items with variants
- User is on confirmation page

**Test Steps**:
1. Locate items with variants
2. Verify variant information displayed
3. Check database for variant snapshot

**Expected Results**:
- ✅ Variant size displayed (if applicable)
- ✅ Variant color displayed (if applicable)
- ✅ Variant finish displayed (if applicable)
- ✅ Variant info matches selected variant
- ✅ Database has variant_snapshot JSONB data

**Test Data**:
- Item: Ring
- Variant: Size 7, Color: Gold, Finish: Polished

---

### TC-009: Delivery Address Display

**Objective**: Verify address is displayed correctly and read-only

**Preconditions**:
- Order has shipping address
- User is on confirmation page

**Test Steps**:
1. Locate delivery address section
2. Verify address details
3. Check for edit option (should not exist)

**Expected Results**:
- ✅ Full name displayed
- ✅ Address lines displayed
- ✅ City, state, pincode displayed
- ✅ Phone number displayed
- ✅ "Delivery Address Confirmed" indicator shown
- ✅ No edit button or editable fields

---

### TC-010: Order Status Timeline - Initial State

**Objective**: Verify timeline shows correct initial state

**Preconditions**:
- Order just created (status: "paid")
- User is on confirmation page

**Test Steps**:
1. Locate order status timeline
2. Verify each step status

**Expected Results**:
- ✅ "Order Placed" - completed (green checkmark)
- ✅ "Processing" - in progress (spinning indicator)
- ✅ "Shipped" - pending (empty circle)
- ✅ "Out for Delivery" - pending
- ✅ "Delivered" - pending

---

### TC-011: Estimated Delivery Date Display

**Objective**: Verify estimated delivery date is shown

**Preconditions**:
- Order just created
- User is on confirmation page

**Test Steps**:
1. Locate estimated delivery section
2. Verify date range displayed
3. Calculate expected date (3-5 business days)

**Expected Results**:
- ✅ Date range displayed
- ✅ Format: "DD MMM YYYY - DD MMM YYYY"
- ✅ Date is 3-5 business days from order date
- ✅ Weekends excluded from calculation

**Example**:
- Order date: Monday, Jan 15, 2024
- Expected delivery: Thursday, Jan 18 - Monday, Jan 22, 2024

---

## Test Suite 3: Page Reload and Direct Access

### TC-012: Page Refresh on Confirmation Page

**Objective**: Verify page works after refresh

**Preconditions**:
- User is on confirmation page

**Test Steps**:
1. Note current order details
2. Press F5 (refresh)
3. Wait for page to reload
4. Verify all data is still displayed

**Expected Results**:
- ✅ Page reloads successfully
- ✅ All order data still displayed
- ✅ No data loss
- ✅ No errors in console
- ✅ Order ID in URL remains same

---

### TC-013: Direct URL Access

**Objective**: Verify page works with direct URL access

**Preconditions**:
- User has completed an order
- User knows order ID

**Test Steps**:
1. Close current browser tab
2. Open new tab
3. Navigate directly to `/orders/{orderId}/confirmation`
4. Verify page loads

**Expected Results**:
- ✅ Page loads successfully
- ✅ All order data displayed
- ✅ User authentication checked
- ✅ No redirect to login (if already logged in)

---

### TC-014: Direct URL Access - Not Logged In

**Objective**: Verify authentication check works

**Preconditions**:
- User is NOT logged in
- Valid order ID exists

**Test Steps**:
1. Log out (if logged in)
2. Navigate to `/orders/{orderId}/confirmation`
3. Verify redirect

**Expected Results**:
- ✅ Redirect to login page
- ✅ After login, redirect back to confirmation page
- ✅ Order data loads correctly

---

## Test Suite 4: Edge Cases and Error Handling

### TC-015: Payment Succeeded but Order Creation Delayed

**Objective**: Verify polling works for delayed orders

**Preconditions**:
- Order intent created
- Payment simulated but order creation delayed

**Test Steps**:
1. Create order intent
2. Simulate payment but delay order creation (manually)
3. Navigate to confirmation page immediately
4. Observe polling behavior

**Expected Results**:
- ✅ "Confirming your order..." message shown
- ✅ Polling starts automatically (every 5 seconds)
- ✅ Order eventually found
- ✅ Confirmation page displays
- ✅ Polling stops after order found

---

### TC-016: Invalid Order ID

**Objective**: Verify error handling for invalid order ID

**Preconditions**:
- User is logged in

**Test Steps**:
1. Navigate to `/orders/invalid-uuid-123/confirmation`
2. Verify error handling

**Expected Results**:
- ✅ 404 error returned
- ✅ User-friendly error message displayed
- ✅ "View My Orders" button shown
- ✅ "Continue Shopping" button shown

---

### TC-017: Access Another User's Order

**Objective**: Verify security - users can't access others' orders

**Preconditions**:
- User A is logged in
- Order exists for User B
- User A knows User B's order ID

**Test Steps**:
1. User A navigates to `/orders/{userB-orderId}/confirmation`
2. Verify access denied

**Expected Results**:
- ✅ 404 error returned
- ✅ Order not accessible
- ✅ No order data displayed
- ✅ Security check works

---

### TC-018: Order Not Found After Max Polling

**Objective**: Verify handling when order never appears

**Preconditions**:
- Order intent created but order never created
- Max polling attempts reached

**Test Steps**:
1. Create order intent
2. Don't create order
3. Navigate to confirmation page
4. Wait for max polling attempts (10 attempts = 50 seconds)

**Expected Results**:
- ✅ Polling stops after max attempts
- ✅ Error message displayed
- ✅ User-friendly message: "Order confirmation is taking longer than expected"
- ✅ Options to view orders or continue shopping

---

## Test Suite 5: Order Status Timeline Updates

### TC-019: Timeline Update - Shipped Status

**Objective**: Verify timeline updates when order is shipped

**Preconditions**:
- Order exists with status "paid"
- User has viewed confirmation page

**Test Steps**:
1. As admin, update order status to "shipped"
2. Update shipment_status to "SHIPPED"
3. User refreshes confirmation page
4. Verify timeline updates

**Expected Results**:
- ✅ "Processing" step completed
- ✅ "Shipped" step in progress
- ✅ Timeline reflects new status

---

### TC-020: Timeline Update - Out for Delivery

**Objective**: Verify timeline updates for out for delivery

**Preconditions**:
- Order is shipped

**Test Steps**:
1. Admin updates shipment_status to "OUT_FOR_DELIVERY"
2. User refreshes confirmation page
3. Verify timeline

**Expected Results**:
- ✅ "Shipped" step completed
- ✅ "Out for Delivery" step in progress

---

### TC-021: Timeline Update - Delivered

**Objective**: Verify timeline completes when delivered

**Preconditions**:
- Order is out for delivery

**Test Steps**:
1. Admin updates order status to "delivered"
2. User refreshes confirmation page
3. Verify timeline

**Expected Results**:
- ✅ All steps completed
- ✅ "Delivered" step completed
- ✅ No steps in progress

---

## Test Suite 6: Data Integrity and Immutability

### TC-022: Order Snapshot Immutability

**Objective**: Verify order data doesn't change after creation

**Preconditions**:
- Order created with specific prices
- Product prices change after order

**Test Steps**:
1. Create order with product @ ₹5000
2. Update product price to ₹6000 in database
3. Refresh confirmation page
4. Verify order still shows ₹5000

**Expected Results**:
- ✅ Order shows original price (₹5000)
- ✅ Price doesn't change to new price (₹6000)
- ✅ Snapshot is immutable

---

### TC-023: Variant Snapshot Immutability

**Objective**: Verify variant data doesn't change

**Preconditions**:
- Order created with variant (size: 7, color: Gold)
- Variant updated after order

**Test Steps**:
1. Create order with variant
2. Update variant color to "Rose Gold" in database
3. Refresh confirmation page
4. Verify variant still shows "Gold"

**Expected Results**:
- ✅ Confirmation page shows "Gold" (original)
- ✅ Variant snapshot unchanged
- ✅ Database variant_snapshot has original data

---

## Test Suite 7: UI/UX and Trust Elements

### TC-024: Trust & Assurance Section

**Objective**: Verify trust elements are displayed

**Preconditions**:
- User is on confirmation page

**Test Steps**:
1. Scroll to trust & assurance section
2. Verify all elements displayed

**Expected Results**:
- ✅ "Secure Payment" card displayed
- ✅ "Easy Returns" card displayed
- ✅ "24/7 Support" card displayed
- ✅ Icons are visible
- ✅ Text is readable

---

### TC-025: Button Functionality

**Objective**: Verify all buttons work correctly

**Preconditions**:
- User is on confirmation page

**Test Steps**:
1. Click "View Order" button
2. Verify navigation
3. Go back to confirmation page
4. Click "Continue Shopping" button
5. Verify navigation

**Expected Results**:
- ✅ "View Order" navigates to `/account/orders`
- ✅ "Continue Shopping" navigates to `/products`
- ✅ Navigation is smooth
- ✅ No errors

---

### TC-026: Loading States

**Objective**: Verify loading states are shown appropriately

**Preconditions**:
- User navigates to confirmation page

**Test Steps**:
1. Navigate to confirmation page
2. Observe loading state
3. Wait for data to load
4. Verify transition

**Expected Results**:
- ✅ Loading spinner shown initially
- ✅ "Loading order confirmation..." message
- ✅ Smooth transition to content
- ✅ No flash of empty content

---

## Test Suite 8: Performance and Optimization

### TC-027: Page Load Performance

**Objective**: Verify page loads quickly

**Preconditions**:
- Order exists
- User is logged in

**Test Steps**:
1. Open browser DevTools
2. Navigate to confirmation page
3. Check Network tab
4. Verify load time

**Expected Results**:
- ✅ Page loads in < 2 seconds
- ✅ API call completes quickly
- ✅ No unnecessary API calls
- ✅ Images load efficiently

---

### TC-028: API Call Efficiency

**Objective**: Verify only necessary data is fetched

**Preconditions**:
- User is on confirmation page

**Test Steps**:
1. Open Network tab
2. Refresh confirmation page
3. Check API calls made

**Expected Results**:
- ✅ Only 1 API call to `/orders/{id}/confirmation`
- ✅ No redundant calls
- ✅ Response includes all needed data
- ✅ No N+1 query problems

---

## Test Summary Report Template

After completing all test cases, fill this summary:

```
Test Execution Summary
=====================

Total Test Cases: 28
Passed: ___
Failed: ___
Blocked: ___
Not Executed: ___

Critical Issues Found: ___
High Priority Issues: ___
Medium Priority Issues: ___
Low Priority Issues: ___

Test Environment:
- Backend: http://localhost:3000
- Frontend: http://localhost:5173
- Database: Supabase
- Test Mode: Enabled

Test Duration: ___ hours
Tester: ___
Date: ___

Notes:
- 
- 
- 
```

---

## Sign-off Criteria

Before marking Phase 1 as complete, ensure:

- [ ] All test cases pass (minimum 95% pass rate)
- [ ] No critical or high-priority bugs
- [ ] All security tests pass
- [ ] Performance is acceptable
- [ ] UI/UX meets requirements
- [ ] Data integrity verified
- [ ] Documentation complete

---

## Next Steps After Testing

1. **Fix any bugs found**
2. **Re-test fixed issues**
3. **Update documentation if needed**
4. **Prepare for staging deployment**
5. **Test with real Razorpay in staging**
6. **Deploy to production**
