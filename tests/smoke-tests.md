# 🧪 Smoke Tests
## Aldorado Jewells – Quick Confidence Checks

**Purpose**: Quick validation to ensure core functionality is not broken after changes.

---

## Frontend & App Load

### Test ID: SMOKE-001
**Title**: Frontend Application Loads Successfully

**Preconditions**:
- Server is running
- Frontend is accessible

**Steps**:
1. Open browser and navigate to the application URL
2. Wait for page to load completely

**Expected Result**:
- Application loads without errors
- No console errors visible
- Homepage or landing page displays correctly
- Navigation menu is visible

---

### Test ID: SMOKE-002
**Title**: Admin Panel Loads Successfully

**Preconditions**:
- Server is running
- Admin panel URL is accessible

**Steps**:
1. Navigate to admin login page (`/admin/login`)
2. Wait for page to load

**Expected Result**:
- Admin login page loads without errors
- Login form is visible
- No console errors

---

## Authentication

### Test ID: SMOKE-003
**Title**: Customer Login Works

**Preconditions**:
- Valid customer account exists
- Customer login page is accessible

**Steps**:
1. Navigate to customer login page (`/login`)
2. Enter valid email and password
3. Click "Login" button

**Expected Result**:
- Login succeeds
- User is redirected to appropriate page (home or account)
- User session is established
- Token is stored in localStorage

---

### Test ID: SMOKE-004
**Title**: Admin Login Works

**Preconditions**:
- Valid admin account exists
- Admin has admin role in database
- Admin login page is accessible

**Steps**:
1. Navigate to admin login page (`/admin/login`)
2. Enter valid admin email and password
3. Click "Login" button

**Expected Result**:
- Login succeeds
- Admin is redirected to admin dashboard
- Admin session is established
- Token is stored in localStorage

---

### Test ID: SMOKE-005
**Title**: Customer Logout Works

**Preconditions**:
- User is logged in as customer

**Steps**:
1. Click on "Logout" or "Sign Out" button
2. Confirm logout if prompted

**Expected Result**:
- User is logged out successfully
- Token is removed from localStorage
- User is redirected to login page or homepage
- Protected routes are no longer accessible

---

### Test ID: SMOKE-006
**Title**: Admin Logout Works

**Preconditions**:
- Admin is logged in

**Steps**:
1. Click on "Logout" or "Sign Out" button in admin panel
2. Confirm logout if prompted

**Expected Result**:
- Admin is logged out successfully
- Token is removed from localStorage
- Admin is redirected to admin login page
- Admin routes are no longer accessible

---

## Product Listing

### Test ID: SMOKE-007
**Title**: Product Listing Page Displays Products

**Preconditions**:
- Products exist in database
- User is on homepage or products page

**Steps**:
1. Navigate to products page or homepage
2. Wait for products to load

**Expected Result**:
- Products are displayed
- Product images load (or show placeholder)
- Product names and prices are visible
- No error messages appear

---

### Test ID: SMOKE-008
**Title**: Product Detail Page Loads

**Preconditions**:
- At least one product exists
- Product has valid ID

**Steps**:
1. Navigate to a product detail page
2. Click on any product from listing

**Expected Result**:
- Product detail page loads
- Product information is displayed (name, price, description)
- Product images are visible
- Variant options are shown (if applicable)
- Add to cart button is visible

---

## Cart Functionality

### Test ID: SMOKE-009
**Title**: Add Product to Cart

**Preconditions**:
- User is logged in
- Product detail page is open
- Product is in stock

**Steps**:
1. Select product variant (if applicable)
2. Click "Add to Cart" button
3. Verify cart icon shows updated count

**Expected Result**:
- Product is added to cart
- Cart count increases
- Success message appears (if implemented)
- Cart icon reflects new item count

---

### Test ID: SMOKE-010
**Title**: View Cart Contents

**Preconditions**:
- User has items in cart
- User is logged in

**Steps**:
1. Click on cart icon or navigate to cart page
2. View cart contents

**Expected Result**:
- Cart page loads
- All cart items are displayed
- Product names, quantities, and prices are visible
- Total amount is calculated correctly

---

### Test ID: SMOKE-011
**Title**: Remove Item from Cart

**Preconditions**:
- User has at least one item in cart
- Cart page is open

**Steps**:
1. Locate remove/delete button for an item
2. Click remove button
3. Confirm removal if prompted

**Expected Result**:
- Item is removed from cart
- Cart count decreases
- Cart total updates correctly
- Item no longer appears in cart list

---

## Order Placement (Happy Path)

### Test ID: SMOKE-012
**Title**: Complete Order Placement Flow

**Preconditions**:
- User is logged in
- User has items in cart
- User has at least one saved address
- Payment gateway is configured (or test mode enabled)

**Steps**:
1. Navigate to checkout page
2. Select shipping address
3. Review order summary
4. Click "Place Order" or "Proceed to Payment"
5. Complete payment (or use test payment)
6. Wait for order confirmation

**Expected Result**:
- Checkout page loads
- Order intent is created
- Payment process initiates
- Order is created after payment
- User is redirected to order confirmation page
- Order number is displayed

---

## Admin Order Visibility

### Test ID: SMOKE-013
**Title**: Admin Can View Orders List

**Preconditions**:
- Admin is logged in
- At least one order exists in system

**Steps**:
1. Navigate to admin dashboard
2. Click on "Orders" or navigate to orders list
3. View orders table

**Expected Result**:
- Orders list page loads
- Orders are displayed in table or list format
- Order details are visible (order number, customer, status, amount)
- No errors appear

---

### Test ID: SMOKE-014
**Title**: Admin Can View Order Details

**Preconditions**:
- Admin is logged in
- At least one order exists
- Admin is on orders list page

**Steps**:
1. Click on any order from the list
2. View order detail page

**Expected Result**:
- Order detail page loads
- Complete order information is displayed
- Order items, customer details, shipping address are visible
- Payment status and shipping status are shown
- Admin actions are available

---

## Page Refresh Safety

### Test ID: SMOKE-015
**Title**: Order Detail Page Works After Refresh

**Preconditions**:
- User is logged in
- User has at least one order
- User is on order detail page

**Steps**:
1. Note the current order ID from URL
2. Refresh the page (F5 or Ctrl+R)
3. Wait for page to reload

**Expected Result**:
- Page reloads successfully
- Order information is still displayed correctly
- No data loss
- URL remains the same
- No authentication errors

---

## Critical Path Summary

These smoke tests validate:
- ✅ Application loads
- ✅ Authentication works (login/logout)
- ✅ Products are visible
- ✅ Cart add/remove works
- ✅ Order can be placed
- ✅ Admin can see orders
- ✅ Page refresh doesn't break functionality

**Execution Time**: ~15-20 minutes for full smoke test suite

**Priority**: Run these tests after every deployment or significant code change.
