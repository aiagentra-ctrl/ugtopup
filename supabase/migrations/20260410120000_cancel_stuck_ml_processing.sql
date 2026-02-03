-- Cancel stuck Mobile Legends orders that remain in processing
UPDATE product_orders
SET status = 'canceled',
    canceled_at = NOW(),
    cancellation_reason = 'Auto-canceled: ML API order stuck in processing.',
    updated_at = NOW()
WHERE product_category = 'mobile_legends'
  AND status = 'processing';

UPDATE liana_orders
SET status = 'failed',
    error_message = 'Auto-canceled: ML API order stuck in processing.',
    updated_at = NOW()
WHERE status = 'processing';
