# Marketing System Setup Guide

This guide will walk you through setting up the Marketing System for the Aldorado Jewells e-commerce platform.

## Prerequisites

- Node.js 16+ installed
- PostgreSQL/Supabase database access
- Firebase account (for push notifications)
- Resend account (for email marketing)

## Step-by-Step Setup

### 1. Database Setup

#### Run Migrations

Execute the following SQL migrations in your Supabase SQL Editor or via psql:

```bash
# Option 1: Using Supabase SQL Editor
# Copy and paste the contents of these files into the SQL Editor:
- migrations/add-marketing-system.sql
- migrations/add-abandoned-cart-reminder-field.sql

# Option 2: Using psql command line
psql -h your-db-host -U postgres -d your-database -f migrations/add-marketing-system.sql
psql -h your-db-host -U postgres -d your-database -f migrations/add-abandoned-cart-reminder-field.sql
```

#### Verify Tables Created

Run this query to verify all tables were created:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
  'blogs', 'blog_categories', 'blog_analytics',
  'push_tokens', 'push_campaigns', 'push_logs',
  'email_subscribers', 'email_templates', 'email_campaigns', 'email_logs',
  'marketing_automation_rules', 'automation_logs'
);
```

You should see 12 tables.

### 2. Firebase Setup (Push Notifications)

#### Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add Project"
3. Enter project name (e.g., "aldorado-jewells")
4. Disable Google Analytics (optional)
5. Click "Create Project"

#### Enable Cloud Messaging

1. In Firebase Console, go to **Project Settings** (gear icon)
2. Go to **Cloud Messaging** tab
3. Under **Web Push certificates**, click "Generate key pair"
4. Copy the VAPID key (you'll need this for frontend)

#### Get Service Account Key

1. In Firebase Console, go to **Project Settings** → **Service Accounts**
2. Click "Generate New Private Key"
3. Download the JSON file
4. Convert to single-line string:

```bash
# On Linux/Mac:
cat firebase-service-account.json | jq -c . | pbcopy

# On Windows (PowerShell):
Get-Content firebase-service-account.json | ConvertFrom-Json | ConvertTo-Json -Compress | Set-Clipboard

# Or manually remove all newlines and extra spaces
```

5. Add to `backend/.env`:

```env
FIREBASE_SERVICE_ACCOUNT={"type":"service_account","project_id":"your-project",...}
```

#### Update Service Worker

Edit `public/firebase-messaging-sw.js` and replace the placeholder values:

```javascript
firebase.initializeApp({
  apiKey: "YOUR_ACTUAL_API_KEY",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
});
```

### 3. Resend Setup (Email Marketing)

#### Create Resend Account

1. Go to [Resend](https://resend.com)
2. Sign up for free account
3. Verify your email

#### Get API Key

1. Go to **API Keys** section
2. Click "Create API Key"
3. Give it a name (e.g., "Aldorado Jewells Production")
4. Copy the API key (starts with `re_`)

#### Verify Domain (Production)

For production, you need to verify your domain:

1. Go to **Domains** section
2. Click "Add Domain"
3. Enter your domain (e.g., `yourdomain.com`)
4. Add the DNS records provided by Resend
5. Wait for verification (can take up to 48 hours)

For development, you can use Resend's test email addresses.

#### Add to Environment

Add to `backend/.env`:

```env
RESEND_API_KEY=re_your_actual_api_key
RESEND_FROM_EMAIL=noreply@yourdomain.com
```

For development, use:
```env
RESEND_FROM_EMAIL=onboarding@resend.dev
```

### 4. Backend Configuration

#### Update .env File

Create or update `backend/.env` with all required variables:

```env
# Server
PORT=3000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

# JWT
JWT_SECRET=your-secret-key-change-in-production

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Admin
ALLOWED_ADMIN_EMAILS=admin@example.com

# Razorpay
RAZORPAY_KEY_ID=rzp_test_your_key
RAZORPAY_KEY_SECRET=your_secret

# Firebase (Push Notifications)
FIREBASE_SERVICE_ACCOUNT={"type":"service_account",...}

# Resend (Email Marketing)
RESEND_API_KEY=re_your_api_key
RESEND_FROM_EMAIL=noreply@yourdomain.com
```

#### Install Dependencies

Dependencies are already in package.json. Just run:

```bash
cd backend
npm install
```

#### Start Backend Server

```bash
npm run dev
```

You should see:
```
Server is running on port 3000
Firebase Admin initialized successfully
Resend email service initialized successfully
Starting abandoned cart worker...
```

### 5. Frontend Configuration

#### Update .env File

Create or update `frontend/.env`:

```env
VITE_API_URL=http://localhost:3000

