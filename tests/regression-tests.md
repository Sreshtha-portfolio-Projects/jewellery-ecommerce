# 🔄 Regression Tests
## Aldorado Jewells – Existing Feature Validation

**Purpose**: Ensure existing features continue to work correctly after new changes or updates.

---

## Order Lifecycle Enforcement

### Test ID: REG-001
**Title**: Order Status Progression is Enforced

**Preconditions**:
- Admin is logged in
- Order exists with status "paid"
- Order has not been shipped yet

**Steps**:
1. Navigate to admin order detail page
2. Attempt to update shipping status to "DELIVERED" directly from "NOT_SHIPPED"
3. Observe system response

**Expected Result**:
- System rejects invalid status transition
- Error message indicates valid next statuses
- Order status remains unchanged
- System suggests valid progression (e.g., NOT_SHIPPED → PROCESSING → SHIPPED)

---

### Test ID: REG-002
**Title**: Shipping Status State Machine Works Correctly

**Preconditions**:
- Admin is logged in
- Order exists with status "paid" and shipping status "NOT_SHIPPED"

**Steps**:
1. Update shipping status to "PROCESSING"
2. Verify status change
3. Update shipping status to "SHIPPED"
4. Add courier and tracking number
5. Update to "IN_TRANSIT"
6. Update to "OUT_FOR_DELIVERY"
7. Update to "DELIVERED"

**Expected Result**:
- Each status transition succeeds
- Status changes are saved correctly
- Previous statuses cannot be reverted
- Status history is maintained
- Customer can see updated status on order detail page

---

### Test ID: REG-003
**Title**: Cannot Ship Unpaid Orders

**Preconditions**:
- Admin is logged in
- Order exists with payment status "pending" or "failed"

**Steps**:
1. Navigate to order detail page
2. Attempt to update shipping status to "SHIPPED"
3. Attempt to create shipment with courier details

**Expected Result**:
- System prevents shipping status update
- Error message indicates order must be paid first
- Shipping actions are disabled or show appropriate message
- Order remains in "NOT_SHIPPED" status

---

## Page Reload Safety

### Test ID: REG-004
**Title**: Cart Persists After Page Refresh

**Preconditions**:
- User is logged in
- User has items in cart

**Steps**:
1. Add items to cart
2. Note cart count
3. Refresh the page (F5)
4. Navigate to cart page

**Expected Result**:
- Cart items persist after refresh
- Cart count remains the same
- All items are still in cart
- No duplicate items appear
- Prices are correct

---

### Test ID: REG-005
**Title**: Checkout Page Maintains State on Refresh

**Preconditions**:
- User is logged in
- User has items in cart
- User is on checkout page

**Steps**:
1. Select shipping address
2. Apply discount code (if applicable)
3. Refresh the page
4. Verify selected address and applied discount

**Expected Result**:
- Page reloads successfully
- Selected address is maintained (or user can reselect)
- Applied discount is maintained (or can be reapplied)
- Price breakdown is recalculated correctly
- User can proceed with checkout

---

### Test ID: REG-006
**Title**: Order Detail Page Data Persists on Refresh

**Preconditions**:
- User is logged in
- User has at least one order
- User is viewing order detail page

**Steps**:
1. View order details (items, status, timeline)
2. Refresh the page multiple times
3. Verify all data is still displayed

**Expected Result**:
- All order data loads correctly after each refresh
- Timeline shows correct status
- Order items are displayed
- Payment and shipping information is accurate
- No data corruption or missing information

---

## Shipping Status Updates

### Test ID: REG-007
**Title**: Customer Sees Updated Shipping Status

**Preconditions**:
- Customer is logged in
- Customer has an order
- Admin updates shipping status

**Steps**:
1. Admin updates order shipping status to "SHIPPED"
2. Admin adds courier name and tracking number
3. Customer navigates to their order detail page
4. Customer refreshes the page

**Expected Result**:
- Customer sees updated shipping status
- Courier name and tracking number are visible
- Timeline reflects "Shipped" status
- Estimated delivery date is shown
- Tracking number is clickable (if link is implemented)

---

### Test ID: REG-008
**Title**: Shipping History is Maintained

**Preconditions**:
- Admin is logged in
- Order has multiple shipping status updates

**Steps**:
1. Navigate to order detail page
2. View shipping history (if available)
3. Verify all status changes are recorded

**Expected Result**:
- Shipping history shows all status transitions
- Timestamps are accurate
- Admin notes are preserved
- History is in chronological order

---

## Admin Order Management

### Test ID: REG-009
**Title**: Admin Can Update Order Shipping Status

**Preconditions**:
- Admin is logged in
- Order exists with status "paid"
- Order shipping status is "NOT_SHIPPED"

**Steps**:
1. Navigate to admin order detail page
2. Update shipping status to "PROCESSING"
3. Verify status change is saved
4. Update to "SHIPPED"
5. Add courier name and tracking number

**Expected Result**:
- Status updates succeed
- Changes are saved immediately
- Status is reflected in order list
- Customer can see updated status
- No errors occur

---

### Test ID: REG-010
**Title**: Admin Can Create Shipment with Tracking

**Preconditions**:
- Admin is logged in
- Order exists with status "paid"
- Order shipping status is "NOT_SHIPPED" or "PROCESSING"

**Steps**:
1. Navigate to admin order detail page
2. Click "Create Shipment" or similar action
3. Enter courier name
4. Enter tracking number
5. Add optional notes
6. Submit shipment creation

