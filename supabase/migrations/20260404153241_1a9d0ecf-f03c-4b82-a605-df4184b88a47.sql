-- 1. Delete old page_views (>14 days) - ~19K rows, 11MB
DELETE FROM page_views WHERE created_at < now() - interval '14 days';

-- 2. Delete READ user_notifications older than 30 days
DELETE FROM user_notifications WHERE is_read = true AND created_at < now() - interval '30 days';

-- 3. Delete orphaned notifications (no user_notifications referencing them)
DELETE FROM notifications WHERE id NOT IN (SELECT DISTINCT notification_id FROM user_notifications);

-- 4. Delete failed and stale pending payment_transactions (>30 days old)
DELETE FROM payment_transactions WHERE status IN ('failed', 'pending', 'initiated') AND created_at < now() - interval '30 days';

-- 5. Delete old whatsapp_message_flows (>14 days)
DELETE FROM whatsapp_message_flows WHERE created_at < now() - interval '14 days';

-- 6. Delete old activity_logs (>60 days)
DELETE FROM activity_logs WHERE created_at < now() - interval '60 days';

-- 7. Delete old cleanup_logs (>30 days)
DELETE FROM cleanup_logs WHERE created_at < now() - interval '30 days';

-- 8. Delete old chatbot_conversations (>30 days)
DELETE FROM chatbot_conversations WHERE created_at < now() - interval '30 days';

-- 9. Delete old visitor_sessions (>30 days)
DELETE FROM visitor_sessions WHERE last_active_at < now() - interval '30 days';

-- 10. Analyze tables for query optimization
ANALYZE page_views;
ANALYZE user_notifications;
ANALYZE notifications;
ANALYZE payment_transactions;
ANALYZE whatsapp_message_flows;
ANALYZE activity_logs;