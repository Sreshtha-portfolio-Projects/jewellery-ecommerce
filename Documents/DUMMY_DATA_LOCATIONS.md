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
| **metal_rates** | Supabase Database | Placeholder gold/silver rates marked 'manual_seed' | Update via Admin Dashboard |

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
2. **Database Metal Rates** - Update to current prices
3. **Add Real Products** - Via Admin Dashboard

### 🟡 IMPORTANT (Before Launch)
4. **Hero Image** - `frontend/src/components/Hero.jsx:9`
5. **Home Banners** - `frontend/src/pages/Home.jsx:20,26,39`
6. **Get Inspired** - `frontend/src/components/GetInspired.jsx:3-6`
7. **Admin Emails** - `backend/.env:6`
8. **Payment Keys** - `backend/.env:8-10` (verify production)

### 🟢 POLISH (Can Wait)
9. **Testimonials** - `frontend/src/components/Testimonials.jsx:4-35`
10. **Category Image** - `frontend/src/components/ShopByCategory.jsx:43`

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
☐ Supabase Database (via SQL cleanup script)
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
