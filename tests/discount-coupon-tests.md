# 🎟️ Discount & Coupon Tests
## Aldorado Jewells – Discount Code Functionality

**Purpose**: Validate discount code application, validation, and admin discount management.

---

## Discount Code Application (Customer)

### Test ID: DISC-001
**Title**: Customer Can Apply Valid Discount Code

**Preconditions**:
- Customer is logged in
- Customer has items in cart
- Valid discount code exists
- Customer is on checkout page

**Steps**:
1. Navigate to checkout page
2. Locate discount code input field
3. Enter valid discount code
4. Click "Apply" or submit
5. Verify discount is applied

**Expected Result**:
- Discount code input is visible
- Code is accepted
- Discount is applied to order
- Price breakdown updates
- Discount amount is shown
- Success message appears

---

### Test ID: DISC-002
**Title**: Discount Code is Case Insensitive

**Preconditions**:
- Customer is logged in
- Customer has items in cart
- Valid discount code exists (e.g., "SAVE10")
- Customer is on checkout page

**Steps**:
1. Enter discount code in lowercase: "save10"
2. Apply code
3. Verify discount is applied
4. Clear code
5. Enter in uppercase: "SAVE10"
6. Apply code
7. Verify discount is applied

**Expected Result**:
- Discount code works in any case
- Case doesn't affect validation
- Discount is applied correctly
- System handles case insensitivity

---

### Test ID: DISC-003
**Title**: Invalid Discount Code is Rejected

**Preconditions**:
- Customer is logged in
- Customer has items in cart
- Customer is on checkout page

**Steps**:
1. Enter invalid discount code
2. Click "Apply"
3. Observe error message

**Expected Result**:
- Invalid code is rejected
- Error message indicates invalid code
- Discount is not applied
- Price breakdown remains unchanged
- Error message is user-friendly

---

### Test ID: DISC-004
**Title**: Expired Discount Code is Rejected

**Preconditions**:
- Customer is logged in
- Customer has items in cart
- Expired discount code exists
- Customer knows the code

**Steps**:
1. Enter expired discount code
2. Click "Apply"
3. Observe error message

**Expected Result**:
- Expired code is rejected
- Error message indicates code has expired
- Discount is not applied
- System validates expiration date correctly

---

### Test ID: DISC-005
**Title**: Discount Code with Minimum Cart Value Requirement

**Preconditions**:
- Customer is logged in
- Discount code exists with minimum cart value (e.g., ₹5000)
- Customer is on checkout page

**Steps**:
1. Add items to cart below minimum value
2. Enter discount code
3. Attempt to apply
4. Observe error
5. Add more items to meet minimum
6. Apply code again

**Expected Result**:
- Code is rejected if cart value is below minimum
- Error message shows minimum cart value required
- Code is accepted when minimum is met
- Discount applies correctly when eligible

---

### Test ID: DISC-006
**Title**: Percentage Discount Calculation is Correct

**Preconditions**:
- Customer is logged in
- Customer has items in cart (e.g., ₹10,000)
- Percentage discount code exists (e.g., 10% off)
- Customer is on checkout page

**Steps**:
1. Enter percentage discount code
2. Apply code
3. Verify discount amount (10% of ₹10,000 = ₹1,000)
4. Check final total

**Expected Result**:
- Percentage discount is calculated correctly
- Discount amount is accurate
- Final total is correct
- Price breakdown shows discount clearly

---

### Test ID: DISC-007
**Title**: Flat Amount Discount Calculation is Correct

**Preconditions**:
- Customer is logged in
- Customer has items in cart
- Flat discount code exists (e.g., ₹500 off)
- Customer is on checkout page

**Steps**:
1. Enter flat discount code
2. Apply code
3. Verify discount amount (₹500)
4. Check final total

**Expected Result**:
- Flat discount is applied correctly
- Discount amount matches code value
- Final total is accurate
- Price breakdown is correct

---

### Test ID: DISC-008
**Title**: Discount Cannot Exceed Cart Total

**Preconditions**:
- Customer is logged in
- Customer has items in cart (e.g., ₹1,000)
- Discount code exists with value greater than cart (e.g., ₹2,000 off)
- Customer is on checkout page

**Steps**:
1. Enter discount code
2. Apply code
3. Verify discount amount

**Expected Result**:
- Discount is capped at cart total
- Final amount is never negative
- Discount amount equals cart total (not more)
- System prevents negative totals

---

### Test ID: DISC-009
**Title**: Discount Code Can Be Removed

**Preconditions**:
- Customer is logged in
- Customer has applied discount code
- Customer is on checkout page

**Steps**:
1. View applied discount
2. Click "Remove" or clear discount code
3. Verify discount is removed

**Expected Result**:
- Discount can be removed
- Price breakdown updates (discount removed)
- Final total increases
- Discount code field is cleared
- User can apply different code

---

### Test ID: DISC-010
**Title**: Discount Code Persists During Checkout

**Preconditions**:
- Customer is logged in
- Customer has applied discount code
- Customer is on checkout page

**Steps**:
1. Apply discount code
2. Refresh the page
3. Verify discount is still applied
4. Or navigate away and return
5. Verify discount persists

**Expected Result**:
- Discount code persists after refresh
- Applied discount remains
- Price breakdown is maintained
- User doesn't need to re-apply code
- State is preserved

---

## Discount Code Limits

### Test ID: DISC-011
**Title**: Maximum Uses Limit is Enforced

