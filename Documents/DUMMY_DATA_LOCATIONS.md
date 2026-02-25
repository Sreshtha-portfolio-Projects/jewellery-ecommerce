# Quick Reference: Dummy Data Locations

This document provides exact file paths and line numbers for all dummy/placeholder content in the portal.

---

## 🗂️ Frontend Components

| Component | File Path | Lines | Dummy Content | Action Required |
|-----------|-----------|-------|---------------|-----------------|
| **Testimonials** | `frontend/src/components/Testimonials.jsx` | 4-35 | 5 fake testimonials (Sarah M., Jessica T., etc.) | Replace with real reviews or remove |
| **Hero** | `frontend/src/components/Hero.jsx` | 9 | Unsplash background image URL | Replace with real hero image |
| **Promotional Banner 1** | `frontend/src/pages/Home.jsx` | 20 | Unsplash jewelry image | Replace with real product photo |
| **Promotional Banner 2** | `frontend/src/pages/Home.jsx` | 26 | Unsplash jewelry image | Replace with real product photo |
| **Elevate Section** | `frontend/src/pages/Home.jsx` | 39 | Unsplash background image | Replace with real photo |
| **Shop By Category** | `frontend/src/components/ShopByCategory.jsx` | 43 | Unsplash rings image | Replace with category-specific images |
| **Get Inspired Gallery** | `frontend/src/components/GetInspired.jsx` | 3-6 | 4 Unsplash image URLs | Replace with real product showcase |

---

## 🗄️ Database Tables

| Table | Location | Content | Action Required |
|-------|----------|---------|-----------------|
| **products** | Supabase Database | 12 sample products with Unsplash images | Delete via SQL script |
| **orders** | Supabase Database | Test orders from dummy email addresses | Delete via cleanup script |
| **auth.users** | Supabase Auth | Test customer accounts (priya@example.com, etc.) | Delete via Supabase Dashboard |
| **metal_rates** | Supabase Database | Placeholder gold/silver rates marked 'manual_seed' | Update via Admin Dashboard |

### Test Email Addresses to Remove
```
sreshtha.form131@gmail.com
sreshtha.mechlin@gmail.com
priya@example.com
ajay@example.com
sneha@example.com
```

### Sample Products to Delete
Run this query to see them:
```sql
SELECT id, name, image_url FROM products 
WHERE name IN (
  'Solitaire Diamond Ring',
  'Gold Hoop Earrings',
  'Gold Triangle Stud Earrings',
  'Rose Gold Diamond Ring',
  'Rose Gold Pendant Necklace',
  'Princess Diamond Ring',
  'Butterfly Stud Earrings',
  'Swirl Diamond Ring',
  'Gold Bar Drop Earrings',
  'Gold Oval Hoop Earrings',
  'Pearl Bracelet',
  'Diamond Tennis Bracelet'
);
```

### Test Orders to Remove
Run this query to see them:
```sql
SELECT 
  o.order_number,
  o.created_at,
  u.email,
  o.status,
  o.payment_status,
  o.total_amount
FROM orders o
LEFT JOIN auth.users u ON o.user_id = u.id
WHERE u.email IN (
  'sreshtha.form131@gmail.com',
  'sreshtha.mechlin@gmail.com',
  'priya@example.com',
  'ajay@example.com',
  'sneha@example.com'
)
ORDER BY o.created_at DESC;
```

---

## 📄 Migration Files (For Reference Only)

| File | Lines | Content | Action |
|------|-------|---------|--------|
| `migrations/supabase-setup.sql` | 36-48 | Sample product INSERT statements | No action needed (already in DB) |
| `migrations/add-metal-rates-table.sql` | 35-39 | Seed metal rates | No action needed (already in DB) |

**Note:** Don't edit migration files. Use the cleanup SQL script or Admin Dashboard instead.

---

## 🔧 Configuration Files

| File | Lines | Content | Action |
|------|-------|---------|--------|
| `backend/.env` | 6 | `ALLOWED_ADMIN_EMAILS` | Update with real admin emails |
| `backend/.env` | 8-10 | Razorpay credentials | Verify production keys when going live |
| `frontend/.env` | 1 | `VITE_API_BASE_URL` | Update for production deployment |

---

## 📊 Summary by Priority

### 🔴 CRITICAL (Do First)
1. **Database Products** - Delete 12 sample products
2. **Database Orders** - Delete test orders from dummy emails
3. **Database Customers** - Delete test customer accounts
4. **Database Metal Rates** - Update to current prices
5. **Add Real Products** - Via Admin Dashboard

### 🟡 IMPORTANT (Before Launch)
6. **Hero Image** - `frontend/src/components/Hero.jsx:9`
7. **Home Banners** - `frontend/src/pages/Home.jsx:20,26,39`
8. **Get Inspired** - `frontend/src/components/GetInspired.jsx:3-6`
9. **Admin Emails** - `backend/.env:6`
10. **Payment Keys** - `backend/.env:8-10` (verify production)

### 🟢 POLISH (Can Wait)
11. **Testimonials** - `frontend/src/components/Testimonials.jsx:4-35`
12. **Category Image** - `frontend/src/components/ShopByCategory.jsx:43`

---

## 🚀 Quick Start Commands

### Find all Unsplash URLs:
```bash
cd frontend/src
grep -rn "unsplash.com" .
```

### Count Unsplash occurrences:
```bash
grep -r "unsplash.com" frontend/src | wc -l
```

### Check database products:
```sql
-- In Supabase SQL Editor
SELECT COUNT(*) FROM products WHERE image_url LIKE '%unsplash.com%';
```

### Check test orders and customers:
```sql
-- Count test orders
SELECT COUNT(*) as test_order_count
FROM orders o
LEFT JOIN auth.users u ON o.user_id = u.id
WHERE u.email LIKE '%@example.com%' 
   OR u.email LIKE '%test%'
   OR u.email LIKE '%form131%'
   OR u.email LIKE '%mechlin%';

-- List test orders
SELECT o.order_number, u.email, o.total_amount, o.status
FROM orders o
LEFT JOIN auth.users u ON o.user_id = u.id
WHERE u.email IN (
  'sreshtha.form131@gmail.com',
  'sreshtha.mechlin@gmail.com',
  'priya@example.com',
  'ajay@example.com',
  'sneha@example.com'
);
```

---

## 📝 File List for Editing

Copy this list to track which files you've updated:

```
☐ frontend/src/components/Testimonials.jsx
☐ frontend/src/components/Hero.jsx
☐ frontend/src/pages/Home.jsx
☐ frontend/src/components/GetInspired.jsx
☐ frontend/src/components/ShopByCategory.jsx
☐ backend/.env
☐ frontend/.env
☐ Supabase Database - Products (via SQL cleanup script)
☐ Supabase Database - Orders & Customers (via SQL cleanup script)
☐ Supabase Auth - Delete test users manually
```

---

## 🔍 Verification Commands

After making changes, verify cleanup:

```bash
# Should return 0 results
grep -r "unsplash.com" frontend/src

# Should return 0 results
grep -r "Sarah M\.\|Jessica T\.\|Emily R\." frontend/src
```

```sql
-- Should return 0
SELECT COUNT(*) FROM products WHERE image_url LIKE '%unsplash.com%';

-- Should not show 'manual_seed'
SELECT source FROM metal_rates;
```

---

**Last Updated:** February 24, 2026
