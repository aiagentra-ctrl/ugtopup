-- Mark all Mobile Legends packages as API-based
UPDATE game_product_prices
SET is_api_product = true
WHERE game = 'mobile_legends' AND is_api_product = false;