**Preconditions**:
- Customer is logged in
- Discount code exists with max uses limit (e.g., 10 uses)
- Code has reached maximum uses
- Customer is on checkout page

**Steps**:
1. Enter discount code that has reached max uses
2. Attempt to apply
3. Observe error message

**Expected Result**:
- Code is rejected
- Error message indicates code has reached maximum uses
- Discount is not applied
- System tracks usage correctly

---

### Test ID: DISC-012
**Title**: One Discount Code Per Order

**Preconditions**:
- Customer is logged in
- Customer has applied one discount code
- Customer is on checkout page

**Steps**:
1. Apply first discount code
2. Attempt to apply second discount code
3. Verify system response

**Expected Result**:
- Only one discount code can be applied
- Second code replaces first (or is rejected)
- System prevents multiple discounts
- Clear behavior is communicated

---

## Admin Discount Management

### Test ID: DISC-013
**Title**: Admin Can Create Discount Code

**Preconditions**:
- Admin is logged in
- Admin navigates to Discounts/Coupons page

**Steps**:
1. Click "Create Discount" or "Add New"
2. Fill discount form:
   - Code (unique)
   - Description
   - Discount type (percentage/flat)
   - Discount value
   - Minimum cart value (optional)
   - Max uses (optional)
   - Expiration date (optional)
3. Save discount

**Expected Result**:
- Discount is created successfully
- Discount appears in discounts list
- All fields are saved correctly
- Discount is active by default
- Success message is displayed

---

### Test ID: DISC-014
**Title**: Admin Can Edit Discount Code

**Preconditions**:
- Admin is logged in
- Discount code exists

**Steps**:
1. Navigate to discounts list
2. Click "Edit" on a discount
3. Modify discount parameters
4. Save changes

**Expected Result**:
- Discount form loads with existing data
- Changes are saved successfully
- Updated discount applies correctly
- Changes are reflected immediately

---

### Test ID: DISC-015
**Title**: Admin Can Deactivate Discount Code

**Preconditions**:
- Admin is logged in
- Active discount code exists

**Steps**:
1. Navigate to discounts list
2. Find active discount
3. Deactivate discount (toggle or edit)
4. Verify status change

**Expected Result**:
- Discount can be deactivated
- Status updates correctly
- Deactivated discount no longer works for customers
- Discount remains in system (not deleted)

---

### Test ID: DISC-016
**Title**: Admin Can View Discount Usage Statistics

**Preconditions**:
- Admin is logged in
- Discount code exists
- Discount has been used

**Steps**:
1. Navigate to discounts list
2. View discount details
3. Check usage count
4. Verify statistics

**Expected Result**:
- Usage count is displayed
- Statistics are accurate
- Usage tracking works
- Admin can monitor discount performance

---

## Discount Validation

### Test ID: DISC-017
**Title**: Duplicate Discount Codes are Prevented

**Preconditions**:
- Admin is logged in
- Discount code "SAVE10" exists

**Steps**:
1. Attempt to create new discount with code "SAVE10"
2. Save discount
3. Observe system response

**Expected Result**:
- Duplicate code is rejected
- Error message indicates code already exists
- Discount is not created
- System enforces uniqueness

---

### Test ID: DISC-018
**Title**: Percentage Discount Value Validation

**Preconditions**:
- Admin is logged in
- Creating percentage discount

**Steps**:
1. Create discount with percentage type
2. Enter percentage > 100
3. Enter percentage < 0
4. Enter valid percentage (0-100)
5. Save discount

**Expected Result**:
- Percentages > 100 are rejected
- Negative percentages are rejected
- Valid percentages (0-100) are accepted
- Validation messages are clear

---

### Test ID: DISC-019
**Title**: Flat Discount Value Validation

**Preconditions**:
- Admin is logged in
- Creating flat discount

**Steps**:
1. Create discount with flat type
2. Enter negative value
3. Enter zero
4. Enter positive value
5. Save discount

**Expected Result**:
- Negative values are rejected
- Zero may be rejected (or accepted)
- Positive values are accepted
- Validation works correctly

---

## Discount in Order Processing

### Test ID: DISC-020
**Title**: Discount is Preserved in Order Snapshot

**Preconditions**:
- Customer is logged in
- Customer has applied discount code
- Customer places order

**Steps**:
1. Apply discount code
2. Place order
3. View order confirmation
4. View order detail page
5. Verify discount in order

**Expected Result**:
- Discount is included in order
- Discount code is saved in order
- Discount amount is in order snapshot
- Order total reflects discount
- Discount cannot be changed after order

---

### Test ID: DISC-021
**Title**: Discount Usage Count Updates After Order

**Preconditions**:
- Admin is logged in
- Discount code exists with usage tracking
- Customer applies code and places order

**Steps**:
1. Note current usage count
2. Customer applies code and places order
3. Check usage count after order
4. Verify count increased

**Expected Result**:
- Usage count increments after order
- Count is accurate
- Tracking works correctly
- Max uses limit is enforced

---

## Summary

These discount and coupon tests validate:
- ✅ Discount code application
- ✅ Code validation
- ✅ Discount calculations
- ✅ Expiration and limits
- ✅ Admin discount management
- ✅ Usage tracking
- ✅ Order integration
- ✅ Edge cases

**Execution Time**: ~60-75 minutes for full discount test suite

**Priority**: Run these tests after discount-related changes and before promotions or sales events.
