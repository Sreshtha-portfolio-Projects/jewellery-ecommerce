# 🚫 Negative Tests
## Aldorado Jewells – Invalid Input & Security Validation

**Purpose**: Validate system behavior under invalid inputs, unauthorized access, and malicious actions.

---

## Unauthorized API Access

### Test ID: NEG-001
**Title**: Unauthenticated User Cannot Access Protected Endpoints

**Preconditions**:
- User is NOT logged in
- Browser developer tools are open (Network tab)

**Steps**:
1. Attempt to access `/api/orders` endpoint directly
2. Attempt to access `/api/cart` endpoint
3. Attempt to access `/api/account/profile` endpoint
4. Observe response codes

**Expected Result**:
- All requests return 401 (Unauthorized) or 403 (Forbidden)
- Error message indicates authentication required
- No sensitive data is returned
- Token validation fails

---

### Test ID: NEG-002
**Title**: Invalid JWT Token is Rejected

**Preconditions**:
- User is not logged in
- Browser developer tools are open

**Steps**:
1. Manually set an invalid token in localStorage: `localStorage.setItem('token', 'invalid_token_123')`
2. Attempt to access a protected endpoint
3. Observe response

**Expected Result**:
- Request is rejected with 401 (Unauthorized)
- Error message indicates invalid token
- User is logged out or redirected to login
- Invalid token is removed from storage

---

### Test ID: NEG-003
**Title**: Expired JWT Token is Rejected

**Preconditions**:
- User has an expired token (wait for token expiration or manually expire)

**Steps**:
1. Attempt to access any protected endpoint with expired token
2. Observe response

**Expected Result**:
- Request is rejected with 401 (Unauthorized)
- Error message indicates token expired
- User is redirected to login page
- Expired token is cleared

---

### Test ID: NEG-004
**Title**: Customer Cannot Access Admin Endpoints

**Preconditions**:
- Customer is logged in
- Customer has valid JWT token
- Browser developer tools are open

**Steps**:
1. Attempt to access `/api/admin/orders` endpoint
2. Attempt to access `/api/admin/products` endpoint
3. Observe response codes

**Expected Result**:
- All admin endpoints return 403 (Forbidden)
- Error message indicates admin access required
- Customer cannot access admin functionality
- Role-based access control works correctly

---

## Accessing Another User's Data

### Test ID: NEG-005
**Title**: User Cannot Access Another User's Orders

**Preconditions**:
- User A is logged in
- User B has orders in the system
- User A knows User B's order ID

**Steps**:
1. User A navigates to `/account/orders/{userB_orderId}`
2. Or User A attempts API call: `GET /api/orders/{userB_orderId}`
3. Observe response

**Expected Result**:
- Request is rejected with 403 (Forbidden) or 404 (Not Found)
- Error message indicates unauthorized access
- No order data is returned
- System validates order ownership

---

### Test ID: NEG-006
**Title**: User Cannot Access Another User's Cart

**Preconditions**:
- User A is logged in
- User B has items in cart
- User A knows User B's user ID

**Steps**:
1. User A attempts to access User B's cart via API
2. Or User A tries to modify User B's cart
3. Observe response

**Expected Result**:
- Request is rejected with 403 (Forbidden)
- No cart data is returned
- Cart operations are blocked
- System validates cart ownership

---

### Test ID: NEG-007
**Title**: User Cannot View Another User's Profile

**Preconditions**:
- User A is logged in
- User B exists in system
- User A knows User B's user ID

**Steps**:
1. User A attempts API call: `GET /api/account/profile/{userB_id}`
2. Or User A tries to access profile endpoint with different user ID
3. Observe response

**Expected Result**:
- Request is rejected with 403 (Forbidden)
- No profile data is returned
- System only returns current user's profile
- User ID from token is enforced

---

## Skipping Order/Shipping States

### Test ID: NEG-008
**Title**: Cannot Skip Shipping Status States

**Preconditions**:
- Admin is logged in
- Order exists with shipping status "NOT_SHIPPED"

**Steps**:
1. Attempt to update shipping status directly to "DELIVERED" (skipping intermediate states)
2. Attempt to update from "NOT_SHIPPED" to "IN_TRANSIT"
3. Observe system response

