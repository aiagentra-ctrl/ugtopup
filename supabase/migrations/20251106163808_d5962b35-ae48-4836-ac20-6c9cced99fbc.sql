-- Phase 1B: Database Schema Enhancement for Order Management System

-- 1.1 Create order_status enum
CREATE TYPE order_status AS ENUM ('pending', 'confirmed', 'canceled', 'processing', 'completed');

-- 1.2 Create product_category enum
CREATE TYPE product_category AS ENUM (
  'freefire',
  'tiktok',
  'netflix',
  'garena',
  'youtube',
  'smilecoin',
  'chatgpt',
  'unipin',
  'other'
);

-- 1.3 Create product_orders table
CREATE TABLE product_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number text UNIQUE NOT NULL,
  
  -- User information
  user_id uuid NOT NULL,
  user_email text NOT NULL,
  user_name text,
  
  -- Product details
  product_category product_category NOT NULL,
  product_name text NOT NULL,
  package_name text NOT NULL,
  quantity numeric NOT NULL,
  price numeric NOT NULL CHECK (price > 0),
  
  -- Product-specific fields (JSONB for flexibility)
  product_details jsonb NOT NULL DEFAULT '{}',
  
  -- Order management
  status order_status NOT NULL DEFAULT 'pending',
  payment_method text DEFAULT 'credit',
  
  -- Credits
  credits_deducted numeric DEFAULT 0,
  
  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  confirmed_at timestamptz,
  completed_at timestamptz,
  canceled_at timestamptz,
  
  -- Admin actions
  reviewed_by uuid,
  admin_remarks text,
  cancellation_reason text,
  
  -- Metadata
  metadata jsonb DEFAULT '{}'
);

-- Create indexes for product_orders
CREATE INDEX idx_product_orders_user_id ON product_orders(user_id);
CREATE INDEX idx_product_orders_status ON product_orders(status);
CREATE INDEX idx_product_orders_created_at ON product_orders(created_at DESC);
CREATE INDEX idx_product_orders_category ON product_orders(product_category);

-- Enable RLS on product_orders
ALTER TABLE product_orders ENABLE ROW LEVEL SECURITY;

-- RLS Policies for product_orders
CREATE POLICY "Users can view own orders"
ON product_orders FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can create orders"
ON product_orders FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all orders"
ON product_orders FOR SELECT
TO authenticated
USING (public.is_admin());

CREATE POLICY "Admins can update orders"
ON product_orders FOR UPDATE
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- 1.4 Create role_permissions table
CREATE TABLE role_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role app_role NOT NULL,
  permission text NOT NULL,
  description text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(role, permission)
);

-- Insert default permissions
INSERT INTO role_permissions (role, permission, description) VALUES
  ('super_admin', 'manage_admins', 'Can create and manage admin users'),
  ('super_admin', 'view_all_data', 'Can view all system data'),
  ('super_admin', 'delete_records', 'Can delete any record'),
  ('super_admin', 'manage_settings', 'Can modify system settings'),
  ('admin', 'approve_payments', 'Can approve/reject payment requests'),
  ('admin', 'manage_orders', 'Can confirm/cancel orders'),
  ('admin', 'view_reports', 'Can view analytics and reports'),
  ('sub_admin', 'view_orders', 'Can view orders'),
  ('sub_admin', 'view_payments', 'Can view payment requests');

-- 1.5 Create activity_type enum
CREATE TYPE activity_type AS ENUM (
  'payment_approved',
  'payment_rejected',
  'order_confirmed',
  'order_canceled',
  'credit_added',
  'credit_deducted',
  'user_created',
  'role_changed',
  'admin_action',
  'system_action'
);

-- 1.6 Create activity_logs table
CREATE TABLE activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Who performed the action
  actor_id uuid,
  actor_email text,
  actor_role app_role,
  
  -- What happened
  activity_type activity_type NOT NULL,
  action text NOT NULL,
  description text,
  
  -- What was affected
  target_type text,
  target_id uuid,
  
  -- Additional context
  metadata jsonb DEFAULT '{}',
  
  -- When
  created_at timestamptz DEFAULT now(),
  
  -- Where (IP address for security)
  ip_address inet,
  user_agent text
);

-- Create indexes for activity_logs
CREATE INDEX idx_activity_logs_actor ON activity_logs(actor_id);
CREATE INDEX idx_activity_logs_type ON activity_logs(activity_type);
CREATE INDEX idx_activity_logs_created ON activity_logs(created_at DESC);

-- Enable RLS on activity_logs
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policy for activity_logs
CREATE POLICY "Only admins can view activity logs"
ON activity_logs FOR SELECT
TO authenticated
USING (public.is_admin());

