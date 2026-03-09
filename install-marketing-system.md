# Marketing System Installation Script

Follow these steps in order to install the Marketing System.

## Step 1: Database Migration (Required)

### Option A: Using Supabase Dashboard
1. Go to your Supabase project dashboard
2. Click on "SQL Editor" in the left sidebar
3. Click "New Query"
4. Copy the contents of `migrations/add-marketing-system.sql`
5. Paste and click "Run"
6. Wait for completion (should see "Success")
7. Repeat for `migrations/add-abandoned-cart-reminder-field.sql`

### Option B: Using psql Command Line
```bash
psql -h db.your-project.supabase.co -U postgres -d postgres -f migrations/add-marketing-system.sql
psql -h db.your-project.supabase.co -U postgres -d postgres -f migrations/add-abandoned-cart-reminder-field.sql
```

### Verify Migration Success
Run this query in SQL Editor:
```sql
SELECT COUNT(*) as table_count 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
  'blogs', 'blog_categories', 'push_tokens', 'push_campaigns',
  'email_subscribers', 'email_templates', 'email_campaigns',
  'marketing_automation_rules', 'automation_logs'
);
```
Expected result: `table_count: 9` or more

## Step 2: Firebase Setup (Required for Push Notifications)

### 2.1 Create Firebase Project
1. Go to https://console.firebase.google.com/
2. Click "Add project"
3. Enter project name: "aldorado-jewells" (or your choice)
4. Disable Google Analytics (optional)
5. Click "Create project"

### 2.2 Enable Cloud Messaging
1. In Firebase Console, click the gear icon → "Project settings"
2. Go to "Cloud Messaging" tab
3. Under "Web Push certificates", click "Generate key pair"
4. Copy the VAPID key (starts with "B...")
5. Save this for frontend .env

### 2.3 Get Service Account Key
1. In Project Settings, go to "Service accounts" tab
2. Click "Generate new private key"
3. Click "Generate key" in the dialog
4. Save the downloaded JSON file

### 2.4 Convert Service Account to Single Line
**On Windows (PowerShell):**
```powershell
$json = Get-Content firebase-service-account.json | ConvertFrom-Json | ConvertTo-Json -Compress
$json | Set-Clipboard
Write-Host "Service account copied to clipboard!"
```

**On Mac/Linux:**
```bash
cat firebase-service-account.json | jq -c . | pbcopy
echo "Service account copied to clipboard!"
```

**Manual Method:**
Open the JSON file and remove all newlines and extra spaces to make it one line.

### 2.5 Get Firebase Config for Frontend
1. In Firebase Console, go to Project Settings
2. Scroll down to "Your apps"
3. Click the web icon (</>)
4. Register app name: "aldorado-jewells-web"
5. Copy the firebaseConfig object values

## Step 3: Resend Setup (Required for Email Marketing)

### 3.1 Create Resend Account
1. Go to https://resend.com
2. Click "Sign Up"
3. Verify your email

