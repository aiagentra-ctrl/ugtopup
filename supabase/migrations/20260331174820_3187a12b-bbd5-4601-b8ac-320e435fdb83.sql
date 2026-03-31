-- Step 1: Delete payment_request_history for rejected requests
DELETE FROM payment_request_history
WHERE payment_request_id IN (
  SELECT id FROM payment_requests WHERE status = 'rejected'
);

-- Step 2: Delete rejected payment requests
DELETE FROM payment_requests WHERE status = 'rejected';

-- Step 3: Delete linked liana_orders for canceled product orders
DELETE FROM liana_orders
WHERE order_id IN (
  SELECT id FROM product_orders WHERE status = 'canceled'
);

-- Step 4: Delete canceled product orders (credits were already refunded at cancellation)
DELETE FROM product_orders WHERE status = 'canceled';