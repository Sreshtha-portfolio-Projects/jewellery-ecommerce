# Product Delete API - 500 Error Fix

## Problem Description

When attempting to delete a product via `DELETE /api/admin/products/{id}`, the API was returning:
- **Status Code**: `500 Internal Server Error`
- **Response**: `{ "message": "Error deleting product" }`

This generic error message provided no details about what actually went wrong, making debugging impossible.

### Root Cause

The backend was using Supabase's `.single()` method to check if a product exists. When the product doesn't exist, `.single()` throws this error:

```
{
  code: 'PGRST116',
  details: 'The result contains 0 rows',
  hint: null,
  message: 'Cannot coerce the result to a single JSON object'
}
```

This error was being caught and returned as a generic 500 error instead of a proper 404 response.

## Solution

### Key Changes

1. **Use `.maybeSingle()` instead of `.single()`**
   - `.single()` throws an error when no rows are found
   - `.maybeSingle()` returns `null` when no rows are found (no error)
   - This allows us to distinguish between "not found" and "database error"

2. **Separate Error Handling**
   - Database errors → 500 with actual error message
   - Product not found → 404 with clear message
   - Product already deleted → 400 with clear message

3. **Include Detailed Error Information**
   - All error responses now include the actual error message
   - Contextual information (productId, productName) included where relevant

### Updated Code

```javascript
const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    // Use .maybeSingle() to handle non-existent products gracefully
    const { data: existingProduct, error: checkError } = await supabase
      .from('products')
      .select('id, name, is_active')
      .eq('id', id)
      .maybeSingle(); // ✅ Returns null if not found (no error thrown)

    // Handle database errors
    if (checkError) {
      console.error('Error checking product:', checkError);
      return res.status(500).json({ 
        message: 'Error checking product existence',
        error: checkError.message // ✅ Actual error message
      });
    }

    // Handle product not found
    if (!existingProduct) {
      return res.status(404).json({ 
        message: 'Product not found',
        productId: id // ✅ Context
      });
    }

    // Handle already deleted product
    if (!existingProduct.is_active) {
      return res.status(400).json({ 
        message: 'Product is already deleted',
        productId: id,
        productName: existingProduct.name // ✅ Context
      });
    }

    // Perform soft delete
    const { data: updatedProduct, error: updateError } = await supabase
      .from('products')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Error deleting product:', updateError);
      return res.status(500).json({ 
        message: 'Error deleting product',
        error: updateError.message // ✅ Actual error message
      });
    }

    // Log audit trail
    await supabase.from('audit_logs').insert({
      user_id: req.user.userId,
      action: 'product_deleted',
      entity_type: 'product',
      entity_id: id
    });

    res.json({ 
      message: 'Product deleted successfully',
      product: updatedProduct
    });
  } catch (error) {
    console.error('Error in deleteProduct:', error);
    res.status(500).json({ 
      message: 'Internal server error',
      error: error.message // ✅ Actual error message
    });
  }
};
```

## API Response Examples

### Case 1: Product Not Found (404)
```json
DELETE /api/admin/products/non-existent-uuid

Response: 404 Not Found
{
  "message": "Product not found",
  "productId": "non-existent-uuid"
}
```

### Case 2: Product Already Deleted (400)
```json
DELETE /api/admin/products/already-deleted-uuid

Response: 400 Bad Request
{
  "message": "Product is already deleted",
  "productId": "already-deleted-uuid",
  "productName": "Diamond Ring"
}
```

### Case 3: Successful Deletion (200)
```json
DELETE /api/admin/products/valid-product-uuid

Response: 200 OK
{
  "message": "Product deleted successfully",
  "product": {
    "id": "valid-product-uuid",
    "name": "Diamond Ring",
    "is_active": false,
    "updated_at": "2026-02-26T14:45:00.000Z",
    ...
  }
}
```

### Case 4: Database Error (500)
```json
DELETE /api/admin/products/some-product-uuid

Response: 500 Internal Server Error
{
  "message": "Error deleting product",
  "error": "Connection timeout to database"
}
```

## Frontend Changes

Also fixed the frontend products list to properly handle deleted products:

### `frontend/src/pages/admin/Products.jsx`

1. **Changed default filter from `''` to `'true'`**
   ```javascript
   const [filters, setFilters] = useState({ 
     search: '', 
     category: '', 
     is_active: 'true' // ✅ Was: ''
   });
   ```

