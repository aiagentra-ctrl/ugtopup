import { createClient } from "https://esm.sh/@supabase/supabase-js@2.76.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

function supabaseAdmin() {
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
}

// Product name keywords to search for
const PRODUCT_KEYWORDS = [
  "chatgpt", "netflix", "tiktok", "free fire", "freefire",
  "mobile legends", "ml", "roblox", "pubg", "garena",
  "youtube", "smile", "smilecoin", "unipin", "capcut",
];

// Route mapping for product links
const PRODUCT_ROUTES: Record<string, string> = {
  chatgpt: "/chatgpt",
  netflix: "/netflix",
  tiktok: "/tiktok-coins",
  "free fire": "/freefire-diamond",
  freefire: "/freefire-diamond",
  "mobile legends": "/mobile-legends",
  ml: "/mobile-legends",
  roblox: "/roblox-topup",
  pubg: "/pubg-mobile",
  garena: "/garena-shell",
  youtube: "/youtube",
  smile: "/smile-coin",
  smilecoin: "/smile-coin",
  unipin: "/unipin-uc",
};

async function searchProducts(message: string) {
  const sb = supabaseAdmin();
  const lowerMsg = message.toLowerCase();

  // Check if the message mentions any known product
  const matchedKeyword = PRODUCT_KEYWORDS.find((kw) => lowerMsg.includes(kw));
  if (!matchedKeyword) return null;

  // Search dynamic_products first
  const { data: dynProducts } = await sb
    .from("dynamic_products")
    .select("title, price, discount_price, image_url, link, description")
    .eq("is_active", true)
    .ilike("title", `%${matchedKeyword}%`)
    .limit(3);

  if (dynProducts && dynProducts.length > 0) {
    return dynProducts.map((p: any) => ({
      name: p.title,
      price: `NPR ${p.discount_price ?? p.price}`,
      image_url: p.image_url,
      link: p.link || PRODUCT_ROUTES[matchedKeyword] || null,
      delivery_time: "5–10 minutes",
    }));
  }

  // Search game_product_prices
  const { data: gamePrices } = await sb
    .from("game_product_prices")
    .select("package_name, price, currency, game")
    .eq("is_active", true)
    .ilike("game", `%${matchedKeyword}%`)
    .order("display_order", { ascending: true })
    .limit(3);

  if (gamePrices && gamePrices.length > 0) {
    // Also try to get the product image from products table
    const { data: productInfo } = await sb
      .from("products")
      .select("image_url, name")
      .eq("is_active", true)
      .ilike("name", `%${matchedKeyword}%`)
      .limit(1);

    const imageUrl = productInfo?.[0]?.image_url || null;

    return gamePrices.map((p: any) => ({
      name: `${p.game} - ${p.package_name}`,
      price: `${p.currency || "NPR"} ${p.price}`,
      image_url: imageUrl,
      link: PRODUCT_ROUTES[matchedKeyword] || null,
      delivery_time: "5–10 minutes",
    }));
  }

  return null;
}

async function handleMessage(body: any) {
  const { message, session_id } = body;
  if (!message) {
    return new Response(
      JSON.stringify({ error: "message is required" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // 1. Check for product matches
  const products = await searchProducts(message);
  if (products && products.length > 0) {
    const firstProduct = products[0];
    const reply = `${firstProduct.name} costs ${firstProduct.price} and delivery usually takes ${firstProduct.delivery_time || "5–10 minutes"}.`;

    return new Response(
      JSON.stringify({
        reply,
        products,
        product: firstProduct, // primary product card
        timestamp: new Date().toISOString(),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // 2. Forward to n8n webhook
  const sb = supabaseAdmin();
  const { data: settings } = await sb
    .from("chatbot_settings")
    .select("webhook_url, gmail_fallback_enabled, gmail_fallback_email")
    .limit(1)
    .single();

  const webhookUrl = settings?.webhook_url || "https://n8n.aiagentra.com/webhook/chatbot";

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 25000);

    const webhookRes = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: message.trim(),
        timestamp: new Date().toISOString(),
        sessionId: session_id || "anonymous",
        source: "UGC-Topup Website",
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const raw = await webhookRes.text();
    let reply = "No response received";
    try {
      const parsed = JSON.parse(raw);
      reply = parsed.reply ?? parsed.message ?? parsed.answer ?? raw;
    } catch {
      reply = raw?.trim() || "No response received";
    }

    return new Response(
      JSON.stringify({ reply, timestamp: new Date().toISOString() }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    // Gmail fallback
    if (settings?.gmail_fallback_enabled && settings?.gmail_fallback_email) {
      console.log(`Webhook failed, Gmail fallback would send to: ${settings.gmail_fallback_email}`);
    }

    const errorMsg = err.name === "AbortError"
      ? "AI is taking too long to respond. Please try again."
      : err.message || "Failed to connect to AI service";

    return new Response(
      JSON.stringify({ reply: `❌ ${errorMsg}`, timestamp: new Date().toISOString(), error: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
}

async function handleOrderStatus(body: any) {
  const { order_id } = body;
  if (!order_id) {
    return new Response(
      JSON.stringify({ error: "order_id is required" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const sb = supabaseAdmin();
  const { data, error } = await sb
    .from("product_orders")
    .select("order_number, product_name, package_name, status, price, created_at, confirmed_at, completed_at, canceled_at, cancellation_reason")
    .or(`order_number.eq.${order_id.trim()},user_email.eq.${order_id.trim()}`)
    .order("created_at", { ascending: false })
    .limit(5);

  if (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  if (!data || data.length === 0) {
    return new Response(
      JSON.stringify({
        orders: [],
        message: `No orders found for "${order_id.trim()}".`,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const orders = data.map((o: any) => ({
    order_number: o.order_number,
    product: o.product_name,
    package: o.package_name,
    status: o.status,
    price: o.price,
    created_at: o.created_at,
    confirmed_at: o.confirmed_at,
    completed_at: o.completed_at,
    canceled_at: o.canceled_at,
    cancellation_reason: o.cancellation_reason,
  }));

  return new Response(
    JSON.stringify({ orders, timestamp: new Date().toISOString() }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

async function handleOrder(body: any) {
  // Future-ready placeholder
  return new Response(
    JSON.stringify({ message: "Order creation via chatbot coming soon.", timestamp: new Date().toISOString() }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const action = body.action || "message";

    switch (action) {
      case "message":
        return await handleMessage(body);
      case "order-status":
        return await handleOrderStatus(body);
      case "order":
        return await handleOrder(body);
      default:
        return new Response(
          JSON.stringify({ error: `Unknown action: ${action}` }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
