-- ============================================
-- Fix infinite recursion in user_roles RLS policies
-- ============================================
-- Problem: Old policies check user_roles to see if user is admin,
--          causing infinite recursion when trying to read user_roles
-- Solution: Simplify policies - backend uses service_role which bypasses RLS anyway
-- ============================================

-- STEP 1: Drop all existing policies on user_roles
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Admins can view all roles" ON user_roles;
  DROP POLICY IF EXISTS "Users can view own roles" ON user_roles;
  DROP POLICY IF EXISTS "Admins can insert roles" ON user_roles;
  DROP POLICY IF EXISTS "Admins can update roles" ON user_roles;
  DROP POLICY IF EXISTS "Admins can delete roles" ON user_roles;
END $$;

-- STEP 2: Create simple policy - users can only view their own roles
CREATE POLICY "Users can view own roles"
  ON user_roles FOR SELECT
  USING (user_id = auth.uid());

-- STEP 3: Keep RLS enabled (service_role key bypasses it)
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- STEP 4: Verify the fix worked
SELECT ur.id, ur.user_id, ur.role, u.email, ur.granted_at
FROM user_roles ur
JOIN auth.users u ON ur.user_id = u.id
WHERE u.email = 'sreshtha.mechlin@gmail.com';

-- You should see the admin role for sreshtha.mechlin@gmail.com
-- Now try the admin login again - it should work!
