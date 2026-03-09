-- Marketing System Database Schema
-- This migration adds tables for blogs, push notifications, email marketing, and subscribers

-- ============================================
-- 1. BLOG SYSTEM
-- ============================================

-- Blog posts table
CREATE TABLE IF NOT EXISTS blogs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  content TEXT NOT NULL,
  thumbnail TEXT,
  tags TEXT[],
  category TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'scheduled')),
  publish_date TIMESTAMPTZ,
  meta_title TEXT,
  meta_description TEXT,
  author_id UUID REFERENCES auth.users(id),
  views INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Blog categories table
CREATE TABLE IF NOT EXISTS blog_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for blogs
CREATE INDEX IF NOT EXISTS idx_blogs_slug ON blogs(slug);
CREATE INDEX IF NOT EXISTS idx_blogs_status ON blogs(status);
CREATE INDEX IF NOT EXISTS idx_blogs_publish_date ON blogs(publish_date);
CREATE INDEX IF NOT EXISTS idx_blogs_category ON blogs(category);
CREATE INDEX IF NOT EXISTS idx_blogs_created_at ON blogs(created_at DESC);

-- ============================================
-- 2. PUSH NOTIFICATION SYSTEM
-- ============================================

-- Push notification tokens table
CREATE TABLE IF NOT EXISTS push_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  token TEXT UNIQUE NOT NULL,
  device TEXT,
  browser TEXT,
  os TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_used_at TIMESTAMPTZ DEFAULT NOW()
);

-- Push notification campaigns table
CREATE TABLE IF NOT EXISTS push_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  image TEXT,
  redirect_url TEXT,
  audience TEXT NOT NULL CHECK (audience IN ('all', 'logged_in', 'vip', 'cart_abandoners', 'custom')),
  custom_audience_filter JSONB,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'sent', 'failed')),
  scheduled_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  sent_count INTEGER DEFAULT 0,
  click_count INTEGER DEFAULT 0,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Push notification logs (track individual sends)
CREATE TABLE IF NOT EXISTS push_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES push_campaigns(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  token_id UUID REFERENCES push_tokens(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('sent', 'failed', 'clicked')),
  error_message TEXT,
  clicked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for push notifications
CREATE INDEX IF NOT EXISTS idx_push_tokens_user_id ON push_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_push_tokens_active ON push_tokens(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_push_campaigns_status ON push_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_push_campaigns_scheduled ON push_campaigns(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_push_logs_campaign ON push_logs(campaign_id);

-- ============================================
-- 3. EMAIL MARKETING SYSTEM
-- ============================================

-- Email subscribers table
CREATE TABLE IF NOT EXISTS email_subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'unsubscribed', 'bounced')),
  source TEXT CHECK (source IN ('signup', 'newsletter', 'checkout', 'manual')),
  tags TEXT[],
  metadata JSONB,
  subscribed_at TIMESTAMPTZ DEFAULT NOW(),
  unsubscribed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Email templates table
CREATE TABLE IF NOT EXISTS email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  subject TEXT NOT NULL,
  html TEXT NOT NULL,
  variables JSONB,
  category TEXT,
  is_system BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Email campaigns table
CREATE TABLE IF NOT EXISTS email_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  template_id UUID REFERENCES email_templates(id) ON DELETE SET NULL,
  html_content TEXT,
  audience TEXT NOT NULL CHECK (audience IN ('all', 'subscribers', 'customers', 'vip', 'cart_abandoners', 'custom')),
  custom_audience_filter JSONB,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'sending', 'sent', 'failed')),
  scheduled_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  sent_count INTEGER DEFAULT 0,
  opened_count INTEGER DEFAULT 0,
  clicked_count INTEGER DEFAULT 0,
  bounced_count INTEGER DEFAULT 0,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Email logs (track individual sends)
CREATE TABLE IF NOT EXISTS email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES email_campaigns(id) ON DELETE CASCADE,
  subscriber_id UUID REFERENCES email_subscribers(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('sent', 'delivered', 'opened', 'clicked', 'bounced', 'failed')),
  error_message TEXT,
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for email marketing
CREATE INDEX IF NOT EXISTS idx_email_subscribers_email ON email_subscribers(email);
CREATE INDEX IF NOT EXISTS idx_email_subscribers_status ON email_subscribers(status);
CREATE INDEX IF NOT EXISTS idx_email_subscribers_user_id ON email_subscribers(user_id);
CREATE INDEX IF NOT EXISTS idx_email_campaigns_status ON email_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_email_campaigns_scheduled ON email_campaigns(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_email_logs_campaign ON email_logs(campaign_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_subscriber ON email_logs(subscriber_id);

-- ============================================
-- 4. MARKETING AUTOMATION
-- ============================================

-- Automation rules table
CREATE TABLE IF NOT EXISTS marketing_automation_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  trigger_type TEXT NOT NULL CHECK (trigger_type IN ('user_signup', 'blog_published', 'cart_abandoned', 'order_completed', 'custom')),
  action_type TEXT NOT NULL CHECK (action_type IN ('send_email', 'send_push', 'both')),
  email_template_id UUID REFERENCES email_templates(id) ON DELETE SET NULL,
  push_title TEXT,
  push_message TEXT,
  push_image TEXT,
  push_redirect_url TEXT,
  conditions JSONB,
  delay_minutes INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Automation execution logs
CREATE TABLE IF NOT EXISTS automation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_id UUID REFERENCES marketing_automation_rules(id) ON DELETE CASCADE,
  trigger_data JSONB,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'executed', 'failed', 'skipped')),
  error_message TEXT,
  executed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for automation
