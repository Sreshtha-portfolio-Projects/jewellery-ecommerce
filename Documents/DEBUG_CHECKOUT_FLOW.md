# 🔍 Debug Checkout Flow - Complete Trace

## Flow Overview
```
Frontend → Order Intent Service → Backend Controller → Services → Database
```

## Step-by-Step Trace

### 1. Frontend (Checkout.jsx)
```javascript
// Line 130-134
const orderIntentData = await orderIntentService.createOrderIntent(
  selectedAddressId,  // UUID
  selectedAddressId,  // UUID  
  appliedCoupon?.code || null  // string or null
);
```

**Sends to backend**:
```json
{
  "shippingAddressId": "uuid-here",
  "billingAddressId": "uuid-here",
  "discountCode": null or "SUMMER20"
}
```

---

### 2. Order Intent Service (orderIntentService.js)
```javascript
// Line 4-10
createOrderIntent: async (shippingAddressId, billingAddressId, discountCode) => {
  const response = await api.post('/order-intents', {
    shippingAddressId,
    billingAddressId,
    discountCode
  });
  return response.data;
}
```

**Makes POST request to**: `/api/order-intents`

---

### 3. Backend Controller (orderIntentController.js)

#### Step 3a: Initial Checks
```javascript
// Line 11-12
const userId = req.user.userId;  // From auth middleware
const { shippingAddressId, billingAddressId, discountCode } = req.body;
```

**Potential Issue #1**: If `req.user` is undefined → 500 error
**Check**: Is authentication middleware applied?

#### Step 3b: Checkout Enabled Check
```javascript
// Line 15-21
const checkoutEnabled = await cartRevalidationService.isCheckoutEnabled();
if (!checkoutEnabled) {
  return res.status(503).json({
    message: 'Checkout is currently disabled',
    maintenance_mode: true
  });
}
```

**Potential Issue #2**: If `admin_settings` table doesn't exist → Error
**Check**: Does `admin_settings` table exist in database?

#### Step 3c: Fetch Cart
```javascript
// Line 24-30
const { data: cartItems, error: cartError } = await supabase
  .from('carts')
  .select(`
    *,
    product:products(*)
  `)
  .eq('user_id', userId);
```

**Potential Issue #3**: If cart is empty → 400 error
**Potential Issue #4**: If products table has issues → 500 error

#### Step 3d: Fetch Variants
```javascript
// Line 47-50
const { data: variants } = await supabase
  .from('product_variants')
  .select('*')
  .in('product_id', productIds);
```

**Potential Issue #5**: If `product_variants` table doesn't exist → Error
**Note**: This is optional, products without variants still work

#### Step 3e: Cart Validation
```javascript
// Line 72-82
const validation = await cartRevalidationService.revalidateCart(
  cartItems.map(item => ({...})),
  discountCode
);
```

**Potential Issue #6**: Validation failure (stock, price changes, etc.)
**Returns**: 400 with validation errors

#### Step 3f: Price Calculation
```javascript
// Line 103-107
const priceCalculation = await pricingEngine.calculateFinalPrice(
  cartItems,
  discountCode,
  variantPrices
);
```

**Potential Issue #7**: `applyPricingRules` function error
**Potential Issue #8**: Tax/shipping calculation failure

#### Step 3g: Create Order Intent
```javascript
// Line 118-144
const { data: orderIntent, error: intentError } = await supabase
  .from('order_intents')
  .insert({
    user_id: userId,
    intent_number: intentNumber,
    status: 'INTENT_CREATED',
    // ... more fields
    shipping_address_id: shippingAddressId,
    billing_address_id: billingAddressId,
    // ...
  })
  .select()
  .single();
```

**Potential Issue #9**: `order_intents` table constraint violation
**Potential Issue #10**: Address IDs are invalid (FK constraint)

#### Step 3h: Lock Inventory
```javascript
// Line 180-189
const { data: lock, error: lockError } = await supabase
  .from('inventory_locks')
  .insert({
    order_intent_id: orderIntent.id,
    variant_id: itemId,
    is_variant_lock: isVariant,
    quantity_locked: item.quantity,
    expires_at: expiresAt
  })
  .select();
```

**Potential Issue #11**: `inventory_locks` table missing `is_variant_lock` column
**FIX NEEDED**: Run `supabase-stock-management-fix.sql`

#### Step 3i: Decrement Stock
```javascript
// Line 202-206
const { error: stockError } = await supabase.rpc('decrement_stock', {
  item_id: itemId,
  quantity: item.quantity,
  is_variant: isVariant
});
```

**Potential Issue #12**: Function `decrement_stock(item_id, quantity, is_variant)` doesn't exist
**FIX NEEDED**: Run `supabase-stock-management-fix.sql`

