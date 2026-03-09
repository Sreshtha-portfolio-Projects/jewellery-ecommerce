# Marketing System Documentation

This document provides a comprehensive guide to the Marketing System module added to the Aldorado Jewells e-commerce platform.

## Overview

The Marketing System includes three main components:
1. **Blog System** - SEO-friendly blog posts for organic traffic
2. **Push Notifications** - Browser push notifications via Firebase Cloud Messaging
3. **Email Marketing** - Email campaigns and newsletters via Resend
4. **Marketing Automation** - Automated triggers for user engagement

## Architecture

### Backend Structure

```
backend/src/modules/
├── blogs/
│   ├── blog.service.js          # Blog business logic
│   ├── blog.controller.js       # Blog request handlers
│   ├── blog.routes.js           # Public blog routes
│   └── adminBlog.routes.js      # Admin blog routes
├── email/
│   ├── email.service.js         # Email service with Resend
│   ├── email.controller.js      # Email request handlers
│   ├── email.routes.js          # Public email routes
│   └── adminEmail.routes.js     # Admin email routes
└── notifications/
    ├── push.service.js          # Push notification service with Firebase
    ├── push.controller.js       # Push request handlers
    ├── push.routes.js           # Public push routes
    ├── adminPush.routes.js      # Admin push routes
    ├── automation.service.js    # Marketing automation engine
    ├── automation.controller.js # Automation request handlers
    ├── adminAutomation.routes.js # Admin automation routes
    └── cartAbandonmentWorker.js # Background worker for cart abandonment
```

### Frontend Structure

```
frontend/src/pages/
├── BlogList.jsx                 # Public blog listing page
├── BlogDetail.jsx               # Public blog detail page
└── admin/marketing/
    ├── Blogs.jsx                # Admin blog management
    ├── BlogForm.jsx             # Create/edit blog form
    ├── EmailCampaigns.jsx       # Email campaign management
    ├── EmailCampaignForm.jsx    # Create/edit campaign form
    ├── PushNotifications.jsx    # Push notification management
    ├── Subscribers.jsx          # Subscriber management
    ├── Automation.jsx           # Automation rules management
    └── EmailTemplates.jsx       # Email template management
```

## Database Schema

### Tables Created

1. **blogs** - Blog posts with SEO metadata
2. **blog_categories** - Blog categories
3. **blog_analytics** - Blog view tracking
4. **push_tokens** - FCM device tokens
5. **push_campaigns** - Push notification campaigns
6. **push_logs** - Push notification delivery logs
7. **email_subscribers** - Email subscriber list
8. **email_templates** - Reusable email templates
9. **email_campaigns** - Email marketing campaigns
10. **email_logs** - Email delivery logs
11. **marketing_automation_rules** - Automation trigger rules
12. **automation_logs** - Automation execution logs

### Views Created

- `email_campaign_analytics` - Email campaign performance metrics
- `push_campaign_analytics` - Push campaign performance metrics
- `blog_performance` - Blog engagement metrics

## Setup Instructions

### 1. Database Migration

Run the migration to create all necessary tables:

```bash
# Connect to your Supabase database and run:
psql -h your-db-host -U postgres -d your-database -f migrations/add-marketing-system.sql
psql -h your-db-host -U postgres -d your-database -f migrations/add-abandoned-cart-reminder-field.sql
```

Or use Supabase SQL Editor to execute the migration files.

### 2. Environment Variables

Add the following to your `backend/.env` file:

```env
# Firebase Cloud Messaging (for Push Notifications)
FIREBASE_SERVICE_ACCOUNT={"type":"service_account","project_id":"your-project-id",...}

# Email Service (Resend)
RESEND_API_KEY=re_your_api_key
RESEND_FROM_EMAIL=noreply@yourdomain.com
```

#### Getting Firebase Service Account:

1. Go to Firebase Console → Project Settings → Service Accounts
2. Click "Generate New Private Key"
3. Download the JSON file
4. Convert to single-line string and add to `.env`

#### Getting Resend API Key:

1. Sign up at https://resend.com
2. Go to API Keys section
3. Create a new API key
4. Add to `.env`

