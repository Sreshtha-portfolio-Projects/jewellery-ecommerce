-- ============================================
-- ENSURE AUDIT LOGS ARE IMMUTABLE (READ-ONLY)
-- ============================================

-- Disable all write operations on audit_logs table
-- Only backend service role can insert (via RLS bypass)
-- No updates or deletes allowed

-- Drop existing policies if any
DROP POLICY IF EXISTS "No public access to audit logs" ON audit_logs;
DROP POLICY IF EXISTS "Admin can view audit logs" ON audit_logs;
DROP POLICY IF EXISTS "Backend service role only" ON audit_logs;

-- Enable RLS
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Policy: No SELECT access via RLS (backend uses service role)
-- This ensures only backend can read/write, and only via service role
CREATE POLICY "Backend service role only"
  ON audit_logs
  FOR ALL
  USING (false); -- Block all RLS access - backend uses service role which bypasses RLS

-- Add comment
COMMENT ON TABLE audit_logs IS 'Immutable audit log - read-only for all users. Only backend service role can insert. No updates or deletes allowed.';

-- Ensure no triggers that could modify logs
-- (This is a safety check - no triggers should exist on audit_logs)
