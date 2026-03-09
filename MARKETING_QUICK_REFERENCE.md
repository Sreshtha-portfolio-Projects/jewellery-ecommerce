# Marketing System - Quick Reference

## Quick Start

### 1. Run Migrations
```sql
-- In Supabase SQL Editor, run:
migrations/add-marketing-system.sql
migrations/add-abandoned-cart-reminder-field.sql
```

### 2. Set Environment Variables

**Backend (.env):**
```env
FIREBASE_SERVICE_ACCOUNT={"type":"service_account",...}
RESEND_API_KEY=re_your_key
RESEND_FROM_EMAIL=noreply@yourdomain.com
```

**Frontend (.env):**
```env
VITE_FIREBASE_API_KEY=your-key
VITE_FIREBASE_PROJECT_ID=your-project
VITE_FIREBASE_VAPID_KEY=your-vapid-key
# ... (see frontend/.env.example for all)
```

### 3. Start Services
```bash
cd backend && npm run dev
cd frontend && npm run dev
```

## API Quick Reference

### Public Endpoints

```bash
# Blogs
GET    /api/blogs                    # List published blogs
GET    /api/blogs/:slug              # Get blog by slug
GET    /api/blogs/categories         # Get categories

# Email
POST   /api/email/subscribe          # Subscribe to newsletter
POST   /api/email/unsubscribe        # Unsubscribe

# Push
POST   /api/push/register            # Register FCM token
POST   /api/push/unregister          # Unregister token
```

### Admin Endpoints (Require Auth)

```bash
# Blog Management
GET    /api/admin/blogs              # All blogs
POST   /api/admin/blogs              # Create blog
PUT    /api/admin/blogs/:id          # Update blog
DELETE /api/admin/blogs/:id          # Delete blog

# Email Campaigns
GET    /api/admin/email/campaigns    # All campaigns
POST   /api/admin/email/campaigns    # Create campaign
POST   /api/admin/email/campaigns/:id/send  # Send campaign

# Push Campaigns
POST   /api/admin/push/send          # Send immediate notification
GET    /api/admin/push/campaigns     # All campaigns

# Subscribers
GET    /api/admin/email/subscribers  # All subscribers
GET    /api/admin/email/subscribers/stats  # Subscriber stats

# Templates
GET    /api/admin/email/templates    # All templates
POST   /api/admin/email/templates    # Create template

# Automation
GET    /api/admin/automation/rules   # All rules
PUT    /api/admin/automation/rules/:id  # Update rule
GET    /api/admin/automation/logs    # Execution logs
```

## Admin Panel Routes

```
/admin/marketing/analytics           # Marketing dashboard
/admin/marketing/blogs               # Blog management
/admin/marketing/blogs/new           # Create blog
/admin/marketing/blogs/edit/:id      # Edit blog
/admin/marketing/email-campaigns     # Email campaigns
/admin/marketing/email-campaigns/new # Create campaign
/admin/marketing/push-notifications  # Push notifications
/admin/marketing/subscribers         # Subscriber list
/admin/marketing/templates           # Email templates
/admin/marketing/automation          # Automation rules
```

## Common Tasks

### Create a Blog Post

```bash
curl -X POST http://localhost:3000/api/admin/blogs \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Blog Title",
    "content": "<p>Content here</p>",
    "status": "published",
    "category": "Style Guide"
  }'
```

### Send Push Notification

```bash
curl -X POST http://localhost:3000/api/admin/push/send \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "New Arrivals!",
    "message": "Check out our latest collection",
    "audience": "all"
  }'
```

### Subscribe to Newsletter

```bash
curl -X POST http://localhost:3000/api/email/subscribe \
  -H "Content-Type: application/json" \
  -d '{
    "email": "customer@example.com",
    "source": "newsletter"
  }'
```

## Automation Triggers

### Pre-configured Automations

1. **Welcome Email**
   - Trigger: User signup
   - Action: Send welcome email with discount code
   - Template: "Welcome Email"

2. **Blog Notification**
   - Trigger: Blog published
   - Action: Send email + push to all subscribers
   - Template: "New Blog Notification"

3. **Abandoned Cart**
   - Trigger: Cart inactive 2+ hours
   - Action: Send reminder email
   - Template: "Abandoned Cart Reminder"
   - Runs: Every 30 minutes (background worker)

