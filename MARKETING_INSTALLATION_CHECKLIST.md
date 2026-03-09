# Marketing System Installation Checklist

Use this checklist to ensure proper installation of the Marketing System.

## Pre-Installation

- [ ] Node.js 16+ installed
- [ ] Backend server running
- [ ] Frontend running
- [ ] Supabase database accessible
- [ ] Admin account exists

## Database Setup

- [ ] Run `migrations/add-marketing-system.sql` in Supabase SQL Editor
- [ ] Run `migrations/add-abandoned-cart-reminder-field.sql` in Supabase SQL Editor
- [ ] Verify 12 new tables created:
  - [ ] blogs
  - [ ] blog_categories
  - [ ] blog_analytics
  - [ ] push_tokens
  - [ ] push_campaigns
  - [ ] push_logs
  - [ ] email_subscribers
  - [ ] email_templates
  - [ ] email_campaigns
  - [ ] email_logs
  - [ ] marketing_automation_rules
  - [ ] automation_logs
- [ ] Verify 3 views created:
  - [ ] email_campaign_analytics
  - [ ] push_campaign_analytics
  - [ ] blog_performance
- [ ] Verify default data inserted:
  - [ ] 5 blog categories
  - [ ] 3 email templates
  - [ ] 3 automation rules

## Firebase Setup (Push Notifications)

- [ ] Create Firebase project at console.firebase.google.com
- [ ] Enable Cloud Messaging
- [ ] Generate VAPID key (Project Settings → Cloud Messaging)
- [ ] Download service account JSON (Project Settings → Service Accounts)
- [ ] Convert service account to single-line string
- [ ] Add `FIREBASE_SERVICE_ACCOUNT` to backend/.env
- [ ] Add Firebase config to frontend/.env:
  - [ ] VITE_FIREBASE_API_KEY
  - [ ] VITE_FIREBASE_AUTH_DOMAIN
  - [ ] VITE_FIREBASE_PROJECT_ID
  - [ ] VITE_FIREBASE_STORAGE_BUCKET
  - [ ] VITE_FIREBASE_MESSAGING_SENDER_ID
  - [ ] VITE_FIREBASE_APP_ID
  - [ ] VITE_FIREBASE_VAPID_KEY
- [ ] Update `public/firebase-messaging-sw.js` with Firebase config

## Resend Setup (Email Marketing)

- [ ] Create account at resend.com
- [ ] Generate API key
- [ ] Add `RESEND_API_KEY` to backend/.env
- [ ] Add `RESEND_FROM_EMAIL` to backend/.env
- [ ] (Production) Verify domain in Resend dashboard
- [ ] (Production) Add DNS records for domain verification

## Backend Configuration

- [ ] Copy `backend/.env.example` to `backend/.env` (if not exists)
- [ ] Set all required environment variables:
  - [ ] FIREBASE_SERVICE_ACCOUNT
  - [ ] RESEND_API_KEY
  - [ ] RESEND_FROM_EMAIL
  - [ ] (Existing) SUPABASE_URL
  - [ ] (Existing) SUPABASE_SERVICE_ROLE_KEY
  - [ ] (Existing) JWT_SECRET
- [ ] Run `npm install` in backend directory
- [ ] Start backend: `npm run dev`
- [ ] Verify in console:
  - [ ] "Firebase Admin initialized successfully"
  - [ ] "Resend email service initialized successfully"
  - [ ] "Starting abandoned cart worker..."
  - [ ] No errors in startup

## Frontend Configuration

- [ ] Copy `frontend/.env.example` to `frontend/.env` (if not exists)
- [ ] Set Firebase environment variables (see above)
- [ ] Install Firebase: `npm install firebase`
- [ ] Start frontend: `npm run dev`
- [ ] Verify no console errors

## Verification Tests

### Test 1: Blog System
- [ ] Login as admin
- [ ] Navigate to Marketing → Blogs
- [ ] Click "Create New Blog"
- [ ] Fill form and set status to "Published"
- [ ] Click "Create Blog"
- [ ] Visit `/blog` in browser
- [ ] Verify blog appears in list
- [ ] Click blog to view detail page
- [ ] Verify content displays correctly

### Test 2: Email Subscription
- [ ] Open website in incognito mode
- [ ] Scroll to footer
- [ ] Enter email in newsletter form
- [ ] Click "Subscribe"
- [ ] Verify success message
- [ ] Login as admin
- [ ] Navigate to Marketing → Subscribers
- [ ] Verify subscriber appears in list

### Test 3: Email Campaign
- [ ] Navigate to Marketing → Email Campaigns
- [ ] Click "Create Campaign"
- [ ] Fill in campaign details
- [ ] Select "All Subscribers" audience
- [ ] Click "Create Campaign"
- [ ] Click "Send" on the campaign
- [ ] Check email inbox for campaign
- [ ] Verify email received

