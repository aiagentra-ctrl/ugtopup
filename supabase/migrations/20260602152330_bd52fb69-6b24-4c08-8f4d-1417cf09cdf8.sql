
-- Expand AI Command write capabilities with proper typing + impact preview
CREATE OR REPLACE FUNCTION public._ai_allowed_cols(p_table text)
RETURNS text[]
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  RETURN CASE p_table
    WHEN 'banners' THEN ARRAY['title','subtitle','image_url','link_url','is_active','display_order']
    WHEN 'game_product_prices' THEN ARRAY['price','is_active','stock','package_name','label','display_order']
    WHEN 'product_orders' THEN ARRAY['status','admin_remarks','cancellation_reason']
    WHEN 'payment_requests' THEN ARRAY['status','admin_remarks']
    WHEN 'coupons' THEN ARRAY['is_used','expires_at','discount_percent','discount_value','max_uses']
    WHEN 'coupon_rules' THEN ARRAY['is_active','discount_value','discount_type','expires_at','min_order_amount','max_total_uses','max_uses_per_user','coupon_code']
    WHEN 'offers' THEN ARRAY['is_active','title','description','discount_percent','starts_at','ends_at','display_order']
    WHEN 'announcements' THEN ARRAY['is_active','title','content','priority','starts_at','ends_at']
    WHEN 'notifications' THEN ARRAY['is_active','title','message','notification_type']
    WHEN 'dynamic_products' THEN ARRAY['is_active','display_order','title','subtitle','image_url','link_url']
    WHEN 'product_categories' THEN ARRAY['is_active','display_order','title','icon_url']
    WHEN 'reward_milestones' THEN ARRAY['is_active','order_count','discount_percent','coupon_validity_days']
    WHEN 'referral_settings' THEN ARRAY['is_enabled','referrer_discount_percent','referee_discount_percent','min_order_amount','reward_after']
    WHEN 'game_page_descriptions' THEN ARRAY['title','content','is_active']
    WHEN 'page_descriptions' THEN ARRAY['title','content','is_active']
    ELSE NULL
  END;
END;
$$;

