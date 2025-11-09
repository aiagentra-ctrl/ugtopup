-- Make payment-screenshots bucket public so screenshots can be viewed
UPDATE storage.buckets 
SET public = true 
WHERE id = 'payment-screenshots';

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow authenticated users to upload screenshots" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to view their own screenshots" ON storage.objects;
DROP POLICY IF EXISTS "Allow admins to view all screenshots" ON storage.objects;

-- Create new policies for payment-screenshots bucket
CREATE POLICY "Allow authenticated users to upload screenshots"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'payment-screenshots' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Allow users to view their own screenshots"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'payment-screenshots' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Allow admins to view all screenshots"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'payment-screenshots' 
  AND public.is_admin()
);