# Product Mapping & Admin Product Management Guide

## 🔍 Understanding the Issue: Why Admin Shows "No Products Found"

### The Problem

Your **frontend (customer-facing)** shows products, but the **admin panel** shows "No products found". This happens because:

1. **Different API Endpoints**:
   - **Frontend (Public)**: Uses `/api/products` - No authentication required, shows ALL products
   - **Admin Panel**: Uses `/api/admin/products` - Requires admin authentication + admin role

2. **Different Query Logic**:
   - **Public endpoint**: Simple query, no filters by default
   - **Admin endpoint**: Uses pagination, can filter by `is_active` status, calculates stock from variants

3. **Authentication Issues**:
   - Admin endpoint requires valid JWT token with admin role
   - If authentication fails, you get empty results or 403 error

## 📊 How Product Mapping Works

### Database Structure

```
products (main table)
├── id (UUID)
├── name
├── category (rings, earrings, necklaces, bracelets)
├── base_price
├── is_active (boolean) ← Important!
└── ...

product_variants (variants table)
├── id (UUID)
├── product_id (FK to products)
├── size, color, finish
├── stock_quantity ← Stock is stored here!
├── price_override
└── ...

product_images (images table)
├── id (UUID)
├── product_id (FK to products)
├── image_url
├── is_primary
└── ...
```

### Stock Calculation

- **Stock is stored at variant level**, not product level
- Admin panel calculates `total_stock` by summing all variant stocks
- If a product has no variants, stock shows as `0`

## 🔧 How to Fix "No Products Found" in Admin

### Step 1: Check Authentication

1. **Verify you're logged in as admin**:
   - Go to `/admin/login`
   - Login with an admin account
   - Check browser console for errors

2. **Check if admin token exists**:
   - Open browser DevTools (F12)
   - Go to Application/Storage → Local Storage
   - Look for `adminToken` key
   - If missing, login again

3. **Verify admin role**:
   - Your email must be in `ALLOWED_ADMIN_EMAILS` env variable
   - OR your account must have `role="admin"` in user metadata
   - OR your email must contain "admin"

### Step 2: Check Filters

The admin panel has filters that might hide products:

1. **Status Filter**: 
   - If set to "Active", only shows products where `is_active = true`
   - If your products have `is_active = false` or `null`, they won't show
   - **Solution**: Set filter to "All Status" or ensure products are active

2. **Category Filter**:
   - If set to a specific category, only shows products in that category
   - **Solution**: Set to "All Categories"

3. **Search Filter**:
   - If you have a search term, it filters products
   - **Solution**: Clear the search field

### Step 3: Check Browser Console

1. Open DevTools (F12) → Console tab
2. Look for errors like:
   - `401 Unauthorized` → Authentication issue
   - `403 Forbidden` → Admin role issue
   - `500 Internal Server Error` → Backend issue
3. Check Network tab → Look at the `/api/admin/products` request:
   - Status code should be `200`
   - Response should contain `{ products: [...], pagination: {...} }`

## ➕ How to Add a Product

### Method 1: Using Admin Panel (Recommended)

1. **Navigate to Product Form**:
   - Go to Admin Panel → Products
   - Click **"+ Add Product"** button
   - OR navigate to `/admin/products/new`

2. **Fill Basic Information**:
   - **Name*** (required): Product name
   - **Category*** (required): Select from dropdown (rings, earrings, necklaces, bracelets)
   - **Base Price*** (required): Price in ₹ (INR)
   - **Metal Type**: Gold, Silver, Diamond, Platinum
   - **Purity**: e.g., "18K", "22K", "925"
   - **Karat**: Number (e.g., 18, 22)
   - **Description**: Full product description
   - **Short Description**: Brief description
   - **Active**: Checkbox (must be checked for product to show)
   - **Bestseller**: Checkbox (optional)

3. **Add Variants** (Optional but Recommended):
   - Click **"+ Add Variant"**
   - Fill in:
     - **Size**: e.g., "6", "7", "8"
     - **Color**: e.g., "Gold", "Rose Gold"
     - **Finish**: e.g., "Polished", "Matte"
     - **Weight**: Weight in grams
     - **Stock**: Stock quantity (IMPORTANT!)
     - **SKU**: Stock keeping unit
     - **Price Override**: Leave empty to use base price
   - Add multiple variants for different sizes/colors

