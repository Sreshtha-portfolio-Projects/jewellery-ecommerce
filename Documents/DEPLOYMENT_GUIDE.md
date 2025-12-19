# Deployment Guide - Vercel & Render

This guide walks you through deploying your jewellery e-commerce platform step-by-step, starting with basic deployment on Vercel (frontend) and Render (backend), then adding webhooks, Cloudflare, and other integrations.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Phase 1: Initial Deployment](#phase-1-initial-deployment)
   - [1.1 Deploy Backend to Render](#11-deploy-backend-to-render)
   - [1.2 Deploy Frontend to Vercel](#12-deploy-frontend-to-vercel)
   - [1.3 Test Basic Deployment](#13-test-basic-deployment)
3. [Phase 2: Webhooks & Integrations](#phase-2-webhooks--integrations)
   - [2.1 Configure Razorpay Webhooks](#21-configure-razorpay-webhooks)
   - [2.2 Set Up Cloudflare (Optional)](#22-set-up-cloudflare-optional)
   - [2.3 Configure Custom Domains](#23-configure-custom-domains)
4. [Troubleshooting](#troubleshooting)
5. [Post-Deployment Checklist](#post-deployment-checklist)

---

## Prerequisites

Before starting, ensure you have:

- **GitHub Account** - Your code should be in a GitHub repository
- **Vercel Account** - Sign up at [vercel.com](https://vercel.com) (free tier works)
- **Render Account** - Sign up at [render.com](https://render.com) (free tier works)
- **Supabase Project** - Already set up with database migrations run
- **Razorpay Account** - Test mode credentials ready
- **Domain Names** (optional) - For custom domains - can be added later if needed

---

## Phase 1: Initial Deployment

This phase gets your application live on the internet with basic functionality. We'll deploy the backend first, then the frontend.

**Important**: The default URLs provided by Vercel (e.g., `your-project.vercel.app`) and Render (e.g., `your-backend.onrender.com`) work perfectly for all functionality including payments and webhooks. Custom domains are optional and can be added later if you want branded URLs.

### 1.1 Deploy Backend to Render

#### Step 1: Prepare Backend for Deployment

1. **Ensure your backend code is committed to GitHub:**
   ```bash
   git add .
   git commit -m "Prepare for deployment"
   git push origin main
   ```

2. **Verify your `backend/package.json` has a start script:**
   ```json
   {
     "scripts": {
       "start": "node src/server.js"
     }
   }
   ```
   This should already be in your `package.json`.

#### Step 2: Create Render Web Service

1. **Go to [Render Dashboard](https://dashboard.render.com)**
2. **Click "New +" → "Web Service"**
3. **Connect your GitHub repository** (if not already connected)
4. **Configure the service:**
   - **Name**: `jewellery-ecommerce-backend` (or your preferred name)
   - **Region**: Choose closest to your users (e.g., `Oregon (US West)` or `Singapore`)
   - **Branch**: `main` (or your default branch)
   - **Root Directory**: `backend`
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: 
     - **Free tier**: `Free` (512 MB RAM, spins down after 15 min inactivity)
     - **Paid tier**: `Starter` ($7/month, always on, 512 MB RAM) - Recommended for production

#### Step 3: Configure Environment Variables on Render

In the Render dashboard, go to **Environment** tab and add these variables:

```env
# Server Configuration
PORT=10000
NODE_ENV=production

# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# JWT Configuration
JWT_SECRET=your-production-jwt-secret-min-32-characters-long-and-random

# Admin Configuration (Optional - Legacy support)
# Note: Admin users are now managed via database (user_roles table)
# You can still use this for initial setup, but it's recommended to use the database method
ALLOWED_ADMIN_EMAILS=admin@yourdomain.com,another-admin@yourdomain.com

# Razorpay Configuration (Test Mode - we'll update to live later)
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxx
RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxxxxxxx
RAZORPAY_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx

# CORS Configuration (optional, for now)
FRONTEND_URL=https://your-frontend.vercel.app
```

**Important Notes:**
- **JWT_SECRET**: Generate a strong random secret for production:
  ```bash
  # On Linux/Mac
  openssl rand -base64 32
  
  # On Windows PowerShell
  -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | % {[char]$_})
  ```
- **PORT**: Render automatically sets `PORT`, but you can use `10000` as default
- **RAZORPAY_WEBHOOK_SECRET**: Leave this for now, we'll configure webhooks in Phase 2
- **ALLOWED_ADMIN_EMAILS**: Optional - Admin users are now managed via database. See "Setting Up Your First Admin" section below.

#### Step 4: Deploy Backend

1. **Click "Create Web Service"**
2. **Wait for deployment** (usually 2-5 minutes)
3. **Check deployment logs** for any errors
4. **Note your backend URL**: `https://jewellery-ecommerce-backend.onrender.com` (or your custom name)

#### Step 5: Test Backend Deployment

1. **Visit your backend health endpoint:**
   ```
   https://your-backend-name.onrender.com/health
   ```
   Should return: `{"status":"ok","message":"Server is running"}`

2. **Test API documentation:**
   ```
   https://your-backend-name.onrender.com/api-docs
   ```
   Should show Swagger UI.

**Backend is deployed!** Save your backend URL - you'll need it for frontend configuration.

**Important**: The admin panel is part of the frontend application, so it will be deployed automatically when you deploy the frontend. No separate deployment is needed.

**Important: Run Admin Roles Migration**

Before you can access the admin panel, you need to run the admin roles migration:

1. Go to **Supabase Dashboard → SQL Editor**
2. Run the migration: `migrations/supabase-admin-roles.sql`
3. This creates the `user_roles` table for managing admin users

**Note**: If you haven't run this migration yet, do it now. The admin panel won't work without it.

---

### 1.2 Deploy Frontend to Vercel

#### Step 1: Prepare Frontend for Deployment

1. **Ensure your frontend code is committed to GitHub** (same repository)

2. **Verify your `frontend/package.json` has a build script:**
   ```json
   {
     "scripts": {
       "build": "vite build"
     }
   }
   ```
   This should already be in your `package.json`.

#### Step 2: Create Vercel Project

1. **Go to [Vercel Dashboard](https://vercel.com/dashboard)**
2. **Click "Add New..." → "Project"**
3. **Import your GitHub repository**
4. **Configure the project:**
   - **Framework Preset**: `Vite`
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build` (auto-detected)
   - **Output Directory**: `dist` (auto-detected)
   - **Install Command**: `npm install`

#### Step 3: Configure Environment Variables on Vercel

In the Vercel project settings, go to **Settings → Environment Variables** and add:

```env
VITE_API_BASE_URL=https://your-backend-name.onrender.com
```

**Important:**
- Replace `your-backend-name.onrender.com` with your actual Render backend URL
- **No trailing slash** in the URL
- For production, you can add this to **Production** environment

#### Step 4: Deploy Frontend

1. **Click "Deploy"**
2. **Wait for deployment** (usually 1-3 minutes)
3. **Check deployment logs** for any errors
4. **Note your frontend URL**: `https://your-project-name.vercel.app`

**Your Admin Panel is Now Live**

The admin panel is automatically deployed as part of your frontend. Access it at:
- **Admin Login**: `https://your-project-name.vercel.app/admin/login`
- **Admin Dashboard**: `https://your-project-name.vercel.app/admin/dashboard` (after login)

**Admin Panel Features:**
- Dashboard with KPIs and analytics
- Product management (add, edit, delete, bulk operations)
- Order management
- Customer management
- Discount codes and pricing rules
- Abandoned cart recovery
- Settings and configuration

**To Access Admin Panel:**
1. Visit `https://your-project-name.vercel.app/admin/login`
2. Login with an admin account (see "Setting Up Your First Admin" below)
3. You'll be redirected to the admin dashboard

**Setting Up Your First Admin:**

After deployment, you need to create your first admin user. You have two options:

**Option 1: Using Supabase Dashboard (Recommended)**
1. Go to Supabase Dashboard → Authentication → Users
2. Create a new user or use an existing user
3. Note the user's ID (UUID)
4. Go to Supabase Dashboard → SQL Editor
5. Run this SQL (replace `USER_ID_HERE` with the actual user ID):
   ```sql
   INSERT INTO user_roles (user_id, role, notes)
   VALUES ('USER_ID_HERE', 'admin', 'Initial admin user');
   ```
6. Now you can login at `/admin/login` with that user's email and password

**Option 2: Using API (After first admin is created)**
1. First create an admin using Option 1
2. Login to admin panel
3. Go to Admin Settings → Users
4. Grant admin role to other users via the UI

**Note**: The `ALLOWED_ADMIN_EMAILS` environment variable still works for backward compatibility, but using the database method is recommended as it's more flexible and doesn't require redeployment to add/remove admins.

#### Step 5: Update Backend CORS (if needed)

**Good News**: The backend now automatically allows all `*.vercel.app` domains, so your Vercel frontend should work without additional configuration!

However, if you're using a custom domain or want to be explicit, you can set:

```env
FRONTEND_URL=https://your-project-name.vercel.app
```

Or for multiple frontend URLs (comma-separated):
```env
FRONTEND_URL=https://your-project-name.vercel.app,https://custom-domain.com
```

**If you're still getting CORS errors:**
1. Make sure you've deployed the latest backend code (with the updated CORS configuration)
2. Set `FRONTEND_URL` in Render environment variables if using custom domain
3. **Redeploy** the backend service on Render (click "Manual Deploy" → "Deploy latest commit")
4. Clear your browser cache and try again

**Note**: The backend automatically allows:
- All `*.vercel.app` domains (any Vercel deployment)
- Localhost in development
- Any origin specified in `FRONTEND_URL` environment variable

---

### 1.3 Test Basic Deployment

#### Test Checklist

1. **Frontend loads:**
   - Visit `https://your-project-name.vercel.app`
   - Should see your homepage

2. **API connection works:**
   - Try to register/login
   - Check browser console for API errors

3. **Backend health check:**
   - Visit `https://your-backend-name.onrender.com/health`
   - Should return `{"status":"ok"}`

4. **Authentication flow:**
   - Register a new user
   - Login with credentials
   - Should redirect to dashboard

5. **Product browsing:**
   - Browse products
   - View product details
   - Add items to cart

6. **Cart functionality:**
   - Add items to cart
   - Update quantities
   - Remove items

7. **Admin Panel access:**
   - Visit `https://your-project-name.vercel.app/admin/login`
   - Login with admin credentials (email must be in `ALLOWED_ADMIN_EMAILS`)
   - Should redirect to admin dashboard

**Important: **Note**: Payment won't work yet - we'll configure that in Phase 2.

---

## Phase 2: Webhooks & Integrations

Now that your app is live, let's add payment webhooks. Custom domains and Cloudflare are optional and can be added later if needed.

**Admin Panel URLs:**
- **Admin Login**: `https://your-project-name.vercel.app/admin/login`
- **Admin Dashboard**: `https://your-project-name.vercel.app/admin/dashboard`
- **Admin Products**: `https://your-project-name.vercel.app/admin/products`
- **Admin Orders**: `https://your-project-name.vercel.app/admin/orders`
- **Admin Analytics**: `https://your-project-name.vercel.app/admin/analytics`
- **Admin Settings**: `https://your-project-name.vercel.app/admin/settings`

All admin routes are protected and require authentication with an admin email.

### 2.1 Configure Razorpay Webhooks

**Important**: You can use the default Render URL for webhooks. Custom domains are optional and can be added later.

#### Step 1: Get Your Backend Webhook URL

Your webhook endpoint uses your Render backend URL:
```
https://your-backend-name.onrender.com/api/payments/webhook
```

**Example**: If your Render service is named `jewellery-ecommerce-backend`, your webhook URL would be:
```
https://jewellery-ecommerce-backend.onrender.com/api/payments/webhook
```

#### Step 2: Configure Webhook in Razorpay Dashboard

1. **Go to [Razorpay Dashboard](https://dashboard.razorpay.com)**
2. **Settings → Webhooks**
3. **Click "Add New Webhook"**
4. **Configure:**
   - **URL**: `https://your-backend-name.onrender.com/api/payments/webhook`
     - Replace `your-backend-name` with your actual Render service name
     - Example: `https://jewellery-ecommerce-backend.onrender.com/api/payments/webhook`
   - **Active Events**: Select these events:
     - `payment.captured` (when payment succeeds)
     - `payment.failed` (when payment fails)
     - `order.paid` (optional, for additional verification)
   - **Secret**: Razorpay will generate a secret - **copy this!**

#### Step 3: Update Backend Environment Variables

Go back to Render dashboard → Your backend service → **Environment** tab:

1. **Update `RAZORPAY_WEBHOOK_SECRET`:**
   ```env
   RAZORPAY_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
   ```
   (Use the secret from Razorpay dashboard)

2. **Redeploy backend:**
   - Click "Manual Deploy" → "Deploy latest commit"
   - Wait for deployment to complete

#### Step 4: Test Webhook (Optional)

1. **Make a test payment** through your frontend
2. **Check Razorpay Dashboard → Webhooks → Recent Deliveries**
3. **Check backend logs** on Render for webhook processing

**Webhooks configured!**

---

### 2.2 Configure Custom Domains (Optional)

**Note**: Custom domains are completely optional. You can use the default Vercel and Render URLs for all functionality including payments and webhooks. Only add custom domains if you want a branded URL.

If you want to use custom domains (e.g., `yourdomain.com` and `api.yourdomain.com`), follow these steps:

#### Frontend Domain (Vercel)

1. **In Vercel Dashboard:**
   - Go to your project → Settings → Domains
   - Add your domain: `yourdomain.com` or `www.yourdomain.com`

2. **Configure DNS:**
   - Add CNAME record pointing to Vercel (Vercel will provide exact value)
   - Or use Cloudflare (see below)

3. **Wait for SSL certificate** (automatic, usually 1-5 minutes)

#### Backend Domain (Render)

1. **In Render Dashboard:**
   - Go to your service → Settings → Custom Domain
   - Add domain: `api.yourdomain.com`

2. **Configure DNS:**
   - Add CNAME record: `api` → `your-backend-name.onrender.com`

3. **Update Environment Variables:**
   - Update `VITE_API_BASE_URL` in Vercel:
     ```env
     VITE_API_BASE_URL=https://api.yourdomain.com
     ```
   - Redeploy frontend

4. **Update Razorpay Webhook URL:**
   - Go to Razorpay Dashboard → Webhooks
   - Update webhook URL to: `https://api.yourdomain.com/api/payments/webhook`
   - Save changes

---

### 2.3 Set Up Cloudflare (Optional)

Cloudflare provides:
- **CDN** - Faster content delivery
- **DDoS Protection** - Security
- **SSL/TLS** - Free SSL certificates
- **Analytics** - Traffic insights

**Note**: Only needed if you're using custom domains. The default Vercel and Render URLs already have SSL/TLS.

#### Option A: Use Cloudflare for DNS Only

1. **Add your domain to Cloudflare:**
   - Sign up at [cloudflare.com](https://cloudflare.com)
   - Add your domain (e.g., `yourdomain.com`)
   - Update nameservers at your domain registrar

2. **Configure DNS records:**
   - **A Record**: `@` → Your Vercel IP (Vercel will provide this)
   - **CNAME Record**: `www` → `your-project.vercel.app`
   - **CNAME Record**: `api` → `your-backend-name.onrender.com`

3. **Update Vercel domain:**
   - In Vercel dashboard → Your project → Settings → Domains
   - Add your custom domain
   - Follow Vercel's instructions

4. **Update Render domain:**
   - In Render dashboard → Your service → Settings → Custom Domain
   - Add `api.yourdomain.com`
   - Update DNS CNAME record

#### Option B: Use Cloudflare as Proxy (Full Setup)

1. **Follow Option A steps above**

2. **Enable Cloudflare Proxy (Orange Cloud):**
   - In Cloudflare DNS settings, click the cloud icon to enable proxy
   - This routes traffic through Cloudflare's network

3. **Configure SSL/TLS:**
   - Go to SSL/TLS settings
   - Set to **"Full"** or **"Full (strict)"** mode

4. **Update Environment Variables:**
   - Update `VITE_API_BASE_URL` to use your custom domain:
     ```env
     VITE_API_BASE_URL=https://api.yourdomain.com
     ```
   - Redeploy frontend on Vercel

---

## Troubleshooting

### Backend Issues

**Problem: Backend shows "Service Unavailable"**
- Check Render logs for errors
- Verify environment variables are set correctly
- Check if free tier service spun down (wait 30 seconds for cold start)

**Problem: CORS errors**
- Verify `FRONTEND_URL` in backend environment variables matches your Vercel URL (e.g., `https://your-project-name.vercel.app`)
- Check backend `server.js` CORS configuration
- Make sure to include the full URL including `https://`

**Problem: Database connection errors**
- Verify `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are correct
- Check Supabase project is active
- Verify database migrations are run

### Frontend Issues

**Problem: Frontend shows blank page**
- ✅ Check browser console for errors
- ✅ Verify `VITE_API_BASE_URL` is set correctly
- ✅ Check Vercel build logs for build errors

**Problem: API calls fail**
- ✅ Verify backend URL is correct in `VITE_API_BASE_URL`
- ✅ Check backend is running (visit `/health` endpoint)
- ✅ Check CORS configuration on backend

### Payment/Webhook Issues

**Problem: Payment modal doesn't open**
- ✅ Check browser console for errors
- ✅ Verify Razorpay script is loading (check Network tab)
- ✅ Check `RAZORPAY_KEY_ID` is set correctly

**Problem: Webhooks not received**
- ✅ Verify webhook URL in Razorpay dashboard matches your Render backend URL (e.g., `https://your-backend-name.onrender.com/api/payments/webhook`)
- ✅ Check `RAZORPAY_WEBHOOK_SECRET` matches Razorpay dashboard
- ✅ Check Render logs for webhook requests
- ✅ Verify webhook events are enabled in Razorpay dashboard
- ✅ Ensure the webhook URL uses `https://` (not `http://`)

---

## Post-Deployment Checklist

### Security

- [ ] Change `JWT_SECRET` to a strong random value (not the development one)
- [ ] Verify `SUPABASE_SERVICE_ROLE_KEY` is the service role key (not anon key)
- [ ] Ensure `.env` files are in `.gitignore` (never commit secrets)
- [ ] Enable HTTPS/SSL on all domains (Vercel and Render provide this automatically)
- [ ] Review CORS settings (only allow your frontend domain - use your Vercel URL)

### Performance

- [ ] Enable Render auto-scaling (if on paid tier)
- [ ] Configure Vercel caching for static assets
- [ ] Set up Cloudflare CDN (optional - only if using custom domains)
- [ ] Monitor Render service uptime

### Monitoring

- [ ] Set up error tracking (e.g., Sentry, LogRocket)
- [ ] Monitor Render logs for errors
- [ ] Set up uptime monitoring (e.g., UptimeRobot)
- [ ] Configure email alerts for critical errors

### Testing

- [ ] Test user registration and login
- [ ] Test product browsing and cart
- [ ] Test checkout and payment flow
- [ ] Test admin panel login and access
- [ ] Test admin features (products, orders, analytics)
- [ ] Test webhook delivery (check Razorpay dashboard)
- [ ] Test on mobile devices
- [ ] Test with different browsers

### Documentation

- [ ] Update README with production URLs
- [ ] Document environment variables
- [ ] Create runbook for common issues

---

## Next Steps

After completing deployment:

1. **Switch to Live Razorpay Keys:**
   - Get live keys from Razorpay dashboard
   - Update `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` in Render
   - Update webhook URL if needed (can keep using Render URL)
   - Redeploy backend

2. **Add Custom Domains (Optional):**
   - If you want branded URLs, follow section 2.2
   - Update webhook URL in Razorpay if you add a custom domain
   - Update `VITE_API_BASE_URL` in Vercel

3. **Set Up Email Service:**
   - Configure SendGrid or similar for transactional emails
   - Update environment variables

4. **Set Up Analytics:**
   - Add Google Analytics or similar
   - Configure tracking codes

5. **Backup Strategy:**
   - Set up Supabase backups
   - Document recovery procedures

6. **Performance Optimization:**
   - Enable caching
   - Optimize images
   - Set up CDN (optional - only if using custom domains)

---

## Support & Resources

- **Vercel Docs**: [vercel.com/docs](https://vercel.com/docs)
- **Render Docs**: [render.com/docs](https://render.com/docs)
- **Razorpay Docs**: [razorpay.com/docs](https://razorpay.com/docs)
- **Supabase Docs**: [supabase.com/docs](https://supabase.com/docs)

---

## 📍 Quick Reference: Your Deployment URLs

After deployment, here are all your important URLs:

### Frontend (Customer-Facing)
- **Homepage**: `https://your-project-name.vercel.app`
- **Products**: `https://your-project-name.vercel.app/products`
- **Cart**: `https://your-project-name.vercel.app/cart`
- **Checkout**: `https://your-project-name.vercel.app/checkout`
- **Customer Login**: `https://your-project-name.vercel.app/login`
- **Customer Signup**: `https://your-project-name.vercel.app/signup`

### Admin Panel
- **Admin Login**: `https://your-project-name.vercel.app/admin/login`
- **Admin Dashboard**: `https://your-project-name.vercel.app/admin/dashboard`
- **Admin Products**: `https://your-project-name.vercel.app/admin/products`
- **Admin Orders**: `https://your-project-name.vercel.app/admin/orders`
- **Admin Analytics**: `https://your-project-name.vercel.app/admin/analytics`
- **Admin Customers**: `https://your-project-name.vercel.app/admin/customers`
- **Admin Settings**: `https://your-project-name.vercel.app/admin/settings`

**Note**: Replace `your-project-name` with your actual Vercel project name.

### Backend API
- **Health Check**: `https://your-backend-name.onrender.com/health`
- **API Documentation**: `https://your-backend-name.onrender.com/api-docs`
- **Webhook Endpoint**: `https://your-backend-name.onrender.com/api/payments/webhook`

**Note**: Replace `your-backend-name` with your actual Render service name.

### Admin Access Requirements
To access the admin panel, you need:
1. A user account created in Supabase (Authentication → Users)
2. Admin role granted in the `user_roles` database table
3. Login credentials (email and password)

**How to Grant Admin Access:**

**Method 1: Via Supabase SQL Editor (Initial Setup)**
```sql
-- Replace 'USER_ID_HERE' with the actual user UUID from auth.users table
INSERT INTO user_roles (user_id, role, notes)
VALUES ('USER_ID_HERE', 'admin', 'Initial admin user');
```

**Method 2: Via Admin Panel (After First Admin is Created)**
1. Login as an existing admin
2. Navigate to Admin Settings → Users
3. Find the user and click "Grant Admin Role"

**Method 3: Via API (Programmatic)**
```bash
POST /api/admin/users/{userId}/roles/admin
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "notes": "Optional notes"
}

```

**Legacy Method (Still Supported):**
- Add email to `ALLOWED_ADMIN_EMAILS` environment variable (requires redeployment)
- Or set `role: 'admin'` in user metadata via Supabase Dashboard

---

**🎉 Congratulations! Your jewellery e-commerce platform is now live!**

