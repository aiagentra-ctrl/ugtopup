import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Liana API Configuration
const LIANA_API_BASE_URL = 'https://api.lfrfrk.xyz';

interface ProcessMLOrderRequest {
  order_id: string;
}

interface LianaApiResponse {
  success: boolean;
  message?: string;
  data?: {
    order_id?: string;
    transaction_id?: string;
    status?: string;
    ign?: string;
  };
  error?: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lianaApiKey = Deno.env.get('LIANA_API_KEY');
    const lianaApiSecret = Deno.env.get('LIANA_API_SECRET');

    if (!lianaApiKey || !lianaApiSecret) {
      console.error('Liana API credentials not configured');
      return new Response(
        JSON.stringify({ success: false, error: 'API credentials not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create admin client for database operations
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    const { order_id }: ProcessMLOrderRequest = await req.json();

    if (!order_id) {
      return new Response(
        JSON.stringify({ success: false, error: 'order_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Processing ML order: ${order_id}`);

    // Fetch the order details
    const { data: order, error: orderError } = await supabaseAdmin
      .from('product_orders')
      .select('*')
      .eq('id', order_id)
      .single();

    if (orderError || !order) {
      console.error('Order not found:', orderError);
      return new Response(
        JSON.stringify({ success: false, error: 'Order not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify this is a Mobile Legends order
    if (order.product_category !== 'mobile_legends') {
      return new Response(
        JSON.stringify({ success: false, error: 'Not a Mobile Legends order' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if order is already processed
    if (order.status !== 'pending') {
      return new Response(
        JSON.stringify({ success: false, error: `Order already ${order.status}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Extract user details from product_details
    const productDetails = order.product_details || {};
    const userId = productDetails.userId || productDetails.user_id;
    const zoneId = productDetails.zoneId || productDetails.zone_id;
    const quantity = order.quantity;
    const packageName = order.package_name;

    if (!userId || !zoneId) {
      console.error('Missing user_id or zone_id in order details');
      return new Response(
        JSON.stringify({ success: false, error: 'Missing user_id or zone_id' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Map package name to Liana product ID
    // This mapping should be adjusted based on actual Liana API product IDs
    const productIdMap: Record<string, number> = {
      '5 Diamonds': 1,
      '11 Diamonds': 2,
      '22 Diamonds': 3,
      '56 Diamonds': 4,
      '86 Diamonds': 5,
      '112 Diamonds': 6,
      '172 Diamonds': 7,
      '257 Diamonds': 8,
      '343 Diamonds': 9,
      '429 Diamonds': 10,
      '514 Diamonds': 11,
      '600 Diamonds': 12,
      '706 Diamonds': 13,
      '792 Diamonds': 14,
      '878 Diamonds': 15,
      '963 Diamonds': 16,
      '1050 Diamonds': 17,
      '1135 Diamonds': 18,
      '1220 Diamonds': 19,
      '1412 Diamonds': 20,
      '2195 Diamonds': 21,
      '2901 Diamonds': 22,
      '3688 Diamonds': 23,
      '4394 Diamonds': 24,
      '5532 Diamonds': 25,
      '9288 Diamonds': 26,
      'Weekly Diamond Pass': 100,
      'Twilight Pass': 101,
    };

    const lianaProductId = productIdMap[packageName] || 1;

    // Create liana_orders record first
    const { data: lianaOrder, error: lianaOrderError } = await supabaseAdmin
      .from('liana_orders')
      .insert({
        order_id: order_id,
        liana_product_id: lianaProductId,
        user_id: userId,
        zone_id: zoneId,
        status: 'processing'
      })
      .select()
      .single();

    if (lianaOrderError) {
      console.error('Failed to create liana_orders record:', lianaOrderError);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to create tracking record' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Created liana_orders record: ${lianaOrder.id}`);

    // Update order status to processing
    await supabaseAdmin
      .from('product_orders')
      .update({ status: 'processing', updated_at: new Date().toISOString() })
      .eq('id', order_id);

    try {
      // Step 1: Verify player ID with Liana API
      console.log(`Verifying player: userId=${userId}, zoneId=${zoneId}`);
      
      const verifyResponse = await fetch(`${LIANA_API_BASE_URL}/api/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': lianaApiKey,
          'X-API-Secret': lianaApiSecret,
        },
        body: JSON.stringify({
          product_id: lianaProductId,
          user_id: userId,
          zone_id: zoneId,
        }),
      });

      const verifyData: LianaApiResponse = await verifyResponse.json();
      console.log('Verify response:', JSON.stringify(verifyData));

      if (!verifyResponse.ok || !verifyData.success) {
        const errorMessage = verifyData.message || verifyData.error || 'Player verification failed';
        console.error('Player verification failed:', errorMessage);
        
        // Call fail_ml_order function
        await supabaseAdmin.rpc('fail_ml_order', {
          p_order_id: order_id,
          p_liana_order_id: lianaOrder.id,
          p_error_message: errorMessage,
          p_api_response: verifyData,
        });

        return new Response(
          JSON.stringify({ success: false, error: errorMessage, stage: 'verification' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const ign = verifyData.data?.ign || '';
      
      // Update liana_orders with IGN
      await supabaseAdmin
        .from('liana_orders')
        .update({ ign })
        .eq('id', lianaOrder.id);

      // Step 2: Create order with Liana API
      console.log(`Creating order: productId=${lianaProductId}, qty=${quantity}`);
      
      const orderResponse = await fetch(`${LIANA_API_BASE_URL}/api/order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': lianaApiKey,
          'X-API-Secret': lianaApiSecret,
        },
        body: JSON.stringify({
          product_id: lianaProductId,
          user_id: userId,
          zone_id: zoneId,
          quantity: quantity,
          reference_id: order.order_number,
        }),
      });

      const orderData: LianaApiResponse = await orderResponse.json();
      console.log('Order response:', JSON.stringify(orderData));

      if (!orderResponse.ok || !orderData.success) {
        const errorMessage = orderData.message || orderData.error || 'Order creation failed';
        console.error('Order creation failed:', errorMessage);
        
        // Call fail_ml_order function
        await supabaseAdmin.rpc('fail_ml_order', {
          p_order_id: order_id,
          p_liana_order_id: lianaOrder.id,
          p_error_message: errorMessage,
          p_api_response: orderData,
        });

        return new Response(
          JSON.stringify({ success: false, error: errorMessage, stage: 'order' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Order successful - call complete_ml_order function
      const transactionId = orderData.data?.transaction_id || orderData.data?.order_id;
      
      await supabaseAdmin.rpc('complete_ml_order', {
        p_order_id: order_id,
        p_liana_order_id: lianaOrder.id,
        p_api_response: orderData,
        p_api_transaction_id: transactionId,
      });

      console.log(`Order ${order.order_number} completed successfully`);

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Diamonds delivered successfully!',
          ign: ign,
          transaction_id: transactionId,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } catch (apiError) {
      console.error('Liana API error:', apiError);
      
      const errorMessage = apiError instanceof Error ? apiError.message : 'API connection failed';
      
      // Call fail_ml_order function
      await supabaseAdmin.rpc('fail_ml_order', {
        p_order_id: order_id,
        p_liana_order_id: lianaOrder.id,
        p_error_message: errorMessage,
        p_api_response: { error: errorMessage },
      });

      return new Response(
        JSON.stringify({ success: false, error: errorMessage, stage: 'api_connection' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

  } catch (error) {
    console.error('Error processing ML order:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