4. **Add Images**:
   - Click **"📤 Upload File"** to upload from computer
   - OR click **"+ Add URL"** to add image URL
   - First image becomes primary automatically
   - You can reorder images with ↑ ↓ buttons

5. **Save Product**:
   - Click **"Create Product"** button
   - Product will be created and you'll be redirected to edit page

### Method 2: Using API Directly

```bash
POST http://localhost:3000/api/admin/products
Authorization: Bearer YOUR_ADMIN_TOKEN
Content-Type: application/json

{
  "name": "Solitaire Diamond Ring",
  "category": "rings",
  "base_price": 50000,
  "description": "Beautiful solitaire diamond ring",
  "metal_type": "Gold",
  "purity": "18K",
  "karat": 18,
  "is_active": true,
  "variants": [
    {
      "size": "6",
      "color": "Gold",
      "stock_quantity": 10,
      "price_override": null
    }
  ],
  "images": [
    {
      "image_url": "https://example.com/ring.jpg",
      "is_primary": true
    }
  ]
}
```

## 📍 Where Products Will Be Seen

### 1. **Admin Panel** (`/admin/products`)
- Shows all products (with filters)
- Displays: Image, Name, Category, Price, Stock, Variants count, Status
- Allows: Edit, Delete, View details
- **Requirements**: Admin login + active status (if filter is set)

### 2. **Frontend Customer Pages**

#### Product Listing (`/products` or `/products/rings`)
- Shows all **active** products (`is_active = true`)
- Grouped by category
- Shows product name, price, image
- **Requirements**: Product must have `is_active = true`

#### Product Detail Page (`/products/:id`)
- Shows full product details
- Shows variants (if any)
- Shows all images
- Allows adding to cart
- **Requirements**: Product must exist and be active

#### Homepage/Bestseller Section
- Shows products where `is_bestseller = true`
- **Requirements**: `is_active = true` AND `is_bestseller = true`

### 3. **Search Results** (`/products?search=ring`)
- Shows products matching search term
- Searches in: name, description, category
- **Requirements**: Product must be active

## 🔍 Troubleshooting Common Issues

### Issue 1: Products show in frontend but not admin

**Possible Causes**:
- Authentication token missing or expired
- Admin role not set correctly
- Filter set to "Active" but products are inactive
- Pagination issue (products on different page)

**Solutions**:
1. Logout and login again as admin
2. Check `ALLOWED_ADMIN_EMAILS` in `.env`
3. Clear all filters (set to "All Status", "All Categories")
4. Check pagination (go to page 1)

### Issue 2: Stock shows as 0 but variants have stock

**Cause**: Stock is calculated from variants. If product has no variants, stock = 0

**Solution**: Add variants with stock quantities

### Issue 3: Product shows in admin but not frontend

**Cause**: Product has `is_active = false`

**Solution**: 
1. Go to admin panel
2. Edit the product
3. Check the "Active" checkbox
4. Save

### Issue 4: Can't add product - 403 Forbidden

**Cause**: Not logged in as admin or admin role not set

**Solution**:
1. Verify you're logged in at `/admin/login`
2. Check your email is in `ALLOWED_ADMIN_EMAILS`
3. Check browser console for specific error

## 📝 Quick Checklist

Before adding products, ensure:
- [ ] You're logged in as admin
- [ ] `ALLOWED_ADMIN_EMAILS` includes your email (or email contains "admin")
- [ ] Backend server is running
- [ ] Database connection is working

When adding products:
- [ ] Fill required fields (name, category, base_price)
- [ ] Set `is_active = true` if you want it visible on frontend
- [ ] Add at least one variant with stock quantity
- [ ] Add at least one image
- [ ] Save product

After adding products:
- [ ] Check admin panel - should see product in list
- [ ] Check frontend - should see product if `is_active = true`
- [ ] Verify stock shows correctly (sum of variant stocks)
- [ ] Test product detail page

## 🎯 Summary

**Key Points**:
1. **Admin endpoint** (`/api/admin/products`) requires authentication + admin role
2. **Public endpoint** (`/api/products`) shows all products (no auth needed)
3. **Stock** is stored in variants, not products
4. **Active status** controls visibility on frontend
5. **Filters** in admin panel can hide products

**To add products**:
- Use Admin Panel → Products → "+ Add Product"
- Fill required fields
- Add variants with stock
- Add images
- Ensure "Active" is checked
- Save

**Where products appear**:
- **Admin Panel**: All products (with filters)
- **Frontend**: Only active products (`is_active = true`)

