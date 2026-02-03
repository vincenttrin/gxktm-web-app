-- ============================================================
-- Role-Based Access Control (RBAC) Setup for GXKTM Application
-- ============================================================
-- This SQL script sets up user roles using Supabase's built-in
-- auth.users metadata field. No custom tables needed!
--
-- Run this in your Supabase SQL Editor
-- ============================================================

-- ============================================================
-- PART 1: Helper Function to Get User Role
-- ============================================================
-- This function extracts the role from the JWT token's user metadata
-- It can be used in RLS policies to check user roles

CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT AS $$
BEGIN
  -- Extract role from the JWT claims (user_metadata)
  -- Returns 'user' as default if no role is set
  RETURN COALESCE(
    (current_setting('request.jwt.claims', true)::json->'user_metadata'->>'role'),
    'user'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_user_role() TO authenticated;


-- ============================================================
-- PART 2: Helper Function to Check if User is Admin
-- ============================================================

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN public.get_user_role() = 'admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;


-- ============================================================
-- PART 3: Update Existing Users to Have Default Role
-- ============================================================
-- This updates all existing users who don't have a role set
-- to have the default 'user' role

-- Note: This requires service_role access and should be run
-- in Supabase SQL Editor with proper permissions

UPDATE auth.users
SET raw_user_meta_data = 
  COALESCE(raw_user_meta_data, '{}'::jsonb) || '{"role": "user"}'::jsonb
WHERE raw_user_meta_data->>'role' IS NULL;


-- ============================================================
-- PART 4: Example RLS Policies (Optional)
-- ============================================================
-- Uncomment and modify these if you want database-level
-- role-based access control on specific tables

/*
-- Example: Only admins can delete families
CREATE POLICY "Admins can delete families"
  ON families FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- Example: Only admins can modify school years
CREATE POLICY "Admins can manage school years"
  ON school_years FOR ALL
  TO authenticated
  USING (public.is_admin());

-- Example: Users can only view their own family data
CREATE POLICY "Users can view own family"
  ON families FOR SELECT
  TO authenticated
  USING (
    public.is_admin() OR 
    id IN (
      SELECT family_id FROM guardians 
      WHERE email = auth.jwt()->>'email'
    )
  );
*/


-- ============================================================
-- PART 5: Admin Management Function (Optional)
-- ============================================================
-- Function to promote/demote users (requires service_role)
-- This is for documentation - use Supabase Dashboard instead

/*
-- To set a user as admin via SQL:
UPDATE auth.users
SET raw_user_meta_data = 
  COALESCE(raw_user_meta_data, '{}'::jsonb) || '{"role": "admin"}'::jsonb
WHERE email = 'admin@example.com';

-- To demote back to user:
UPDATE auth.users
SET raw_user_meta_data = 
  COALESCE(raw_user_meta_data, '{}'::jsonb) || '{"role": "user"}'::jsonb
WHERE email = 'admin@example.com';
*/

