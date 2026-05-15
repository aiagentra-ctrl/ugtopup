
-- AI Command Dashboard tables
CREATE TABLE public.ai_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL DEFAULT 'New conversation',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.ai_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.ai_conversations(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user','assistant','system')),
  content text NOT NULL DEFAULT '',
  response_payload jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_ai_messages_conv ON public.ai_messages(conversation_id, created_at);

CREATE TABLE public.ai_changelogs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  action_type text NOT NULL,
  table_name text NOT NULL,
  record_id text,
  old_value jsonb,
  new_value jsonb,
  performed_by uuid REFERENCES auth.users(id),
  performed_by_email text,
  performed_at timestamptz NOT NULL DEFAULT now(),
  rolled_back boolean NOT NULL DEFAULT false,
  rollback_of uuid REFERENCES public.ai_changelogs(id),
  notes text
);
CREATE INDEX idx_ai_changelogs_perf_at ON public.ai_changelogs(performed_at DESC);

CREATE TABLE public.ai_saved_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  query text,
  response_payload jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_changelogs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_saved_reports ENABLE ROW LEVEL SECURITY;

-- Conversations
CREATE POLICY "Admins manage own conversations" ON public.ai_conversations
  FOR ALL TO authenticated
  USING (public.is_admin() AND admin_id = auth.uid())
  WITH CHECK (public.is_admin() AND admin_id = auth.uid());

-- Messages (via parent conversation)
CREATE POLICY "Admins manage messages in own conversations" ON public.ai_messages
  FOR ALL TO authenticated
  USING (public.is_admin() AND EXISTS (SELECT 1 FROM public.ai_conversations c WHERE c.id = conversation_id AND c.admin_id = auth.uid()))
  WITH CHECK (public.is_admin() AND EXISTS (SELECT 1 FROM public.ai_conversations c WHERE c.id = conversation_id AND c.admin_id = auth.uid()));

-- Changelog: all admins can see all entries (audit trail), only system can insert via RPC
CREATE POLICY "Admins can view all changelogs" ON public.ai_changelogs
  FOR SELECT TO authenticated USING (public.is_admin());

-- Saved reports
CREATE POLICY "Admins manage own saved reports" ON public.ai_saved_reports
  FOR ALL TO authenticated
  USING (public.is_admin() AND admin_id = auth.uid())
  WITH CHECK (public.is_admin() AND admin_id = auth.uid());

-- Whitelist of tables + columns the AI is allowed to modify
CREATE OR REPLACE FUNCTION public.apply_ai_write(p_action jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_table text := p_action->>'table';
  v_record_id text := p_action->>'record_id';
  v_new jsonb := p_action->'new_value';
  v_action_type text := COALESCE(p_action->>'action_type','update');
  v_old jsonb;
  v_changelog_id uuid;
  v_email text;
  v_allowed_cols text[];
  v_col text;
  v_set_clauses text := '';
  v_sql text;
  v_result jsonb;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Only admins can apply AI writes';
  END IF;

  -- Whitelist mapping: table => allowed updatable columns
  CASE v_table
    WHEN 'banners' THEN v_allowed_cols := ARRAY['title','subtitle','image_url','link_url','is_active','display_order'];
    WHEN 'game_product_prices' THEN v_allowed_cols := ARRAY['price','is_active'];
    WHEN 'product_orders' THEN v_allowed_cols := ARRAY['status','admin_remarks'];
    WHEN 'payment_requests' THEN v_allowed_cols := ARRAY['status','admin_remarks'];
    WHEN 'coupons' THEN v_allowed_cols := ARRAY['is_used','expires_at'];
    WHEN 'coupon_rules' THEN v_allowed_cols := ARRAY['is_active','discount_value','expires_at'];
    WHEN 'offers' THEN v_allowed_cols := ARRAY['is_active','title','description'];
    WHEN 'announcements' THEN v_allowed_cols := ARRAY['is_active','title','content'];
    WHEN 'notifications' THEN v_allowed_cols := ARRAY['is_active','title','message'];
    WHEN 'dynamic_products' THEN v_allowed_cols := ARRAY['is_active','display_order','title'];
    ELSE
      RAISE EXCEPTION 'Table % is not allowed for AI writes', v_table;
  END CASE;

  -- Capture old row
  EXECUTE format('SELECT to_jsonb(t) FROM public.%I t WHERE id::text = $1', v_table)
    INTO v_old USING v_record_id;

  IF v_old IS NULL THEN
    RAISE EXCEPTION 'Record % not found in %', v_record_id, v_table;
  END IF;

  -- Build SET clause from whitelisted keys present in v_new
  FOREACH v_col IN ARRAY v_allowed_cols LOOP
    IF v_new ? v_col THEN
      IF length(v_set_clauses) > 0 THEN v_set_clauses := v_set_clauses || ', '; END IF;
      v_set_clauses := v_set_clauses || format('%I = ($1->>%L)', v_col, v_col);
    END IF;
  END LOOP;

  IF length(v_set_clauses) = 0 THEN
    RAISE EXCEPTION 'No allowed columns to update';
  END IF;

  v_sql := format('UPDATE public.%I SET %s WHERE id::text = $2 RETURNING to_jsonb(%I.*)', v_table, v_set_clauses, v_table);
  EXECUTE v_sql INTO v_result USING v_new, v_record_id;

  SELECT email INTO v_email FROM auth.users WHERE id = auth.uid();

  INSERT INTO public.ai_changelogs(action_type, table_name, record_id, old_value, new_value, performed_by, performed_by_email)
  VALUES (v_action_type, v_table, v_record_id, v_old, v_result, auth.uid(), v_email)
  RETURNING id INTO v_changelog_id;

  RETURN jsonb_build_object('success', true, 'changelog_id', v_changelog_id, 'new_value', v_result);
END;
$$;

CREATE OR REPLACE FUNCTION public.rollback_ai_change(p_change_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_change ai_changelogs%ROWTYPE;
  v_action jsonb;
  v_result jsonb;
  v_new_change_id uuid;
  v_email text;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Only admins can rollback';
  END IF;

  SELECT * INTO v_change FROM public.ai_changelogs WHERE id = p_change_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Changelog not found'; END IF;
  IF v_change.rolled_back THEN RAISE EXCEPTION 'Already rolled back'; END IF;

  v_action := jsonb_build_object(
    'table', v_change.table_name,
    'record_id', v_change.record_id,
    'new_value', v_change.old_value,
    'action_type', 'rollback'
  );
  v_result := public.apply_ai_write(v_action);

  UPDATE public.ai_changelogs SET rolled_back = true WHERE id = p_change_id;

  -- Mark the latest inserted changelog as rollback_of
  SELECT email INTO v_email FROM auth.users WHERE id = auth.uid();
  UPDATE public.ai_changelogs
  SET rollback_of = p_change_id
  WHERE id = (v_result->>'changelog_id')::uuid;

  RETURN jsonb_build_object('success', true, 'restored', v_result);
END;
$$;
