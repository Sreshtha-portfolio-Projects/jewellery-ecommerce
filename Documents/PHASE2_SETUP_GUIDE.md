# Phase 2 Implementation - Setup Guide

This guide explains how to complete the setup for Returns & Refunds and Invoice PDF Generation features.

## ✅ Completed Tasks

### 1. Returns Link Added to Admin Navigation
- **Location**: `frontend/src/layouts/AdminLayout.jsx`
- **Status**: ✅ Complete
- The Returns menu item has been added to the admin sidebar navigation with icon 🔄

### 2. Return Window Configuration
- **Location**: Admin Settings → Returns category
- **Status**: ✅ Complete
- **Migration**: `migrations/add-returns-invoice-settings.sql`
- **Setting Key**: `return_window_days`
- **Default Value**: 7 days
- **Type**: Number

### 3. Invoice Seller Details Configuration
- **Location**: Admin Settings → Invoice category
- **Status**: ✅ Complete
- **Migration**: `migrations/add-returns-invoice-settings.sql`
- **Settings Available**:
  - `seller_name` - Business name (default: "Aldorado Jewells")
  - `seller_address` - Business address
  - `seller_gstin` - GSTIN number
  - `seller_phone` - Business phone number
  - `seller_email` - Business email

## 📋 Setup Instructions

### Step 1: Run Database Migrations

Run the following migrations in order:

1. **Returns & Refunds System** (if not already run):
   ```sql
   -- Run: migrations/add-returns-refunds-system.sql
   ```

2. **Returns & Invoice Settings**:
   ```sql
   -- Run: migrations/add-returns-invoice-settings.sql
   ```

### Step 2: Create Supabase Storage Bucket

Create a storage bucket named `invoices` in Supabase:

1. Go to Supabase Dashboard → Storage
2. Click "New bucket"
3. Name: `invoices`
4. Make it **public** (or configure RLS policies as needed)
5. Click "Create bucket"

### Step 3: Configure Settings

1. **Login to Admin Panel**: Navigate to `/admin/login`

2. **Configure Return Window**:
   - Go to Settings → Returns category
   - Find "Return Window Days"
   - Set your desired number of days (default: 7)
   - Click "Save"

3. **Configure Invoice Seller Details**:
   - Go to Settings → Invoice category
   - Update the following fields:
     - **Seller Name**: Your business name
     - **Seller Address**: Your complete business address
     - **Seller Gstin**: Your GSTIN number
     - **Seller Phone**: Your business phone number
     - **Seller Email**: Your business email
   - Click "Save" for each field

## 🎯 How It Works

### Returns System
- Users can request returns only for **DELIVERED** orders
- Return window is checked against the configured `return_window_days` setting
- The system fetches the return window from `admin_settings` table dynamically
- Admin can approve/reject returns and manage the refund process

### Invoice Generation
- Invoices are automatically generated when a shipment is created
- Seller details are fetched from `admin_settings` table each time an invoice is generated
- PDFs are stored in Supabase Storage bucket `invoices`
- Invoice metadata (ID, URL, created date) is stored in the `orders` table
- Invoices are immutable - once generated, they are never regenerated

## 🔧 Technical Details

### Return Window Logic
- **File**: `backend/src/controllers/returnController.js`
- The system queries `admin_settings` for `return_window_days`
- Falls back to 7 days if setting not found
- Calculates days since order creation (not delivery date)

### Invoice Seller Details
- **File**: `backend/src/services/invoiceService.js`
- Seller details are fetched from `admin_settings` before PDF generation
- Values are merged into the order object for PDF rendering
- Falls back to defaults if settings not found

## 📝 Notes

1. **Return Window Calculation**: Currently uses order creation date. You may want to update this to use delivery date instead for more accurate calculation.

2. **Invoice Storage**: Ensure the `invoices` bucket has proper RLS policies if you want to restrict access. Currently configured for public access.

3. **Settings Updates**: Changes to settings take effect immediately for new invoices/returns. Existing invoices are not regenerated.

4. **Default Values**: All settings have sensible defaults, so the system works even if settings are not configured.

## 🚀 Testing

1. **Test Return Window**:
   - Create a test order
   - Mark it as delivered
   - Try requesting a return
   - Adjust return window in settings and test again

2. **Test Invoice Generation**:
   - Create a shipment for a paid order
   - Check that invoice is generated automatically
   - Download invoice and verify seller details match settings
   - Update seller details in settings
   - Create another shipment and verify new details appear

3. **Test Settings UI**:
   - Navigate to Admin → Settings
   - Verify "Returns" and "Invoice" categories appear
   - Update settings and verify they save correctly

## ❓ Troubleshooting

**Issue**: Returns link not showing in admin menu
- **Solution**: Clear browser cache and refresh. Verify `AdminLayout.jsx` has the Returns menu item.

**Issue**: Return window not working
- **Solution**: Verify migration `add-returns-invoice-settings.sql` was run and `return_window_days` exists in `admin_settings` table.

**Issue**: Invoice seller details not updating
- **Solution**: Verify settings are saved in `admin_settings` table. Check that invoice service is fetching settings correctly.

**Issue**: Invoice PDF not generating
- **Solution**: Verify `invoices` bucket exists in Supabase Storage. Check backend logs for errors.

---

**All features are now fully configured and ready to use!** 🎉