# Firebase (from Firebase Console → Project Settings)
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123
VITE_FIREBASE_VAPID_KEY=your-vapid-key-from-cloud-messaging
```

#### Install Dependencies

```bash
cd frontend
npm install firebase
```

#### Start Frontend

```bash
npm run dev
```

### 6. Testing the Setup

#### Test Blog System

1. Login as admin at `/admin/login`
2. Navigate to **Marketing → Blogs**
3. Click "Create New Blog"
4. Fill in the form and publish
5. Visit `/blog` to see your blog listed
6. Click on the blog to view the detail page

#### Test Email Marketing

1. Navigate to **Marketing → Subscribers**
2. Open your website in incognito
3. Subscribe via footer newsletter form
4. Check if subscriber appears in admin panel
5. Navigate to **Marketing → Email Campaigns**
6. Create a test campaign
7. Send to "All Subscribers"
8. Check your email inbox

#### Test Push Notifications

1. Navigate to **Marketing → Push Notifications**
2. Click "Send Notification"
3. Fill in title and message
4. Click "Send Now"
5. Check browser for notification (must grant permission first)

#### Test Automation

1. Create a new user account on the website
2. Check email for welcome message
3. Check **Marketing → Automation → Execution Logs**
4. Verify "Welcome Email on Signup" was executed

### 7. Production Deployment

#### Environment Variables

Set all environment variables in your production environment:

**Backend (Vercel/Railway/Heroku):**
- All variables from `backend/.env.example`
- Set `NODE_ENV=production`
- Use production Firebase service account
- Use verified Resend domain

**Frontend (Vercel/Netlify):**
- All variables from `frontend/.env.example`
- Update `VITE_API_URL` to production backend URL
- Use production Firebase config

#### Security Checklist

- [ ] Change `JWT_SECRET` to a strong random string
- [ ] Use production Firebase service account
- [ ] Verify Resend domain
- [ ] Enable HTTPS for all endpoints
- [ ] Review RLS policies in Supabase
- [ ] Test admin authentication
- [ ] Verify CORS settings

#### Performance Optimization

- [ ] Enable database indexes (already in migration)
- [ ] Configure Redis for rate limiting (optional)
- [ ] Set up CDN for blog images
- [ ] Enable caching for public blog pages
- [ ] Monitor email sending rate limits

### 8. Common Issues & Solutions

#### Firebase Not Working

**Issue:** "Firebase not initialized" error

**Solution:**
1. Verify `FIREBASE_SERVICE_ACCOUNT` is set correctly
2. Check JSON is valid (use online JSON validator)
3. Ensure it's a single-line string (no newlines)
4. Verify Firebase project has Cloud Messaging enabled

#### Emails Not Sending

**Issue:** Emails not being delivered

**Solution:**
1. Check `RESEND_API_KEY` is correct
2. Verify sender email is verified in Resend
3. Check Resend dashboard for error logs
4. For production, ensure domain is verified
5. Check spam folder

#### Push Notifications Not Appearing

**Issue:** Notifications not showing in browser

**Solution:**
1. Check browser notification permissions
2. Verify Firebase config in frontend `.env`
3. Update `firebase-messaging-sw.js` with correct config
4. Check browser console for errors
5. Test in Chrome (best FCM support)

#### Automation Not Triggering

**Issue:** Welcome email not sent on signup

**Solution:**
1. Check automation rule is active in admin panel
2. Verify email template exists
3. Check automation logs for errors
4. Ensure `automation.service.js` is imported correctly
5. Check server logs for errors

#### Cart Abandonment Not Working

**Issue:** Abandoned cart emails not being sent

**Solution:**
1. Verify worker started (check server logs)
2. Check `abandoned_carts` table has data
3. Verify `reminder_sent` column exists
4. Check automation rule for `cart_abandoned` is active
5. Wait at least 2 hours after cart activity

### 9. Monitoring & Maintenance

#### Daily Tasks

- Check automation logs for failures
- Monitor email bounce rates
- Review push notification click rates
- Check subscriber growth

#### Weekly Tasks

- Review blog analytics
- Analyze campaign performance
- Clean bounced email addresses
- Update email templates as needed

#### Monthly Tasks

- Review automation rules effectiveness
- Optimize email subject lines
- A/B test push notification content
- Update blog content strategy

### 10. Next Steps

After setup is complete:

1. **Create Content:**
   - Write 3-5 initial blog posts
   - Create custom email templates
   - Set up brand-specific automation rules

2. **Test Everything:**
   - Send test campaigns to yourself
   - Verify all automation triggers
   - Check analytics are tracking correctly

3. **Launch:**
   - Announce blog to existing customers
   - Promote newsletter subscription
   - Enable push notification prompts

4. **Monitor:**
   - Track engagement metrics
   - Optimize based on performance
   - Iterate on content strategy

## Support

For issues or questions:
- Check server logs: `npm run dev` in backend
- Check browser console for frontend errors
- Review `MARKETING_SYSTEM_README.md` for API documentation
- Check automation logs in admin panel

## Resources

- [Firebase Cloud Messaging Docs](https://firebase.google.com/docs/cloud-messaging)
- [Resend Documentation](https://resend.com/docs)
- [Supabase RLS Guide](https://supabase.com/docs/guides/auth/row-level-security)
