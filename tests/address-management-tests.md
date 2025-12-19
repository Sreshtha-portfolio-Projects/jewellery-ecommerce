# 📍 Address Management Tests
## Aldorado Jewells – Customer Address CRUD Operations

**Purpose**: Validate customer address creation, editing, deletion, and default address functionality.

---

## Address Creation

### Test ID: ADDR-001
**Title**: Customer Can Add New Address

**Preconditions**:
- Customer is logged in
- Customer navigates to Addresses page or Checkout

**Steps**:
1. Click "Add New Address" or "Add Address"
2. Fill address form:
   - Full Name
   - Phone Number
   - Address Line 1
   - Address Line 2 (optional)
   - City
   - State
   - Postal Code
   - Country
3. Optionally set as default address
4. Click "Save" or "Add Address"

**Expected Result**:
- Address is created successfully
- Success message is displayed
- Address appears in addresses list
- Address is saved correctly
- All fields are preserved

---

### Test ID: ADDR-002
**Title**: Required Fields Validation Works

**Preconditions**:
- Customer is on address form
- Form validation is implemented

**Steps**:
1. Attempt to save address without required fields
2. Leave name empty
3. Leave phone empty
4. Leave address line 1 empty
5. Leave city empty
6. Submit form

**Expected Result**:
- Form validation prevents submission
- Error messages indicate missing fields
- Required fields are highlighted
- Form does not submit until all required fields are filled
- Error messages are clear and helpful

---

### Test ID: ADDR-003
**Title**: Phone Number Validation Works

**Preconditions**:
- Customer is on address form

**Steps**:
1. Enter invalid phone number formats:
   - Too short (less than 10 digits)
   - Too long (more than 15 digits)
   - Special characters only
   - Letters
2. Attempt to save

**Expected Result**:
- Invalid phone formats are rejected
- Error message indicates valid format required
- Valid phone numbers are accepted
- Validation is consistent

---

### Test ID: ADDR-004
**Title**: Postal Code Validation Works

**Preconditions**:
- Customer is on address form

**Steps**:
1. Enter invalid postal codes:
   - Too short
   - Too long
   - Non-numeric (if required)
2. Enter valid postal code
3. Attempt to save

**Expected Result**:
- Invalid postal codes are rejected
- Valid postal codes are accepted
- Error messages are clear
- Validation works correctly

---

### Test ID: ADDR-005
**Title**: Address Can Be Set as Default

**Preconditions**:
- Customer is logged in
- Customer has no default address or existing default address

**Steps**:
1. Create new address
2. Check "Set as Default" checkbox
3. Save address
4. Verify default status

**Expected Result**:
- Default checkbox is available
- Address is set as default
- Previous default address is unset (if exists)
- Only one default address exists
- Default address is marked clearly

---

## Address Listing

### Test ID: ADDR-006
**Title**: Customer Can View All Addresses

**Preconditions**:
- Customer is logged in
- Customer has multiple addresses

**Steps**:
1. Navigate to "My Account" → "Addresses"
2. View addresses list
3. Verify all addresses are displayed

**Expected Result**:
- All addresses are listed
- Default address is clearly marked
- Addresses are displayed in readable format
- Address information is complete
- List is well-organized

---

### Test ID: ADDR-007
**Title**: Default Address Appears First

**Preconditions**:
- Customer is logged in
- Customer has multiple addresses with one default

**Steps**:
1. Navigate to Addresses page
2. View addresses list
3. Check order of addresses

**Expected Result**:
- Default address appears first in list
- Default address is clearly marked
- Other addresses follow
- Order is consistent

---

## Address Editing

### Test ID: ADDR-008
**Title**: Customer Can Edit Existing Address

**Preconditions**:
- Customer is logged in
- Customer has at least one address

**Steps**:
1. Navigate to Addresses page
2. Click "Edit" on an address
3. Modify address fields
4. Save changes

**Expected Result**:
- Address form loads with existing data
- All fields are pre-filled correctly
- Changes are saved successfully
- Updated address appears in list
- Success message is displayed

---

### Test ID: ADDR-009
**Title**: Customer Can Change Default Address

**Preconditions**:
- Customer is logged in
- Customer has multiple addresses
- One address is currently default

**Steps**:
1. Navigate to Addresses page
2. Edit non-default address
3. Check "Set as Default" checkbox
4. Save changes
5. Verify default status changes

**Expected Result**:
- Default status can be changed
- Previous default is unset
- New default is set correctly
- Only one default exists
- Changes are saved immediately

---

### Test ID: ADDR-010
**Title**: Customer Can Only Edit Own Addresses

**Preconditions**:
- Customer A is logged in
- Customer B has addresses
- Customer A knows Customer B's address ID (hypothetical)

**Steps**:
1. Attempt to edit address via API with different user's address ID
2. Or attempt to access edit form with invalid address ID

