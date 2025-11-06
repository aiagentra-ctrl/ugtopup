-- =====================================================
-- PAYMENT REQUEST SYSTEM WITH ADMIN APPROVAL
-- =====================================================

-- 1. Create app_role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- 2. Create user_roles table
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'user',
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  UNIQUE(user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 3. Create security definer functions for role checking
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(auth.uid(), 'admin');
$$;

-- 4. RLS Policies for user_roles
CREATE POLICY "Users can view own roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (public.is_admin());

CREATE POLICY "Only admins can manage roles"
ON public.user_roles FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- 5. Create payment_status enum
CREATE TYPE public.payment_status AS ENUM ('pending', 'confirmed', 'rejected');

-- 6. Create payment_requests table
CREATE TABLE public.payment_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Request details
  amount numeric NOT NULL CHECK (amount > 0 AND amount <= 100000),
  credits numeric NOT NULL CHECK (credits > 0 AND credits <= 100000),
  remarks text,
  
  -- Screenshot/proof
  screenshot_url text,
  screenshot_path text,
  
  -- Status tracking
  status payment_status NOT NULL DEFAULT 'pending',
  
  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  -- Admin action tracking
  reviewed_by uuid REFERENCES auth.users(id),
  reviewed_at timestamptz,
  admin_remarks text,
  
  -- Metadata
  user_email text NOT NULL,
  user_name text
);

ALTER TABLE public.payment_requests ENABLE ROW LEVEL SECURITY;

-- Add indexes for faster queries
CREATE INDEX idx_payment_requests_user_id ON public.payment_requests(user_id);
CREATE INDEX idx_payment_requests_status ON public.payment_requests(status);
CREATE INDEX idx_payment_requests_created_at ON public.payment_requests(created_at DESC);

-- 7. RLS Policies for payment_requests
CREATE POLICY "Users can view own payment requests"
ON public.payment_requests FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can create payment requests"
ON public.payment_requests FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all payment requests"
ON public.payment_requests FOR SELECT
TO authenticated
USING (public.is_admin());

CREATE POLICY "Admins can update payment requests"
ON public.payment_requests FOR UPDATE
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- 8. Trigger for updated_at
CREATE TRIGGER set_payment_requests_updated_at
BEFORE UPDATE ON public.payment_requests
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- 9. Create payment_request_history table
CREATE TABLE public.payment_request_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_request_id uuid REFERENCES public.payment_requests(id) ON DELETE CASCADE,
  
  -- What changed
  old_status payment_status,
  new_status payment_status,
  
  -- Who made the change
  changed_by uuid REFERENCES auth.users(id),
  changed_at timestamptz DEFAULT now(),
  
  -- Additional context
  remarks text
);

ALTER TABLE public.payment_request_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admins can view history"
ON public.payment_request_history FOR SELECT
TO authenticated
USING (public.is_admin());

-- 10. Create storage bucket for screenshots
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'payment-screenshots',
  'payment-screenshots',
  false,
  2097152,
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
);

-- 11. Storage RLS Policies
CREATE POLICY "Users can upload own screenshots"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'payment-screenshots' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view own screenshots"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'payment-screenshots' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Admins can view all screenshots"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'payment-screenshots' 
  AND public.is_admin()
);

CREATE POLICY "Users can delete own screenshots"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'payment-screenshots' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- 12. Function to approve payment request
CREATE OR REPLACE FUNCTION public.approve_payment_request(
  request_id uuid,
  admin_remarks_text text DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  request_record payment_requests%ROWTYPE;
  old_balance numeric;
  new_balance numeric;
BEGIN
  -- Check if user is admin
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Only admins can approve payment requests';
  END IF;
  
  -- Get the payment request
  SELECT * INTO request_record
  FROM public.payment_requests
  WHERE id = request_id
  FOR UPDATE;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Payment request not found';
  END IF;
  
  IF request_record.status != 'pending' THEN
    RAISE EXCEPTION 'Payment request is not pending (current status: %)', request_record.status;
  END IF;
  
  -- Get current balance
  SELECT balance INTO old_balance
  FROM public.profiles
  WHERE id = request_record.user_id;
  
  -- Add credits to user balance
  UPDATE public.profiles
  SET balance = COALESCE(balance, 0) + request_record.credits
  WHERE id = request_record.user_id
  RETURNING balance INTO new_balance;
  
  -- Update payment request status
  UPDATE public.payment_requests
  SET 
    status = 'confirmed',
    reviewed_by = auth.uid(),
    reviewed_at = now(),
    admin_remarks = admin_remarks_text
  WHERE id = request_id;
  
  -- Log the change in history
  INSERT INTO public.payment_request_history (
    payment_request_id,
    old_status,
    new_status,
    changed_by,
    remarks
  ) VALUES (
    request_id,
    'pending',
    'confirmed',
    auth.uid(),
    admin_remarks_text
  );
  
  RETURN json_build_object(
    'success', true,
    'message', 'Payment request approved',
    'old_balance', old_balance,
    'new_balance', new_balance,
    'credits_added', request_record.credits
  );
END;
$$;

-- 13. Function to reject payment request
CREATE OR REPLACE FUNCTION public.reject_payment_request(
  request_id uuid,
  admin_remarks_text text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  request_record payment_requests%ROWTYPE;
BEGIN
  -- Check if user is admin
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Only admins can reject payment requests';
  END IF;
  
  IF admin_remarks_text IS NULL OR admin_remarks_text = '' THEN
    RAISE EXCEPTION 'Admin remarks are required when rejecting';
  END IF;
  
  -- Get the payment request
  SELECT * INTO request_record
  FROM public.payment_requests
  WHERE id = request_id
  FOR UPDATE;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Payment request not found';
  END IF;
  
  IF request_record.status != 'pending' THEN
    RAISE EXCEPTION 'Payment request is not pending (current status: %)', request_record.status;
  END IF;
  
  -- Update payment request status
  UPDATE public.payment_requests
  SET 
    status = 'rejected',
    reviewed_by = auth.uid(),
    reviewed_at = now(),
    admin_remarks = admin_remarks_text
  WHERE id = request_id;
  
  -- Log the change in history
  INSERT INTO public.payment_request_history (
    payment_request_id,
    old_status,
    new_status,
    changed_by,
    remarks
  ) VALUES (
    request_id,
    'pending',
    'rejected',
    auth.uid(),
    admin_remarks_text
  );
  
  RETURN json_build_object(
    'success', true,
    'message', 'Payment request rejected',
    'reason', admin_remarks_text
  );
END;
$$;