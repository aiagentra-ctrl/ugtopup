-- ============================================================================
-- COMPLETE DATABASE MIGRATION FOR SELF-HOSTED SUPABASE
-- ============================================================================
-- Run this script on your self-hosted Supabase at https://supabase.aiagentra.com/
-- This will recreate the entire database structure including:
-- - Enum types, Tables, Indexes, RLS policies
-- - Functions, Triggers, Materialized views
-- - Storage buckets, Realtime configuration, Initial data
-- ============================================================================

-- ============================================================================
-- STEP 1: CREATE ENUM TYPES
-- ============================================================================

DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin', 'user', 'super_admin', 'sub_admin');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE public.activity_type AS ENUM (
    'payment_approved',
    'payment_rejected',
    'order_confirmed',
    'order_canceled',
    'order_created',
    'product_created',
    'product_updated',
    'product_deleted',
    'user_created',
    'user_updated',
    'role_assigned',
    'role_removed'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE public.order_status AS ENUM ('pending', 'confirmed', 'canceled', 'processing', 'completed');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE public.payment_status AS ENUM ('pending', 'confirmed', 'rejected');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE public.product_category AS ENUM (
    'freefire',
    'tiktok',
    'netflix',
    'garena',
    'youtube',
    'smilecoin',
    'chatgpt',
    'unipin',
    'mobile_legends',
    'roblox',
    'design',
    'pubg',
    'other'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- ============================================================================
-- STEP 2: CREATE TABLES
-- ============================================================================

-- Table: profiles
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid NOT NULL PRIMARY KEY,
  email text NOT NULL,
  username text,
  full_name text,
  avatar_url text,
  provider text,
  balance numeric NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Table: user_roles
CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role public.app_role NOT NULL DEFAULT 'user'::public.app_role,
  created_at timestamp with time zone DEFAULT now(),
  created_by uuid
);

-- Table: role_permissions
CREATE TABLE IF NOT EXISTS public.role_permissions (
  id uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  role public.app_role NOT NULL,
  permission text NOT NULL,
  description text,
  created_at timestamp with time zone DEFAULT now()
);

