-- Cancel all pending and processing liana_orders (legacy orders that were manually completed)
UPDATE liana_orders 
SET status = 'canceled', 
    error_message = 'Manually completed - canceled to prevent duplicate processing',
    updated_at = NOW()
WHERE status IN ('pending', 'processing');

-- Cancel corresponding product_orders
UPDATE product_orders 
SET status = 'canceled',
    failure_reason = 'Manually completed - canceled to prevent duplicate processing',
    canceled_at = NOW(),
    updated_at = NOW()
WHERE id IN (
  SELECT order_id FROM liana_orders WHERE status = 'canceled' AND error_message = 'Manually completed - canceled to prevent duplicate processing'
);