-- 1.7 Create permission checking functions
CREATE OR REPLACE FUNCTION has_permission(_user_id uuid, _permission text)
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

CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(auth.uid(), 'super_admin');
$$;

-- 1.8 Create confirm_order function
CREATE OR REPLACE FUNCTION confirm_order(
  order_id uuid,
  admin_remarks_text text DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  order_record product_orders%ROWTYPE;
  user_balance numeric;
BEGIN
  -- Check if user is admin
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Only admins can confirm orders';
  END IF;
  
  -- Get and lock the order
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
  
  -- Check user balance
  SELECT balance INTO user_balance
  FROM profiles
  WHERE id = order_record.user_id;
  
  IF user_balance < order_record.price THEN
    RAISE EXCEPTION 'Insufficient balance. User has % credits, order requires %', user_balance, order_record.price;
  END IF;
  
  -- Deduct credits from user
  UPDATE profiles
  SET balance = balance - order_record.price
  WHERE id = order_record.user_id;
  
  -- Update order status
  UPDATE product_orders
  SET 
    status = 'confirmed',
    reviewed_by = auth.uid(),
    confirmed_at = now(),
    updated_at = now(),
    admin_remarks = admin_remarks_text,
    credits_deducted = order_record.price
  WHERE id = order_id;
  
  -- Log activity
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

-- 1.9 Create cancel_order function
CREATE OR REPLACE FUNCTION cancel_order(
  order_id uuid,
  cancellation_reason_text text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  order_record product_orders%ROWTYPE;
BEGIN
  -- Check if user is admin
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Only admins can cancel orders';
  END IF;
  
  IF cancellation_reason_text IS NULL OR cancellation_reason_text = '' THEN
    RAISE EXCEPTION 'Cancellation reason is required';
  END IF;
  
  -- Get and lock the order
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
  
  -- Update order status
  UPDATE product_orders
  SET 
    status = 'canceled',
    reviewed_by = auth.uid(),
    canceled_at = now(),
    updated_at = now(),
    cancellation_reason = cancellation_reason_text
  WHERE id = order_id;
  
  -- Log activity
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

-- 1.10 Create materialized view for dashboard statistics
CREATE MATERIALIZED VIEW admin_dashboard_stats AS
SELECT
  -- User statistics
  (SELECT COUNT(*) FROM profiles) as total_users,
  (SELECT COUNT(*) FROM profiles WHERE created_at > now() - interval '30 days') as new_users_last_month,
  
  -- Credit statistics
  (SELECT COALESCE(SUM(credits), 0) FROM payment_requests WHERE status = 'confirmed') as total_credits_added,
  (SELECT COALESCE(SUM(credits_deducted), 0) FROM product_orders WHERE status = 'confirmed') as total_credits_spent,
  (SELECT COALESCE(SUM(balance), 0) FROM profiles) as total_balance_remaining,
  
  -- Payment request statistics
  (SELECT COUNT(*) FROM payment_requests WHERE status = 'pending') as pending_payment_requests,
  (SELECT COUNT(*) FROM payment_requests WHERE status = 'confirmed') as confirmed_payment_requests,
  (SELECT COUNT(*) FROM payment_requests WHERE status = 'rejected') as rejected_payment_requests,
  
  -- Order statistics
  (SELECT COUNT(*) FROM product_orders) as total_orders,
  (SELECT COUNT(*) FROM product_orders WHERE status = 'pending') as pending_orders,
  (SELECT COUNT(*) FROM product_orders WHERE status = 'confirmed') as confirmed_orders,
  (SELECT COUNT(*) FROM product_orders WHERE status = 'canceled') as canceled_orders,
  (SELECT COALESCE(SUM(price), 0) FROM product_orders WHERE status = 'confirmed') as total_revenue,
  
  -- Recent activity
  now() as last_updated;

-- Create unique index for concurrent refresh
CREATE UNIQUE INDEX ON admin_dashboard_stats (last_updated);

-- 1.11 Create function to refresh dashboard stats
CREATE OR REPLACE FUNCTION refresh_dashboard_stats()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY admin_dashboard_stats;
END;
$$;

-- 1.12 Enable realtime for key tables
ALTER TABLE payment_requests REPLICA IDENTITY FULL;
ALTER TABLE product_orders REPLICA IDENTITY FULL;
ALTER TABLE activity_logs REPLICA IDENTITY FULL;

-- 1.13 Create trigger for updated_at on product_orders
CREATE TRIGGER update_product_orders_updated_at
BEFORE UPDATE ON product_orders
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();