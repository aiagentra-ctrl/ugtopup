-- Seed Mobile Legends packages into game_product_prices table
INSERT INTO game_product_prices (game, package_id, package_name, package_type, quantity, price, currency, display_order, is_active)
VALUES
  ('mobile_legends', 'ml_d1', '55 Diamonds', 'topup', 55, 134, '₹', 1, true),
  ('mobile_legends', 'ml_d2', '86 Diamonds', 'topup', 86, 186, '₹', 2, true),
  ('mobile_legends', 'ml_d3', '110 Diamonds', 'topup', 110, 253, '₹', 3, true),
  ('mobile_legends', 'ml_d4', '165 Diamonds', 'topup', 165, 362, '₹', 4, true),
  ('mobile_legends', 'ml_d5', '172 Diamonds', 'topup', 172, 386, '₹', 5, true),
  ('mobile_legends', 'ml_d6', '257 Diamonds', 'topup', 257, 578, '₹', 6, true),
  ('mobile_legends', 'ml_d7', '344 Diamonds', 'topup', 344, 762, '₹', 7, true),
  ('mobile_legends', 'ml_d8', '430 Diamonds', 'topup', 430, 947, '₹', 8, true),
  ('mobile_legends', 'ml_d9', '514 Diamonds', 'topup', 514, 1056, '₹', 9, true),
  ('mobile_legends', 'ml_d10', '706 Diamonds', 'topup', 706, 1498, '₹', 10, true),
  ('mobile_legends', 'ml_d11', '1050 Diamonds', 'topup', 1050, 2248, '₹', 11, true),
  ('mobile_legends', 'ml_d12', '1412 Diamonds', 'topup', 1412, 2987, '₹', 12, true),
  ('mobile_legends', 'ml_d13', '2215 Diamonds', 'topup', 2215, 4378, '₹', 13, true),
  ('mobile_legends', 'ml_d14', '3688 Diamonds', 'topup', 3688, 7187, '₹', 14, true),
  ('mobile_legends', 'ml_d15', '5532 Diamonds', 'topup', 5532, 10727, '₹', 15, true),
  ('mobile_legends', 'ml_d16', '9288 Diamonds', 'topup', 9288, 17846, '₹', 16, true),
  -- Special Deals
  ('mobile_legends', 'ml_s1', 'Weekly', 'special', 1, 248, '₹', 17, true),
  ('mobile_legends', 'ml_s2', 'Twilight', 'special', 1, 1234, '₹', 18, true);