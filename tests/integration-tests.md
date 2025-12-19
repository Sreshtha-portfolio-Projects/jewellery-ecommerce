# 🔗 Integration Tests
## Aldorado Jewells – API & System Integration Validation

**Purpose**: Validate API endpoints, data flow, and integration between frontend and backend systems.

---

## Authentication Integration

### Test ID: INT-001
**Title**: Login API Returns Valid JWT Token

**Preconditions**:
- Backend server is running
- Valid user credentials exist
- API testing tool available (Postman, curl, or browser)

**Steps**:
1. Send POST request to `/api/customer/auth/login`
2. Include email and password in request body
3. Verify response
4. Extract token from response

**Expected Result**:
- Request returns 200 status
- Response contains JWT token
- Token is valid format
- User data is included in response
- Token can be used for authenticated requests

---

### Test ID: INT-002
**Title**: Protected Endpoints Require Authentication

**Preconditions**:
- Backend server is running
- API testing tool available

**Steps**:
1. Attempt to access `/api/orders` without token
2. Attempt to access `/api/cart` without token
3. Attempt to access `/api/account/profile` without token
4. Observe response codes

**Expected Result**:
- All requests return 401 (Unauthorized)
- Error message indicates authentication required
- No data is returned
- Security is enforced

---

### Test ID: INT-003
**Title**: Authenticated Requests Work with Valid Token

**Preconditions**:
- Backend server is running
- Valid JWT token obtained from login

**Steps**:
1. Login and obtain token
2. Use token in Authorization header: `Bearer {token}`
3. Access `/api/orders` with token
4. Access `/api/cart` with token
5. Verify responses

**Expected Result**:
- Requests with valid token succeed
- Data is returned correctly
- Token is accepted
- No authentication errors

---

## Cart Integration

### Test ID: INT-004
**Title**: Add to Cart API Works

**Preconditions**:
- Backend server is running
- User is authenticated
- Product exists

**Steps**:
1. Send POST request to `/api/cart`
2. Include product_id and quantity
3. Include variant_id (if applicable)
4. Verify response

**Expected Result**:
- Item is added to cart
- Response returns cart item data
- Cart count updates
- Item appears in cart list

---

### Test ID: INT-005
**Title**: Get Cart API Returns User's Cart

**Preconditions**:
- Backend server is running
- User is authenticated
- User has items in cart

**Steps**:
1. Send GET request to `/api/cart`
2. Verify response
3. Check cart items

**Expected Result**:
- Cart items are returned
- Response includes product details
- Quantities are correct
- Prices are accurate
- Only user's cart is returned

---

### Test ID: INT-006
**Title**: Update Cart Item Quantity Works

**Preconditions**:
- Backend server is running
- User is authenticated
- User has items in cart

**Steps**:
1. Get cart items
2. Send PUT request to `/api/cart/{itemId}`
3. Update quantity
4. Verify response

**Expected Result**:
- Quantity updates successfully
- Response reflects new quantity
- Cart total updates
- Changes are persisted

---

### Test ID: INT-007
**Title**: Remove Cart Item Works

**Preconditions**:
- Backend server is running
- User is authenticated
- User has items in cart

**Steps**:
1. Get cart items
2. Send DELETE request to `/api/cart/{itemId}`
3. Verify response
4. Get cart again to confirm removal

**Expected Result**:
- Item is removed from cart
- Response confirms deletion
- Cart no longer contains item
- Cart count decreases

---

## Order Integration

### Test ID: INT-008
**Title**: Create Order Intent API Works

**Preconditions**:
- Backend server is running
- User is authenticated
- User has items in cart
- User has saved address

**Steps**:
1. Send POST request to `/api/order-intents`
2. Include shipping_address_id
3. Include discount_code (optional)
4. Verify response

**Expected Result**:
- Order intent is created
- Response includes order intent data
- Inventory is locked
- Prices are snapshotted
- Intent number is generated

