# Setup Guide

This guide provides step-by-step instructions for setting up the Aldorado Jewells platform from scratch.

## Prerequisites

Before starting, ensure you have:

- **Node.js** v18 or higher - [Download](https://nodejs.org/)
- **npm** (comes with Node.js)
- **Git** (for cloning repository)
- **Supabase Account** - [Sign up](https://supabase.com) (free tier works)
- **Razorpay Account** - [Sign up](https://razorpay.com) (for payments)

Verify installations:
```bash
node --version  # Should be v18.x.x or higher
npm --version   # Should be 9.x.x or higher
```

## Step 1: Clone Repository

```bash
git clone <repository-url>
cd jewellery-ecommerce
```

## Step 2: Supabase Setup

### 2.1 Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in/sign up
2. Click **"New Project"**
3. Fill in:
   - **Name**: Your project name
   - **Database Password**: Create a strong password (save it!)
   - **Region**: Choose closest to you
4. Click **"Create new project"**
5. Wait 2-3 minutes for project to initialize

### 2.2 Run Database Migrations

1. In Supabase Dashboard, go to **SQL Editor**
2. Run migrations **in this order**:

   - `migrations/supabase-setup.sql`
   - `migrations/supabase-schema-extensions.sql`
   - `migrations/supabase-product-variants-pricing.sql`
   - `migrations/supabase-product-features-extensions.sql`
   - `migrations/supabase-order-intent-inventory.sql`
   - `migrations/supabase-payment-shipping-extensions.sql`
   - `migrations/add-razorpay-order-id-to-intents.sql`
   - `migrations/add-state-machine-configs.sql`
   - `migrations/ensure-audit-logs-immutable.sql`
   - `migrations/supabase-admin-roles.sql`
   - `migrations/improve-sku-management.sql`
   - `migrations/add-returns-refunds-system.sql`
   - `migrations/add-shipping-state-machine.sql`
   - `migrations/add-delivery-days-settings.sql`
   - `migrations/add-category-product-delivery-zones.sql`

3. For each migration:
   - Click **"New query"**
   - Copy entire contents of migration file
   - Paste into SQL Editor
   - Click **"Run"**
   - Verify "Success" message

### 2.3 Get Supabase Credentials

1. Go to **Settings** → **API**
2. Copy:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **Service Role Key**: The `service_role` key (NOT the `anon` key)
     - Look for key labeled "service_role" (usually with warning icon)
     - This key bypasses RLS and has admin access
     - Keep it secret - never commit to git

### 2.4 Create Admin User

1. Go to **Authentication** → **Users**
2. Click **"Add user"** → **"Create new user"**
3. Fill in:
   - **Email**: Your admin email
   - **Password**: Strong password
   - **Auto Confirm User**: Check this box
4. Click **"Create user"**
5. **Note the user ID** (UUID) - you'll need it for admin role

### 2.5 Grant Admin Role

1. Go to **SQL Editor**
2. Run this SQL (replace `USER_ID_HERE` with actual user UUID):

```sql
INSERT INTO user_roles (user_id, role, notes)
VALUES ('USER_ID_HERE', 'admin', 'Initial admin user');
```

### 2.6 Set Up Storage (for Product Images)

1. Go to **Storage** in Supabase Dashboard
2. Click **"New bucket"**
3. Create bucket named: `product-images`
4. Set as **Public bucket**
5. Click **"Create bucket"**
6. Run this SQL in SQL Editor to set up policies:

```sql
-- Allow public read access
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'product-images');

-- Allow authenticated users to upload
CREATE POLICY "Authenticated users can upload"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'product-images' 
  AND auth.role() = 'authenticated'
);

-- Allow authenticated users to update
CREATE POLICY "Authenticated users can update"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'product-images' 
  AND auth.role() = 'authenticated'
);

-- Allow authenticated users to delete
CREATE POLICY "Authenticated users can delete"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'product-images' 
  AND auth.role() = 'authenticated'
);
```

## Step 3: Backend Setup

### 3.1 Install Dependencies

```bash
cd backend
npm install
```

This installs:
- Express, Supabase client, JWT, Razorpay SDK
- Swagger for API documentation
- Other required packages

### 3.2 Configure Environment Variables

1. Create `.env` file in `backend/` directory:

```bash
# Windows PowerShell
New-Item -Path .env -ItemType File

# Linux/Mac
touch .env
```

2. Add these variables to `backend/.env`:

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# JWT Configuration
JWT_SECRET=your-secret-jwt-key-min-32-characters-long-and-random

# Admin Configuration (Optional - Legacy)
ALLOWED_ADMIN_EMAILS=admin@example.com

# Razorpay Configuration (Test Mode)
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxx
RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxxxxxxx
RAZORPAY_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:5173
```

**Generate JWT Secret**:
```bash
# Windows PowerShell
-join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | % {[char]$_})

# Linux/Mac
openssl rand -base64 32

# Or use Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

**Important**:
- Replace `your-project.supabase.co` with your actual Supabase URL
- Replace `your-service-role-key-here` with your actual service role key
- Use a strong random string for `JWT_SECRET` (min 32 characters)
- For Razorpay, get test keys from Razorpay Dashboard (see Step 5)

### 3.3 Verify Environment Setup

```bash
cd backend
node check-env.js
```

Should show all variables as set.

### 3.4 Start Backend Server

```bash
npm run dev
```

You should see:
```
Server is running on port 3000
Environment: development
```

**Test backend**:
- Open browser: `http://localhost:3000/health`
- Should see: `{"status":"ok","message":"Server is running"}`
- API docs: `http://localhost:3000/api-docs`

## Step 4: Frontend Setup

### 4.1 Install Dependencies

Open a **NEW terminal window**:

```bash
cd frontend
npm install
```

This installs:
- React, Vite, Tailwind CSS
- React Router, Axios
- Razorpay SDK, Recharts

### 4.2 Configure Environment Variables

1. Create `.env` file in `frontend/` directory:

```bash
# Windows PowerShell
New-Item -Path .env -ItemType File

# Linux/Mac
touch .env
```

2. Add this variable to `frontend/.env`:

```env
VITE_API_BASE_URL=http://localhost:3000
```

For production, update to your production backend URL.

### 4.3 Start Frontend Server

```bash
npm run dev
```

You should see:
```
  VITE v7.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
```

**Open in browser**: `http://localhost:5173`

## Step 5: Razorpay Setup (Optional - for Payments)

### 5.1 Create Razorpay Account

1. Go to [razorpay.com](https://razorpay.com)
2. Sign up for account
3. Complete basic setup

### 5.2 Get Test API Keys

1. Go to Razorpay Dashboard → **Settings** → **API Keys**
2. You'll see Test Mode keys (default):
   - **Key ID**: Starts with `rzp_test_...`
   - **Key Secret**: Long string (click "Reveal" to see)
3. Copy both keys

### 5.3 Add Keys to Backend

Update `backend/.env`:

```env
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxx
RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxxxxxxx
```

### 5.4 Set Up Webhook (for Local Testing)

For local development, you need a tunnel (Razorpay can't hit localhost):

**Using ngrok**:
```bash
# Install ngrok: https://ngrok.com/download
ngrok http 3000
```

Copy the HTTPS URL (e.g., `https://abc123.ngrok.io`)

**Configure in Razorpay**:
1. Go to Razorpay Dashboard → **Settings** → **Webhooks**
2. Click **"Add New Webhook"**
3. Enter URL: `https://your-ngrok-url.ngrok.io/api/payments/webhook`
4. Select events: `payment.captured`, `payment.failed`
5. Copy the **Webhook Secret** (starts with `whsec_...`)

**Add to backend `.env`**:
```env
RAZORPAY_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
```

**Note**: Free ngrok URLs change on restart. Update webhook URL in Razorpay dashboard each time.

For production, use your production backend URL directly (no tunnel needed).

## Step 6: Verify Setup

### 6.1 Test Homepage

1. Visit: `http://localhost:5173`
2. Should see luxury jewelry homepage
3. Products may be empty initially (add products via admin panel)

### 6.2 Test Admin Login

1. Visit: `http://localhost:5173/admin/login`
2. Enter admin email and password (from Step 2.4)
3. Should redirect to admin dashboard
4. Dashboard should show:
   - Admin Authenticated (green checkmark)
   - API Connection Status: ok (green checkmark)

### 6.3 Test API Connection

1. Visit: `http://localhost:3000/api-docs`
2. Should see Swagger UI with all API endpoints
3. Test health endpoint: `http://localhost:3000/health`
4. Should return: `{"status":"ok"}`

### 6.4 Test Product Creation

1. Login to admin panel
2. Go to Products → Add Product
3. Fill in product details
4. Add variant with stock
5. Upload image
6. Save product
7. Verify product appears in admin list
8. Verify product appears on frontend (if `is_active = true`)

## Troubleshooting

### Backend Issues

**Port 3000 already in use**:
- Change `PORT=3001` in `backend/.env`
- Update `VITE_API_BASE_URL` in `frontend/.env` accordingly

**Supabase connection error**:
- Verify `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are correct
- Make sure you're using **service_role** key, not anon key
- Check Supabase project is active (not paused)

**JWT errors**:
- Make sure `JWT_SECRET` is set and at least 32 characters
- Restart backend after changing `.env`

**Routes not working**:
- Run `node verify-routes.js` to check route registration
- Check server console for errors
- Verify all controller files export correctly

### Frontend Issues

**Can't connect to backend**:
- Verify backend is running on port 3000
- Check `VITE_API_BASE_URL` in `frontend/.env`
- Check browser console for CORS errors
- Verify backend CORS is configured

**No products showing**:
- Check backend console for errors
- Verify products exist in Supabase (Table Editor → products)
- Verify products have `is_active = true`
- Test API directly: `http://localhost:3000/api/products`

**Login fails**:
- Verify user exists in Supabase Authentication → Users
- Check backend console for error messages
- Verify email/password are correct
- Make sure user is confirmed

**Admin panel shows "No products found"**:
- Verify you're logged in as admin
- Check admin token exists in localStorage
- Clear filters (set to "All Status", "All Categories")
- Check browser console for 401/403 errors

### Database Issues

**Migrations fail**:
- Run migrations one at a time
- Check for error messages in SQL Editor
- Verify previous migrations completed successfully
- Some migrations depend on previous ones

**Products table doesn't exist**:
- Re-run `supabase-setup.sql` in SQL Editor
- Check for error messages

**RLS blocking queries**:
- Backend uses service_role key, so RLS is bypassed
- If issues persist, check RLS policies in Supabase Dashboard

## Next Steps

After setup is complete:

1. **Add Products**: Use admin panel to add products with variants and images
2. **Configure Settings**: Set tax, shipping, return window via admin settings
3. **Test Payment Flow**: Use Razorpay test cards to test checkout
4. **Review Documentation**: Read through [Core Flows](core-flows.md) and [Admin Operations](admin-operations.md)

## Quick Reference

### Most Common Commands

```bash
# Backend
cd backend && npm install && npm run dev

# Frontend
cd frontend && npm install && npm run dev

# Both (in separate terminals)
cd backend && npm run dev  # Terminal 1
cd frontend && npm run dev # Terminal 2
```

### Environment Files

**Backend** (`backend/.env`):
- Supabase URL and service role key
- JWT secret
- Razorpay keys (if using payments)
- Port and environment

**Frontend** (`frontend/.env`):
- Backend API URL

### Important URLs

- **Frontend**: `http://localhost:5173`
- **Backend API**: `http://localhost:3000`
- **API Docs**: `http://localhost:3000/api-docs`
- **Health Check**: `http://localhost:3000/health`
- **Admin Login**: `http://localhost:5173/admin/login`

## Additional Resources

- **Main README**: `README.md` in project root
- **Deployment Guide**: `Documents/DEPLOYMENT_GUIDE.md`
- **Razorpay Setup**: `Documents/RAZORPAY_QUICK_SETUP.md`
- **NPM Commands**: `Documents/NPM_SETUP_GUIDE.md`
- **Environment Setup**: `Documents/ENVIRONMENT_SETUP_GUIDE.md`

