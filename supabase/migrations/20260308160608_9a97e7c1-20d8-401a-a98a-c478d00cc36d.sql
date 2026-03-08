
-- Voucher codes table
CREATE TABLE public.voucher_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_name text NOT NULL,
  game text NOT NULL,
  package_id text,
  code text NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'used')),
  order_id uuid REFERENCES public.product_orders(id) ON DELETE SET NULL,
  added_at timestamptz NOT NULL DEFAULT now(),
  used_at timestamptz
);

-- RLS: Admin only (codes are secrets)
ALTER TABLE public.voucher_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage voucher codes"
  ON public.voucher_codes FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Function: assign a single voucher code atomically
CREATE OR REPLACE FUNCTION public.assign_voucher_code(p_order_id uuid, p_game text, p_package_id text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
DECLARE
  v_code text;
  v_voucher_id uuid;
BEGIN
  SELECT id, code INTO v_voucher_id, v_code
  FROM voucher_codes
  WHERE game = p_game
    AND (p_package_id IS NULL OR package_id = p_package_id)
    AND status = 'available'
  ORDER BY added_at ASC
  LIMIT 1
  FOR UPDATE SKIP LOCKED;

  IF v_voucher_id IS NULL THEN
    RETURN NULL;
  END IF;

  UPDATE voucher_codes
  SET status = 'used',
      order_id = p_order_id,
      used_at = now()
  WHERE id = v_voucher_id;

  RETURN v_code;
END;
$$;

-- Function: try to assign voucher after order placement
CREATE OR REPLACE FUNCTION public.try_assign_voucher(p_order_id uuid, p_game text, p_package_id text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
DECLARE
  v_code text;
  v_order product_orders%ROWTYPE;
BEGIN
  -- Get order
  SELECT * INTO v_order FROM product_orders WHERE id = p_order_id;
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'message', 'Order not found');
  END IF;

  -- Try to assign a code
  v_code := assign_voucher_code(p_order_id, p_game, p_package_id);

  IF v_code IS NOT NULL THEN
    -- Store code in order metadata and mark completed
    UPDATE product_orders
    SET metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object('voucher_code', v_code),
        status = 'completed',
        completed_at = now(),
        updated_at = now(),
        admin_remarks = 'Auto-delivered voucher code'
    WHERE id = p_order_id;

    -- Notify user
    PERFORM create_user_notification(
      v_order.user_id,
      'Voucher Code Delivered! 🎉',
      'Your voucher code for order ' || v_order.order_number || ' has been delivered. Check your order details.',
      'order'
    );

    RETURN json_build_object('success', true, 'code', v_code);
  ELSE
    -- No stock - leave as pending, notify admins
    RETURN json_build_object('success', false, 'message', 'Voucher stock empty. Order will be processed manually.');
  END IF;
END;
$$;
