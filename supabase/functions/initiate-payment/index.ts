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

  try {
    // Validate auth
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    // Verify user
    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = claimsData.claims.sub;
    const userEmail = claimsData.claims.email as string;

    // Parse request body
    const { amount, siteUrl } = await req.json();

    if (!amount || amount < 1 || amount > 100000) {
      return new Response(
        JSON.stringify({ error: 'Invalid amount. Must be between 1 and 100000' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get user profile for customer details
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('full_name, username, email')
      .eq('id', userId)
      .single();

    if (profileError) {
      console.error('Profile fetch error:', profileError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch user profile' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate unique identifier (max 20 chars for API Nepal)
    // Format: UG + 4 char user + timestamp in base36 = ~15-17 chars
    const identifier = `UG${userId.slice(0, 4)}${Date.now().toString(36)}`;

    // Create admin client for inserting transaction
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Insert payment transaction record
    const { error: insertError } = await supabaseAdmin
      .from('payment_transactions')
      .insert({
        user_id: userId,
        user_email: userEmail,
        identifier,
        amount,
        credits: amount, // 1:1 ratio
        status: 'initiated'
      });

    if (insertError) {
      console.error('Insert error:', insertError);
      return new Response(
        JSON.stringify({ error: 'Failed to create payment record' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get API Nepal credentials
    const mode = Deno.env.get('APINEPAL_MODE') || 'test';
    const publicKey = Deno.env.get('APINEPAL_PUBLIC_KEY');
    const secretKey = Deno.env.get('APINEPAL_SECRET_KEY');

    if (!publicKey || !secretKey) {
      console.error('Missing API Nepal credentials');
      return new Response(
        JSON.stringify({ error: 'Payment gateway not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Determine API endpoint based on mode
    const apiEndpoint = mode === 'live' 
      ? 'https://apinepal.com/payment/initiate'
      : 'https://apinepal.com/test/payment/initiate';

    // Build callback URLs
    const baseUrl = siteUrl || 'https://ug-gaming-topup.lovable.app';
    const ipnUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/payment-ipn`;
    const successUrl = `${baseUrl}/#/payment/success?id=${identifier}`;
    const cancelUrl = `${baseUrl}/#/payment/cancel?id=${identifier}`;

    // Customer name parsing
    const fullName = profile.full_name || profile.username || userEmail.split('@')[0];
    const nameParts = fullName.split(' ');
    const firstName = nameParts[0] || 'Customer';
    const lastName = nameParts.slice(1).join(' ') || 'User';

    // Prepare payment parameters
    const params = new URLSearchParams();
    params.append('public_key', publicKey);
    params.append('secret_key', secretKey);
    params.append('identifier', identifier);
    params.append('currency', 'NPR');
    params.append('amount', amount.toString());
    params.append('details', `UG Gaming Credit Top-Up - ${amount} Credits`);
    params.append('ipn_url', ipnUrl);
    params.append('success_url', successUrl);
    params.append('cancel_url', cancelUrl);
    params.append('site_name', 'UG Gaming');
    params.append('site_logo', 'https://ug-gaming-topup.lovable.app/logo.jpg');
    params.append('checkout_theme', 'dark');
    params.append('customer[first_name]', firstName);
    params.append('customer[last_name]', lastName);
    params.append('customer[email]', userEmail);
    params.append('customer[mobile]', '9800000000');

    console.log('Initiating payment:', { identifier, amount, mode, ipnUrl });

    // Call API Nepal
    const response = await fetch(apiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    const result = await response.json();
    console.log('API Nepal response:', result);

    if (result.status === 'success' && result.redirect_url) {
      // Update transaction with redirect URL
      await supabaseAdmin
        .from('payment_transactions')
        .update({ 
          redirect_url: result.redirect_url,
          status: 'pending'
        })
        .eq('identifier', identifier);

      return new Response(
        JSON.stringify({ 
          success: true, 
          redirect_url: result.redirect_url,
          identifier 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      console.error('API Nepal error:', result);
      
      // Update transaction as failed
      await supabaseAdmin
        .from('payment_transactions')
        .update({ 
          status: 'failed',
          api_response: result
        })
        .eq('identifier', identifier);

      return new Response(
        JSON.stringify({ 
          error: result.message?.[0] || 'Payment initiation failed' 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  } catch (error) {
    console.error('Initiate payment error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
