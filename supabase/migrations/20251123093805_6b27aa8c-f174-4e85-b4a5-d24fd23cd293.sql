-- Function to safely delete payment requests (admin only)
CREATE OR REPLACE FUNCTION public.delete_payment_request(request_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  request_record payment_requests%ROWTYPE;
BEGIN
  -- Check admin permission
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Only admins can delete payment requests';
  END IF;
  
  -- Get the payment request
  SELECT * INTO request_record
  FROM public.payment_requests
  WHERE id = request_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Payment request not found';
  END IF;
  
  -- Delete the record
  DELETE FROM public.payment_requests
  WHERE id = request_id;
  
  -- Log the deletion
  INSERT INTO public.activity_logs (
    actor_id, actor_email, activity_type, action, description, target_type, target_id, metadata
  ) VALUES (
    auth.uid(),
    (SELECT email FROM auth.users WHERE id = auth.uid()),
    'admin_action',
    'Payment Request Deleted',
    FORMAT('Payment request from %s deleted (Amount: %s, Credits: %s, Status: %s)', 
      request_record.user_email, request_record.amount, request_record.credits, request_record.status),
    'payment_request',
    request_id,
    jsonb_build_object(
      'user_email', request_record.user_email,
      'amount', request_record.amount,
      'credits', request_record.credits,
      'status', request_record.status,
      'screenshot_path', request_record.screenshot_path
    )
  );
  
  RETURN json_build_object(
    'success', true,
    'message', 'Payment request deleted successfully',
    'screenshot_path', request_record.screenshot_path
  );
END;
$$;

-- Storage policy: Allow admins to delete screenshots
CREATE POLICY "Admins can delete payment screenshots"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'payment-screenshots' AND
  public.is_admin()
);