CREATE INDEX IF NOT EXISTS idx_automation_rules_active ON marketing_automation_rules(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_automation_logs_rule ON automation_logs(rule_id);
CREATE INDEX IF NOT EXISTS idx_automation_logs_status ON automation_logs(status);

-- ============================================
-- 5. ANALYTICS & TRACKING
-- ============================================

-- Blog analytics table
CREATE TABLE IF NOT EXISTS blog_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blog_id UUID REFERENCES blogs(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id TEXT,
  event_type TEXT NOT NULL CHECK (event_type IN ('view', 'share', 'time_spent')),
  time_spent_seconds INTEGER,
  referrer TEXT,
  device TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_blog_analytics_blog_id ON blog_analytics(blog_id);
CREATE INDEX IF NOT EXISTS idx_blog_analytics_event_type ON blog_analytics(event_type);
CREATE INDEX IF NOT EXISTS idx_blog_analytics_created_at ON blog_analytics(created_at DESC);

-- ============================================
-- 6. ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE blogs ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketing_automation_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_analytics ENABLE ROW LEVEL SECURITY;

-- Blogs: Public read for published blogs, admin write
CREATE POLICY "Public can view published blogs" ON blogs
  FOR SELECT USING (status = 'published' AND (publish_date IS NULL OR publish_date <= NOW()));

CREATE POLICY "Admins can manage all blogs" ON blogs
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Blog categories: Public read, admin write
CREATE POLICY "Public can view blog categories" ON blog_categories
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage blog categories" ON blog_categories
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Push tokens: Users can manage their own tokens
CREATE POLICY "Users can manage their own push tokens" ON push_tokens
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all push tokens" ON push_tokens
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Push campaigns: Admin only
CREATE POLICY "Admins can manage push campaigns" ON push_campaigns
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Push logs: Admin only
CREATE POLICY "Admins can view push logs" ON push_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Email subscribers: Users can manage their own subscription
CREATE POLICY "Users can manage their own subscription" ON email_subscribers
  FOR ALL USING (auth.uid() = user_id OR email = (SELECT email FROM auth.users WHERE id = auth.uid()));

CREATE POLICY "Admins can manage all subscribers" ON email_subscribers
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Email templates: Admin only
CREATE POLICY "Admins can manage email templates" ON email_templates
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Email campaigns: Admin only
CREATE POLICY "Admins can manage email campaigns" ON email_campaigns
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Email logs: Admin only
CREATE POLICY "Admins can view email logs" ON email_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Marketing automation: Admin only
CREATE POLICY "Admins can manage automation rules" ON marketing_automation_rules
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can view automation logs" ON automation_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Blog analytics: Admin only
CREATE POLICY "Admins can view blog analytics" ON blog_analytics
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Anyone can insert blog analytics" ON blog_analytics
  FOR INSERT WITH CHECK (true);

-- ============================================
-- 7. FUNCTIONS & TRIGGERS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_blogs_updated_at BEFORE UPDATE ON blogs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_email_templates_updated_at BEFORE UPDATE ON email_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_email_campaigns_updated_at BEFORE UPDATE ON email_campaigns
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_push_campaigns_updated_at BEFORE UPDATE ON push_campaigns
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_automation_rules_updated_at BEFORE UPDATE ON marketing_automation_rules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to auto-generate slug from title
CREATE OR REPLACE FUNCTION generate_slug_from_title()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    NEW.slug := lower(regexp_replace(regexp_replace(NEW.title, '[^a-zA-Z0-9\s-]', '', 'g'), '\s+', '-', 'g'));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER generate_blog_slug BEFORE INSERT ON blogs
  FOR EACH ROW EXECUTE FUNCTION generate_slug_from_title();

CREATE TRIGGER generate_blog_category_slug BEFORE INSERT ON blog_categories
  FOR EACH ROW EXECUTE FUNCTION generate_slug_from_title();

-- ============================================
-- 8. DEFAULT DATA
-- ============================================

-- Insert default blog categories
INSERT INTO blog_categories (name, slug, description) VALUES
  ('Jewellery Care', 'jewellery-care', 'Tips and guides for maintaining your precious jewellery'),
  ('Style Guide', 'style-guide', 'Fashion and styling tips for jewellery'),
  ('Industry News', 'industry-news', 'Latest trends and news in the jewellery industry'),
  ('Behind the Scenes', 'behind-the-scenes', 'Stories about our craftsmanship and process'),
  ('Gift Ideas', 'gift-ideas', 'Perfect jewellery gifts for every occasion')
ON CONFLICT (slug) DO NOTHING;

-- Insert default email templates
INSERT INTO email_templates (name, subject, html, variables, category, is_system) VALUES
  (
    'Welcome Email',
    'Welcome to Aldorado Jewells - {{discount_code}}',
    '<html><body><h1>Welcome {{customer_name}}!</h1><p>Thank you for joining Aldorado Jewells. Here''s a special discount code for you: <strong>{{discount_code}}</strong></p><p>Use it on your first purchase to get 10% off!</p></body></html>',
    '{"customer_name": "string", "discount_code": "string"}',
    'transactional',
    true
  ),
  (
    'New Blog Notification',
    'New Blog Post: {{blog_title}}',
    '<html><body><h1>New Blog Post</h1><h2>{{blog_title}}</h2><p>{{blog_excerpt}}</p><a href="{{blog_url}}">Read More</a></body></html>',
    '{"blog_title": "string", "blog_excerpt": "string", "blog_url": "string"}',
    'marketing',
    true
  ),
  (
    'Abandoned Cart Reminder',
    'You left something beautiful behind...',
    '<html><body><h1>Your cart is waiting</h1><p>Hi {{customer_name}},</p><p>You left some items in your cart. Complete your purchase now!</p><a href="{{cart_url}}">View Cart</a></body></html>',
    '{"customer_name": "string", "cart_url": "string"}',
    'transactional',
    true
  )
ON CONFLICT (name) DO NOTHING;

-- Insert default automation rules
INSERT INTO marketing_automation_rules (name, trigger_type, action_type, email_template_id, is_active) VALUES
  (
    'Welcome Email on Signup',
    'user_signup',
    'send_email',
    (SELECT id FROM email_templates WHERE name = 'Welcome Email' LIMIT 1),
    true
  ),
  (
    'Blog Notification',
    'blog_published',
    'both',
    (SELECT id FROM email_templates WHERE name = 'New Blog Notification' LIMIT 1),
    true
  ),
  (
    'Abandoned Cart Email',
    'cart_abandoned',
    'send_email',
    (SELECT id FROM email_templates WHERE name = 'Abandoned Cart Reminder' LIMIT 1),
    true
  )
ON CONFLICT DO NOTHING;

-- Update automation rules with push notification details
UPDATE marketing_automation_rules 
SET 
  push_title = 'New Blog Post!',
  push_message = 'Check out our latest article on jewellery care and styling tips.',
  push_redirect_url = '/blog'
WHERE trigger_type = 'blog_published';

-- ============================================
-- 9. VIEWS FOR ANALYTICS
-- ============================================

-- Email campaign analytics view
CREATE OR REPLACE VIEW email_campaign_analytics AS
SELECT 
  ec.id,
  ec.name,
  ec.subject,
  ec.status,
  ec.sent_count,
  ec.opened_count,
  ec.clicked_count,
  ec.bounced_count,
  CASE 
    WHEN ec.sent_count > 0 THEN ROUND((ec.opened_count::NUMERIC / ec.sent_count) * 100, 2)
    ELSE 0
  END AS open_rate,
  CASE 
    WHEN ec.sent_count > 0 THEN ROUND((ec.clicked_count::NUMERIC / ec.sent_count) * 100, 2)
    ELSE 0
  END AS click_rate,
  ec.sent_at,
  ec.created_at
FROM email_campaigns ec;

-- Push campaign analytics view
CREATE OR REPLACE VIEW push_campaign_analytics AS
SELECT 
  pc.id,
  pc.title,
  pc.status,
  pc.sent_count,
  pc.click_count,
  CASE 
    WHEN pc.sent_count > 0 THEN ROUND((pc.click_count::NUMERIC / pc.sent_count) * 100, 2)
    ELSE 0
  END AS click_rate,
  pc.sent_at,
  pc.created_at
FROM push_campaigns pc;

-- Blog performance view
CREATE OR REPLACE VIEW blog_performance AS
SELECT 
  b.id,
  b.title,
  b.slug,
  b.category,
  b.views,
  b.publish_date,
  COUNT(DISTINCT ba.user_id) AS unique_visitors,
  AVG(ba.time_spent_seconds) AS avg_time_spent,
  b.created_at
FROM blogs b
LEFT JOIN blog_analytics ba ON b.id = ba.blog_id AND ba.event_type = 'view'
WHERE b.status = 'published'
GROUP BY b.id, b.title, b.slug, b.category, b.views, b.publish_date, b.created_at;

-- ============================================
-- GRANT PERMISSIONS
-- ============================================

-- Grant necessary permissions (adjust based on your Supabase setup)
-- These are handled by RLS policies above