**Expected Result**:
- Status transition is rejected
- Error message indicates invalid transition
- System shows valid next statuses
- Order status remains unchanged
- State machine enforces proper progression

---

### Test ID: NEG-009
**Title**: Cannot Revert Shipping Status to Previous State

**Preconditions**:
- Admin is logged in
- Order has shipping status "SHIPPED"

**Steps**:
1. Attempt to change shipping status back to "NOT_SHIPPED"
2. Attempt to change from "DELIVERED" to "SHIPPED"
3. Observe system response

**Expected Result**:
- Status revert is rejected
- Error message indicates invalid transition
- Order status remains at current state
- Only forward progression is allowed

---

### Test ID: NEG-010
**Title**: Cannot Create Shipment for Non-Paid Orders

**Preconditions**:
- Admin is logged in
- Order exists with payment status "pending"

**Steps**:
1. Navigate to order detail page
2. Attempt to create shipment (add courier and tracking)
3. Observe system response

**Expected Result**:
- Shipment creation is blocked
- Error message indicates order must be paid first
- Shipping status cannot be updated
- System enforces payment before shipping

---

## Duplicate Return Requests

### Test ID: NEG-011
**Title**: Cannot Submit Multiple Return Requests for Same Order

**Preconditions**:
- User is logged in
- User has a delivered order
- User has already submitted a return request

**Steps**:
1. Navigate to order detail page
2. Attempt to submit another return request
3. Try to access return request form again

**Expected Result**:
- Return request form is not accessible
- "Request Return" button is disabled or hidden
- Error message indicates return already requested (if attempted via API)
- Only one return request per order is allowed

---

### Test ID: NEG-012
**Title**: Cannot Request Return for Non-Delivered Orders

**Preconditions**:
- User is logged in
- User has orders with status "SHIPPED" or "IN_TRANSIT"

**Steps**:
1. Navigate to order detail page for non-delivered order
2. Check for "Request Return" button
3. Attempt to access return request endpoint via API (if possible)

**Expected Result**:
- "Request Return" button is not visible or disabled
- Return request is rejected if attempted via API
- Error message indicates order must be delivered first
- System enforces delivery before return eligibility

---

## Invalid Payment Callbacks

### Test ID: NEG-013
**Title**: Invalid Payment Signature is Rejected

**Preconditions**:
- Payment gateway is configured
- Order intent exists

**Steps**:
1. Create order intent
2. Initiate payment
3. Manually send payment callback with invalid signature
4. Observe system response

**Expected Result**:
- Payment verification fails
- Order is not created
- Payment status remains "pending"
- Error is logged
- User sees appropriate error message

---

### Test ID: NEG-014
**Title**: Duplicate Payment Callback is Ignored

**Preconditions**:
- Payment was successful
- Order was created from payment

**Steps**:
1. Resend the same payment callback
2. Attempt to process payment again
3. Observe system response

**Expected Result**:
- Duplicate callback is ignored
- Order is not created again
- Payment is not processed twice
- System prevents duplicate order creation
- Idempotency is maintained

---

## Missing or Tampered JWT

### Test ID: NEG-015
**Title**: Missing JWT Token Blocks Access

**Preconditions**:
- User is not logged in
- No token in localStorage

**Steps**:
1. Attempt to access protected route directly via URL
2. Attempt to make API call without token
3. Observe response

**Expected Result**:
- User is redirected to login page
- API calls return 401 (Unauthorized)
- No data is returned
- Authentication is required

---

### Test ID: NEG-016
**Title**: Tampered JWT Token is Rejected

**Preconditions**:
- User is logged in
- Browser developer tools are open

**Steps**:
1. Open localStorage
2. Modify JWT token (change characters)
3. Attempt to access protected endpoint
4. Observe response

**Expected Result**:
- Request is rejected with 401 (Unauthorized)
- Token signature validation fails
- User is logged out
- Tampered token is removed
- User must login again

---

### Test ID: NEG-017
**Title**: JWT Token with Modified User ID is Rejected

**Preconditions**:
- User is logged in
- Advanced: User can decode JWT (not recommended to test manually)