### Test 4: Push Notifications
- [ ] Navigate to Marketing → Push Notifications
- [ ] Click "Send Notification"
- [ ] Fill in title and message
- [ ] Select "All Users" audience
- [ ] Click "Send Now"
- [ ] Grant browser permission if prompted
- [ ] Verify notification appears in browser
- [ ] Click notification
- [ ] Verify redirect works (if URL provided)

### Test 5: Welcome Email Automation
- [ ] Open website in incognito
- [ ] Create new user account
- [ ] Check email inbox
- [ ] Verify welcome email received
- [ ] Login as admin
- [ ] Navigate to Marketing → Automation → Execution Logs
- [ ] Verify "Welcome Email on Signup" executed successfully

### Test 6: Blog Notification Automation
- [ ] Ensure you have at least 1 subscriber
- [ ] Create and publish a new blog
- [ ] Check subscriber email inbox
- [ ] Verify blog notification email received
- [ ] Check browser for push notification
- [ ] Check automation logs for execution

### Test 7: Abandoned Cart Automation
- [ ] Login as customer
- [ ] Add items to cart
- [ ] Leave cart for 2+ hours
- [ ] Wait for worker to run (every 30 min)
- [ ] Check email for abandoned cart reminder
- [ ] Verify in automation logs

### Test 8: Admin Panel Navigation
- [ ] Verify all marketing menu items work:
  - [ ] Marketing → Analytics
  - [ ] Marketing → Blogs
  - [ ] Marketing → Email Campaigns
  - [ ] Marketing → Push Notifications
  - [ ] Marketing → Subscribers
  - [ ] Marketing → Email Templates
  - [ ] Marketing → Automation

### Test 9: Analytics Dashboard
- [ ] Navigate to Marketing → Analytics
- [ ] Verify subscriber stats display
- [ ] Verify email campaign performance shows
- [ ] Verify push campaign performance shows
- [ ] Verify top blogs display

### Test 10: Newsletter Opt-in at Checkout
- [ ] Add items to cart
- [ ] Go to checkout
- [ ] Check "Subscribe to newsletter" checkbox
- [ ] Complete order (or cancel)
- [ ] Verify subscription in admin panel

## Post-Installation

- [ ] Review all automation rules in admin panel
- [ ] Customize email templates with brand content
- [ ] Update blog categories if needed
- [ ] Create initial blog content (3-5 posts)
- [ ] Test all features in production environment
- [ ] Monitor logs for first 24 hours
- [ ] Set up monitoring alerts (optional)

## Rollback Plan (If Needed)

If you need to rollback the marketing system:

1. **Remove Routes from server.js:**
   - Comment out marketing route imports
   - Comment out route registrations
   - Restart backend

2. **Remove from Admin Sidebar:**
   - Comment out marketing section in AdminSidebar.jsx
   - Remove marketing routes from App.jsx

3. **Database (Optional):**
   - Marketing tables don't affect existing functionality
   - Can be left in place or dropped if needed

## Success Indicators

After installation, you should see:

✅ **Backend Console:**
```
Server is running on port 3000
Environment: development
Firebase Admin initialized successfully
Resend email service initialized successfully
Starting abandoned cart worker...
Checking for abandoned carts...
```

✅ **Admin Panel:**
- Marketing section visible in sidebar
- All marketing pages load without errors
- Can create blogs, campaigns, and notifications
- Analytics display correctly

✅ **Public Site:**
- `/blog` page shows blog list
- `/blog/:slug` shows blog detail
- Newsletter subscription works in footer
- Checkout has newsletter opt-in

✅ **Automation:**
- Welcome email sent on signup
- Blog notification sent on publish
- Cart abandonment emails sent after 2 hours

## Troubleshooting

### Issue: "Module not found" errors

**Solution:**
```bash
cd backend
npm install
```

### Issue: "Firebase not initialized"

**Solution:**
- Check `FIREBASE_SERVICE_ACCOUNT` in .env
- Verify JSON is valid and single-line
- Check Firebase console for project status

### Issue: "Resend not configured"

**Solution:**
- Check `RESEND_API_KEY` in .env
- Verify API key is valid
- Check Resend dashboard for status

### Issue: Routes not working

**Solution:**
- Restart backend server
- Check server.js for route registration
- Verify no syntax errors in route files
- Check browser console for CORS errors

### Issue: Admin panel pages not loading

**Solution:**
- Check browser console for errors
- Verify routes in App.jsx
- Check component imports
- Clear browser cache

## Support Resources

- **Full Documentation:** `MARKETING_SYSTEM_README.md`
- **Setup Guide:** `MARKETING_SETUP_GUIDE.md`
- **Quick Reference:** `MARKETING_QUICK_REFERENCE.md`
- **Implementation Summary:** `MARKETING_IMPLEMENTATION_SUMMARY.md`

## Contact

For technical support or questions about the marketing system implementation, refer to the documentation files or check server logs for detailed error messages.

---

**Last Updated:** March 6, 2026
**Version:** 1.0.0
**Status:** Ready for Production