---

### Test ID: INT-009
**Title**: Get Order API Returns Order Details

**Preconditions**:
- Backend server is running
- User is authenticated
- User has placed order

**Steps**:
1. Send GET request to `/api/orders/{orderId}`
2. Verify response structure
3. Check all order data

**Expected Result**:
- Order data is returned
- Response includes order items
- Shipping address is included
- Payment details are included
- Timeline is included
- All data is accurate

---

### Test ID: INT-010
**Title**: Order List API Returns User's Orders

**Preconditions**:
- Backend server is running
- User is authenticated
- User has multiple orders

**Steps**:
1. Send GET request to `/api/orders`
2. Verify response
3. Check order list

**Expected Result**:
- Orders list is returned
- Only user's orders are included
- Orders are sorted correctly
- Pagination works (if implemented)
- Order data is complete

---

## Product Integration

### Test ID: INT-011
**Title**: Get Products API Returns Product List

**Preconditions**:
- Backend server is running
- Products exist in database

**Steps**:
1. Send GET request to `/api/products`
2. Verify response
3. Check product data structure

**Expected Result**:
- Products are returned
- Response is array of products
- Each product has required fields
- Images are included
- Prices are included

---

### Test ID: INT-012
**Title**: Get Product by ID API Works

**Preconditions**:
- Backend server is running
- Product exists

**Steps**:
1. Send GET request to `/api/products/{productId}`
2. Verify response
3. Check product details

**Expected Result**:
- Product data is returned
- Variants are included
- Images are included
- Pricing is calculated
- All product information is present

---

### Test ID: INT-013
**Title**: Product Search API Works

**Preconditions**:
- Backend server is running
- Products exist in database

**Steps**:
1. Send GET request to `/api/products?search={term}`
2. Verify search results
3. Test with different search terms

**Expected Result**:
- Search results are returned
- Results match search term
- Search is case-insensitive
- No results return empty array
- Search works correctly

---

## Address Integration

### Test ID: INT-014
**Title**: Create Address API Works

**Preconditions**:
- Backend server is running
- User is authenticated

**Steps**:
1. Send POST request to `/api/addresses`
2. Include all required address fields
3. Verify response

**Expected Result**:
- Address is created
- Response includes address data
- Address ID is generated
- All fields are saved correctly
- Address is linked to user

---

### Test ID: INT-015
**Title**: Get Addresses API Returns User's Addresses

**Preconditions**:
- Backend server is running
- User is authenticated
- User has saved addresses

**Steps**:
1. Send GET request to `/api/addresses`
2. Verify response
3. Check address list

**Expected Result**:
- Addresses are returned
- Only user's addresses are included
- Default address is marked
- Addresses are sorted correctly
- All address data is present

---

### Test ID: INT-016
**Title**: Update Address API Works

**Preconditions**:
- Backend server is running
- User is authenticated
- User has saved address

**Steps**:
1. Send PUT request to `/api/addresses/{addressId}`
2. Include updated fields
3. Verify response

**Expected Result**:
- Address is updated
- Response reflects changes
- Changes are persisted
- Only user's address can be updated
- Validation works

---

## Payment Integration

### Test ID: INT-017
**Title**: Create Payment Order API Works

**Preconditions**:
- Backend server is running
- User is authenticated
- Order intent exists

**Steps**:
1. Send POST request to `/api/payments/create-order`
2. Include order_intent_id
3. Verify response

**Expected Result**:
- Payment order is created
- Response includes Razorpay order details
- Key ID and order ID are returned
- Amount is correct
- Payment can be initiated

---

### Test ID: INT-018
**Title**: Payment Verification API Works

**Preconditions**:
- Backend server is running
- Payment was initiated
- Payment response data available

**Steps**:
1. Send POST request to `/api/payments/verify`
2. Include payment response data
3. Verify response

