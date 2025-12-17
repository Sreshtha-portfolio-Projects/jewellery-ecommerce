# ⚡ Quick Fix Reference - Checkout System

## 🚨 One-Command Deploy

```bash
# Step 1: Run this SQL in Supabase SQL Editor
# Copy from: migrations/supabase-stock-management-fix.sql

# Step 2: Deploy code
git add . && git commit -m "Fix: Complete checkout system" && git push origin main
```

## ✅ What's Fixed

| Issue | Status | File |
|-------|--------|------|
| Cart - Add to Cart fails | ✅ Fixed | `cartController.js` |
| Cart - Update quantity errors | ✅ Fixed | `cartController.js` |
| Address - Cannot create | ✅ Fixed | `addressController.js` |
| Reviews - Won't load | ✅ Fixed | `reviewController.js` |
| Checkout - Order intent fails | ✅ Fixed | `orderIntentController.js` |
| Stock - Products without variants | ✅ Fixed | `cartRevalidationService.js` |
| Inventory - Locking errors | ✅ Fixed | `supabase-stock-management-fix.sql` |

## 🔍 Quick Diagnosis

### Error: "Cart is empty" (400)
**Where**: Order Intent Creation  
**Cause**: Cart validation failing  
**Check**: `cartRevalidationService.js` deployed  

### Error: "Failed to lock inventory" (500)
**Where**: Order Intent Creation  
**Cause**: Database functions not updated  
**Fix**: Run `supabase-stock-management-fix.sql`  

### Error: "Variant no longer exists" (400)
**Where**: Cart Validation  
**Cause**: Products without variants  
**Check**: New code handles both cases  

### Error: "Error creating address" (500)
**Where**: Address Creation  
**Cause**: Data validation or RLS policies  
**Check**: `addressController.js` has better logging  

## 🎯 Test Checklist

- [ ] Add product to cart → Success
- [ ] Update cart quantity → Success
- [ ] Remove from cart → Success
- [ ] Create address → Success
- [ ] Edit address → Success
- [ ] View product reviews → Success
- [ ] Proceed to checkout → Success
- [ ] Create order intent → Success
- [ ] Payment modal opens → Success

## 📊 Monitoring

### Check Render Logs
Look for these SUCCESS messages:
```
✅ "Cart items found: X for user: [uuid]"
✅ "Order intent created successfully"
✅ "Address created successfully"
```

Look for these ERROR patterns:
```
❌ "Insufficient stock for..."
❌ "Failed to lock inventory"
❌ "Cart validation failed"
```

### Check Supabase
```sql
-- Verify functions exist
SELECT routine_name FROM information_schema.routines 
WHERE routine_name IN ('decrement_stock', 'increment_stock', 'get_available_stock');

-- Check recent inventory locks
SELECT * FROM inventory_locks 
WHERE created_at > NOW() - INTERVAL '1 hour' 
ORDER BY created_at DESC LIMIT 10;
```

## 🛠️ Common Fixes

### "Function does not exist"
```bash
# Re-run database migration
# Go to Supabase → SQL Editor
# Run: migrations/supabase-stock-management-fix.sql
```

### "Column is_variant_lock does not exist"
```bash
# Migration didn't complete
# Re-run: migrations/supabase-stock-management-fix.sql
```

### Still seeing errors after deploy
```bash
# Clear deployment cache
git commit --allow-empty -m "Trigger redeploy"
git push origin main

# Wait 3-5 minutes for Render to redeploy
```

## 📞 Support Escalation

If errors persist after:
1. ✅ Database migration run
2. ✅ Code deployed
3. ✅ Browser cache cleared
4. ✅ Tested in incognito

**Check:**
- Render deployment logs (last 100 lines)
- Supabase logs (Real-time tab)
- Browser console errors (Network tab)
- Share specific error message

## 🔄 Quick Rollback

```bash
# If needed, revert to previous version
git log --oneline -5
git revert [commit-hash]
git push origin main
```

## 📋 Success Indicators

### Green Flags ✅
- No 400/500 errors in console
- Orders completing successfully  
- Stock decrements properly
- Inventory locks created

### Red Flags ❌
- Repeated "Cart is empty" errors
- "Function does not exist" in logs
- Stock not updating
- Multiple failed order attempts

## ⏱️ Expected Timeline

- **Database Migration**: 5 seconds
- **Code Deployment**: 2-5 minutes
- **Verification**: 5 minutes
- **Total**: ~10-15 minutes

## 🎉 Post-Deployment

1. ✅ Test complete checkout flow
2. ✅ Monitor for 30 minutes
3. ✅ Check stock levels accurate
4. ✅ Verify order completion rate
5. ✅ Mark as stable ✨