2. **Updated filter dropdown labels**
   ```javascript
   <option value="true">Active Products</option>      // ✅ Was: "Active"
   <option value="false">Inactive (Deleted)</option>  // Same
   <option value="all">All Products</option>          // ✅ Was: "All"
   ```

3. **Fixed clear filters button**
   ```javascript
   onClick={() => setFilters({ 
     search: '', 
     category: '', 
     is_active: 'true' // ✅ Was: ''
   })}
   ```

## Testing Guide

### Test 1: Delete Non-existent Product
```bash
curl -X DELETE http://localhost:3000/api/admin/products/00000000-0000-0000-0000-000000000000 \
  -H "Authorization: Bearer YOUR_TOKEN"

Expected: 404 with message "Product not found"
```

### Test 2: Delete Existing Product
```bash
# First, get a real product ID
curl http://localhost:3000/api/admin/products \
  -H "Authorization: Bearer YOUR_TOKEN"

# Then delete it
curl -X DELETE http://localhost:3000/api/admin/products/{PRODUCT_ID} \
  -H "Authorization: Bearer YOUR_TOKEN"

Expected: 200 with message "Product deleted successfully"
```

### Test 3: Delete Same Product Again
```bash
curl -X DELETE http://localhost:3000/api/admin/products/{SAME_PRODUCT_ID} \
  -H "Authorization: Bearer YOUR_TOKEN"

Expected: 400 with message "Product is already deleted"
```

### Test 4: View Deleted Products in Admin UI
1. Go to `http://localhost:5173/admin/products`
2. Default view shows only **Active Products**
3. Change filter dropdown to **Inactive (Deleted)** to see deleted products
4. Change to **All Products** to see everything

## HTTP Status Codes

| Code | Meaning | Trigger |
|------|---------|---------|
| 200 | OK | Product successfully deleted |
| 400 | Bad Request | Product already deleted |
| 404 | Not Found | Product doesn't exist |
| 500 | Internal Server Error | Database connection error or other server issues |

## Why This Matters

### Before the Fix
```
Developer: "Why is delete returning 500?"
Response: { "message": "Error deleting product" }
Developer: "What error? Is it not found? Is it already deleted? Database down?"
Response: ¯\_(ツ)_/¯
```

### After the Fix
```
Developer: "Why is delete returning 404?"
Response: { "message": "Product not found", "productId": "xyz" }
Developer: "Ah! The product doesn't exist. That makes sense."
```

## Benefits

1. **Better DX (Developer Experience)**: Clear error messages make debugging trivial
2. **Proper HTTP Semantics**: Using correct status codes (404, 400, 500)
3. **Frontend Can Handle Errors**: Different UI for "not found" vs "already deleted" vs "server error"
4. **Audit Trail**: Console logs show actual Supabase errors
5. **API Documentation**: Clear contract for API consumers

## Related Files Modified

- `backend/src/controllers/adminProductController.js` - Main fix
- `frontend/src/pages/admin/Products.jsx` - Filter fixes
- `backend/src/routes/adminProductRoutes.js` - No changes (routes already correct)

## Supabase Query Comparison

### `.single()` - Throws error on no results
```javascript
const { data, error } = await supabase
  .from('products')
  .select('*')
  .eq('id', 'non-existent-id')
  .single();

// If no results: error = PGRST116 error object
// If one result: data = the row
// If multiple results: error = PGRST116 error object
```

### `.maybeSingle()` - Returns null on no results
```javascript
const { data, error } = await supabase
  .from('products')
  .select('*')
  .eq('id', 'non-existent-id')
  .maybeSingle();

// If no results: data = null, error = null ✅
// If one result: data = the row, error = null
// If multiple results: error = PGRST116 error object
```

## Additional Notes

- This is a **soft delete** implementation (sets `is_active = false`)
- Products are never permanently removed from the database
- To add **hard delete** (permanent removal), create a separate endpoint
- Audit logs track all delete operations with user information

## Deployment

The fix has been applied and will auto-reload via nodemon. No manual restart needed.

To verify the fix is live:
1. Check backend terminal for "nodemon restarting due to changes..."
2. Test the delete endpoint
3. Check response has proper status code and detailed message
