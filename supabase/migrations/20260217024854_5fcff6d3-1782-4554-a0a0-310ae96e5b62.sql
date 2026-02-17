
-- Add is_api_product column to distinguish API vs Non-API packages
ALTER TABLE public.game_product_prices ADD COLUMN IF NOT EXISTS is_api_product boolean DEFAULT false;

-- Mark existing API packages (those with Liana variation IDs)
UPDATE public.game_product_prices SET is_api_product = true WHERE game = 'mobile_legends' AND package_name IN ('86 Diamonds', '172 Diamonds', '257 Diamonds', '429 Diamonds', '514 Diamonds', '706 Diamonds', '1050 Diamonds', '1412 Diamonds', '2195 Diamonds', '3688 Diamonds', '5532 Diamonds', '9288 Diamonds', 'Weekly', 'Twilight');

-- Mark Non-API packages
UPDATE public.game_product_prices SET is_api_product = false WHERE game = 'mobile_legends' AND package_name IN ('55 Diamonds', '165 Diamonds', '275 Diamonds', '565 Diamonds');

-- Add missing API packages: 343, 600, 878, 1135 Diamonds and Super Value Pass
INSERT INTO public.game_product_prices (game, package_id, package_name, package_type, quantity, price, currency, is_active, display_order, is_api_product)
VALUES
  ('mobile_legends', 'ml-343', '343 Diamonds', 'topup', 343, 799, 'INR', true, 7, true),
  ('mobile_legends', 'ml-600', '600 Diamonds', 'topup', 600, 1350, 'INR', true, 10, true),
  ('mobile_legends', 'ml-878', '878 Diamonds', 'topup', 878, 1950, 'INR', true, 12, true),
  ('mobile_legends', 'ml-1135', '1135 Diamonds', 'topup', 1135, 2600, 'INR', true, 14, true),
  ('mobile_legends', 'ml-svp', 'Super Value Pass', 'special', 1, 1300, 'INR', true, 19, true);

-- Reorder display_order for clean sequencing (Non-API first, then API diamonds, then specials)
-- Non-API packages
UPDATE public.game_product_prices SET display_order = 1 WHERE game = 'mobile_legends' AND package_name = '55 Diamonds';
UPDATE public.game_product_prices SET display_order = 2 WHERE game = 'mobile_legends' AND package_name = '165 Diamonds';
UPDATE public.game_product_prices SET display_order = 3 WHERE game = 'mobile_legends' AND package_name = '275 Diamonds';
UPDATE public.game_product_prices SET display_order = 4 WHERE game = 'mobile_legends' AND package_name = '565 Diamonds';

-- API diamond packages in ascending order
UPDATE public.game_product_prices SET display_order = 5 WHERE game = 'mobile_legends' AND package_name = '86 Diamonds';
UPDATE public.game_product_prices SET display_order = 6 WHERE game = 'mobile_legends' AND package_name = '172 Diamonds';
UPDATE public.game_product_prices SET display_order = 7 WHERE game = 'mobile_legends' AND package_name = '257 Diamonds';
UPDATE public.game_product_prices SET display_order = 8 WHERE game = 'mobile_legends' AND package_name = '343 Diamonds';
UPDATE public.game_product_prices SET display_order = 9 WHERE game = 'mobile_legends' AND package_name = '429 Diamonds';
UPDATE public.game_product_prices SET display_order = 10 WHERE game = 'mobile_legends' AND package_name = '514 Diamonds';
UPDATE public.game_product_prices SET display_order = 11 WHERE game = 'mobile_legends' AND package_name = '600 Diamonds';
UPDATE public.game_product_prices SET display_order = 12 WHERE game = 'mobile_legends' AND package_name = '706 Diamonds';
UPDATE public.game_product_prices SET display_order = 13 WHERE game = 'mobile_legends' AND package_name = '878 Diamonds';
UPDATE public.game_product_prices SET display_order = 14 WHERE game = 'mobile_legends' AND package_name = '1050 Diamonds';
UPDATE public.game_product_prices SET display_order = 15 WHERE game = 'mobile_legends' AND package_name = '1135 Diamonds';
UPDATE public.game_product_prices SET display_order = 16 WHERE game = 'mobile_legends' AND package_name = '1412 Diamonds';
UPDATE public.game_product_prices SET display_order = 17 WHERE game = 'mobile_legends' AND package_name = '2195 Diamonds';
UPDATE public.game_product_prices SET display_order = 18 WHERE game = 'mobile_legends' AND package_name = '3688 Diamonds';
UPDATE public.game_product_prices SET display_order = 19 WHERE game = 'mobile_legends' AND package_name = '5532 Diamonds';
UPDATE public.game_product_prices SET display_order = 20 WHERE game = 'mobile_legends' AND package_name = '9288 Diamonds';

-- API special packages
UPDATE public.game_product_prices SET display_order = 21 WHERE game = 'mobile_legends' AND package_name = 'Weekly';
UPDATE public.game_product_prices SET display_order = 22 WHERE game = 'mobile_legends' AND package_name = 'Twilight';
UPDATE public.game_product_prices SET display_order = 23 WHERE game = 'mobile_legends' AND package_name = 'Super Value Pass';