### 3. Install Dependencies

The required dependencies are already in `package.json`:
- `firebase-admin` - For push notifications
- `resend` - For email marketing

No additional installation needed if you've already run `npm install`.

## API Endpoints

### Public APIs

#### Blogs
- `GET /api/blogs` - Get published blogs (paginated)
- `GET /api/blogs/categories` - Get blog categories
- `GET /api/blogs/:slug` - Get blog by slug

#### Email
- `POST /api/email/subscribe` - Subscribe to newsletter
- `POST /api/email/unsubscribe` - Unsubscribe from newsletter

#### Push Notifications
- `POST /api/push/register` - Register FCM token
- `POST /api/push/unregister` - Unregister FCM token
- `POST /api/push/click/:campaignId` - Track notification click

### Admin APIs

#### Blog Management
- `GET /api/admin/blogs` - Get all blogs (admin view)
- `POST /api/admin/blogs` - Create blog
- `PUT /api/admin/blogs/:id` - Update blog
- `DELETE /api/admin/blogs/:id` - Delete blog
- `GET /api/admin/blogs/:id/analytics` - Get blog analytics
- `GET /api/admin/blogs/categories/all` - Get categories
- `POST /api/admin/blogs/categories` - Create category
- `PUT /api/admin/blogs/categories/:id` - Update category
- `DELETE /api/admin/blogs/categories/:id` - Delete category

#### Email Marketing
- `GET /api/admin/email/subscribers` - Get subscribers
- `GET /api/admin/email/subscribers/stats` - Get subscriber stats
- `GET /api/admin/email/templates` - Get email templates
- `POST /api/admin/email/templates` - Create template
- `PUT /api/admin/email/templates/:id` - Update template
- `DELETE /api/admin/email/templates/:id` - Delete template
- `GET /api/admin/email/campaigns` - Get campaigns
- `POST /api/admin/email/campaigns` - Create campaign
- `PUT /api/admin/email/campaigns/:id` - Update campaign
- `POST /api/admin/email/campaigns/:id/send` - Send campaign
- `GET /api/admin/email/analytics` - Get campaign analytics

#### Push Notifications
- `GET /api/admin/push/campaigns` - Get push campaigns
- `POST /api/admin/push/campaigns` - Create campaign
- `PUT /api/admin/push/campaigns/:id` - Update campaign
- `POST /api/admin/push/campaigns/:id/send` - Send campaign
- `POST /api/admin/push/send` - Send immediate notification
- `GET /api/admin/push/analytics` - Get push analytics

#### Marketing Automation
- `GET /api/admin/automation/rules` - Get automation rules
- `POST /api/admin/automation/rules` - Create rule
- `PUT /api/admin/automation/rules/:id` - Update rule
- `DELETE /api/admin/automation/rules/:id` - Delete rule
- `GET /api/admin/automation/logs` - Get execution logs

## Features

### 1. Blog System

**Admin Features:**
- Create, edit, and delete blog posts
- Rich text content with HTML support
- Upload thumbnail images
- Add tags and categories
- Schedule publishing
- SEO metadata (meta title, meta description)
- Draft/Published/Scheduled status
- View analytics (views, unique visitors, time spent)

**Public Features:**
- Browse published blogs
- Filter by category
- Search blogs
- View individual blog posts
- Automatic view tracking

### 2. Push Notifications

**Admin Features:**
- Send immediate push notifications
- Create scheduled campaigns
- Target specific audiences:
  - All users
  - Logged-in customers
  - VIP customers
  - Cart abandoners
- Add images and redirect URLs
- View campaign analytics (sent count, click rate)

**User Features:**
- Register for push notifications
- Receive browser notifications
- Click tracking

### 3. Email Marketing

**Admin Features:**
- Create email templates with variables
- Create email campaigns
- Target specific audiences:
  - All subscribers
  - Newsletter subscribers only
  - Customers only
  - VIP customers
  - Cart abandoners
- Schedule campaigns
- View analytics (open rate, click rate)
- Manage subscribers

