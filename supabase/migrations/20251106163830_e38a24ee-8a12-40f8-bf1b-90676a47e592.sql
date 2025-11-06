-- Fix security issues from Phase 1B

-- 1. Enable RLS on role_permissions table
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;

-- Only admins can view role permissions
CREATE POLICY "Only admins can view role permissions"
ON role_permissions FOR SELECT
TO authenticated
USING (public.is_admin());

-- Only super admins can modify role permissions
CREATE POLICY "Only super admins can manage role permissions"
ON role_permissions FOR ALL
TO authenticated
USING (public.is_super_admin())
WITH CHECK (public.is_super_admin());

-- 2. Secure the materialized view by revoking public access
REVOKE ALL ON admin_dashboard_stats FROM anon, authenticated;

-- Grant access only to authenticated users (will be filtered by function)
GRANT SELECT ON admin_dashboard_stats TO authenticated;

-- Create RLS-like wrapper function for the materialized view
CREATE OR REPLACE FUNCTION get_dashboard_stats()
RETURNS TABLE (
  total_users bigint,
  new_users_last_month bigint,
  total_credits_added numeric,
  total_credits_spent numeric,
  total_balance_remaining numeric,
  pending_payment_requests bigint,
  confirmed_payment_requests bigint,
  rejected_payment_requests bigint,
  total_orders bigint,
  pending_orders bigint,
  confirmed_orders bigint,
  canceled_orders bigint,
  total_revenue numeric,
  last_updated timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only admins can access dashboard stats
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Only admins can view dashboard statistics';
  END IF;
  
  RETURN QUERY SELECT * FROM admin_dashboard_stats;
END;
$$;