-- Fix search_path for the two functions
CREATE OR REPLACE FUNCTION complete_ml_order(
    p_order_id UUID,
    p_liana_order_id UUID,
    p_api_response JSONB,
    p_api_transaction_id TEXT DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
DECLARE
    v_order product_orders%ROWTYPE;
BEGIN
    SELECT * INTO v_order FROM product_orders WHERE id = p_order_id FOR UPDATE;
    
    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'message', 'Order not found');
    END IF;
    
    UPDATE product_orders
    SET status = 'completed',
        completed_at = NOW(),
        updated_at = NOW(),
        admin_remarks = 'Auto-processed via Liana API'
    WHERE id = p_order_id;
    
    UPDATE liana_orders
    SET status = 'completed',
        api_response = p_api_response,
        api_transaction_id = p_api_transaction_id,
        updated_at = NOW()
    WHERE id = p_liana_order_id;
    
    PERFORM create_user_notification(
        v_order.user_id,
        'Order Completed',
        'Your Mobile Legends diamonds for order ' || v_order.order_number || ' have been delivered successfully!',
        'order'
    );
    
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

CREATE OR REPLACE FUNCTION fail_ml_order(
    p_order_id UUID,
    p_liana_order_id UUID,
    p_error_message TEXT,
    p_api_response JSONB DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
DECLARE
    v_order product_orders%ROWTYPE;
BEGIN
    SELECT * INTO v_order FROM product_orders WHERE id = p_order_id FOR UPDATE;
    
    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'message', 'Order not found');
    END IF;
    
    UPDATE product_orders
    SET status = 'canceled',
        canceled_at = NOW(),
        updated_at = NOW(),
        cancellation_reason = 'API Error: ' || p_error_message
    WHERE id = p_order_id;
    
    UPDATE liana_orders
    SET status = 'failed',
        error_message = p_error_message,
        api_response = p_api_response,
        retry_count = retry_count + 1,
        updated_at = NOW()
    WHERE id = p_liana_order_id;
    
    PERFORM create_user_notification(
        v_order.user_id,
        'Order Failed',
        'Your order ' || v_order.order_number || ' could not be processed: ' || p_error_message || '. Please contact support.',
        'order'
    );
    
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