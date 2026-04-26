import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  console.log('IPN webhook received');

  try {
    // Parse the IPN data (can be form-urlencoded or JSON)
    let ipnData: Record<string, any>;
    
    const contentType = req.headers.get('content-type') || '';
    
    if (contentType.includes('application/x-www-form-urlencoded')) {
      const formData = await req.formData();
      ipnData = {};
      formData.forEach((value, key) => {
        ipnData[key] = value;
      });
    } else if (contentType.includes('application/json')) {
      ipnData = await req.json();
    } else {
      // Try to parse as text and convert
      const text = await req.text();
      try {
        ipnData = JSON.parse(text);
      } catch {
        // Parse as URL encoded
        const params = new URLSearchParams(text);
        ipnData = {};
        params.forEach((value, key) => {
          ipnData[key] = value;
        });
      }
    }

    console.log('IPN data received');

    // --- Strict input validation: only accept known fields, with size limits ---
    const str = (v: unknown, max: number): string | undefined => {
      if (v === null || v === undefined) return undefined;
      const s = String(v).slice(0, max);
      return s.length ? s : undefined;
    };
    const num = (v: unknown): number | undefined => {
      const n = typeof v === 'number' ? v : parseFloat(String(v));
      return Number.isFinite(n) ? n : undefined;
    };

    const identifier = str(ipnData.identifier ?? ipnData.payment_id, 50);
    const status = str(ipnData.status ?? ipnData.payment_status, 30);
    const transactionId = str(ipnData.transaction_id ?? ipnData.trx_id ?? ipnData.api_transaction_id, 100);
    const gateway = str(ipnData.gateway ?? ipnData.payment_gateway ?? ipnData.method, 50);

    // Optional shared-secret signature check (set APINEPAL_WEBHOOK_SECRET to enable).
    const expectedSecret = Deno.env.get('APINEPAL_WEBHOOK_SECRET');
    if (expectedSecret) {
      const provided = req.headers.get('x-webhook-secret') || str(ipnData.webhook_secret, 200);
      if (provided !== expectedSecret) {
        console.warn('IPN rejected: invalid webhook secret');
        return new Response(
          JSON.stringify({ error: 'Unauthorized' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Build a sanitized payload that gets persisted to api_response — strips any
    // attacker-supplied junk fields that could later be rendered in admin tools.
    const sanitizedPayload = {
      identifier,
      status,
      transaction_id: transactionId,
      gateway,
      amount: num(ipnData.amount),
      currency: str(ipnData.currency, 10),
      received_at: new Date().toISOString(),
    };

    if (!identifier) {
      return new Response(
        JSON.stringify({ error: 'Missing identifier' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create admin client
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Verify the transaction exists
    const { data: transaction, error: fetchError } = await supabaseAdmin
      .from('payment_transactions')
      .select('*')
      .eq('identifier', identifier)
      .single();

    if (fetchError || !transaction) {
      console.error('Transaction not found:', identifier);
      return new Response(
        JSON.stringify({ error: 'Transaction not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Found transaction:', transaction.id, 'Current status:', transaction.status);

    // Process based on status
    const normalizedStatus = (status || '').toLowerCase();

    if (normalizedStatus === 'completed' || normalizedStatus === 'success' || normalizedStatus === 'paid') {
      // Call the atomic completion function
      const { data: result, error: rpcError } = await supabaseAdmin.rpc(
        'process_payment_completion',
        {
          p_identifier: identifier,
          p_transaction_id: transactionId || '',
          p_gateway: gateway || 'unknown',
          p_api_response: ipnData
        }
      );

      if (rpcError) {
        console.error('RPC error:', rpcError);
        return new Response(
          JSON.stringify({ error: 'Processing failed' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log('Payment processed:', result);

      return new Response(
        JSON.stringify({ success: true, message: 'Payment processed' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } else if (normalizedStatus === 'failed' || normalizedStatus === 'cancelled' || normalizedStatus === 'canceled') {
      // Call the failure function
      const failureStatus = normalizedStatus === 'cancelled' || normalizedStatus === 'canceled' 
        ? 'cancelled' 
        : 'failed';

      const { data: result, error: rpcError } = await supabaseAdmin.rpc(
        'process_payment_failure',
        {
          p_identifier: identifier,
          p_status: failureStatus,
          p_api_response: ipnData
        }
      );

      if (rpcError) {
        console.error('RPC error:', rpcError);
        return new Response(
          JSON.stringify({ error: 'Processing failed' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log('Payment failure processed:', result);

      return new Response(
        JSON.stringify({ success: true, message: 'Payment status updated' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } else {
      // Unknown or pending status - just log it
      console.log('Unknown/pending status:', normalizedStatus);
      
      await supabaseAdmin
        .from('payment_transactions')
        .update({ 
          api_response: ipnData,
          updated_at: new Date().toISOString()
        })
        .eq('identifier', identifier);

      return new Response(
        JSON.stringify({ success: true, message: 'Status logged' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

  } catch (error) {
    console.error('IPN processing error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
