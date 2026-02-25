# URGENT: Clear Analytics Data - Step-by-Step

Your analytics are still showing data because there are 2 orders remaining in the database. Here's how to reset everything to zero.

---

## 🎯 Goal

Reset all analytics data to zero:
- Revenue by Metal Type: 0
- Online vs Offline Sales: 0
- Sales Trends: 0
- Total Orders: 0
- Total Customers: 0 (or keep real customers if you want)

---

## ⚡ Quick Fix (3 Steps - 10 Minutes)

### Step 1: Diagnose (2 minutes)

Open Supabase SQL Editor and run: `migrations/diagnostic-find-remaining-orders.sql`

This will show you:
- Which users still have orders
- Which order numbers are still in the system
- Why analytics still show data

### Step 2: Delete All Orders (5 minutes)

Open Supabase SQL Editor and run: `migrations/complete-reset-all-orders-analytics.sql`

**Important**: 
1. First run **STEP 2** (preview) to see what will be deleted
2. Then uncomment **STEP 3** by removing `/*` and `*/`
3. Run the deletion
4. Run **STEP 4** to verify (should show all 0s)

### Step 3: Verify Analytics Reset (2 minutes)

1. Go to your admin dashboard at `/admin/analytics`
2. Hard refresh the page (Ctrl + Shift + R)
3. You should see:
   - ✅ Revenue by Metal Type: "No data available" or all 0%
   - ✅ Online vs Offline Sales: All bars at 0
   - ✅ Sales Trends: Flat line at 0

---

## 📋 Detailed Instructions

### What the Scripts Do

**`diagnostic-find-remaining-orders.sql`** (Run first)
- Shows which users have orders
- Lists all order numbers
- Identifies why analytics still show data
- No deletions - just information

**`complete-reset-all-orders-analytics.sql`** (Run second)
- Deletes ALL orders from the database
- Deletes ALL related data (order items, payments, shipments)
- Resets analytics to completely zero
- Includes backup and verification steps

---

## 🔍 Why Analytics Still Show Data

Analytics data comes from the `orders` table in your database. Your current status:

```
Current State:
- total_products: 1
- total_orders: 2 ← Still have 2 orders!
- total_users: 3 ← Still have 3 users!
- total_revenue: ₹4,720 ← This is why analytics show data
```

The previous cleanup script may not have deleted all orders if:
1. The users still exist in the system
2. The email addresses don't match exactly
3. There are orphaned orders (user deleted but order remains)

---

## ⚠️ IMPORTANT: Two Options

### Option A: Keep User Accounts, Delete Only Orders
If you want to keep the test user accounts but just remove their orders:
- Run `complete-reset-all-orders-analytics.sql`
- DO NOT delete users from Supabase Auth
- Users will remain but will have zero orders

### Option B: Complete Clean (Recommended)
If you want to remove everything:
1. Run `complete-reset-all-orders-analytics.sql` (deletes all orders)
2. Then go to Supabase Dashboard → Authentication → Users
3. Manually delete the test user accounts
4. This will give you a completely fresh start

---

## 📊 After Cleanup

Your admin dashboard will show:

### Orders Page (`/admin/orders`)
- "No orders found" or empty table

### Customers Page (`/admin/customers`)
- Empty or only real customers (depending on Option A or B)

### Analytics Page (`/admin/analytics`)
- **Revenue by Metal Type**: No data or 0%
- **Online vs Offline Sales**: All bars at 0
- **Sales Trends**: Flat line at 0
- **Total Revenue**: ₹0
- **Total Orders**: 0

**This is completely normal and expected!** Your analytics will populate with real data as real customers place new orders.

---

## 🚀 Quick Commands

Copy and paste these in order:

### 1. Run Diagnostic
```
Open: migrations/diagnostic-find-remaining-orders.sql in Supabase SQL Editor
Run: All queries
Review: Which orders/users remain
```

### 2. Run Complete Reset
```
Open: migrations/complete-reset-all-orders-analytics.sql in Supabase SQL Editor
Run: STEP 2 (preview)
Review: Confirm what will be deleted
Uncomment: STEP 3 (remove /* and */)
Run: STEP 3 (deletion)
Run: STEP 4 (verification - should show all 0s)
```

### 3. Refresh Dashboard
```
Open: /admin/analytics
Press: Ctrl + Shift + R (hard refresh)
Verify: All charts show 0 or "No data"
```

---

## ✅ Success Checklist

After running the scripts:

- [ ] Run diagnostic script - identified remaining orders
- [ ] Run complete reset script - STEP 2 (preview)
- [ ] Confirmed data to be deleted is correct
- [ ] Uncommented STEP 3 in reset script
- [ ] Run STEP 3 - all orders deleted
- [ ] Run STEP 4 - verification shows all 0s
- [ ] Hard refresh analytics page
- [ ] Analytics show 0 or "No data"
- [ ] Orders page shows empty
- [ ] (Optional) Deleted test users from Supabase Auth

---

## 🆘 If Analytics Still Show Data

1. **Clear browser cache**: Sometimes analytics are cached
2. **Wait 1-2 minutes**: Server-side cache may need to clear
3. **Check database directly**: Run the verification queries in STEP 4
4. **Hard refresh**: Ctrl + Shift + R on the analytics page
5. **Check for missed orders**: Run diagnostic script again

---

## 📞 Files You Need

Both scripts are ready to use:

```
migrations/
├── diagnostic-find-remaining-orders.sql    ← Run this FIRST
└── complete-reset-all-orders-analytics.sql ← Run this SECOND
```

---

**Status**: ✅ Scripts are ready to run!  
**Time Required**: ~10 minutes total  
**Risk Level**: LOW (includes preview and verification)

👉 **START HERE**: Open `migrations/diagnostic-find-remaining-orders.sql` in Supabase SQL Editor