**User Features:**
- Subscribe to newsletter
- Unsubscribe from emails
- Receive marketing emails

### 4. Marketing Automation

**Pre-configured Automations:**

1. **Welcome Email on Signup**
   - Trigger: User creates account
   - Action: Send welcome email with discount code
   - Status: Active by default

2. **Blog Notification**
   - Trigger: Blog is published
   - Action: Send email + push notification to all subscribers
   - Status: Active by default

3. **Abandoned Cart Reminder**
   - Trigger: Cart inactive for 2 hours
   - Action: Send reminder email
   - Status: Active by default
   - Background worker checks every 30 minutes

**Admin Features:**
- View all automation rules
- Enable/disable rules
- View execution logs
- Create custom automation rules

## Usage Guide

### For Admins

#### Creating a Blog Post

1. Navigate to **Marketing → Blogs**
2. Click **Create New Blog**
3. Fill in:
   - Title (auto-generates slug)
   - Content (HTML supported)
   - Thumbnail URL
   - Category
   - Tags
   - SEO metadata
4. Choose status:
   - **Draft** - Save without publishing
   - **Published** - Publish immediately
   - **Scheduled** - Set publish date
5. Click **Create Blog**

#### Sending an Email Campaign

1. Navigate to **Marketing → Email Campaigns**
2. Click **Create Campaign**
3. Fill in:
   - Campaign name
   - Subject line
   - Select template or write custom HTML
   - Choose audience
   - Optional: Schedule send time
4. Click **Create Campaign**
5. Click **Send** to send immediately

#### Sending Push Notifications

1. Navigate to **Marketing → Push Notifications**
2. Click **Send Notification**
3. Fill in:
   - Title (max 50 chars)
   - Message (max 150 chars)
   - Optional: Image URL
   - Optional: Redirect URL
   - Choose audience
4. Click **Send Now**

#### Managing Subscribers

1. Navigate to **Marketing → Subscribers**
2. View subscriber stats dashboard
3. Filter by status, source, or search
4. Export subscriber list (coming soon)

#### Managing Automation

1. Navigate to **Marketing → Automation**
2. View active automation rules
3. Enable/disable rules as needed
4. View execution logs in **Execution Logs** tab

### For Developers

#### Triggering Automation Programmatically

```javascript
const automationService = require('./modules/notifications/automation.service');

// Trigger on user signup
await automationService.triggerAutomation('user_signup', {
  user_id: userId,
  email: userEmail,
  name: userName,
  discount_code: 'WELCOME10'
});

// Trigger on blog publish
await automationService.triggerAutomation('blog_published', {
  blog_id: blogId,
  blog_title: blogTitle,
  blog_slug: blogSlug,
  blog_excerpt: excerpt
});

// Trigger on cart abandonment
await automationService.triggerAutomation('cart_abandoned', {
  user_id: userId,
  email: userEmail,
  customer_name: name,
  cart_value: value
});
```

#### Sending Custom Emails

```javascript
const emailService = require('./modules/email/email.service');

// Send using template
await emailService.sendTemplateEmail(
  'customer@example.com',
  'Welcome Email',
  {
    customer_name: 'John Doe',
    discount_code: 'WELCOME10'
  }
);

// Send custom email
await emailService.sendEmail(
  'customer@example.com',
  'Subject Line',
  '<html><body>Email content</body></html>'
);
```

#### Sending Push Notifications

```javascript
const pushService = require('./modules/notifications/push.service');

// Send to specific tokens
await pushService.sendPushNotification(
  ['token1', 'token2'],
  'Notification Title',
  'Notification message',
  {
    image: 'https://example.com/image.jpg',
    redirect_url: '/products'
  }
);
```

## Security

### Row Level Security (RLS)

All tables have RLS enabled with appropriate policies:

- **Blogs**: Public can view published blogs, admins can manage all
- **Push Tokens**: Users manage their own, admins view all
- **Email Subscribers**: Users manage their own subscription, admins manage all
- **Campaigns & Templates**: Admin-only access
- **Automation**: Admin-only access

### Authentication

All admin endpoints require:
1. Valid JWT token in Authorization header
2. Admin role verification via `requireAdmin` middleware

