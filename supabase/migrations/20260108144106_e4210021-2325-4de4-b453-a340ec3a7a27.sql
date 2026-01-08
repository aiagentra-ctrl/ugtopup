-- Insert TikTok Coins packages
INSERT INTO game_product_prices (game, package_id, package_name, package_type, quantity, price, currency, display_order) VALUES
  ('tiktok', 'tk1', '350 Coins', 'topup', 350, 525, '₹', 1),
  ('tiktok', 'tk2', '700 Coins', 'topup', 700, 1274, '₹', 2),
  ('tiktok', 'tk3', '1,000 Coins', 'topup', 1000, 1862, '₹', 3),
  ('tiktok', 'tk4', '1,500 Coins', 'topup', 1500, 2498, '₹', 4),
  ('tiktok', 'tk5', '2,000 Coins', 'topup', 2000, 3474, '₹', 5),
  ('tiktok', 'tk6', '5,000 Coins', 'topup', 5000, 8327, '₹', 6),
  ('tiktok', 'tk7', '7,000 Coins', 'topup', 7000, 11729, '₹', 7),
  ('tiktok', 'tk8', '10,000 Coins', 'topup', 10000, 16876, '₹', 8),
  ('tiktok', 'tk9', '14,000 Coins', 'topup', 14000, 23358, '₹', 9),
  ('tiktok', 'tk10', '21,000 Coins', 'topup', 21000, 34427, '₹', 10);

-- Insert Roblox Robux packages
INSERT INTO game_product_prices (game, package_id, package_name, package_type, quantity, price, currency, display_order) VALUES
  ('roblox', 'rb1', '1000 Robux', 'topup', 1000, 1574, '₹', 1),
  ('roblox', 'rb2', '2000 Robux', 'topup', 2000, 3148, '₹', 2),
  ('roblox', 'rb3', '3000 Robux', 'topup', 3000, 4722, '₹', 3),
  ('roblox', 'rb4', '4000 Robux', 'topup', 4000, 6296, '₹', 4),
  ('roblox', 'rb5', '5000 Robux', 'topup', 5000, 7868, '₹', 5);

-- Insert PUBG UC packages
INSERT INTO game_product_prices (game, package_id, package_name, package_type, quantity, price, currency, display_order) VALUES
  ('pubg', 'uc1', '60 UC', 'topup', 60, 146, '₹', 1),
  ('pubg', 'uc2', '120 UC', 'topup', 120, 292, '₹', 2),
  ('pubg', 'uc3', '240 UC', 'topup', 240, 547, '₹', 3),
  ('pubg', 'uc4', '325 UC', 'topup', 325, 698, '₹', 4),
  ('pubg', 'uc5', '660 UC', 'topup', 660, 1446, '₹', 5),
  ('pubg', 'uc6', '720 UC', 'topup', 720, 1543, '₹', 6),
  ('pubg', 'uc7', '1500 UC', 'topup', 1500, 3276, '₹', 7),
  ('pubg', 'uc8', '1800 UC', 'topup', 1800, 3588, '₹', 8),
  ('pubg', 'uc9', '3850 UC', 'topup', 3850, 6767, '₹', 9),
  ('pubg', 'uc10', '8100 UC', 'topup', 8100, 13878, '₹', 10);

-- Insert Netflix subscription packages
INSERT INTO game_product_prices (game, package_id, package_name, package_type, quantity, price, currency, display_order) VALUES
  ('netflix', 'nf1', '1 Month Netflix', 'subscription', 1, 399, '₹', 1),
  ('netflix', 'nf3', '3 Months Netflix', 'subscription', 3, 1199, '₹', 2),
  ('netflix', 'nf6', '6 Months Netflix', 'subscription', 6, 2299, '₹', 3),
  ('netflix', 'nf12', '12 Months Netflix', 'subscription', 12, 4499, '₹', 4);

-- Insert YouTube Premium subscription packages
INSERT INTO game_product_prices (game, package_id, package_name, package_type, quantity, price, currency, display_order) VALUES
  ('youtube', 'yt1', '1 Month YouTube Premium', 'subscription', 1, 499, '₹', 1),
  ('youtube', 'yt3', '3 Months YouTube Premium', 'subscription', 3, 1499, '₹', 2),
  ('youtube', 'yt6', '6 Months YouTube Premium', 'subscription', 6, 2999, '₹', 3),
  ('youtube', 'yt12', '1 Year YouTube Premium', 'subscription', 12, 5999, '₹', 4);

-- Insert ChatGPT Plus subscription packages
INSERT INTO game_product_prices (game, package_id, package_name, package_type, quantity, price, currency, display_order) VALUES
  ('chatgpt', 'cgpt1', '1 Month ChatGPT Plus', 'subscription', 1, 1299, '₹', 1),
  ('chatgpt', 'cgpt3', '3 Months ChatGPT Plus', 'subscription', 3, 2999, '₹', 2);

-- Insert Garena Shell package
INSERT INTO game_product_prices (game, package_id, package_name, package_type, quantity, price, currency, display_order) VALUES
  ('garena', 'gr1', 'GARENA SHELL 1300 RGG', 'topup', 1300, 1499, '₹', 1);

-- Insert SmileCoin package
INSERT INTO game_product_prices (game, package_id, package_name, package_type, quantity, price, currency, display_order) VALUES
  ('smilecoin', 'sc1', '1000 SMILE COIN', 'topup', 1000, 2927, '₹', 1);

-- Insert Unipin UC package
INSERT INTO game_product_prices (game, package_id, package_name, package_type, quantity, price, currency, display_order) VALUES
  ('unipin', 'up1', 'UNIPIN 2000 UC POINT', 'topup', 2000, 2235, '₹', 1);