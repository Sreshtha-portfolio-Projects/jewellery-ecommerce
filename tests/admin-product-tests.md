# 🛠️ Admin Product Management Tests
## Aldorado Jewells – Product & Variant Administration

**Purpose**: Validate admin capabilities for managing products, variants, images, and pricing.

---

## Product CRUD Operations

### Test ID: ADMIN-PROD-001
**Title**: Admin Can Create New Product

**Preconditions**:
- Admin is logged in
- Admin navigates to Products page

**Steps**:
1. Click "Add New Product" or "Create Product" button
2. Fill in product form:
   - Product name
   - Description
   - Category
   - Base price
   - Metal type, purity, karat (if applicable)
   - SKU
3. Set product as active/bestseller (if applicable)
4. Click "Save" or "Create"

**Expected Result**:
- Product is created successfully
- Success message is displayed
- Product appears in products list
- Product ID is generated
- All fields are saved correctly

---

### Test ID: ADMIN-PROD-002
**Title**: Admin Can View Product List with Pagination

**Preconditions**:
- Admin is logged in
- Multiple products exist (more than page limit)

**Steps**:
1. Navigate to Products page
2. View first page of products
3. Click "Next" or page number
4. Verify pagination controls

**Expected Result**:
- Products list displays correctly
- Pagination shows correct page numbers
- Total count is accurate
- Products load correctly on page change
- Page size is respected

---

### Test ID: ADMIN-PROD-003
**Title**: Admin Can Search Products

**Preconditions**:
- Admin is logged in
- Multiple products exist with different names

**Steps**:
1. Navigate to Products page
2. Enter search term in search box
3. Submit search or wait for auto-search
4. Verify results

**Expected Result**:
- Search results match search term
- Search works for product name, SKU, description
- Results update correctly
- No products found message shows if no matches

---

### Test ID: ADMIN-PROD-004
**Title**: Admin Can Filter Products by Category

**Preconditions**:
- Admin is logged in
- Products exist in multiple categories

**Steps**:
1. Navigate to Products page
2. Select category from filter dropdown
3. Verify filtered results
4. Clear filter

**Expected Result**:
- Only products from selected category are shown
- Filter persists during session
- Clear filter shows all products
- Filter works with search

---

### Test ID: ADMIN-PROD-005
**Title**: Admin Can Filter Products by Active Status

**Preconditions**:
- Admin is logged in
- Some products are active, some inactive

**Steps**:
1. Navigate to Products page
2. Filter by "Active" status
3. Filter by "Inactive" status
4. Filter by "All"

**Expected Result**:
- Active filter shows only active products
- Inactive filter shows only inactive products
- All shows all products
- Status filter works correctly

---

### Test ID: ADMIN-PROD-006
**Title**: Admin Can Edit Existing Product

**Preconditions**:
- Admin is logged in
- Product exists in system

**Steps**:
1. Navigate to Products page
2. Click "Edit" on a product
3. Modify product fields (name, price, description)
4. Save changes

**Expected Result**:
- Product form loads with existing data
- Changes are saved successfully
- Success message is displayed
- Updated product appears in list
- Changes are reflected immediately

---

### Test ID: ADMIN-PROD-007
**Title**: Admin Can Delete (Soft Delete) Product

**Preconditions**:
- Admin is logged in
- Product exists and is active

**Steps**:
1. Navigate to Products page
2. Click "Delete" on a product
3. Confirm deletion
4. Verify product status

**Expected Result**:
- Product is soft deleted (is_active = false)
- Product no longer appears in active products
- Product can be restored (if feature exists)
- Deletion is logged in audit trail

---

## Variant Management

### Test ID: ADMIN-PROD-008
**Title**: Admin Can Add Variant to Product

**Preconditions**:
- Admin is logged in
- Product exists

**Steps**:
1. Navigate to product edit page
2. Go to Variants section
3. Click "Add Variant"
4. Fill variant details:
   - Size (if applicable)
   - Color/Metal
   - Finish
   - Weight
   - Stock quantity
   - Price override (if applicable)
5. Save variant

**Expected Result**:
- Variant is created successfully
- Variant appears in variants list
- Stock quantity is set correctly
- Price override works (if applicable)
- Variant is active by default

