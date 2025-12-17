# Deploy Checkout Fixes - Step by Step Guide

## Overview
This guide fixes ALL checkout-related issues including:
- ✅ Cart operations (add to cart, update quantity)
- ✅ Address creation/management
- ✅ Review system
- ✅ Order intent creation (CRITICAL FIX: Cart-Variant join issue)
- ✅ Inventory locking
- ✅ Stock management

## Latest Fix (CRITICAL)
**Issue**: "Could not find a relationship between 'carts' and 'product_variants'"
**Solution**: Removed direct join, fetch variants separately based on product_id

## Prerequisites
- Access to Supabase SQL Editor
- Access to Render.com deployment
- Git repository access

## Deployment Steps

### Step 1: Run Database Migration (CRITICAL - DO THIS FIRST!)

1. Go to your Supabase Dashboard
2. Navigate to SQL Editor
3. Copy and paste the entire contents of `migrations/supabase-stock-management-fix.sql`
4. Click "Run" to execute

**What this does:**
- Creates universal stock management functions that work for both products and variants
- Adds `is_variant_lock` column to `inventory_locks` table
- Updates inventory release functions
- Fixes the `decrement_stock` and `increment_stock` functions

### Step 2: Commit and Deploy Code Changes

```bash
# Add all fixed files
git add .

# Commit with descriptive message
git commit -m "Fix: Complete checkout flow - cart, address, reviews, order intent

- Add universal stock management for products and variants
- Fix cart validation for items without variants
- Improve error handling across all endpoints
- Add comprehensive logging for debugging
- Update inventory locking logic"

# Push to trigger automatic deployment
git push origin main
```

### Step 3: Verify Deployment

Wait for Render to complete the deployment (usually 2-5 minutes).

### Step 4: Test the Complete Flow

#### Test 1: Add to Cart
1. Go to any product page
2. Click "Add to Cart"
3. **Expected**: Item added successfully, no console errors

#### Test 2: Address Management
1. Go to Account > Addresses
2. Click "Add New Address"
3. Fill in all fields and submit
4. **Expected**: Address saved successfully

#### Test 3: Checkout Flow
1. Go to Cart
2. Click "Proceed to Checkout"
3. Select an address
4. Click "Proceed to Payment"
5. **Expected**: Razorpay payment modal opens, no 400/500 errors

#### Test 4: Review System
1. Go to any product page
2. Scroll to reviews section
3. **Expected**: Reviews load without errors

### Step 5: Monitor Logs

Check Render logs for any errors:

```bash
# Look for these log messages indicating success:
"Cart items found: X for user: [uuid]"
"Order intent created successfully"
```

## Files Modified

### Backend Controllers
- ✅ `backend/src/controllers/orderIntentController.js`
- ✅ `backend/src/controllers/cartController.js`
- ✅ `backend/src/controllers/addressController.js`
- ✅ `backend/src/controllers/reviewController.js`

### Backend Services
- ✅ `backend/src/services/cartRevalidationService.js`

### Database Migrations
- ✅ `migrations/supabase-stock-management-fix.sql` (NEW)

## Rollback Plan

If something goes wrong:

### Rollback Database (if needed)
```sql
-- Revert to old functions (variant-only)
DROP FUNCTION IF EXISTS decrement_stock(UUID, INTEGER, BOOLEAN);
DROP FUNCTION IF EXISTS increment_stock(UUID, INTEGER, BOOLEAN);

CREATE OR REPLACE FUNCTION decrement_stock(variant_id UUID, quantity INTEGER)
RETURNS void AS $$
BEGIN
  UPDATE product_variants
  SET stock_quantity = GREATEST(0, stock_quantity - quantity)
  WHERE id = variant_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION increment_stock(variant_id UUID, quantity INTEGER)
RETURNS void AS $$
BEGIN
  UPDATE product_variants
  SET stock_quantity = stock_quantity + quantity
  WHERE id = variant_id;
END;
$$ LANGUAGE plpgsql;
```

### Rollback Code
```bash
git revert HEAD
git push origin main
```

## Common Issues and Solutions

### Issue: "Cart is empty" error
**Cause**: Cart items not loading properly
**Solution**: Check if products exist and are active in database

### Issue: "Variant no longer exists"
**Cause**: Product doesn't have variants but cart validation expects them
**Solution**: This is fixed by the new code. Redeploy if you see this.

### Issue: "Failed to lock inventory"
**Cause**: Database functions not updated
**Solution**: Re-run Step 1 (database migration)

### Issue: 500 error on order intent
**Cause**: Old `decrement_stock` function still in use
**Solution**: 
1. Check Supabase SQL Editor for function definition
2. Re-run `migrations/supabase-stock-management-fix.sql`
3. Restart Render deployment

## Support Checklist

Before asking for help, verify:
- [ ] Database migration ran successfully (no SQL errors)
- [ ] Code deployed to Render (check deployment logs)
- [ ] Browser cache cleared
- [ ] Tested in incognito/private window
- [ ] Checked Render logs for specific error messages
- [ ] Checked browser console for client-side errors

## Success Indicators

✅ **All working correctly when:**
1. Can add products to cart
2. Can create/edit addresses
3. Can see product reviews
4. Can create order intent (proceed to payment)
5. No 400 or 500 errors in browser console
6. No errors in Render logs

## Performance Notes

These fixes also improve:
- Better error messages for debugging
- Reduced database queries in cart validation
- Proper stock locking prevents overselling
- Comprehensive logging for production issues

## Next Steps

After successful deployment:
1. Monitor for 24 hours
2. Check cart abandonment rates
3. Verify all orders complete successfully
4. Test with high-traffic simulation
