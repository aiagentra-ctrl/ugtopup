
-- Drop tournament tables
DROP TABLE IF EXISTS public.tournament_withdrawals CASCADE;
DROP TABLE IF EXISTS public.tournament_reports CASCADE;
DROP TABLE IF EXISTS public.tournament_participants CASCADE;
DROP TABLE IF EXISTS public.tournament_ledger CASCADE;
DROP TABLE IF EXISTS public.tournament_boosts CASCADE;
DROP TABLE IF EXISTS public.tournament_banners CASCADE;
DROP TABLE IF EXISTS public.tournament_settings CASCADE;
DROP TABLE IF EXISTS public.tournaments CASCADE;

-- Tournament helper functions
DROP FUNCTION IF EXISTS public.leave_tournament(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.cancel_tournament_admin(uuid, text) CASCADE;
DROP FUNCTION IF EXISTS public.get_tournament_credentials(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.can_view_tournament_credentials(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.tournaments_set_updated_at() CASCADE;
DROP FUNCTION IF EXISTS public.sync_tournament_room_status() CASCADE;
DROP FUNCTION IF EXISTS public.start_tournament(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.finish_tournament(uuid, jsonb) CASCADE;
DROP FUNCTION IF EXISTS public._tournament_ledger(uuid, uuid, text, numeric, text, jsonb) CASCADE;
DROP FUNCTION IF EXISTS public.create_tournament_v2(jsonb) CASCADE;
DROP FUNCTION IF EXISTS public.join_tournament(uuid, jsonb) CASCADE;

-- Drop WhatsApp tables
DROP TABLE IF EXISTS public.whatsapp_messages CASCADE;
DROP TABLE IF EXISTS public.whatsapp_message_flows CASCADE;
DROP TABLE IF EXISTS public.whatsapp_config CASCADE;

-- Drop visitor / page tracking
DROP TABLE IF EXISTS public.page_views CASCADE;
DROP TABLE IF EXISTS public.visitor_sessions CASCADE;
DROP TABLE IF EXISTS public.promotion_analytics CASCADE;
DROP FUNCTION IF EXISTS public.upsert_visitor_session(uuid, text, text, text, text, text) CASCADE;

-- Remove old whatsapp retention setting; add payment screenshot retention
DELETE FROM public.cleanup_settings WHERE setting_key = 'whatsapp_flow_retention_days';
DELETE FROM public.cleanup_settings WHERE setting_key = 'page_views_retention_days';

INSERT INTO public.cleanup_settings (setting_key, setting_value, description, is_enabled)
VALUES ('payment_screenshot_retention_days', 7,
        'Delete payment screenshots from storage older than N days (only for approved/rejected requests)', true)
ON CONFLICT (setting_key) DO UPDATE SET setting_value = EXCLUDED.setting_value, is_enabled = true;