---

### Test ID: ADMIN-PROD-009
**Title**: Admin Can Edit Variant

**Preconditions**:
- Admin is logged in
- Product with variant exists

**Steps**:
1. Navigate to product edit page
2. Find variant in variants list
3. Click "Edit" on variant
4. Modify variant details (stock, price)
5. Save changes

**Expected Result**:
- Variant form loads with existing data
- Changes are saved successfully
- Updated variant reflects changes
- Stock updates correctly

---

### Test ID: ADMIN-PROD-010
**Title**: Admin Can Delete Variant

**Preconditions**:
- Admin is logged in
- Product with multiple variants exists

**Steps**:
1. Navigate to product edit page
2. Find variant in variants list
3. Click "Delete" on variant
4. Confirm deletion

**Expected Result**:
- Variant is deleted successfully
- Variant no longer appears in list
- Product still exists
- Stock calculations update

---

### Test ID: ADMIN-PROD-011
**Title**: Variant Stock Updates Correctly

**Preconditions**:
- Admin is logged in
- Product with variant exists
- Variant has stock quantity

**Steps**:
1. Navigate to product edit page
2. View variant stock quantity
3. Update stock quantity
4. Save changes
5. Verify stock in product list

**Expected Result**:
- Stock quantity updates correctly
- Total stock for product updates
- Stock is reflected in customer-facing pages
- Stock validation works (no negative stock)

---

## Image Management

### Test ID: ADMIN-PROD-012
**Title**: Admin Can Upload Product Image

**Preconditions**:
- Admin is logged in
- Product exists
- Image file is available

**Steps**:
1. Navigate to product edit page
2. Go to Images section
3. Click "Upload Image" or "Add Image"
4. Select image file or enter image URL
5. Upload image

**Expected Result**:
- Image uploads successfully
- Image appears in images list
- Image URL is generated (if using storage)
- Image is accessible
- Image validation works (type, size)

---

### Test ID: ADMIN-PROD-013
**Title**: Admin Can Reorder Product Images

**Preconditions**:
- Admin is logged in
- Product has multiple images

**Steps**:
1. Navigate to product edit page
2. Go to Images section
3. Use drag-and-drop or up/down arrows to reorder
4. Save image order

**Expected Result**:
- Images can be reordered
- Display order is saved
- Primary image can be set
- Order is reflected on product detail page

---

### Test ID: ADMIN-PROD-014
**Title**: Admin Can Delete Product Image

**Preconditions**:
- Admin is logged in
- Product has multiple images

**Steps**:
1. Navigate to product edit page
2. Go to Images section
3. Click "Delete" on an image
4. Confirm deletion

**Expected Result**:
- Image is deleted successfully
- Image no longer appears in list
- Image is removed from storage (if applicable)
- Product still exists

---

### Test ID: ADMIN-PROD-015
**Title**: Admin Can Set Primary Image

**Preconditions**:
- Admin is logged in
- Product has multiple images

**Steps**:
1. Navigate to product edit page
2. Go to Images section
3. Select primary image
4. Save changes

**Expected Result**:
- Primary image is set correctly
- Primary image appears first in list
- Primary image is used in product listings
- Change is saved

---

## Bulk Operations

### Test ID: ADMIN-PROD-016
**Title**: Admin Can Export Products to CSV

**Preconditions**:
- Admin is logged in
- Products exist in system

**Steps**:
1. Navigate to Bulk Operations page
2. Click "Export Products" or "Export to CSV"
3. Select export type (products, variants, or both)
4. Download CSV file
5. Open CSV file

**Expected Result**:
- CSV file downloads successfully
- CSV contains all product data
- CSV format is correct
- All required fields are included
- Data is accurate

---

### Test ID: ADMIN-PROD-017
**Title**: Admin Can Import Products from CSV

**Preconditions**:
- Admin is logged in
- Valid CSV file is prepared

**Steps**:
1. Navigate to Bulk Operations page
2. Click "Import Products" or "Import from CSV"
3. Select CSV file
4. Choose import type (products, variants, or both)
5. Review import preview
6. Confirm import

**Expected Result**:
- CSV file is uploaded successfully
- Import preview shows row count
- Products/variants are imported correctly
- Errors are displayed with row numbers
- Import log is created