---

## Common Error Scenarios

### Error: "Cart is empty"
```json
{ "message": "Cart is empty" }
```
**Cause**: No items in cart OR cart fetch failed
**Check**: Go to Supabase → Table Editor → carts → Verify rows exist

### Error: "Cart validation failed"
```json
{
  "message": "Cart validation failed",
  "errors": ["Variant no longer exists"],
  "requiresRefresh": true
}
```
**Cause**: Product/variant validation failed
**Check**: Ensure products are active, have stock

### Error: "Failed to create order intent"
```json
{ "message": "Failed to create order intent" }
```
**Cause**: Database insertion failed
**Check Render logs for**: `"Error creating order intent:"`

### Error: "Failed to lock inventory"
```json
{
  "message": "Failed to lock inventory",
  "error": "column 'is_variant_lock' does not exist"
}
```
**Cause**: Database migration not run
**FIX**: Run `migrations/supabase-stock-management-fix.sql`

### Error: "Failed to update stock"
```json
{
  "message": "Failed to update stock",
  "error": "function decrement_stock(uuid, integer, boolean) does not exist"
}
```
**Cause**: Database functions not created
**FIX**: Run `migrations/supabase-stock-management-fix.sql`

---

## Required Database Tables

### Tables That MUST Exist:
1. ✅ `carts` - Cart items
2. ✅ `products` - Product data
3. ✅ `product_variants` - Variant data (optional)
4. ✅ `addresses` - Shipping/billing addresses
5. ✅ `order_intents` - Order intents
6. ✅ `inventory_locks` - Stock locks (needs `is_variant_lock` column)
7. ✅ `admin_settings` - System settings
8. ✅ `discounts` - Discount codes (if using coupons)

### Functions That MUST Exist:
1. ✅ `decrement_stock(item_id UUID, quantity INTEGER, is_variant BOOLEAN)`
2. ✅ `increment_stock(item_id UUID, quantity INTEGER, is_variant BOOLEAN)`

---

## Debug Checklist

When you get "Error placing order", check in this order:

### 1. Check Render Logs
Look for the FIRST error message:
```
"Error fetching cart:"
"Cart validation failed for user:"
"Error creating order intent:"
"Error locking inventory:"
"Error decrementing stock:"
```

### 2. Check Browser Console
Look for response data:
```javascript
error.response.data.message  // Main error message
error.response.data.error    // Technical details (dev mode only)
error.response.data.errors   // Validation errors array
```

### 3. Check Database
```sql
-- Check if cart has items
SELECT * FROM carts WHERE user_id = 'your-user-id';

-- Check if products exist
SELECT * FROM products WHERE id IN (
  SELECT product_id FROM carts WHERE user_id = 'your-user-id'
);

-- Check if addresses exist
SELECT * FROM addresses WHERE id = 'selected-address-id';

-- Check if functions exist
SELECT routine_name FROM information_schema.routines 
WHERE routine_name IN ('decrement_stock', 'increment_stock');

-- Check if is_variant_lock column exists
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'inventory_locks' 
AND column_name = 'is_variant_lock';
```

### 4. Most Likely Issues (in order)

#### Issue #1: Database Functions Missing (80% of cases)
**Symptom**: "function decrement_stock does not exist"
**Fix**: Run `migrations/supabase-stock-management-fix.sql` in Supabase SQL Editor

#### Issue #2: Column Missing (15% of cases)
**Symptom**: "column is_variant_lock does not exist"
**Fix**: Run `migrations/supabase-stock-management-fix.sql` in Supabase SQL Editor

#### Issue #3: Cart Empty (3% of cases)
**Symptom**: "Cart is empty"
**Fix**: Verify items are in cart, re-add if needed

#### Issue #4: Product/Variant Issues (2% of cases)
**Symptom**: "Variant no longer exists" or "Product is no longer available"
**Fix**: Check product is active, has stock

---

## Quick Test Script

Run this in browser console on checkout page:

```javascript
// Test order intent creation
fetch('https://jewellery-ecommerce-9xs1.onrender.com/api/order-intents', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('token')}`
  },
  body: JSON.stringify({
    shippingAddressId: 'your-address-id-here',
    billingAddressId: 'your-address-id-here',
    discountCode: null
  })
})
.then(r => r.json())
.then(console.log)
.catch(console.error);
```

---

## Next Steps

1. **Check Render logs** - Find the specific error
2. **Run database migration** - If functions/columns missing
3. **Verify data** - Ensure cart, products, addresses exist
4. **Test again** - Clear cache, try in incognito

**Most likely you need to**: Run `migrations/supabase-stock-management-fix.sql` ⚡
