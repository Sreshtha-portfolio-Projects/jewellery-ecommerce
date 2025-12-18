# Troubleshooting: 400 Error on Order Intent Creation

## Common Causes

### 1. Cart is Empty
**Error Message**: "Cart is empty. Please add items to your cart before checkout."

**Solution**:
- Add items to cart first
- Navigate to `/cart` and verify items are there
- Refresh the page and try again

### 2. Cart Validation Failed
**Error Message**: "Cart validation failed" or specific validation errors

**Common Reasons**:
- **Stock unavailable**: Items in cart are out of stock
- **Price changed**: Product prices have changed since adding to cart
- **Product removed**: Products were deleted or deactivated
- **Variant unavailable**: Selected variants are no longer available

**Solution**:
- Go to cart page
- Remove unavailable items
- Refresh cart
- Try checkout again

### 3. Invalid Shipping Address
**Error Message**: "Invalid shipping address. Please select a valid address."

**Solution**:
- Select a valid shipping address
- Or add a new address in account settings
- Ensure address belongs to your account

### 4. Checkout Disabled
**Error Message**: "Checkout is currently disabled. Please try again later."

**Solution**:
- This is a maintenance mode
- Wait for admin to re-enable checkout
- Check backend logs for more details

## Debugging Steps

### Step 1: Check Browser Console
Look for the detailed error message in the console. The error response should contain:
- `message`: Main error message
- `errors`: Array of specific validation errors
- `warnings`: Array of warnings (non-blocking)
- `requiresRefresh`: Boolean indicating if cart needs refresh

### Step 2: Check Cart Contents
1. Go to `/cart` page
2. Verify items are displayed
3. Check quantities are correct
4. Verify prices are shown

### Step 3: Check Backend Logs
Look for:
- "Cart is empty for user: {userId}"
- "Cart validation failed for user: {userId}, Errors: [...]"
- Any database errors

### Step 4: Verify Address
1. Go to `/account/addresses`
2. Verify you have at least one address
3. Ensure address is complete (all required fields)

## Quick Fixes

### Fix 1: Clear and Re-add to Cart
```javascript
// In browser console
localStorage.clear();
// Then refresh and add items to cart again
```

### Fix 2: Check Cart in Database
If you have database access, check:
```sql
SELECT * FROM carts WHERE user_id = 'your-user-id';
```

### Fix 3: Verify Products Exist
```sql
SELECT id, name, is_active, stock_quantity 
FROM products 
WHERE id IN (SELECT product_id FROM carts WHERE user_id = 'your-user-id');
```

## Prevention

1. **Always validate cart before checkout**
2. **Show validation errors clearly to user**
3. **Auto-refresh cart if validation fails**
4. **Handle stock changes gracefully**

## Error Response Format

```json
{
  "message": "Cart validation failed",
  "errors": [
    "Product 'Gold Ring' is out of stock",
    "Price for 'Silver Necklace' has changed"
  ],
  "warnings": [
    "Some items may have updated prices"
  ],
  "requiresRefresh": true
}
```

## Testing

To test order intent creation:

1. **Ensure cart has items**:
   - Add products to cart
   - Verify cart count > 0

2. **Ensure address is selected**:
   - Go to checkout
   - Select a delivery address
   - Verify address is highlighted

3. **Try test payment**:
   - Click "🧪 Test Payment" button
   - Check console for errors
   - Verify order intent is created

## Common Error Codes

- `EMPTY_CART`: Cart is empty
- `VALIDATION_FAILED`: Cart validation failed
- `INVALID_ADDRESS`: Shipping address is invalid
- `CHECKOUT_DISABLED`: Checkout is in maintenance mode
- `STOCK_UNAVAILABLE`: Items are out of stock
- `PRICE_CHANGED`: Product prices have changed