### 3.2 Get API Key
1. In Resend dashboard, go to "API Keys"
2. Click "Create API Key"
3. Name: "Aldorado Jewells Production"
4. Permission: "Sending access"
5. Click "Create"
6. Copy the API key (starts with "re_")
7. Save immediately (won't be shown again)

### 3.3 Verify Domain (Production Only)
For production:
1. Go to "Domains" in Resend dashboard
2. Click "Add Domain"
3. Enter your domain: "yourdomain.com"
4. Add the provided DNS records to your domain
5. Wait for verification (up to 48 hours)

For development, use: `onboarding@resend.dev`

## Step 4: Backend Configuration

### 4.1 Update .env File
Edit `backend/.env` and add:

```env
# Firebase Cloud Messaging
FIREBASE_SERVICE_ACCOUNT={"type":"service_account","project_id":"your-project",...}

# Resend Email Service
RESEND_API_KEY=re_your_actual_api_key
RESEND_FROM_EMAIL=onboarding@resend.dev
```

For production, use your verified domain:
```env
RESEND_FROM_EMAIL=noreply@yourdomain.com
```

### 4.2 Verify Dependencies
Check `backend/package.json` includes:
```json
{
  "dependencies": {
    "firebase-admin": "^13.7.0",
    "resend": "^6.9.3"
  }
}
```

Already included - no action needed!

### 4.3 Install (if needed)
```bash
cd backend
npm install
```

### 4.4 Start Backend
```bash
npm run dev
```

### 4.5 Verify Backend Started Successfully
Check console output for:
```
✓ Server is running on port 3000
✓ Firebase Admin initialized successfully
✓ Resend email service initialized successfully
✓ Starting abandoned cart worker...
```

If you see warnings instead of success messages, the services will be disabled but the system will still work (just without push/email functionality).

## Step 5: Frontend Configuration

### 5.1 Update .env File
Edit `frontend/.env` and add:

```env
# Firebase Configuration (from Step 2.5)
VITE_FIREBASE_API_KEY=AIza...
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123
VITE_FIREBASE_VAPID_KEY=B...
```

### 5.2 Update Service Worker
Edit `public/firebase-messaging-sw.js` and replace:

```javascript
firebase.initializeApp({
  apiKey: "YOUR_API_KEY",           // Replace with actual
  authDomain: "YOUR_AUTH_DOMAIN",   // Replace with actual
  projectId: "YOUR_PROJECT_ID",     // Replace with actual
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
});
```

### 5.3 Install Firebase
```bash
cd frontend
npm install firebase
```

### 5.4 Start Frontend
```bash
npm run dev
```

## Step 6: Verification Tests

### Test 1: Backend Health Check
```bash
curl http://localhost:3000/health
```
Expected: `{"status":"ok","message":"Server is running"}`

### Test 2: Blog API
```bash
curl http://localhost:3000/api/blogs
```
Expected: `{"blogs":[],"total":0,...}` (empty initially)

### Test 3: Admin Login
1. Go to `http://localhost:5173/admin/login`
2. Login with admin credentials
3. Verify redirect to admin dashboard

### Test 4: Marketing Section
1. In admin panel, check left sidebar
2. Verify "Marketing" section exists with:
   - Analytics
   - Blogs
   - Email Campaigns
   - Push Notifications
   - Subscribers
   - Email Templates
   - Automation

### Test 5: Create Blog
1. Click Marketing → Blogs
2. Click "Create New Blog"
3. Fill in form:
   - Title: "Test Blog Post"
   - Content: "This is a test"
   - Status: "Published"
4. Click "Create Blog"
5. Go to `http://localhost:5173/blog`
6. Verify blog appears

### Test 6: Newsletter Subscription
1. Scroll to footer
2. Enter email in newsletter form
3. Click "Subscribe"
4. Verify success message
5. In admin panel, go to Marketing → Subscribers
6. Verify email appears in list

### Test 7: Send Test Email (Optional)
1. Go to Marketing → Email Campaigns
2. Click "Create Campaign"
3. Fill in:
   - Name: "Test Campaign"
   - Subject: "Test Email"
   - HTML Content: "<p>This is a test</p>"
   - Audience: "All Subscribers"
4. Click "Create Campaign"
5. Click "Send"
6. Check email inbox

### Test 8: Send Test Push (Optional)
1. Go to Marketing → Push Notifications
2. Click "Send Notification"
3. Fill in:
   - Title: "Test Notification"
   - Message: "This is a test"
   - Audience: "All Users"
4. Click "Send Now"
5. Grant browser permission if prompted
6. Verify notification appears

## Step 7: Production Deployment

### 7.1 Environment Variables
Set all environment variables in your hosting platform:

**Backend (Vercel/Railway/Heroku):**
- All variables from backend/.env
- Set `NODE_ENV=production`
- Use production Firebase service account
- Use verified Resend domain

**Frontend (Vercel/Netlify):**
- All variables from frontend/.env
- Update `VITE_API_URL` to production backend URL
- Use production Firebase config

### 7.2 Update Service Worker
Update `public/firebase-messaging-sw.js` with production Firebase config.

### 7.3 Deploy
```bash
# Backend
git push heroku main
# or
vercel --prod

# Frontend
npm run build
vercel --prod
# or
netlify deploy --prod
```

### 7.4 Verify Production
- [ ] Visit production URL
- [ ] Test blog pages
- [ ] Test newsletter subscription
- [ ] Test admin panel access
- [ ] Check server logs for errors

## Troubleshooting

### Issue: "Module not found" errors
```bash
cd backend && npm install
cd frontend && npm install firebase
```

### Issue: "Firebase not initialized"
- Verify `FIREBASE_SERVICE_ACCOUNT` is set
- Check JSON is valid (use JSON validator)
- Ensure it's a single-line string

### Issue: "Resend not configured"
- Verify `RESEND_API_KEY` is set
- Check API key is valid in Resend dashboard
- For dev, use `onboarding@resend.dev` as from email

### Issue: "Table does not exist"
- Run migrations again
- Check Supabase SQL Editor for errors
- Verify you're connected to correct database

### Issue: Routes not working
- Restart backend server
- Check server.js for syntax errors
- Verify all route files exist
- Check browser console for CORS errors

## Post-Installation

### Immediate Tasks
- [ ] Create 3-5 initial blog posts
- [ ] Customize email templates
- [ ] Test all automation triggers
- [ ] Review automation logs

### Within 24 Hours
- [ ] Monitor server logs
- [ ] Check automation execution
- [ ] Verify email delivery
- [ ] Test push notifications

### Within 1 Week
- [ ] Create marketing content calendar
- [ ] Set up regular blog posting schedule
- [ ] Plan first email campaign
- [ ] Monitor analytics

## Success Checklist

After installation, you should have:

- ✅ All database tables created
- ✅ Backend server running without errors
- ✅ Frontend running without errors
- ✅ Firebase initialized successfully
- ✅ Resend initialized successfully
- ✅ Marketing section in admin panel
- ✅ Blog pages accessible
- ✅ Newsletter subscription working
- ✅ Can create blogs
- ✅ Can send email campaigns
- ✅ Can send push notifications
- ✅ Automation rules active
- ✅ Analytics displaying correctly

## Rollback Instructions

If you need to rollback:

### Quick Rollback (Keep Database)
1. Edit `backend/src/server.js`
2. Comment out lines 32-38 (marketing route imports)
3. Comment out lines 160-167 (marketing route registrations)
4. Comment out lines 372-377 (worker startup)
5. Restart backend

### Full Rollback (Remove Everything)
```sql
-- In Supabase SQL Editor
DROP TABLE IF EXISTS blog_analytics CASCADE;
DROP TABLE IF EXISTS blogs CASCADE;
DROP TABLE IF EXISTS blog_categories CASCADE;
DROP TABLE IF EXISTS push_logs CASCADE;
DROP TABLE IF EXISTS push_campaigns CASCADE;
DROP TABLE IF EXISTS push_tokens CASCADE;
DROP TABLE IF EXISTS email_logs CASCADE;
DROP TABLE IF EXISTS email_campaigns CASCADE;
DROP TABLE IF EXISTS email_templates CASCADE;
DROP TABLE IF EXISTS email_subscribers CASCADE;
DROP TABLE IF EXISTS automation_logs CASCADE;
DROP TABLE IF EXISTS marketing_automation_rules CASCADE;

DROP VIEW IF EXISTS email_campaign_analytics;
DROP VIEW IF EXISTS push_campaign_analytics;
DROP VIEW IF EXISTS blog_performance;
```

Then follow Quick Rollback steps above.

## Getting Help

- **Setup Issues:** See `MARKETING_SETUP_GUIDE.md`
- **API Questions:** See `MARKETING_SYSTEM_README.md`
- **Quick Commands:** See `MARKETING_QUICK_REFERENCE.md`
- **Feature List:** See `MARKETING_FEATURES.md`

## Conclusion

Follow these steps in order, and you'll have a fully functional Marketing System in about 1 hour. All features are production-ready and well-documented.

Good luck! 🚀

---

**Last Updated:** March 6, 2026
**Version:** 1.0.0
