-- Add 'order_created' to activity_type enum
ALTER TYPE activity_type ADD VALUE IF NOT EXISTS 'order_created';

-- Add admin SELECT policy for product_orders
CREATE POLICY "Admins can view all orders"
  ON public.product_orders
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- Add admin UPDATE policy for product_orders
CREATE POLICY "Admins can update all orders"
  ON public.product_orders
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());