-- Add RLS policy for activity_logs to allow admins to view logs
CREATE POLICY "Admins can view activity logs"
ON public.activity_logs FOR SELECT
USING (public.is_admin());

-- Add RLS policy for storage.objects to allow admins to query metadata
CREATE POLICY "Admins can view storage objects metadata"
ON storage.objects FOR SELECT
USING (public.is_admin());