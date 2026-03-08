
INSERT INTO public.feature_flags (feature_key, feature_name, description, is_enabled, category, monthly_cost_note)
VALUES 
  ('support_tickets', 'Support Ticket System', 'Customer support ticket system with messaging', true, 'user_feature', 'Included in monthly maintenance'),
  ('announcements', 'In-App Announcements', 'Admin announcements displayed as banners or modals', true, 'communication', 'Included in monthly maintenance'),
  ('user_analytics', 'User Analytics Dashboard', 'Advanced user and revenue analytics for admin', true, 'analytics', 'Included in monthly maintenance'),
  ('automated_campaigns', 'Automated Marketing', 'Trigger-based notifications and coupons for inactive users', false, 'automation', 'Requires cron setup - contact developer'),
  ('wishlist', 'Wishlist / Favorites', 'Users can save products to their wishlist', true, 'user_feature', 'Included in monthly maintenance'),
  ('subscriptions', 'Subscription Plans', 'Recurring top-up subscriptions for users', false, 'user_feature', 'Requires cron setup - contact developer')
ON CONFLICT (feature_key) DO NOTHING;
