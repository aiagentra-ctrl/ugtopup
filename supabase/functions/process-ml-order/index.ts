import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const LIANA_API_BASE_URL = 'https://lianastore.in/wp-json/ar2/v1';

interface ProcessMLOrderRequest {
  order_id?: string;
  action?: string;
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

// Complete mapping of ML Indian diamond packages to Liana variation_ids
const productIdMap: Record<string, number> = {
  '86 Diamonds': 5743,
  '172 Diamonds': 5857,
  '257 Diamonds': 5859,
  '343 Diamonds': 5860,
  '429 Diamonds': 5861,
  '514 Diamonds': 5862,
  '600 Diamonds': 5863,
  '706 Diamonds': 5864,
  '878 Diamonds': 6936,
  '1049 Diamonds': 5865,
  '1050 Diamonds': 5865,
  '1135 Diamonds': 6978,
  '1412 Diamonds': 5866,
  '2195 Diamonds': 5867,
  '3688 Diamonds': 5868,
  '5532 Diamonds': 5869,
  '9288 Diamonds': 5870,
  'Weekly': 5570,
  'Weekly Diamond Pass': 5570,
  'Twilight': 6111,
  'Twilight Pass': 6111,
  'Super Value Pass': 7236,
};

const quantityMap: Record<number, number> = {
  86: 5743, 172: 5857, 257: 5859, 343: 5860, 429: 5861, 514: 5862,
  600: 5863, 706: 5864, 878: 6936, 1049: 5865, 1050: 5865,
  1135: 6978, 1412: 5866, 2195: 5867, 3688: 5868, 5532: 5869, 9288: 5870,
};

const nonApiPackages = new Set(['55 Diamonds', '110 Diamonds', '165 Diamonds', '275 Diamonds', '565 Diamonds']);

function resolveVariationId(packageName: string, quantity?: number): number | null {
  const trimmed = packageName.trim();
  if (productIdMap[trimmed]) return productIdMap[trimmed];
  const match = trimmed.match(/^(\d+)\s*Diamonds?$/i);
  if (match) {
    const qty = parseInt(match[1], 10);
    if (quantityMap[qty]) return quantityMap[qty];
  }
  if (quantity && quantityMap[quantity]) return quantityMap[quantity];
  return null;
}

function getLianaHeaders(apiKey: string, apiSecret: string) {
  return {
    'Content-Type': 'application/json',
    'X-API-KEY': apiKey,
    'X-API-SECRET': apiSecret,
    'X-ORIGIN-DOMAIN': 'ugtopups.com',
    'Accept': 'application/json',
    'User-Agent': 'LianaStoreWooCommerce/2.2.2'
  };
}

// Fetch Liana wallet balance
async function fetchWalletBalance(apiKey: string, apiSecret: string): Promise<any> {
  const headers = getLianaHeaders(apiKey, apiSecret);
  
  try {
    const response = await fetch(`${LIANA_API_BASE_URL}/balance`, {
      method: 'GET',
      headers,
    });
    
    const text = await response.text();
    console.log('Wallet balance raw response:', text);
    
    try {
      return JSON.parse(text);
    } catch {
      return { status: 'error', message: text };
    }
  } catch (error) {
    console.error('Wallet balance fetch error:', error);
    return { status: 'error', message: error instanceof Error ? error.message : 'Connection failed' };
  }
}

// Handle wallet balance check action
async function handleBalanceCheck(lianaApiKey: string, lianaApiSecret: string) {
  const balanceData = await fetchWalletBalance(lianaApiKey, lianaApiSecret);
  
  return new Response(
    JSON.stringify({
      success: balanceData.status !== 'error',
      balance: balanceData,
      timestamp: new Date().toISOString(),
    }),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

// Process ML order
async function handleProcessOrder(
  orderId: string,
  supabaseAdmin: any,
  lianaApiKey: string,
  lianaApiSecret: string
) {
  console.log(`Processing ML order: ${orderId}`);

  const { data: order, error: orderError } = await supabaseAdmin
    .from('product_orders')
    .select('*')
    .eq('id', orderId)
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
    return new Response(
      JSON.stringify({ success: false, error: 'Missing user_id or zone_id' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  if (nonApiPackages.has(packageName)) {
    console.log(`Non-API package: ${packageName}. Skipping API processing.`);
    return new Response(
      JSON.stringify({ success: false, error: 'non_api_package', message: 'This package is processed manually.' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const lianaProductId = resolveVariationId(packageName, order.quantity);
  if (!lianaProductId) {
    return new Response(
      JSON.stringify({ success: false, error: `Unknown package: ${packageName}` }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Check wallet balance BEFORE processing
  console.log('Checking Liana wallet balance before order...');
  const balanceData = await fetchWalletBalance(lianaApiKey, lianaApiSecret);
  console.log('Wallet balance check result:', JSON.stringify(balanceData));
  
  if (balanceData.status === 'success' && balanceData.balance !== undefined) {
    const walletBalance = parseFloat(balanceData.balance);
    console.log(`Liana wallet balance: ${walletBalance} coins`);
    
    if (walletBalance <= 0) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Liana wallet has insufficient balance. Please top up the merchant wallet.',
          wallet_balance: walletBalance
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  }

  // Create or update liana_orders tracking
  const { data: existingLianaOrder } = await supabaseAdmin
    .from('liana_orders')
    .select('*')
    .eq('order_id', orderId)
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
        order_id: orderId,
        liana_product_id: lianaProductId,
        user_id: userId,
        zone_id: zoneId,
        status: 'processing',
        api_request_sent: false
      })
      .select()
      .single();

    if (lianaOrderError) {
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to create tracking record' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    lianaOrderId = lianaOrder.id;
  }

  await supabaseAdmin
    .from('product_orders')
    .update({
      status: 'processing',
      processing_started_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('id', orderId);

  const apiHeaders = getLianaHeaders(lianaApiKey, lianaApiSecret);

  try {
    // Step 1: Verify player ID
    console.log(`Verifying player: uid=${userId}, zone_id=${zoneId}, variation_id=${lianaProductId}`);

    await supabaseAdmin
      .from('liana_orders')
      .update({ verification_sent_at: new Date().toISOString() })
      .eq('id', lianaOrderId);

    const verifyPayload = { variation_id: lianaProductId, uid: userId, zone_id: zoneId };
    console.log('Verify payload:', JSON.stringify(verifyPayload));

    const verifyResponse = await fetch(`${LIANA_API_BASE_URL}/ign/verify`, {
      method: 'POST',
      headers: apiHeaders,
      body: JSON.stringify(verifyPayload),
    });

    const verifyText = await verifyResponse.text();
    console.log('Verify raw response:', verifyText);

    let verifyData: LianaVerifyResponse;
    try { verifyData = JSON.parse(verifyText); } catch { verifyData = { status: 'error', message: verifyText }; }

    await supabaseAdmin
      .from('liana_orders')
      .update({ verification_response: verifyData, verification_completed_at: new Date().toISOString() })
      .eq('id', lianaOrderId);

    const isVerified = verifyData.status === 'success' && verifyData.verified === true;

    if (!verifyResponse.ok || !isVerified) {
      const errorMessage = verifyData.message || verifyData.error || 'Player verification failed';
      console.error('Player verification failed:', errorMessage);

      await supabaseAdmin.from('liana_orders').update({
        status: 'failed', error_message: `Verification failed: ${errorMessage}`,
        api_response: verifyData, updated_at: new Date().toISOString()
      }).eq('id', lianaOrderId);

      await supabaseAdmin.from('product_orders').update({
        status: 'canceled', failed_at: new Date().toISOString(),
        failure_reason: `Verification failed: ${errorMessage}`, updated_at: new Date().toISOString()
      }).eq('id', orderId);

      return new Response(
        JSON.stringify({ success: false, error: errorMessage, stage: 'verification' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const ign = verifyData.display || userId;
    await supabaseAdmin.from('liana_orders').update({ ign }).eq('id', lianaOrderId);
    console.log(`Player verified: IGN = ${ign}`);

    // Step 2: Create order
    console.log(`Creating order: variation_id=${lianaProductId}, qty=${purchaseQuantity}`);

    await supabaseAdmin.from('liana_orders')
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
    try { orderData = JSON.parse(orderText); } catch { orderData = { status: 'error', message: orderText }; }

    await supabaseAdmin.from('liana_orders').update({ order_response: orderData }).eq('id', lianaOrderId);

    if (!orderResponse.ok || orderData.status !== 'success') {
      const errorMessage = orderData.message || orderData.error || 'Order creation failed';
      console.error('Order creation failed:', errorMessage);

      await supabaseAdmin.from('liana_orders').update({
        status: 'failed', error_message: `Order failed: ${errorMessage}`,
        api_response: orderData, updated_at: new Date().toISOString()
      }).eq('id', lianaOrderId);

      await supabaseAdmin.from('product_orders').update({
        status: 'canceled', failed_at: new Date().toISOString(),
        failure_reason: `Order failed: ${errorMessage}`, updated_at: new Date().toISOString()
      }).eq('id', orderId);

      return new Response(
        JSON.stringify({ success: false, error: errorMessage, stage: 'order' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Success
    const transactionId = orderData.order_id || orderData.transaction_id || '';

    await supabaseAdmin.from('liana_orders').update({
      status: 'completed', api_response: orderData, api_transaction_id: transactionId,
      completed_at: new Date().toISOString(), updated_at: new Date().toISOString()
    }).eq('id', lianaOrderId);

    await supabaseAdmin.from('product_orders').update({
      status: 'completed', transaction_id: transactionId,
      completed_at: new Date().toISOString(), updated_at: new Date().toISOString()
    }).eq('id', orderId);

    console.log(`Order ${order.order_number} completed! Transaction: ${transactionId}`);

    return new Response(
      JSON.stringify({
        success: true, message: 'Diamonds delivered successfully!',
        ign, transaction_id: transactionId,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (apiError) {
    console.error('Liana API error:', apiError);
    const errorMessage = apiError instanceof Error ? apiError.message : 'API connection failed';

    await supabaseAdmin.from('liana_orders').update({
      status: 'failed', error_message: `Connection error: ${errorMessage}`,
      api_response: { error: errorMessage }, updated_at: new Date().toISOString()
    }).eq('id', lianaOrderId);

    await supabaseAdmin.from('product_orders').update({
      status: 'canceled', failed_at: new Date().toISOString(),
      failure_reason: `Connection error: ${errorMessage}`, updated_at: new Date().toISOString()
    }).eq('id', orderId);

    return new Response(
      JSON.stringify({ success: false, error: errorMessage, stage: 'api_connection' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const lianaApiKey = Deno.env.get('LIANA_API_KEY');
    const lianaApiSecret = Deno.env.get('LIANA_API_SECRET');

    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.replace('Bearer ', '');
      const isKnownKey = token === supabaseServiceKey || token === anonKey;
      if (!isKnownKey) {
        const userClient = createClient(supabaseUrl, anonKey, {
          global: { headers: { Authorization: authHeader } }
        });
        const { error: claimsError } = await userClient.auth.getClaims(token);
        if (claimsError) {
          return new Response(
            JSON.stringify({ success: false, error: 'Invalid token' }),
            { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }
    }

    if (!lianaApiKey || !lianaApiSecret) {
      return new Response(
        JSON.stringify({ success: false, error: 'API credentials not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body: ProcessMLOrderRequest = await req.json();
    const action = body.action || 'process';

    if (action === 'check-balance') {
      return await handleBalanceCheck(lianaApiKey, lianaApiSecret);
    }

    // Default: process order
    const { order_id } = body;
    if (!order_id) {
      return new Response(
        JSON.stringify({ success: false, error: 'order_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    return await handleProcessOrder(order_id, supabaseAdmin, lianaApiKey, lianaApiSecret);

  } catch (err) {
    console.error('Unhandled error:', err);
    return new Response(
      JSON.stringify({ success: false, error: err instanceof Error ? err.message : 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