## Performance Considerations

### Background Workers

- **Cart Abandonment Worker**: Runs every 30 minutes
- Checks for carts inactive for 2+ hours
- Sends automated reminders

### Optimization Tips

1. **Email Campaigns**: Send in batches to avoid rate limits
2. **Push Notifications**: FCM batches up to 500 tokens per request
3. **Blog Views**: Uses database function for atomic increments
4. **Analytics**: Pre-computed views for faster queries

## Monitoring

### Analytics Available

**Blog Analytics:**
- Total views
- Unique visitors
- Average time spent
- Performance by category

**Email Analytics:**
- Sent count
- Open rate
- Click rate
- Bounce rate

**Push Analytics:**
- Sent count
- Click count
- Click rate

**Automation Logs:**
- Execution status
- Error messages
- Trigger data

## Troubleshooting

### Firebase Not Working

1. Check `FIREBASE_SERVICE_ACCOUNT` is set correctly
2. Verify JSON is valid single-line string
3. Check Firebase project has FCM enabled
4. Verify service account has necessary permissions

### Emails Not Sending

1. Check `RESEND_API_KEY` is set
2. Verify `RESEND_FROM_EMAIL` is verified in Resend dashboard
3. Check Resend API logs for errors
4. Verify email templates exist

### Automation Not Triggering

1. Check automation rules are active (`is_active = true`)
2. Verify trigger conditions are met
3. Check automation logs for errors
4. Ensure email templates and push settings are configured

### Cart Abandonment Not Working

1. Verify `abandoned_carts` table has `reminder_sent` column
2. Check worker is running (logs on server start)
3. Verify cart activity is being tracked
4. Check automation rule for `cart_abandoned` is active

## Best Practices

### Blog SEO

1. Always fill meta title and meta description
2. Use descriptive slugs
3. Add relevant tags
4. Use high-quality images
5. Write engaging content (500+ words)

### Email Marketing

1. Test templates before sending campaigns
2. Use personalization variables
3. Segment audiences appropriately
4. Monitor open and click rates
5. Clean bounced emails regularly

### Push Notifications

1. Keep titles under 50 characters
2. Keep messages under 150 characters
3. Use images for better engagement
4. Don't over-send (respect user attention)
5. Always include relevant redirect URLs

### Automation

1. Test automation rules before enabling
2. Monitor execution logs regularly
3. Set appropriate delays for follow-ups
4. Use meaningful rule names
5. Keep templates updated

## Future Enhancements

Potential improvements for future iterations:

1. **Rich Text Editor**: Integrate TipTap or EditorJS for blog content
2. **Email Builder**: Visual email template builder
3. **A/B Testing**: Test different email subjects and content
4. **Advanced Segmentation**: Custom audience filters
5. **Scheduled Automation**: Time-based triggers
6. **Analytics Dashboard**: Unified marketing analytics
7. **Export Features**: Export subscribers, campaign reports
8. **Webhook Integration**: Connect with external services
9. **SMS Marketing**: Add SMS campaigns
10. **Social Media Integration**: Auto-post blogs to social media

## API Examples

### Create a Blog Post

```bash
curl -X POST http://localhost:3000/api/admin/blogs \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "How to Care for Your Gold Jewellery",
    "slug": "how-to-care-for-gold-jewellery",
    "content": "<p>Your complete guide...</p>",
    "category": "Jewellery Care",
    "status": "published",
    "meta_title": "Gold Jewellery Care Guide",
    "meta_description": "Learn the best practices for maintaining your gold jewellery"
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

### Send Push Notification

```bash
curl -X POST http://localhost:3000/api/admin/push/send \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "New Collection Launch!",
    "message": "Check out our latest diamond collection",
    "image": "https://example.com/image.jpg",
    "redirect_url": "/products",
    "audience": "all"
  }'
```

## Support

For issues or questions:
1. Check automation logs in admin panel
2. Review server logs for errors
3. Verify environment variables are set correctly
4. Ensure database migrations ran successfully

## License

This module is part of the Aldorado Jewells e-commerce platform.
