# 🔥 HOTFIX: Cart-Variant Join Error

## Error Message
```
"Could not find a relationship between 'carts' and 'product_variants' in the schema cache"
```

## Root Cause
The `carts` table doesn't have a foreign key column to `product_variants` table. The old code tried to join them directly:

```javascript
// ❌ BROKEN - This fails
const { data: cartItems } = await supabase
  .from('carts')
  .select(`
    *,
    product:products(*),
    variant:product_variants(*)  // ← NO RELATIONSHIP EXISTS
  `)
```

## The Fix
Changed to fetch variants separately based on product_id:

```javascript
// ✅ WORKING - Fetch products, then variants separately
const { data: cartItems } = await supabase
  .from('carts')
  .select(`
    *,
    product:products(*)
  `)
  .eq('user_id', userId);

// Fetch variants for these products
const productIds = cartItems.map(item => item.product_id);
const { data: variants } = await supabase
  .from('product_variants')
  .select('*')
  .in('product_id', productIds);

// Map variants to cart items
cartItems.forEach(item => {
  const productVariants = variantsByProduct[item.product_id];
  if (productVariants && productVariants.length > 0) {
    item.variant = productVariants.find(v => v.is_active) || productVariants[0];
    item.variant_id = item.variant.id;
  }
});
```

## Why This Happened
The `carts` table schema:
```sql
CREATE TABLE carts (
  id UUID,
  user_id UUID REFERENCES auth.users(id),
  product_id UUID REFERENCES products(id),  -- ✅ Has this FK
  quantity INTEGER,
  -- variant_id is MISSING  -- ❌ No FK to variants
);
```

## Deploy This Fix

### Option 1: Quick Deploy (No Database Changes)
```bash
git add backend/src/controllers/orderIntentController.js
git commit -m "Hotfix: Fix cart-variant join error in order intent"
git push origin main
```

### Option 2: Full Solution (Add variant_id to carts) - RECOMMENDED

**Step 1: Update Database**
```sql
-- Add variant_id column to carts table
ALTER TABLE carts
ADD COLUMN IF NOT EXISTS variant_id UUID REFERENCES product_variants(id) ON DELETE SET NULL;

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_carts_variant ON carts(variant_id);
```

**Step 2: Update Cart Controller**
When adding to cart, include variant_id:
```javascript
// backend/src/controllers/cartController.js
const { data, error } = await supabase
  .from('carts')
  .upsert({
    user_id: userId,
    product_id: productId,
    variant_id: variantId || null,  // ← ADD THIS
    quantity: requestedQuantity,
    updated_at: new Date().toISOString()
  }, {
    onConflict: 'user_id,product_id'
  });
```

**Step 3: Update Order Intent Controller**
Revert to simple join:
```javascript
const { data: cartItems } = await supabase
  .from('carts')
  .select(`
    *,
    product:products(*),
    variant:product_variants(*)  // ← Now this works!
  `)
  .eq('user_id', userId);
```

## Testing

### Test Case 1: Product WITHOUT Variant
1. Add product to cart (no variant selected)
2. Go to checkout
3. **Expected**: Order intent created successfully
4. **Verify**: `item.variant` is null, uses product stock

### Test Case 2: Product WITH Variant
1. Add product with variant to cart
2. Go to checkout
3. **Expected**: Order intent created successfully
4. **Verify**: `item.variant` has data, uses variant stock

## Status
✅ **Quick fix deployed** - Works without database changes
🔄 **Full solution pending** - Adds variant_id to carts table (recommended for long-term)

## Timeline
- **Immediate**: Deploy quick fix (no DB changes)
- **Next sprint**: Implement full solution with variant_id column