**Expected Result**:
- Shipment is created successfully
- Shipping status automatically updates to "SHIPPED"
- Courier name and tracking number are saved
- Invoice is generated (if configured)
- Customer can see tracking information

---

### Test ID: REG-011
**Title**: Admin Can View All Orders with Filters

**Preconditions**:
- Admin is logged in
- Multiple orders exist with different statuses

**Steps**:
1. Navigate to admin orders list
2. Apply status filter (e.g., "paid", "shipped")
3. Verify filtered results
4. Clear filter and view all orders

**Expected Result**:
- Filters work correctly
- Only matching orders are displayed
- Filter state persists during session
- All orders are shown when filter is cleared

---

## Invoice Download

### Test ID: REG-012
**Title**: Invoice Download Works for Paid Orders

**Preconditions**:
- User is logged in
- User has a paid order
- Order has been shipped (invoice generated)

**Steps**:
1. Navigate to order detail page
2. Click "Download Invoice" button
3. Verify invoice opens/downloads

**Expected Result**:
- Invoice download button is visible for paid orders
- Invoice opens in new window or downloads
- Invoice contains correct order information
- Seller details, buyer details, line items are accurate
- Pricing breakdown matches order snapshot

---

### Test ID: REG-013
**Title**: Invoice Not Available for Unpaid Orders

**Preconditions**:
- User is logged in
- User has an order with payment status "pending"

**Steps**:
1. Navigate to order detail page
2. Look for invoice download option

**Expected Result**:
- Invoice download button is not visible
- Or button is disabled with appropriate message
- No invoice is generated for unpaid orders

---

### Test ID: REG-014
**Title**: Invoice Reflects Order Snapshot Accurately

**Preconditions**:
- User is logged in
- User has a paid and shipped order
- Product prices have changed since order was placed

**Steps**:
1. Navigate to order detail page
2. Download invoice
3. Compare invoice prices with current product prices
4. Verify invoice matches order snapshot

**Expected Result**:
- Invoice shows prices from order snapshot (time of purchase)
- Invoice does not reflect current product prices
- Line items match order items exactly
- Discounts and taxes are accurate
- Total amount matches order total

---

## Return Request Rules

### Test ID: REG-015
**Title**: Return Request Only Allowed for Delivered Orders

**Preconditions**:
- User is logged in
- User has orders with different shipping statuses

**Steps**:
1. Navigate to order detail page for order with status "SHIPPED"
2. Check for "Request Return" button
3. Navigate to order detail page for order with status "DELIVERED"
4. Check for "Request Return" button

**Expected Result**:
- "Request Return" button is NOT visible for non-delivered orders
- "Request Return" button IS visible for delivered orders
- Button is disabled or hidden for orders not yet delivered

---

### Test ID: REG-016
**Title**: Return Request Window is Enforced

**Preconditions**:
- User is logged in
- User has a delivered order
- Return window is configured (e.g., 7 days)
- Order was delivered more than return window days ago

**Steps**:
1. Navigate to order detail page
2. Check if "Request Return" button is available
3. Verify return window message (if shown)

**Expected Result**:
- Return request is blocked if outside return window
- Appropriate message is shown (if implemented)
- Button is disabled or hidden
- System enforces admin-configured return window

---

### Test ID: REG-017
**Title**: Cannot Create Duplicate Return Requests

**Preconditions**:
- User is logged in
- User has a delivered order
- User has already submitted a return request for this order

**Steps**:
1. Navigate to order detail page
2. Check for "Request Return" button
3. Verify existing return request status

**Expected Result**:
- "Request Return" button is not visible or disabled
- Existing return request status is displayed
- User cannot submit another return request
- Return status timeline is shown

---

## Configuration Changes Reflecting Correctly

### Test ID: REG-018
**Title**: Delivery Zone Changes Reflect in Checkout

**Preconditions**:
- Admin is logged in
- Delivery zones are configured
- User is on checkout page

**Steps**:
1. Admin updates delivery zone settings (e.g., shipping cost, delivery days)
2. User refreshes checkout page or navigates to checkout
3. Verify shipping cost and delivery estimate

**Expected Result**:
- Updated delivery zone settings are reflected
- Shipping cost is calculated correctly
- Estimated delivery date updates
- Changes take effect without requiring user logout/login

---

### Test ID: REG-019
**Title**: Discount Code Changes Reflect Correctly

**Preconditions**:
- Admin is logged in
- Discount codes exist
- User is on checkout page

**Steps**:
1. Admin deactivates or modifies a discount code
2. User has that discount code applied in checkout
3. User refreshes checkout page or attempts to place order

**Expected Result**:
- Invalid discount codes are rejected
- Applied discount is removed if code is deactivated
- Error message is shown (if applicable)
- Price breakdown updates correctly

---

## Data Integrity

### Test ID: REG-020
**Title**: Order Snapshot Remains Immutable

**Preconditions**:
- User is logged in
- User has a completed order
- Product information has changed since order

**Steps**:
1. Navigate to order detail page
2. View order items
3. Compare with current product information
4. Verify prices and variant details

**Expected Result**:
- Order items show snapshot data (from time of purchase)
- Prices match order snapshot, not current prices
- Variant information is preserved
- Product name changes don't affect order display
- Order data never changes after creation

---

## Summary

These regression tests validate:
- ✅ Order lifecycle state machine
- ✅ Page reload safety
- ✅ Shipping status updates
- ✅ Admin order management
- ✅ Invoice generation and download
- ✅ Return request rules
- ✅ Configuration changes
- ✅ Data integrity

**Execution Time**: ~45-60 minutes for full regression suite

**Priority**: Run these tests before major releases and after significant feature additions.
