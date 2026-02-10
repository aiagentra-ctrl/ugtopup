import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const LIANA_API_BASE_URL = 'https://lianastore.in/wp-json/ar2/v1';

interface ProcessMLOrderRequest {
  order_id: string;
}

interface LianaVerifyResponse {
  status: string;
  verified?: boolean;
  display?: string;
  game?: string;
  message?: string;
  error?: string;
}

interface LianaOrderResponse {
  status: string;
  order_id?: string;
  transaction_id?: string;
  balance_after?: number;
  message?: string;
  error?: string;
}

// Map frontend package names to Liana variation_ids
// Frontend names come from mlPackages.ts (e.g. "55 Diamonds", "86 Diamonds", "Weekly")
const productIdMap: Record<string, number> = {
  // Diamond packages - matching frontend mlDiamondPackages names
  '55 Diamonds': 3894,
  '86 Diamonds': 3895,
  '110 Diamonds': 3896,
  '165 Diamonds': 3897,
  '172 Diamonds': 3897,
  '257 Diamonds': 3898,
  '344 Diamonds': 3899,
  '343 Diamonds': 3899,
  '430 Diamonds': 3900,
  '429 Diamonds': 3900,
  '514 Diamonds': 3901,
  '565 Diamonds': 3902,
  '600 Diamonds': 3902,
  '706 Diamonds': 3903,
  '792 Diamonds': 3904,
  '878 Diamonds': 3905,
  '963 Diamonds': 3906,
  '1050 Diamonds': 3907,
  '1135 Diamonds': 3908,
  '1220 Diamonds': 3909,
  '1412 Diamonds': 3910,
  '2195 Diamonds': 3911,
  '2215 Diamonds': 3911,
  '2901 Diamonds': 3912,
  '3688 Diamonds': 3913,
  '4394 Diamonds': 3914,
  '5532 Diamonds': 3915,
  '9288 Diamonds': 3916,
  // Special packages - matching frontend mlSpecialDeals names
  'Weekly': 3917,
  'Weekly Diamond Pass': 3917,
  'Twilight': 3918,
  'Twilight Pass': 3918,
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
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

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    const { order_id }: ProcessMLOrderRequest = await req.json();

    if (!order_id) {
      return new Response(
        JSON.stringify({ success: false, error: 'order_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Processing ML order: ${order_id}`);

    // Fetch order
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

    if (order.product_category !== 'mobile_legends') {
      return new Response(
        JSON.stringify({ success: false, error: 'Not a Mobile Legends order' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (order.status === 'completed' || order.status === 'canceled') {
      return new Response(
        JSON.stringify({ success: false, error: `Order already ${order.status}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const productDetails = order.product_details || {};
    const userId = productDetails.userId || productDetails.user_id;
    const zoneId = productDetails.zoneId || productDetails.zone_id;
    const purchaseQuantity = productDetails.purchase_quantity || 1;
    const packageName = order.package_name;

    if (!userId || !zoneId) {
      console.error('Missing user_id or zone_id in order details');
      return new Response(
        JSON.stringify({ success: false, error: 'Missing user_id or zone_id' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const lianaProductId = productIdMap[packageName];

    if (!lianaProductId) {
      console.error(`Unknown package: ${packageName}. Available: ${Object.keys(productIdMap).join(', ')}`);
      return new Response(
        JSON.stringify({ success: false, error: `Unknown package: ${packageName}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create or update liana_orders tracking record
    const { data: existingLianaOrder } = await supabaseAdmin
      .from('liana_orders')
      .select('*')
      .eq('order_id', order_id)
      .single();

    let lianaOrderId: string;

    if (existingLianaOrder) {
      lianaOrderId = existingLianaOrder.id;
      await supabaseAdmin
        .from('liana_orders')
        .update({
          status: 'processing',
          retry_count: (existingLianaOrder.retry_count || 0) + 1,
          error_message: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', lianaOrderId);
    } else {
      const { data: lianaOrder, error: lianaOrderError } = await supabaseAdmin
        .from('liana_orders')
        .insert({
          order_id: order_id,
          liana_product_id: lianaProductId,
          user_id: userId,
          zone_id: zoneId,
          status: 'processing',
          api_request_sent: false
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
      lianaOrderId = lianaOrder.id;
    }

    // Update order status to processing
    await supabaseAdmin
      .from('product_orders')
      .update({
        status: 'processing',
        processing_started_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', order_id);

    const apiHeaders = {
      'Content-Type': 'application/json',
      'X-API-KEY': lianaApiKey,
      'X-API-SECRET': lianaApiSecret,
      'X-ORIGIN-DOMAIN': 'ugtopups.lovable.app',
      'Accept': 'application/json',
      'User-Agent': 'LianaStoreWooCommerce/2.2.2'
    };

    try {
      // Step 1: Verify player ID
      console.log(`Verifying player: uid=${userId}, zone_id=${zoneId}, variation_id=${lianaProductId}`);

      await supabaseAdmin
        .from('liana_orders')
        .update({ verification_sent_at: new Date().toISOString() })
        .eq('id', lianaOrderId);

      const verifyPayload = {
        variation_id: lianaProductId,
        uid: userId,
        zone_id: zoneId
      };

      console.log('Verify payload:', JSON.stringify(verifyPayload));

      const verifyResponse = await fetch(`${LIANA_API_BASE_URL}/ign/verify`, {
        method: 'POST',
        headers: apiHeaders,
        body: JSON.stringify(verifyPayload),
      });

      const verifyText = await verifyResponse.text();
      console.log('Verify raw response:', verifyText);

      let verifyData: LianaVerifyResponse;
      try {
        verifyData = JSON.parse(verifyText);
      } catch {
        verifyData = { status: 'error', message: verifyText };
      }

      await supabaseAdmin
        .from('liana_orders')
        .update({
          verification_response: verifyData,
          verification_completed_at: new Date().toISOString()
        })
        .eq('id', lianaOrderId);

      const isVerified = verifyData.status === 'success' && verifyData.verified === true;

      if (!verifyResponse.ok || !isVerified) {
        const errorMessage = verifyData.message || verifyData.error || 'Player verification failed - IGN not found';
        console.error('Player verification failed:', errorMessage);

        await supabaseAdmin
          .from('liana_orders')
          .update({
            status: 'failed',
            error_message: `Verification failed: ${errorMessage}`,
            api_response: verifyData,
            updated_at: new Date().toISOString()
          })
          .eq('id', lianaOrderId);

        await supabaseAdmin
          .from('product_orders')
          .update({
            status: 'canceled',
            failed_at: new Date().toISOString(),
            failure_reason: `Verification failed: ${errorMessage}`,
            updated_at: new Date().toISOString()
          })
          .eq('id', order_id);

        return new Response(
          JSON.stringify({ success: false, error: errorMessage, stage: 'verification' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // IGN from verification
      const ign = verifyData.display || userId;

      await supabaseAdmin
        .from('liana_orders')
        .update({ ign })
        .eq('id', lianaOrderId);

      console.log(`Player verified: IGN = ${ign}`);

      // Step 2: Create order
      console.log(`Creating order: variation_id=${lianaProductId}, qty=${purchaseQuantity}`);

      await supabaseAdmin
        .from('liana_orders')
        .update({ order_sent_at: new Date().toISOString(), api_request_sent: true })
        .eq('id', lianaOrderId);

      const orderPayload = {
        variation_id: lianaProductId,
        qty: purchaseQuantity,
        uid: userId,
        zone_id: zoneId,
        reference_id: order.order_number
      };

      console.log('Order payload:', JSON.stringify(orderPayload));

      const orderResponse = await fetch(`${LIANA_API_BASE_URL}/orders`, {
        method: 'POST',
        headers: apiHeaders,
        body: JSON.stringify(orderPayload),
      });

      const orderText = await orderResponse.text();
      console.log('Order raw response:', orderText);

      let orderData: LianaOrderResponse;
      try {
        orderData = JSON.parse(orderText);
      } catch {
        orderData = { status: 'error', message: orderText };
      }

      await supabaseAdmin
        .from('liana_orders')
        .update({
          order_response: orderData,
        })
        .eq('id', lianaOrderId);

      if (!orderResponse.ok || orderData.status !== 'success') {
        const errorMessage = orderData.message || orderData.error || 'Order creation failed';
        console.error('Order creation failed:', errorMessage);

        await supabaseAdmin
          .from('liana_orders')
          .update({
            status: 'failed',
            error_message: `Order failed: ${errorMessage}`,
            api_response: orderData,
            updated_at: new Date().toISOString()
          })
          .eq('id', lianaOrderId);

        await supabaseAdmin
          .from('product_orders')
          .update({
            status: 'canceled',
            failed_at: new Date().toISOString(),
            failure_reason: `Order failed: ${errorMessage}`,
            updated_at: new Date().toISOString()
          })
          .eq('id', order_id);

        return new Response(
          JSON.stringify({ success: false, error: errorMessage, stage: 'order' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Success!
      const transactionId = orderData.order_id || orderData.transaction_id || '';

      await supabaseAdmin
        .from('liana_orders')
        .update({
          status: 'completed',
          api_response: orderData,
          api_transaction_id: transactionId,
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', lianaOrderId);

      await supabaseAdmin
        .from('product_orders')
        .update({
          status: 'completed',
          transaction_id: transactionId,
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', order_id);

      console.log(`Order ${order.order_number} completed! Transaction: ${transactionId}`);

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

      await supabaseAdmin
        .from('liana_orders')
        .update({
          status: 'failed',
          error_message: `Connection error: ${errorMessage}`,
          api_response: { error: errorMessage },
          updated_at: new Date().toISOString()
        })
        .eq('id', lianaOrderId);

      await supabaseAdmin
        .from('product_orders')
        .update({
          status: 'canceled',
          failed_at: new Date().toISOString(),
          failure_reason: `Connection error: ${errorMessage}`,
          updated_at: new Date().toISOString()
        })
        .eq('id', order_id);

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
