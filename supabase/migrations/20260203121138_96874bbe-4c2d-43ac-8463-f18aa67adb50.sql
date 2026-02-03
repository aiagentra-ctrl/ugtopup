-- Add tracking columns to liana_orders table
ALTER TABLE liana_orders 
ADD COLUMN IF NOT EXISTS verification_response JSONB,
ADD COLUMN IF NOT EXISTS order_response JSONB,
ADD COLUMN IF NOT EXISTS api_request_sent BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS verification_sent_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS verification_completed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS order_sent_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;

-- Add tracking columns to product_orders table
ALTER TABLE product_orders 
ADD COLUMN IF NOT EXISTS processing_started_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS failed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS failure_reason TEXT,
ADD COLUMN IF NOT EXISTS transaction_id VARCHAR(100);