**Steps**:
1. Decode JWT token (if possible)
2. Modify userId in token payload
3. Re-encode and use modified token
4. Attempt to access endpoints

**Expected Result**:
- Token signature becomes invalid
- Request is rejected
- System detects tampering
- User must re-authenticate

---

## Invalid Order IDs in URL

### Test ID: NEG-018
**Title**: Invalid Order ID Returns 404

**Preconditions**:
- User is logged in
- Invalid order ID format

**Steps**:
1. Navigate to `/account/orders/invalid-id-123`
2. Navigate to `/account/orders/00000000-0000-0000-0000-000000000000`
3. Observe response

**Expected Result**:
- Page shows 404 error or "Order not found"
- No order data is displayed
- Error message is user-friendly
- No system errors are exposed

---

### Test ID: NEG-019
**Title**: SQL Injection Attempt in Order ID is Blocked

**Preconditions**:
- User is logged in
- System uses parameterized queries (should be implemented)

**Steps**:
1. Attempt to access: `/account/orders/1' OR '1'='1`
2. Attempt API call with malicious order ID
3. Observe response

**Expected Result**:
- Request is rejected safely
- No SQL injection occurs
- Error message is generic (doesn't reveal database structure)
- System uses parameterized queries
- No sensitive data is exposed

---

### Test ID: NEG-020
**Title**: XSS Attempt in Order ID is Sanitized

**Preconditions**:
- User is logged in

**Steps**:
1. Attempt to access: `/account/orders/<script>alert('xss')</script>`
2. Check if script executes
3. Observe page behavior

**Expected Result**:
- Script does not execute
- Order ID is sanitized
- No alert popup appears
- Invalid order ID is handled gracefully
- XSS protection is in place

---

## Invalid Input Validation

### Test ID: NEG-021
**Title**: Empty Cart Prevents Checkout

**Preconditions**:
- User is logged in
- Cart is empty

**Steps**:
1. Navigate to checkout page directly via URL
2. Attempt to proceed with checkout

**Expected Result**:
- User is redirected to cart page
- Or checkout shows error message
- "Place Order" button is disabled
- System prevents checkout with empty cart

---

### Test ID: NEG-022
**Title**: Invalid Shipping Address is Rejected

**Preconditions**:
- User is logged in
- User has items in cart

**Steps**:
1. Navigate to checkout
2. Attempt to proceed without selecting address
3. Or select invalid/non-existent address ID

**Expected Result**:
- Checkout is blocked
- Error message indicates address is required
- Order intent is not created
- User must select valid address

---

### Test ID: NEG-023
**Title**: Invalid Discount Code is Rejected

**Preconditions**:
- User is logged in
- User is on checkout page

**Steps**:
1. Enter invalid discount code
2. Click "Apply" or submit
3. Observe response

**Expected Result**:
- Discount code is rejected
- Error message indicates invalid code
- Discount is not applied
- Price breakdown remains unchanged

---

### Test ID: NEG-024
**Title**: Expired Discount Code is Rejected

**Preconditions**:
- User is logged in
- Discount code exists but is expired
- User knows the code

**Steps**:
1. Enter expired discount code
2. Attempt to apply
3. Observe response

**Expected Result**:
- Discount code is rejected
- Error message indicates code is expired or invalid
- Discount is not applied
- System validates expiration date

---

## Rate Limiting & Abuse Prevention

### Test ID: NEG-025
**Title**: Multiple Rapid API Calls are Handled

**Preconditions**:
- User is logged in
- Rate limiting is implemented (if applicable)

**Steps**:
1. Make multiple rapid API calls to same endpoint
2. Send 10+ requests within 1 second
3. Observe response

**Expected Result**:
- System handles requests gracefully
- Rate limiting prevents abuse (if implemented)
- No system crash or timeout
- Responses are consistent

---

## Summary

These negative tests validate:
- ✅ Unauthorized access is blocked
- ✅ Token validation works
- ✅ User data isolation
- ✅ State machine enforcement
- ✅ Duplicate prevention
- ✅ Invalid input handling
- ✅ Security measures
- ✅ Abuse prevention

**Execution Time**: ~60-90 minutes for full negative test suite

**Priority**: Run these tests before security audits and after authentication/authorization changes.
