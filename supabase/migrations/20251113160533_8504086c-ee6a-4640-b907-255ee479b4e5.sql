-- Fix function search paths for security
-- Update all functions to have immutable search_path

-- Drop and recreate functions with proper search_path using CASCADE
DROP FUNCTION IF EXISTS public.has_role(uuid, app_role) CASCADE;
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

DROP FUNCTION IF EXISTS public.has_permission(uuid, text) CASCADE;
CREATE OR REPLACE FUNCTION public.has_permission(_user_id uuid, _permission text)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM user_roles ur
    JOIN role_permissions rp ON ur.role = rp.role
    WHERE ur.user_id = _user_id
    AND rp.permission = _permission
  )
$$;

DROP FUNCTION IF EXISTS public.is_super_admin() CASCADE;
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
  SELECT public.has_role(auth.uid(), 'super_admin');
$$;

DROP FUNCTION IF EXISTS public.is_admin() CASCADE;
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
  SELECT public.has_role(auth.uid(), 'admin')
      OR public.has_role(auth.uid(), 'super_admin')
      OR public.has_role(auth.uid(), 'sub_admin');
$$;

-- Recreate the RLS policies that were dropped due to CASCADE
-- Policy for role_permissions table
DROP POLICY IF EXISTS "Only super admins can manage role permissions" ON public.role_permissions;
CREATE POLICY "Only super admins can manage role permissions" 
ON public.role_permissions
FOR ALL
USING (public.is_super_admin())
WITH CHECK (public.is_super_admin());

-- Revoke direct access to materialized view to prevent exposure
REVOKE ALL ON admin_dashboard_stats FROM anon, authenticated;

-- Only allow access through the RPC function
GRANT EXECUTE ON FUNCTION public.get_dashboard_stats() TO authenticated;