**Expected Result**:
- System prevents editing other user's addresses
- Error message indicates unauthorized access
- Only own addresses can be edited
- Security is enforced

---

## Address Deletion

### Test ID: ADDR-011
**Title**: Customer Can Delete Address

**Preconditions**:
- Customer is logged in
- Customer has multiple addresses

**Steps**:
1. Navigate to Addresses page
2. Click "Delete" on an address
3. Confirm deletion
4. Verify address is removed

**Expected Result**:
- Address is deleted successfully
- Address no longer appears in list
- Success message is displayed
- Deletion is permanent
- Other addresses remain intact

---

### Test ID: ADDR-012
**Title**: Cannot Delete Only Address

**Preconditions**:
- Customer is logged in
- Customer has only one address

**Steps**:
1. Navigate to Addresses page
2. Attempt to delete the only address
3. Verify system response

**Expected Result**:
- Delete option is disabled or hidden
- Or deletion is prevented with message
- User must have at least one address
- System prevents deletion of last address

---

### Test ID: ADDR-013
**Title**: Deleting Default Address Updates Default Status

**Preconditions**:
- Customer is logged in
- Customer has multiple addresses
- One address is default

**Steps**:
1. Delete the default address
2. Verify remaining addresses
3. Check if new default is set

**Expected Result**:
- Default address can be deleted
- System handles default address deletion
- Another address may be set as default (if auto-assign)
- Or user must manually set new default
- No errors occur

---

## Address Usage in Checkout

### Test ID: ADDR-014
**Title**: Saved Addresses Appear in Checkout

**Preconditions**:
- Customer is logged in
- Customer has saved addresses
- Customer has items in cart

**Steps**:
1. Navigate to checkout page
2. View address selection
3. Verify saved addresses are listed
4. Select an address

**Expected Result**:
- Saved addresses are displayed
- Addresses are selectable
- Default address is pre-selected
- Address information is complete
- Selection works correctly

---

### Test ID: ADDR-015
**Title**: Customer Can Add Address During Checkout

**Preconditions**:
- Customer is logged in
- Customer is on checkout page
- Customer has items in cart

**Steps**:
1. On checkout page, click "Add New Address"
2. Fill address form
3. Save address
4. Verify address is selected for checkout

**Expected Result**:
- Add address option is available
- Address form appears (modal or inline)
- New address can be saved
- New address is automatically selected
- Checkout can proceed with new address

---

### Test ID: ADDR-016
**Title**: Address Selection is Required for Checkout

**Preconditions**:
- Customer is logged in
- Customer has items in cart
- Customer is on checkout page

**Steps**:
1. Attempt to proceed without selecting address
2. Click "Place Order" without address selection
3. Verify system response

**Expected Result**:
- Checkout is blocked without address
- Error message indicates address is required
- "Place Order" button is disabled or shows error
- User must select address to proceed

---

## Address Data Integrity

### Test ID: ADDR-017
**Title**: Address Data Persists After Page Refresh

**Preconditions**:
- Customer is logged in
- Customer has saved addresses

**Steps**:
1. View addresses list
2. Refresh the page
3. Verify addresses are still displayed
4. Check address details

**Expected Result**:
- Addresses persist after refresh
- All address data is preserved
- No data loss occurs
- Addresses load correctly

---

### Test ID: ADDR-018
**Title**: Address Formatting is Consistent

**Preconditions**:
- Customer is logged in
- Customer has addresses with different formats entered

**Steps**:
1. View addresses list
2. Check address formatting
3. Verify consistency

**Expected Result**:
- Addresses are formatted consistently
- Line breaks are appropriate
- All fields are displayed
- Formatting is readable
- No formatting issues

---

## Address Validation Edge Cases

### Test ID: ADDR-019
**Title**: Special Characters in Address Fields

**Preconditions**:
- Customer is on address form

**Steps**:
1. Enter address with special characters:
   - Apostrophes
   - Hyphens
   - Commas
   - Numbers
2. Save address
3. Verify data is preserved

**Expected Result**:
- Special characters are accepted
- Data is saved correctly
- Special characters are displayed properly
- No data corruption occurs

---

### Test ID: ADDR-020
**Title**: Long Address Fields are Handled

**Preconditions**:
- Customer is on address form

**Steps**:
1. Enter very long text in address fields
2. Save address
3. Verify display

**Expected Result**:
- Long text is accepted (within limits)
- Text is truncated or wrapped appropriately
- Address displays correctly
- No layout issues occur
- Character limits are enforced (if applicable)

---

## Summary

These address management tests validate:
- ✅ Address creation
- ✅ Field validation
- ✅ Address editing
- ✅ Address deletion
- ✅ Default address management
- ✅ Address listing
- ✅ Checkout integration
- ✅ Data persistence
- ✅ Security
- ✅ Edge cases

**Execution Time**: ~45-60 minutes for full address management test suite

**Priority**: Run these tests after address-related changes and before checkout feature updates.