-- Table: products
CREATE TABLE IF NOT EXISTS public.products (
  id uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id text NOT NULL,
  name text NOT NULL,
  description text,
  category public.product_category NOT NULL,
  price numeric NOT NULL,
  original_price numeric,
  quantity integer,
  stock_status text DEFAULT 'in_stock'::text,
  is_active boolean DEFAULT true,
  image_url text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_by uuid,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Table: product_orders
CREATE TABLE IF NOT EXISTS public.product_orders (
  id uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number text NOT NULL,
  user_id uuid NOT NULL,
  user_email text NOT NULL,
  user_name text,
  product_category public.product_category NOT NULL,
  product_name text NOT NULL,
  package_name text NOT NULL,
  quantity numeric NOT NULL,
  price numeric NOT NULL,
  product_details jsonb NOT NULL DEFAULT '{}'::jsonb,
  status public.order_status NOT NULL DEFAULT 'pending'::public.order_status,
  payment_method text DEFAULT 'credit'::text,
  credits_deducted numeric DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  confirmed_at timestamp with time zone,
  completed_at timestamp with time zone,
  canceled_at timestamp with time zone,
  reviewed_by uuid,
  admin_remarks text,
  cancellation_reason text,
  metadata jsonb DEFAULT '{}'::jsonb
);

-- Table: payment_requests
CREATE TABLE IF NOT EXISTS public.payment_requests (
  id uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  user_email text NOT NULL,
  user_name text,
  amount numeric NOT NULL,
  credits numeric NOT NULL,
  remarks text,
  screenshot_url text,
  screenshot_path text,
  status public.payment_status NOT NULL DEFAULT 'pending'::public.payment_status,
  admin_remarks text,
  reviewed_by uuid,
  reviewed_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Table: payment_request_history
CREATE TABLE IF NOT EXISTS public.payment_request_history (
  id uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_request_id uuid,
  old_status public.payment_status,
  new_status public.payment_status,
  changed_by uuid,
  changed_at timestamp with time zone DEFAULT now(),
  remarks text
);

-- Table: activity_logs
CREATE TABLE IF NOT EXISTS public.activity_logs (
  id uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid,
  actor_email text,
  actor_role public.app_role,
  activity_type public.activity_type NOT NULL,
  action text NOT NULL,
  description text,
  target_type text,
  target_id uuid,
  metadata jsonb DEFAULT '{}'::jsonb,
  ip_address inet,
  user_agent text,
  created_at timestamp with time zone DEFAULT now()
);

-- ============================================================================
-- STEP 3: CREATE INDEXES
-- ============================================================================

CREATE UNIQUE INDEX IF NOT EXISTS profiles_email_key ON public.profiles USING btree (email);
CREATE INDEX IF NOT EXISTS profiles_username_idx ON public.profiles USING btree (username);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles USING btree (user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON public.user_roles USING btree (role);
CREATE UNIQUE INDEX IF NOT EXISTS user_roles_user_id_role_key ON public.user_roles USING btree (user_id, role);
CREATE INDEX IF NOT EXISTS idx_role_permissions_role ON public.role_permissions USING btree (role);
CREATE UNIQUE INDEX IF NOT EXISTS role_permissions_role_permission_key ON public.role_permissions USING btree (role, permission);
CREATE UNIQUE INDEX IF NOT EXISTS products_product_id_key ON public.products USING btree (product_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products USING btree (category);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON public.products USING btree (is_active);
CREATE UNIQUE INDEX IF NOT EXISTS product_orders_order_number_key ON public.product_orders USING btree (order_number);
CREATE INDEX IF NOT EXISTS idx_product_orders_user_id ON public.product_orders USING btree (user_id);
CREATE INDEX IF NOT EXISTS idx_product_orders_status ON public.product_orders USING btree (status);
CREATE INDEX IF NOT EXISTS idx_product_orders_category ON public.product_orders USING btree (product_category);
CREATE INDEX IF NOT EXISTS idx_product_orders_created_at ON public.product_orders USING btree (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payment_requests_user_id ON public.payment_requests USING btree (user_id);
CREATE INDEX IF NOT EXISTS idx_payment_requests_status ON public.payment_requests USING btree (status);
CREATE INDEX IF NOT EXISTS idx_payment_requests_created_at ON public.payment_requests USING btree (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_actor_id ON public.activity_logs USING btree (actor_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_activity_type ON public.activity_logs USING btree (activity_type);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON public.activity_logs USING btree (created_at DESC);

-- ============================================================================
-- STEP 4: ENABLE ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_request_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 5: CREATE SECURITY DEFINER FUNCTIONS
-- ============================================================================

-- Function: has_role (security definer to avoid RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
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

-- Function: is_admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(auth.uid(), 'admin')
      OR public.has_role(auth.uid(), 'super_admin')
      OR public.has_role(auth.uid(), 'sub_admin');
$$;

-- Function: is_super_admin
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(auth.uid(), 'super_admin');
$$;

-- Function: has_permission
CREATE OR REPLACE FUNCTION public.has_permission(_user_id uuid, _permission text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM user_roles ur
    JOIN role_permissions rp ON ur.role = rp.role
    WHERE ur.user_id = _user_id
    AND rp.permission = _permission
  )
$$;

-- Function: handle_new_user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, username, full_name, avatar_url, provider)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'username', SPLIT_PART(new.email, '@', 1)),
    COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    COALESCE(new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'picture'),
    CASE 
      WHEN new.raw_user_meta_data->>'provider' = 'google' THEN 'google'
      ELSE 'email'
    END
  );
  RETURN new;
END;
$$;

-- Function: handle_updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  new.updated_at = NOW();
  RETURN new;
END;
$$;

-- Function: handle_products_updated_at
CREATE OR REPLACE FUNCTION public.handle_products_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Function: approve_payment_request
CREATE OR REPLACE FUNCTION public.approve_payment_request(request_id uuid, admin_remarks_text text DEFAULT NULL::text)
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
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Only admins can approve payment requests';
  END IF;
  
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
  
  SELECT balance INTO old_balance
  FROM public.profiles
  WHERE id = request_record.user_id;
  
  UPDATE public.profiles
  SET balance = COALESCE(balance, 0) + request_record.credits
  WHERE id = request_record.user_id
  RETURNING balance INTO new_balance;
  
  UPDATE public.payment_requests
  SET 
    status = 'confirmed',
    reviewed_by = auth.uid(),
    reviewed_at = now(),
    admin_remarks = admin_remarks_text
  WHERE id = request_id;
  
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

-- Function: reject_payment_request
CREATE OR REPLACE FUNCTION public.reject_payment_request(request_id uuid, admin_remarks_text text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  request_record payment_requests%ROWTYPE;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Only admins can reject payment requests';
  END IF;
  
  IF admin_remarks_text IS NULL OR admin_remarks_text = '' THEN
    RAISE EXCEPTION 'Admin remarks are required when rejecting';
  END IF;
  
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
  
  UPDATE public.payment_requests
  SET 
    status = 'rejected',
    reviewed_by = auth.uid(),
    reviewed_at = now(),
    admin_remarks = admin_remarks_text
  WHERE id = request_id;
  
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

-- Function: confirm_order
CREATE OR REPLACE FUNCTION public.confirm_order(order_id uuid, admin_remarks_text text DEFAULT NULL::text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  order_record product_orders%ROWTYPE;
  user_balance numeric;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Only admins can confirm orders';
  END IF;
  
  SELECT * INTO order_record
  FROM product_orders
  WHERE id = order_id
  FOR UPDATE;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order not found';
  END IF;
  
  IF order_record.status != 'pending' THEN
    RAISE EXCEPTION 'Order is not pending (current status: %)', order_record.status;
  END IF;
  
  SELECT balance INTO user_balance
  FROM profiles
  WHERE id = order_record.user_id;
  
  IF user_balance < order_record.price THEN
    RAISE EXCEPTION 'Insufficient balance. User has % credits, order requires %', user_balance, order_record.price;
  END IF;
  
  UPDATE profiles
  SET balance = balance - order_record.price
  WHERE id = order_record.user_id;
  
  UPDATE product_orders
  SET 
    status = 'confirmed',
    reviewed_by = auth.uid(),
    confirmed_at = now(),
    updated_at = now(),
    admin_remarks = admin_remarks_text,
    credits_deducted = order_record.price
  WHERE id = order_id;
  
  INSERT INTO activity_logs (
    actor_id,
    actor_email,
    activity_type,
    action,
    description,
    target_type,
    target_id,
    metadata
  ) VALUES (
    auth.uid(),
    (SELECT email FROM auth.users WHERE id = auth.uid()),
    'order_confirmed',
    'Order Confirmed',
    format('Order %s confirmed. %s credits deducted from user %s', 
           order_record.order_number, order_record.price, order_record.user_email),
    'order',
    order_id,
    jsonb_build_object(
      'order_number', order_record.order_number,
      'credits_deducted', order_record.price,
      'product', order_record.product_name
    )
  );
  
  RETURN json_build_object(
    'success', true,
    'message', 'Order confirmed and credits deducted',
    'order_number', order_record.order_number,
    'credits_deducted', order_record.price,
    'new_balance', user_balance - order_record.price
  );
END;
$$;

-- Function: cancel_order
CREATE OR REPLACE FUNCTION public.cancel_order(order_id uuid, cancellation_reason_text text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  order_record product_orders%ROWTYPE;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Only admins can cancel orders';
  END IF;
  
  IF cancellation_reason_text IS NULL OR cancellation_reason_text = '' THEN
    RAISE EXCEPTION 'Cancellation reason is required';
  END IF;
  
  SELECT * INTO order_record
  FROM product_orders
  WHERE id = order_id
  FOR UPDATE;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order not found';
  END IF;
  
  IF order_record.status != 'pending' THEN
    RAISE EXCEPTION 'Only pending orders can be canceled (current status: %)', order_record.status;
  END IF;
  
  UPDATE product_orders
  SET 
    status = 'canceled',
    reviewed_by = auth.uid(),
    canceled_at = now(),
    updated_at = now(),
    cancellation_reason = cancellation_reason_text
  WHERE id = order_id;
  
  INSERT INTO activity_logs (
    actor_id,
    actor_email,
    activity_type,
    action,
    description,
    target_type,
    target_id,
    metadata
  ) VALUES (
    auth.uid(),
    (SELECT email FROM auth.users WHERE id = auth.uid()),
    'order_canceled',
    'Order Canceled',
    format('Order %s canceled. Reason: %s', order_record.order_number, cancellation_reason_text),
    'order',
    order_id,
    jsonb_build_object(
      'order_number', order_record.order_number,
      'reason', cancellation_reason_text,
      'product', order_record.product_name
    )
  );
  
  RETURN json_build_object(
    'success', true,
    'message', 'Order canceled',
    'order_number', order_record.order_number
  );
END;
$$;

-- Function: get_dashboard_stats
CREATE OR REPLACE FUNCTION public.get_dashboard_stats()
RETURNS TABLE(
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
  last_updated timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Only admins can view dashboard statistics';
  END IF;
  
  RETURN QUERY SELECT * FROM admin_dashboard_stats;
END;
$$;

-- Function: refresh_dashboard_stats
CREATE OR REPLACE FUNCTION public.refresh_dashboard_stats()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY admin_dashboard_stats;
END;
$$;

-- ============================================================================
-- STEP 6: CREATE TRIGGERS
-- ============================================================================

-- Trigger: on_auth_user_created
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger: set_payment_requests_updated_at
DROP TRIGGER IF EXISTS set_payment_requests_updated_at ON public.payment_requests;
CREATE TRIGGER set_payment_requests_updated_at
  BEFORE UPDATE ON public.payment_requests
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Trigger: update_product_orders_updated_at
DROP TRIGGER IF EXISTS update_product_orders_updated_at ON public.product_orders;
CREATE TRIGGER update_product_orders_updated_at
  BEFORE UPDATE ON public.product_orders
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Trigger: set_products_updated_at
DROP TRIGGER IF EXISTS set_products_updated_at ON public.products;
CREATE TRIGGER set_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.handle_products_updated_at();

-- Trigger: on_profile_updated
DROP TRIGGER IF EXISTS on_profile_updated ON public.profiles;
CREATE TRIGGER on_profile_updated
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================================
-- STEP 7: CREATE MATERIALIZED VIEW FOR DASHBOARD STATS
-- ============================================================================

DROP MATERIALIZED VIEW IF EXISTS public.admin_dashboard_stats;
CREATE MATERIALIZED VIEW public.admin_dashboard_stats AS
SELECT
  (SELECT COUNT(*) FROM public.profiles) AS total_users,
  (SELECT COUNT(*) FROM public.profiles WHERE created_at >= NOW() - INTERVAL '30 days') AS new_users_last_month,
  COALESCE((SELECT SUM(credits) FROM public.payment_requests WHERE status = 'confirmed'), 0) AS total_credits_added,
  COALESCE((SELECT SUM(credits_deducted) FROM public.product_orders WHERE status = 'confirmed'), 0) AS total_credits_spent,
  COALESCE((SELECT SUM(balance) FROM public.profiles), 0) AS total_balance_remaining,
  (SELECT COUNT(*) FROM public.payment_requests WHERE status = 'pending') AS pending_payment_requests,
  (SELECT COUNT(*) FROM public.payment_requests WHERE status = 'confirmed') AS confirmed_payment_requests,
  (SELECT COUNT(*) FROM public.payment_requests WHERE status = 'rejected') AS rejected_payment_requests,
  (SELECT COUNT(*) FROM public.product_orders) AS total_orders,
  (SELECT COUNT(*) FROM public.product_orders WHERE status = 'pending') AS pending_orders,
  (SELECT COUNT(*) FROM public.product_orders WHERE status = 'confirmed') AS confirmed_orders,
  (SELECT COUNT(*) FROM public.product_orders WHERE status = 'canceled') AS canceled_orders,
  COALESCE((SELECT SUM(price) FROM public.product_orders WHERE status = 'confirmed'), 0) AS total_revenue,
  NOW() AS last_updated;

CREATE UNIQUE INDEX IF NOT EXISTS admin_dashboard_stats_unique_idx ON public.admin_dashboard_stats ((1));

-- ============================================================================
-- STEP 8: CREATE RLS POLICIES
-- ============================================================================

-- Policies for profiles
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Policies for user_roles
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;
CREATE POLICY "Users can view own roles" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
CREATE POLICY "Admins can view all roles" ON public.user_roles
  FOR SELECT USING (public.is_admin());

DROP POLICY IF EXISTS "Only admins can manage roles" ON public.user_roles;
CREATE POLICY "Only admins can manage roles" ON public.user_roles
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Policies for role_permissions
DROP POLICY IF EXISTS "Only admins can view role permissions" ON public.role_permissions;
CREATE POLICY "Only admins can view role permissions" ON public.role_permissions
  FOR SELECT USING (public.is_admin());

DROP POLICY IF EXISTS "Only super admins can manage role permissions" ON public.role_permissions;
CREATE POLICY "Only super admins can manage role permissions" ON public.role_permissions
  FOR ALL USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());

-- Policies for products
DROP POLICY IF EXISTS "Anyone can view active products" ON public.products;
CREATE POLICY "Anyone can view active products" ON public.products
  FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Admins can manage products" ON public.products;
CREATE POLICY "Admins can manage products" ON public.products
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Policies for product_orders
DROP POLICY IF EXISTS "Users can view own orders" ON public.product_orders;
CREATE POLICY "Users can view own orders" ON public.product_orders
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create orders" ON public.product_orders;
CREATE POLICY "Users can create orders" ON public.product_orders
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all orders" ON public.product_orders;
CREATE POLICY "Admins can view all orders" ON public.product_orders
  FOR SELECT USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can update orders" ON public.product_orders;
CREATE POLICY "Admins can update orders" ON public.product_orders
  FOR UPDATE USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Policies for payment_requests
DROP POLICY IF EXISTS "Users can view own payment requests" ON public.payment_requests;
CREATE POLICY "Users can view own payment requests" ON public.payment_requests
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create payment requests" ON public.payment_requests;
CREATE POLICY "Users can create payment requests" ON public.payment_requests
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all payment requests" ON public.payment_requests;
CREATE POLICY "Admins can view all payment requests" ON public.payment_requests
  FOR SELECT USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can update payment requests" ON public.payment_requests;
CREATE POLICY "Admins can update payment requests" ON public.payment_requests
  FOR UPDATE USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Policies for payment_request_history
DROP POLICY IF EXISTS "Only admins can view history" ON public.payment_request_history;
CREATE POLICY "Only admins can view history" ON public.payment_request_history
  FOR SELECT USING (public.is_admin());

-- Policies for activity_logs
DROP POLICY IF EXISTS "Only admins can view activity logs" ON public.activity_logs;
CREATE POLICY "Only admins can view activity logs" ON public.activity_logs
  FOR SELECT USING (public.is_admin());

-- ============================================================================
-- STEP 9: SETUP REALTIME
-- ============================================================================

ALTER TABLE public.profiles REPLICA IDENTITY FULL;
ALTER TABLE public.payment_requests REPLICA IDENTITY FULL;
ALTER TABLE public.product_orders REPLICA IDENTITY FULL;

ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE public.payment_requests;
ALTER PUBLICATION supabase_realtime ADD TABLE public.product_orders;

-- ============================================================================
-- STEP 10: CREATE STORAGE BUCKET AND POLICIES
-- ============================================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('payment-screenshots', 'payment-screenshots', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Storage policies for payment-screenshots
DROP POLICY IF EXISTS "Authenticated users can upload own screenshots" ON storage.objects;
CREATE POLICY "Authenticated users can upload own screenshots"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'payment-screenshots' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "Users can view own screenshots" ON storage.objects;
CREATE POLICY "Users can view own screenshots"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'payment-screenshots' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "Admins can view all screenshots" ON storage.objects;
CREATE POLICY "Admins can view all screenshots"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'payment-screenshots' AND
  public.is_admin()
);

-- ============================================================================
-- STEP 11: INSERT INITIAL DATA
-- ============================================================================

-- Insert role permissions
INSERT INTO public.role_permissions (role, permission, description) VALUES
  ('admin', 'manage_orders', 'Can view and manage all orders'),
  ('admin', 'manage_payments', 'Can approve/reject payment requests'),
  ('admin', 'view_analytics', 'Can view dashboard analytics'),
  ('sub_admin', 'manage_orders', 'Can view and manage all orders'),
  ('sub_admin', 'manage_payments', 'Can approve/reject payment requests'),
  ('sub_admin', 'view_analytics', 'Can view dashboard analytics'),
  ('super_admin', 'manage_orders', 'Can view and manage all orders'),
  ('super_admin', 'manage_payments', 'Can approve/reject payment requests'),
  ('super_admin', 'view_analytics', 'Can view dashboard analytics')
ON CONFLICT (role, permission) DO NOTHING;

-- Insert sample products (PUBG Mobile UC)
INSERT INTO public.products (product_id, name, description, category, price, original_price, quantity, stock_status, is_active, metadata) VALUES
  ('pubg-uc-60', '60 UC', 'PUBG Mobile 60 UC', 'pubg', 100, 120, 1000, 'in_stock', true, '{"package_size": "60"}'),
  ('pubg-uc-325', '325 UC', 'PUBG Mobile 325 UC', 'pubg', 500, 600, 1000, 'in_stock', true, '{"package_size": "325"}'),
  ('pubg-uc-660', '660 UC', 'PUBG Mobile 660 UC', 'pubg', 1000, 1200, 1000, 'in_stock', true, '{"package_size": "660"}'),
  ('pubg-uc-1800', '1800 UC', 'PUBG Mobile 1800 UC', 'pubg', 2700, 3200, 1000, 'in_stock', true, '{"package_size": "1800"}'),
  ('pubg-uc-3850', '3850 UC', 'PUBG Mobile 3850 UC', 'pubg', 5500, 6500, 1000, 'in_stock', true, '{"package_size": "3850"}'),
  ('pubg-uc-8100', '8100 UC', 'PUBG Mobile 8100 UC', 'pubg', 11000, 13000, 1000, 'in_stock', true, '{"package_size": "8100"}'),
  ('pubg-uc-16200', '16200 UC', 'PUBG Mobile 16200 UC', 'pubg', 22000, 26000, 1000, 'in_stock', true, '{"package_size": "16200"}'),
  ('pubg-uc-24300', '24300 UC', 'PUBG Mobile 24300 UC', 'pubg', 33000, 39000, 1000, 'in_stock', true, '{"package_size": "24300"}'),
  ('pubg-uc-32400', '32400 UC', 'PUBG Mobile 32400 UC', 'pubg', 44000, 52000, 1000, 'in_stock', true, '{"package_size": "32400"}'),
  ('pubg-uc-40500', '40500 UC', 'PUBG Mobile 40500 UC', 'pubg', 55000, 65000, 1000, 'in_stock', true, '{"package_size": "40500"}')
ON CONFLICT (product_id) DO NOTHING;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- Refresh the materialized view
REFRESH MATERIALIZED VIEW public.admin_dashboard_stats;

-- Done! Your database is now ready to use.