---

### Test ID: ADMIN-PROD-018
**Title**: CSV Import Handles Errors Gracefully

**Preconditions**:
- Admin is logged in
- CSV file with errors (invalid data, missing fields)

**Steps**:
1. Navigate to Bulk Operations page
2. Upload CSV file with errors
3. Review error messages
4. Fix errors in CSV
5. Re-upload corrected CSV

**Expected Result**:
- Errors are detected and displayed
- Error messages indicate row numbers
- Specific field errors are shown
- Valid rows are imported
- Invalid rows are skipped with clear messages

---

## Pricing Rules

### Test ID: ADMIN-PROD-019
**Title**: Admin Can Create Pricing Rule

**Preconditions**:
- Admin is logged in
- Navigate to Pricing Rules page

**Steps**:
1. Click "Create Pricing Rule"
2. Fill rule details:
   - Rule name
   - Rule type (metal markup, weight-based, category, seasonal)
   - Action type (percentage, flat amount)
   - Value
   - Conditions (if applicable)
3. Save rule

**Expected Result**:
- Pricing rule is created successfully
- Rule appears in rules list
- Rule is active by default
- Rule applies to matching products

---

### Test ID: ADMIN-PROD-020
**Title**: Admin Can Edit Pricing Rule

**Preconditions**:
- Admin is logged in
- Pricing rule exists

**Steps**:
1. Navigate to Pricing Rules page
2. Click "Edit" on a rule
3. Modify rule parameters
4. Save changes

**Expected Result**:
- Rule form loads with existing data
- Changes are saved successfully
- Updated rule applies correctly
- Price calculations update

---

### Test ID: ADMIN-PROD-021
**Title**: Admin Can Delete Pricing Rule

**Preconditions**:
- Admin is logged in
- Pricing rule exists

**Steps**:
1. Navigate to Pricing Rules page
2. Click "Delete" on a rule
3. Confirm deletion

**Expected Result**:
- Rule is deleted successfully
- Rule no longer applies to products
- Product prices revert to base prices
- Rule is removed from list

---

### Test ID: ADMIN-PROD-022
**Title**: Pricing Rules Apply Automatically

**Preconditions**:
- Admin is logged in
- Pricing rule exists
- Product matches rule conditions

**Steps**:
1. Create or update pricing rule
2. View product that matches rule
3. Verify price calculation
4. Check customer-facing product page

**Expected Result**:
- Pricing rule applies automatically
- Product price reflects rule
- Price calculation is correct
- Customer sees updated price
- Rule applies in real-time

---

## Product Validation

### Test ID: ADMIN-PROD-023
**Title**: Required Fields Validation Works

**Preconditions**:
- Admin is logged in
- On product creation form

**Steps**:
1. Attempt to save product without required fields
2. Leave name empty
3. Leave price empty
4. Submit form

**Expected Result**:
- Form validation prevents submission
- Error messages indicate missing fields
- Required fields are highlighted
- Form does not submit until all required fields are filled

---

### Test ID: ADMIN-PROD-024
**Title**: Price Validation Works

**Preconditions**:
- Admin is logged in
- On product creation/edit form

**Steps**:
1. Enter negative price
2. Enter invalid price format
3. Enter very large price
4. Submit form

**Expected Result**:
- Negative prices are rejected
- Invalid formats show error
- Large prices are accepted (if within limits)
- Validation messages are clear

---

### Test ID: ADMIN-PROD-025
**Title**: SKU Uniqueness Validation

**Preconditions**:
- Admin is logged in
- Product with SKU exists

**Steps**:
1. Create new product
2. Enter existing SKU
3. Attempt to save

**Expected Result**:
- Duplicate SKU is rejected
- Error message indicates SKU already exists
- Form does not submit
- User must enter unique SKU

---

## Summary

These admin product tests validate:
- ✅ Product CRUD operations
- ✅ Variant management
- ✅ Image upload and management
- ✅ Bulk import/export
- ✅ Pricing rules engine
- ✅ Search and filtering
- ✅ Data validation
- ✅ Stock management

**Execution Time**: ~90-120 minutes for full admin product test suite

**Priority**: Run these tests after product management feature changes and before major releases.