**Expected Result**:
- Payment is verified
- Order is created if payment successful
- Response indicates success/failure
- Payment signature is validated
- Security is enforced

---

## Admin Integration

### Test ID: INT-019
**Title**: Admin Get Orders API Works

**Preconditions**:
- Backend server is running
- Admin is authenticated
- Orders exist in system

**Steps**:
1. Send GET request to `/api/admin/orders`
2. Include admin token
3. Verify response

**Expected Result**:
- Orders are returned
- All orders are accessible (not just admin's)
- Response includes order details
- Pagination works (if implemented)
- Filters work (if implemented)

---

### Test ID: INT-020
**Title**: Admin Update Shipping Status API Works

**Preconditions**:
- Backend server is running
- Admin is authenticated
- Order exists with status "paid"

**Steps**:
1. Send POST request to `/api/admin/orders/{orderId}/shipping/status`
2. Include status and notes
3. Verify response

**Expected Result**:
- Shipping status is updated
- Response confirms update
- Status change is valid
- Order is updated in database
- Customer can see updated status

---

### Test ID: INT-021
**Title**: Admin Create Shipment API Works

**Preconditions**:
- Backend server is running
- Admin is authenticated
- Order exists with status "paid"

**Steps**:
1. Send POST request to `/api/admin/orders/{orderId}/shipping/create`
2. Include courier_name and tracking_number
3. Verify response

**Expected Result**:
- Shipment is created
- Shipping status updates to "SHIPPED"
- Courier and tracking are saved
- Invoice is generated (if configured)
- Response confirms creation

---

## Discount Integration

### Test ID: INT-022
**Title**: Validate Discount Code API Works

**Preconditions**:
- Backend server is running
- User is authenticated
- Discount code exists

**Steps**:
1. Send POST request to `/api/discounts/validate`
2. Include code and cart_value
3. Verify response

**Expected Result**:
- Discount is validated
- Response indicates valid/invalid
- Discount amount is calculated
- Error messages are clear
- Validation rules are enforced

---

## Error Handling

### Test ID: INT-023
**Title**: API Returns Appropriate Error Codes

**Preconditions**:
- Backend server is running
- API testing tool available

**Steps**:
1. Send invalid request (missing required fields)
2. Send request with invalid ID
3. Send request to non-existent endpoint
4. Observe error responses

**Expected Result**:
- 400 (Bad Request) for invalid input
- 404 (Not Found) for non-existent resources
- 401 (Unauthorized) for missing auth
- 403 (Forbidden) for unauthorized access
- 500 (Server Error) for server issues
- Error messages are helpful

---

### Test ID: INT-024
**Title**: API Handles Invalid Data Gracefully

**Preconditions**:
- Backend server is running
- User is authenticated

**Steps**:
1. Send request with invalid data types
2. Send request with missing required fields
3. Send request with out-of-range values
4. Observe responses

**Expected Result**:
- Invalid data is rejected
- Error messages indicate issues
- System doesn't crash
- Validation errors are clear
- Data integrity is maintained

---

## Data Consistency

### Test ID: INT-025
**Title**: Order Snapshot Preserves Data

**Preconditions**:
- Backend server is running
- User places order
- Product prices change after order

**Steps**:
1. Place order with product at price X
2. Change product price to Y (via admin)
3. Retrieve order via API
4. Verify order prices

**Expected Result**:
- Order shows original price X
- Order snapshot is immutable
- Product price change doesn't affect order
- Order data remains consistent
- Snapshot works correctly

---

## Summary

These integration tests validate:
- ✅ API authentication
- ✅ Cart operations
- ✅ Order processing
- ✅ Product retrieval
- ✅ Address management
- ✅ Payment integration
- ✅ Admin operations
- ✅ Discount validation
- ✅ Error handling
- ✅ Data consistency

**Execution Time**: ~90-120 minutes for full integration test suite

**Priority**: Run these tests after API changes, backend updates, and before deployments.
