-- Create function to get storage usage stats
CREATE OR REPLACE FUNCTION public.get_storage_usage()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'storage'
AS $$
DECLARE
  result json;
BEGIN
  -- Check admin permission
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Only admins can view storage usage';
  END IF;
  
  -- Query storage.objects for payment-screenshots bucket
  SELECT json_build_object(
    'total_bytes', COALESCE(SUM((metadata->>'size')::bigint), 0),
    'file_count', COUNT(*)
  ) INTO result
  FROM storage.objects
  WHERE bucket_id = 'payment-screenshots';
  
  RETURN result;
END;
$$;