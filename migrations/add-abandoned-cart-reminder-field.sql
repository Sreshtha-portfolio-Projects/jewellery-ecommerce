-- Add reminder_sent field to abandoned_carts table if it doesn't exist
ALTER TABLE abandoned_carts 
ADD COLUMN IF NOT EXISTS reminder_sent BOOLEAN DEFAULT false;

-- Add index for efficient querying
CREATE INDEX IF NOT EXISTS idx_abandoned_carts_reminder_sent 
ON abandoned_carts(reminder_sent) 
WHERE reminder_sent = false;

-- Add function to increment blog views
CREATE OR REPLACE FUNCTION increment_blog_views(blog_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE blogs 
  SET views = COALESCE(views, 0) + 1 
  WHERE id = blog_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
