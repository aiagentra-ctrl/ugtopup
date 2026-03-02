-- Reset order for retry with updated X-ORIGIN-DOMAIN: ugtopups.com
UPDATE product_orders 
SET status = 'pending', canceled_at = NULL, failure_reason = NULL, cancellation_reason = NULL, processing_started_at = NULL, failed_at = NULL, updated_at = now() 
WHERE id = 'ff6376f4-80fc-46d9-9e30-bb61f652e8fb';

UPDATE liana_orders 
SET status = 'pending', error_message = NULL, api_response = NULL, api_request_sent = false, updated_at = now() 
WHERE order_id = 'ff6376f4-80fc-46d9-9e30-bb61f652e8fb';