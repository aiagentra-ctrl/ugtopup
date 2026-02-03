-- Mark all stuck ML orders as canceled since API was broken
-- Users can reorder with the fixed API now

UPDATE product_orders 
SET status = 'canceled',
    canceled_at = NOW(),
    cancellation_reason = 'API was not configured correctly. Order was either completed manually or needs to be reordered.',
    updated_at = NOW()
WHERE product_category = 'mobile_legends' 
  AND status = 'processing';

UPDATE liana_orders 
SET status = 'failed',
    error_message = 'Legacy order - API was misconfigured. Marked as failed during API fix.',
    updated_at = NOW()
WHERE status = 'processing';