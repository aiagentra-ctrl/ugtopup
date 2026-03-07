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

async function getSettings() {
  const sb = supabaseAdmin();
  const { data } = await sb
    .from("chatbot_settings")
    .select("*")
    .limit(1)
    .single();
  return data;
}

async function searchProducts(message: string) {
  const sb = supabaseAdmin();
  const lowerMsg = message.toLowerCase();

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

function buildProductContext(products: any[]): string {
  return products.map((p: any) =>
    `Product: ${p.name} | Price: ${p.price} | Delivery: ${p.delivery_time || "5-10 minutes"} | Link: ${p.link || "N/A"}`
  ).join("\n");
}

async function callAI(message: string, settings: any, productContext?: string): Promise<string> {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY) {
    throw new Error("AI is not configured. LOVABLE_API_KEY missing.");
  }

  const model = settings?.ai_model || "google/gemini-3-flash-preview";
  const systemPrompt = settings?.ai_system_prompt ||
    "You are UIQ, a helpful AI sales assistant for UGC-Topup. Help users with products, pricing, orders, and account questions.";

  const fullSystemPrompt = productContext
    ? `${systemPrompt}\n\nRelevant product data from our database:\n${productContext}\n\nUse this data to answer the user's question accurately. Include the price and delivery time in your response.`
    : systemPrompt;

  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: fullSystemPrompt },
        { role: "user", content: message },
      ],
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    console.error("AI gateway error:", response.status, errText);
    if (response.status === 429) throw new Error("AI is busy. Please try again in a moment.");
    if (response.status === 402) throw new Error("AI service quota reached. Please try later.");
    throw new Error("Failed to get AI response");
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || "I couldn't generate a response. Please try again.";
}

async function handleMessage(body: any) {
  const { message, session_id } = body;
  if (!message) {
    return new Response(
      JSON.stringify({ error: "message is required" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const settings = await getSettings();

  // Check if chatbot is enabled
  if (settings && !settings.is_enabled) {
    return new Response(
      JSON.stringify({ reply: "Chatbot is currently offline. Please try again later.", timestamp: new Date().toISOString() }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // 1. Check for product matches
  const products = await searchProducts(message);

  try {
    // 2. Call AI with product context if available
    const productContext = products ? buildProductContext(products) : undefined;
    const aiReply = await callAI(message, settings, productContext);

    const responseBody: any = {
      reply: aiReply,
      timestamp: new Date().toISOString(),
    };

    // Include product cards if found
    if (products && products.length > 0) {
      responseBody.products = products;
      responseBody.product = products[0];
    }

    return new Response(
      JSON.stringify(responseBody),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("AI error:", err.message);

    // Fallback: if AI fails but we have product data, return product info without AI
    if (products && products.length > 0) {
      const firstProduct = products[0];
      return new Response(
        JSON.stringify({
          reply: `${firstProduct.name} costs ${firstProduct.price} and delivery usually takes ${firstProduct.delivery_time || "5–10 minutes"}.`,
          products,
          product: firstProduct,
          timestamp: new Date().toISOString(),
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ reply: `❌ ${err.message}`, timestamp: new Date().toISOString(), error: true }),
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