### Trigger Automation Programmatically

```javascript
const automationService = require('./modules/notifications/automation.service');

await automationService.triggerAutomation('user_signup', {
  user_id: userId,
  email: email,
  name: name,
  discount_code: 'WELCOME10'
});
```

## Database Tables

### Core Tables
- `blogs` - Blog posts
- `blog_categories` - Categories
- `push_tokens` - FCM tokens
- `push_campaigns` - Push campaigns
- `email_subscribers` - Subscribers
- `email_templates` - Email templates
- `email_campaigns` - Email campaigns
- `marketing_automation_rules` - Automation rules

### Analytics Tables
- `blog_analytics` - Blog views
- `push_logs` - Push delivery logs
- `email_logs` - Email delivery logs
- `automation_logs` - Automation execution logs

### Views
- `email_campaign_analytics` - Email metrics
- `push_campaign_analytics` - Push metrics
- `blog_performance` - Blog metrics

## File Structure

### Backend
```
backend/src/modules/
├── blogs/
│   ├── blog.service.js
│   ├── blog.controller.js
│   ├── blog.routes.js
│   └── adminBlog.routes.js
├── email/
│   ├── email.service.js
│   ├── email.controller.js
│   ├── email.routes.js
│   └── adminEmail.routes.js
└── notifications/
    ├── push.service.js
    ├── push.controller.js
    ├── push.routes.js
    ├── adminPush.routes.js
    ├── automation.service.js
    ├── automation.controller.js
    ├── adminAutomation.routes.js
    └── cartAbandonmentWorker.js
```

### Frontend
```
frontend/src/pages/
├── BlogList.jsx
├── BlogDetail.jsx
└── admin/marketing/
    ├── MarketingAnalytics.jsx
    ├── Blogs.jsx
    ├── BlogForm.jsx
    ├── EmailCampaigns.jsx
    ├── EmailCampaignForm.jsx
    ├── PushNotifications.jsx
    ├── Subscribers.jsx
    ├── EmailTemplates.jsx
    └── Automation.jsx
```

## Testing Checklist

- [ ] Database migrations ran successfully
- [ ] Backend server starts without errors
- [ ] Firebase initialized successfully
- [ ] Resend initialized successfully
- [ ] Cart abandonment worker started
- [ ] Can create blog posts
- [ ] Can view blogs on public site
- [ ] Can subscribe to newsletter
- [ ] Can send email campaigns
- [ ] Can send push notifications
- [ ] Welcome email sent on signup
- [ ] Blog notification sent on publish
- [ ] Abandoned cart email sent after 2 hours
- [ ] Admin panel accessible
- [ ] All marketing routes work

## Performance Tips

1. **Batch Email Sends:** Campaigns send to all subscribers in sequence
2. **Push Batching:** FCM automatically batches up to 500 tokens
3. **Blog Caching:** Consider caching published blogs
4. **Image CDN:** Use CDN for blog thumbnails
5. **Database Indexes:** Already included in migrations

## Security Notes

- All admin endpoints require authentication
- RLS policies protect sensitive data
- Email templates can't be deleted if system templates
- Push tokens are user-specific
- Automation logs are admin-only

## Troubleshooting Commands

```bash
# Check if tables exist
psql -c "SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_name LIKE '%blog%' OR table_name LIKE '%email%' OR table_name LIKE '%push%';"

# Check automation rules
psql -c "SELECT name, trigger_type, action_type, is_active FROM marketing_automation_rules;"

# Check recent automation logs
psql -c "SELECT * FROM automation_logs ORDER BY created_at DESC LIMIT 10;"

# Test Resend API
curl https://api.resend.com/emails \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "from": "onboarding@resend.dev",
    "to": "your@email.com",
    "subject": "Test",
    "html": "<p>Test email</p>"
  }'
```

## Default Data

The migration creates:

**5 Blog Categories:**
- Jewellery Care
- Style Guide
- Industry News
- Behind the Scenes
- Gift Ideas

**3 Email Templates:**
- Welcome Email
- New Blog Notification
- Abandoned Cart Reminder

**3 Automation Rules:**
- Welcome Email on Signup
- Blog Notification
- Abandoned Cart Email

All are ready to use immediately after migration!
