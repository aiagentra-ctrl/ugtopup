-- Create liana_orders table for tracking Liana API order processing
CREATE TABLE liana_orders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id UUID NOT NULL REFERENCES product_orders(id) ON DELETE CASCADE,
    liana_product_id INTEGER NOT NULL,
    user_id TEXT NOT NULL,
    zone_id TEXT NOT NULL,
    ign TEXT,
    status TEXT DEFAULT 'pending',
    api_response JSONB,
    api_transaction_id TEXT,
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX idx_liana_orders_order_id ON liana_orders(order_id);
CREATE INDEX idx_liana_orders_status ON liana_orders(status);

-- Enable RLS
ALTER TABLE liana_orders ENABLE ROW LEVEL SECURITY;

-- Users can view their own liana orders through the product_orders relationship
CREATE POLICY "Users can view own liana orders" ON liana_orders
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM product_orders po 
            WHERE po.id = liana_orders.order_id 
            AND po.user_id = auth.uid()
        )
    );

-- Admins can view and manage all liana orders
CREATE POLICY "Admins can view all liana orders" ON liana_orders
    FOR SELECT USING (is_admin());

CREATE POLICY "Admins can update liana orders" ON liana_orders
    FOR UPDATE USING (is_admin()) WITH CHECK (is_admin());

-- Create trigger for updated_at
CREATE TRIGGER update_liana_orders_updated_at
    BEFORE UPDATE ON liana_orders
    FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- Create function to complete ML order (called by edge function via service role)
CREATE OR REPLACE FUNCTION complete_ml_order(
    p_order_id UUID,
    p_liana_order_id UUID,
    p_api_response JSONB,
    p_api_transaction_id TEXT DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    v_order product_orders%ROWTYPE;
BEGIN
    -- Get order
    SELECT * INTO v_order FROM product_orders WHERE id = p_order_id FOR UPDATE;
    
    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'message', 'Order not found');
    END IF;
    
    -- Update product_orders status to completed
    UPDATE product_orders
    SET status = 'completed',
        completed_at = NOW(),
        updated_at = NOW(),
        admin_remarks = 'Auto-processed via Liana API'
    WHERE id = p_order_id;
    
    -- Update liana_orders status
    UPDATE liana_orders
    SET status = 'completed',
        api_response = p_api_response,
        api_transaction_id = p_api_transaction_id,
        updated_at = NOW()
    WHERE id = p_liana_order_id;
    
    -- Create success notification for user
    PERFORM create_user_notification(
        v_order.user_id,
        'Order Completed',
        'Your Mobile Legends diamonds for order ' || v_order.order_number || ' have been delivered successfully!',
        'order'
    );
    
    -- Log activity
    INSERT INTO activity_logs (
        actor_id, actor_email, activity_type, action, description, target_type, target_id, metadata
    ) VALUES (
        v_order.user_id,
        v_order.user_email,
        'order_completed',
        'ML Order Auto-Completed',
        FORMAT('Order %s auto-completed via Liana API', v_order.order_number),
        'order',
        p_order_id,
        jsonb_build_object(
            'order_number', v_order.order_number,
            'liana_order_id', p_liana_order_id,
            'api_transaction_id', p_api_transaction_id
        )
    );
    
    RETURN json_build_object('success', true, 'message', 'Order completed successfully');
END;
$$;

-- Create function to fail ML order (called by edge function via service role)
CREATE OR REPLACE FUNCTION fail_ml_order(
    p_order_id UUID,
    p_liana_order_id UUID,
    p_error_message TEXT,
    p_api_response JSONB DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    v_order product_orders%ROWTYPE;
BEGIN
    -- Get order
    SELECT * INTO v_order FROM product_orders WHERE id = p_order_id FOR UPDATE;
    
    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'message', 'Order not found');
    END IF;
    
    -- Update product_orders status to failed (custom status for API failures)
    UPDATE product_orders
    SET status = 'canceled',
        canceled_at = NOW(),
        updated_at = NOW(),
        cancellation_reason = 'API Error: ' || p_error_message
    WHERE id = p_order_id;
    
    -- Update liana_orders status
    UPDATE liana_orders
    SET status = 'failed',
        error_message = p_error_message,
        api_response = p_api_response,
        retry_count = retry_count + 1,
        updated_at = NOW()
    WHERE id = p_liana_order_id;
    
    -- Create failure notification for user
    PERFORM create_user_notification(
        v_order.user_id,
        'Order Failed',
        'Your order ' || v_order.order_number || ' could not be processed: ' || p_error_message || '. Please contact support.',
        'order'
    );
    
    -- Log activity
    INSERT INTO activity_logs (
        actor_id, actor_email, activity_type, action, description, target_type, target_id, metadata
    ) VALUES (
        v_order.user_id,
        v_order.user_email,
        'order_failed',
        'ML Order Failed',
        FORMAT('Order %s failed: %s', v_order.order_number, p_error_message),
        'order',
        p_order_id,
        jsonb_build_object(
            'order_number', v_order.order_number,
            'liana_order_id', p_liana_order_id,
            'error', p_error_message
        )
    );
    
    RETURN json_build_object('success', true, 'message', 'Order marked as failed');
END;
$$;