-- Rewrite apply_ai_write with typed updates + insert + soft-delete
CREATE OR REPLACE FUNCTION public.apply_ai_write(p_action jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_table text := p_action->>'table';
  v_record_id text := p_action->>'record_id';
  v_new jsonb := COALESCE(p_action->'new_value', '{}'::jsonb);
  v_action_type text := COALESCE(p_action->>'action_type','update');
  v_old jsonb;
  v_changelog_id uuid;
  v_email text;
  v_allowed_cols text[];
  v_col text;
  v_cols_csv text := '';
  v_sel_csv text := '';
  v_sql text;
  v_result jsonb;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Only admins can apply AI writes';
  END IF;

  v_allowed_cols := public._ai_allowed_cols(v_table);
  IF v_allowed_cols IS NULL THEN
    RAISE EXCEPTION 'Table % is not allowed for AI writes', v_table;
  END IF;

  SELECT email INTO v_email FROM auth.users WHERE id = auth.uid();

  IF v_action_type = 'update' OR v_action_type = 'rollback' THEN
    EXECUTE format('SELECT to_jsonb(t) FROM public.%I t WHERE id::text = $1', v_table)
      INTO v_old USING v_record_id;
    IF v_old IS NULL THEN
      RAISE EXCEPTION 'Record % not found in %', v_record_id, v_table;
    END IF;

    FOREACH v_col IN ARRAY v_allowed_cols LOOP
      IF v_new ? v_col THEN
        IF length(v_cols_csv) > 0 THEN
          v_cols_csv := v_cols_csv || ', ';
          v_sel_csv := v_sel_csv || ', ';
        END IF;
        v_cols_csv := v_cols_csv || quote_ident(v_col);
        v_sel_csv := v_sel_csv || 'r.' || quote_ident(v_col);
      END IF;
    END LOOP;

    IF length(v_cols_csv) = 0 THEN
      RAISE EXCEPTION 'No allowed columns to update';
    END IF;

    -- Use jsonb_populate_record to preserve column types
    v_sql := format(
      'UPDATE public.%I t SET (%s) = (SELECT %s FROM jsonb_populate_record(NULL::public.%I, $1) r) WHERE t.id::text = $2 RETURNING to_jsonb(t.*)',
      v_table, v_cols_csv, v_sel_csv, v_table
    );
    EXECUTE v_sql INTO v_result USING v_new, v_record_id;

  ELSIF v_action_type = 'soft_delete' THEN
    EXECUTE format('SELECT to_jsonb(t) FROM public.%I t WHERE id::text = $1', v_table)
      INTO v_old USING v_record_id;
    IF v_old IS NULL THEN RAISE EXCEPTION 'Record not found'; END IF;
    IF NOT ('is_active' = ANY(v_allowed_cols)) THEN
      RAISE EXCEPTION 'Soft delete not supported on %', v_table;
    END IF;
    EXECUTE format('UPDATE public.%I SET is_active = false WHERE id::text = $1 RETURNING to_jsonb(%I.*)', v_table, v_table)
      INTO v_result USING v_record_id;

  ELSE
    RAISE EXCEPTION 'Unsupported action_type: %', v_action_type;
  END IF;

  INSERT INTO public.ai_changelogs(action_type, table_name, record_id, old_value, new_value, performed_by, performed_by_email)
  VALUES (v_action_type, v_table, v_record_id, v_old, v_result, auth.uid(), v_email)
  RETURNING id INTO v_changelog_id;

  RETURN jsonb_build_object('success', true, 'changelog_id', v_changelog_id, 'old_value', v_old, 'new_value', v_result);
END;
$$;

-- Impact preview: returns warnings about what users/data will be affected
CREATE OR REPLACE FUNCTION public.preview_ai_write(p_action jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_table text := p_action->>'table';
  v_record_id text := p_action->>'record_id';
  v_new jsonb := COALESCE(p_action->'new_value','{}'::jsonb);
  v_old jsonb;
  v_warnings jsonb := '[]'::jsonb;
  v_count int;
  v_pkg record;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Only admins can preview AI writes';
  END IF;

  IF v_record_id IS NOT NULL THEN
    EXECUTE format('SELECT to_jsonb(t) FROM public.%I t WHERE id::text = $1', v_table)
      INTO v_old USING v_record_id;
  END IF;

  IF v_table = 'game_product_prices' THEN
    SELECT game, package_name, label, price, stock INTO v_pkg
    FROM game_product_prices WHERE id::text = v_record_id;
    IF FOUND THEN
      SELECT COUNT(*) INTO v_count FROM product_orders
      WHERE product_name ILIKE '%'||v_pkg.game||'%'
        AND created_at > now() - interval '7 days';
      v_warnings := v_warnings || jsonb_build_object(
        'level','info','message',
        FORMAT('%s orders for %s in the last 7 days will see the new price.', v_count, v_pkg.game)
      );
      IF v_new ? 'price' THEN
        v_warnings := v_warnings || jsonb_build_object(
          'level','warning','message',
          FORMAT('Price change: Rs.%s → Rs.%s', v_pkg.price, v_new->>'price')
        );
      END IF;
      IF v_new ? 'is_active' AND (v_new->>'is_active')::boolean = false THEN
        v_warnings := v_warnings || jsonb_build_object(
          'level','critical','message','This package will be hidden from all users immediately.'
        );
      END IF;
    END IF;
  ELSIF v_table = 'banners' THEN
    IF v_new ? 'is_active' AND (v_new->>'is_active')::boolean = false THEN
      v_warnings := v_warnings || jsonb_build_object('level','warning','message','Banner will be removed from the homepage.');
    END IF;
  ELSIF v_table = 'product_orders' THEN
    IF v_new->>'status' = 'canceled' THEN
      v_warnings := v_warnings || jsonb_build_object('level','critical','message','Cancelling will refund credits to the customer.');
    END IF;
  ELSIF v_table = 'coupon_rules' OR v_table = 'offers' THEN
    IF v_new ? 'is_active' AND (v_new->>'is_active')::boolean = false THEN
      v_warnings := v_warnings || jsonb_build_object('level','warning','message','Promotion will stop being available to users.');
    END IF;
  ELSIF v_table = 'notifications' OR v_table = 'announcements' THEN
    v_warnings := v_warnings || jsonb_build_object('level','info','message','Change will be visible to all targeted users instantly.');
  END IF;

  RETURN jsonb_build_object('success', true, 'old_value', v_old, 'warnings', v_warnings, 'table', v_table, 'record_id', v_record_id);
END;
$$;

GRANT EXECUTE ON FUNCTION public.apply_ai_write(jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.preview_ai_write(jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.rollback_ai_change(uuid) TO authenticated;
