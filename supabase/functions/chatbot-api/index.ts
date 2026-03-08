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

// Map keywords to game names in game_product_prices table
const KEYWORD_TO_GAME: Record<string, string> = {
  chatgpt: "chatgpt",
  netflix: "netflix",
  tiktok: "tiktok",
  "free fire": "freefire",
  freefire: "freefire",
  "mobile legends": "mobile_legends",
  ml: "mobile_legends",
  roblox: "roblox",
  pubg: "pubg",
  garena: "garena",
  youtube: "youtube",
  smile: "smilecoin",
  smilecoin: "smilecoin",
  unipin: "unipin",
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

  const gameName = KEYWORD_TO_GAME[matchedKeyword] || matchedKeyword;
  const route = PRODUCT_ROUTES[matchedKeyword] || null;

  const { data: gamePrices } = await sb
    .from("game_product_prices")
    .select("package_name, price, currency, game, quantity")
    .eq("is_active", true)
    .eq("game", gameName)
    .order("display_order", { ascending: true })
    .limit(6);

  if (gamePrices && gamePrices.length > 0) {
    const { data: productInfo } = await sb
      .from("dynamic_products")
      .select("image_url")
      .eq("is_active", true)
      .ilike("title", `%${matchedKeyword}%`)
      .limit(1);

    let imageUrl = productInfo?.[0]?.image_url || null;
    if (!imageUrl) {
      const { data: legacyProduct } = await sb
        .from("products")
        .select("image_url")
        .eq("is_active", true)
        .ilike("name", `%${matchedKeyword}%`)
        .limit(1);
      imageUrl = legacyProduct?.[0]?.image_url || null;
    }

    return gamePrices.map((p: any) => ({
      name: p.package_name,
      price: `${p.currency || "NPR"} ${p.price}`,
      image_url: imageUrl,
      link: route,
      delivery_time: "5–10 minutes",
    }));
  }

  const { data: dynProducts } = await sb
    .from("dynamic_products")
    .select("title, price, discount_price, image_url, link, description")
    .eq("is_active", true)
    .ilike("title", `%${matchedKeyword}%`)
    .limit(3);

  if (dynProducts && dynProducts.length > 0) {
    const validProducts = dynProducts.filter(
      (p: any) => (p.discount_price && p.discount_price > 0) || (p.price && p.price > 0)
    );

    if (validProducts.length > 0) {
      return validProducts.map((p: any) => ({
        name: p.title,
        price: `NPR ${p.discount_price || p.price}`,
        image_url: p.image_url,
        link: p.link || route,
        delivery_time: "5–10 minutes",
      }));
    }

    return dynProducts.map((p: any) => ({
      name: p.title,
      price: "See pricing on product page",
      image_url: p.image_url,
      link: p.link || route,
      delivery_time: "5–10 minutes",
    }));
  }

  return null;
}

function buildProductContext(products: any[]): string {
  return products
    .map(
      (p: any) =>
        `Product: ${p.name} | Price: ${p.price} | Delivery: ${p.delivery_time || "5-10 minutes"} | Link: ${p.link || "N/A"}`
    )
    .join("\n");
}

interface ConversationMessage {
  role: "user" | "assistant";
  content: string;
}

async function callAI(
  message: string,
  settings: any,
  productContext?: string,
  conversationHistory?: ConversationMessage[]
): Promise<string> {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY) {
    throw new Error("AI is not configured. LOVABLE_API_KEY missing.");
  }

  const model = settings?.ai_model || "google/gemini-3-flash-preview";
  const systemPrompt =
    settings?.ai_system_prompt ||
    "You are UIQ, a helpful AI sales assistant for UGC-Topup. Help users with products, pricing, orders, and account questions.";

  let fullSystemPrompt = systemPrompt;
  if (productContext) {
    fullSystemPrompt += `\n\nRelevant product data from our database:\n${productContext}\n\nUse this data to answer the user's question accurately. Include the price and delivery time in your response. If a price says "See pricing on product page", tell the user to visit the product page for detailed pricing and provide the link.`;
  } else {
    fullSystemPrompt += `\n\nIf the user asks about a product that is not found in our database, respond with: "This product is not currently available on our website. It may be added soon."`;
  }

  const messages: { role: string; content: string }[] = [
    { role: "system", content: fullSystemPrompt },
  ];

  if (conversationHistory && conversationHistory.length > 0) {
    const recentHistory = conversationHistory.slice(-10);
    for (const msg of recentHistory) {
      messages.push({ role: msg.role, content: msg.content });
    }
  }

  messages.push({ role: "user", content: message });

  const response = await fetch(
    "https://ai.gateway.lovable.dev/v1/chat/completions",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ model, messages }),
    }
  );

  if (!response.ok) {
    const errText = await response.text();
    console.error("AI gateway error:", response.status, errText);
    if (response.status === 429)
      throw new Error("AI is busy. Please try again in a moment.");
    if (response.status === 402)
      throw new Error("AI service quota reached. Please try later.");
    throw new Error("Failed to get AI response");
  }

  const data = await response.json();
  return (
    data.choices?.[0]?.message?.content ||
    "I couldn't generate a response. Please try again."
  );
}

// ── Conversation storage helpers ──

async function loadServerHistory(sessionId: string): Promise<ConversationMessage[]> {
  const sb = supabaseAdmin();
  const { data } = await sb
    .from("chatbot_conversations")
    .select("role, message")
    .eq("session_id", sessionId)
    .order("created_at", { ascending: false })
    .limit(10);

  if (!data || data.length === 0) return [];

  // Reverse so oldest first
  return data.reverse().map((r: any) => ({
    role: r.role as "user" | "assistant",
    content: r.message,
  }));
}

async function storeMessage(sessionId: string, platform: string, role: string, message: string) {
  const sb = supabaseAdmin();
  await sb.from("chatbot_conversations").insert({
    session_id: sessionId,
    platform,
    role,
    message,
  });
}

async function handleMessage(body: any) {
  const { message, session_id, history, platform } = body;
  const effectivePlatform = platform || "web";

  if (!message) {
    return new Response(
      JSON.stringify({ error: "message is required" }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  const settings = await getSettings();

  if (settings && !settings.is_enabled) {
    return new Response(
      JSON.stringify({
        reply: "Chatbot is currently offline. Please try again later.",
        timestamp: new Date().toISOString(),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const products = await searchProducts(message);

  // Determine conversation history source
  let conversationHistory: ConversationMessage[] | undefined;

  if (effectivePlatform !== "web" && session_id) {
    // External platforms: load from server-side storage
    conversationHistory = await loadServerHistory(session_id);
  } else if (Array.isArray(history)) {
    // Web: use client-sent history (backward compatible)
    conversationHistory = history as ConversationMessage[];
  }

  // Store inbound user message (for all platforms with a session_id)
  if (session_id) {
    await storeMessage(session_id, effectivePlatform, "user", message);
  }

  try {
    const productContext = products
      ? buildProductContext(products)
      : undefined;
    const aiReply = await callAI(
      message,
      settings,
      productContext,
      conversationHistory
    );

    // Store assistant reply
    if (session_id) {
      await storeMessage(session_id, effectivePlatform, "assistant", aiReply);
    }

    const responseBody: any = {
      reply: aiReply,
      timestamp: new Date().toISOString(),
    };

    if (products && products.length > 0) {
      responseBody.products = products;
      responseBody.product = products[0];
    }

    return new Response(JSON.stringify(responseBody), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("AI error:", err.message);

    if (products && products.length > 0) {
      const firstProduct = products[0];
      const fallbackReply = `Here are some options for ${firstProduct.name}:\n${products.map((p: any) => `• ${p.name} — ${p.price}`).join("\n")}\n\nDelivery usually takes ${firstProduct.delivery_time || "5–10 minutes"}.`;

      if (session_id) {
        await storeMessage(session_id, effectivePlatform, "assistant", fallbackReply);
      }

      return new Response(
        JSON.stringify({
          reply: fallbackReply,
          products,
          product: firstProduct,
          timestamp: new Date().toISOString(),
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        reply: `❌ ${err.message}`,
        timestamp: new Date().toISOString(),
        error: true,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
}

async function handleOrderStatus(body: any) {
  const { order_id } = body;
  if (!order_id) {
    return new Response(
      JSON.stringify({ error: "order_id is required" }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  const sb = supabaseAdmin();
  const { data, error } = await sb
    .from("product_orders")
    .select(
      "order_number, product_name, package_name, status, price, created_at, confirmed_at, completed_at, canceled_at, cancellation_reason"
    )
    .or(
      `order_number.eq.${order_id.trim()},user_email.eq.${order_id.trim()}`
    )
    .order("created_at", { ascending: false })
    .limit(5);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
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
  const { email, package_id, player_id, zone_id, product_name } = body;

  if (!email || !package_id) {
    return new Response(
      JSON.stringify({ error: "email and package_id are required" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const sb = supabaseAdmin();

  // 1. Look up the package
  const { data: pkg } = await sb
    .from("game_product_prices")
    .select("*")
    .eq("package_id", package_id)
    .eq("is_active", true)
    .single();

  if (!pkg) {
    return new Response(
      JSON.stringify({ error: "Package not found or inactive.", package_id }),
      { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // 2. Look up user by email
  const { data: profile } = await sb
    .from("profiles")
    .select("id, email, username, balance")
    .eq("email", email)
    .single();

  if (!profile) {
    return new Response(
      JSON.stringify({ error: "No account found with this email. Please register at our website first." }),
      { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const price = Number(pkg.price);

  // 3. Check balance
  if ((profile.balance || 0) < price) {
    return new Response(
      JSON.stringify({
        error: "insufficient_credits",
        message: `Insufficient credits. You have NPR ${profile.balance || 0} but need NPR ${price}. Please top up your account first.`,
        balance: profile.balance || 0,
        required: price,
        top_up_url: "https://ugtopups.lovable.app/#/dashboard",
        timestamp: new Date().toISOString(),
      }),
      { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // 4. Build product details
  const productDetails: any = { player_id: player_id || "" };
  if (zone_id) productDetails.zone_id = zone_id;

  // Determine product category from game name
  const gameToCategoryMap: Record<string, string> = {
    freefire: "freefire", mobile_legends: "mobile_legends", pubg: "pubg",
    roblox: "roblox", netflix: "netflix", tiktok: "tiktok", youtube: "youtube",
    chatgpt: "chatgpt", garena: "garena", smilecoin: "smilecoin", unipin: "unipin",
  };
  const category = gameToCategoryMap[pkg.game] || pkg.game;

  // 5. Place order using the atomic place_order function via service role
  // We need to impersonate the user for the place_order RPC which uses auth.uid()
  // Instead, insert directly with atomic balance check
  const orderNumber = (profile.username || email.split("@")[0]).toLowerCase() + "-" + Math.random().toString(36).slice(2, 5);

  // Atomic: lock profile, check balance, deduct, insert order
  const { data: updatedProfile, error: deductErr } = await sb
    .from("profiles")
    .update({ balance: profile.balance - price })
    .eq("id", profile.id)
    .gte("balance", price) // atomic check
    .select("balance")
    .single();

  if (deductErr || !updatedProfile) {
    return new Response(
      JSON.stringify({ error: "insufficient_credits", message: "Balance changed. Please try again." }),
      { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const { data: order, error: orderErr } = await sb
    .from("product_orders")
    .insert({
      user_id: profile.id,
      user_email: profile.email,
      user_name: profile.username || email.split("@")[0],
      order_number: orderNumber,
      product_category: category,
      product_name: product_name || pkg.package_name,
      package_name: pkg.package_name,
      quantity: pkg.quantity,
      price: price,
      credits_deducted: price,
      product_details: productDetails,
      payment_method: "credit",
      status: "pending",
    })
    .select("id, order_number")
    .single();

  if (orderErr) {
    // Refund credits on failure
    await sb.from("profiles").update({ balance: profile.balance }).eq("id", profile.id);
    console.error("Order insert error:", orderErr);
    return new Response(
      JSON.stringify({ error: "Failed to create order. " + orderErr.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Log activity
  await sb.from("activity_logs").insert({
    actor_id: profile.id,
    actor_email: profile.email,
    activity_type: "order_created",
    action: "Chatbot Order Placed",
    description: `Order ${orderNumber} placed via chatbot API. ${price} credits deducted.`,
    target_type: "order",
    target_id: order.id,
    metadata: { order_number: orderNumber, price, product: pkg.package_name, source: "chatbot_api" },
  });

  return new Response(
    JSON.stringify({
      success: true,
      message: `Order placed successfully! Order number: ${orderNumber}. ${price} credits deducted.`,
      order_number: orderNumber,
      order_id: order.id,
      product: pkg.package_name,
      price,
      new_balance: updatedProfile.balance,
      timestamp: new Date().toISOString(),
    }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

async function handleInitiatePayment(body: any) {
  const { email, amount } = body;

  if (!email || !amount || amount < 1 || amount > 100000) {
    return new Response(
      JSON.stringify({ error: "email and amount (1-100000) are required" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const sb = supabaseAdmin();

  const { data: profile } = await sb
    .from("profiles")
    .select("id, email, username, full_name")
    .eq("email", email)
    .single();

  if (!profile) {
    return new Response(
      JSON.stringify({ error: "No account found with this email." }),
      { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const identifier = `UG${profile.id.slice(0, 4)}${Date.now().toString(36)}`;

  // Insert payment transaction
  const { error: insertErr } = await sb
    .from("payment_transactions")
    .insert({
      user_id: profile.id,
      user_email: email,
      identifier,
      amount: Number(amount),
      credits: Number(amount),
      status: "initiated",
    });

  if (insertErr) {
    return new Response(
      JSON.stringify({ error: "Failed to create payment record." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Try API Nepal payment
  const mode = Deno.env.get("APINEPAL_MODE") || "test";
  const publicKey = Deno.env.get("APINEPAL_PUBLIC_KEY");
  const secretKey = Deno.env.get("APINEPAL_SECRET_KEY");

  if (!publicKey || !secretKey) {
    // Return manual payment instructions
    return new Response(
      JSON.stringify({
        success: true,
        payment_method: "manual",
        message: `Payment gateway not configured. Please use manual payment: send NPR ${amount} via bank transfer and submit a credit request with your email.`,
        identifier,
        timestamp: new Date().toISOString(),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const apiEndpoint = mode === "live"
    ? "https://apinepal.com/payment/initiate"
    : "https://apinepal.com/test/payment/initiate";

  const baseUrl = "https://ugtopups.lovable.app";
  const ipnUrl = `${SUPABASE_URL}/functions/v1/payment-ipn`;
  const fullName = profile.full_name || profile.username || email.split("@")[0];
  const nameParts = fullName.split(" ");

  const params = new URLSearchParams();
  params.append("public_key", publicKey);
  params.append("secret_key", secretKey);
  params.append("identifier", identifier);
  params.append("currency", "NPR");
  params.append("amount", amount.toString());
  params.append("details", `UG Gaming - User: ${profile.username || email} - ${amount} Credits Top-Up`);
  params.append("ipn_url", ipnUrl);
  params.append("success_url", `${baseUrl}/#/payment/success?id=${identifier}`);
  params.append("cancel_url", `${baseUrl}/#/payment/cancel?id=${identifier}`);
  params.append("site_name", "UG Gaming");
  params.append("site_logo", `${baseUrl}/logo.jpg`);
  params.append("checkout_theme", "dark");
  params.append("customer[first_name]", nameParts[0] || "Customer");
  params.append("customer[last_name]", nameParts.slice(1).join(" ") || "User");
  params.append("customer[email]", email);
  params.append("customer[mobile]", "9800000000");

  try {
    const response = await fetch(apiEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString(),
    });
    const result = await response.json();

    if (result.status === "success" && result.redirect_url) {
      await sb.from("payment_transactions")
        .update({ redirect_url: result.redirect_url, status: "pending" })
        .eq("identifier", identifier);

      return new Response(
        JSON.stringify({
          success: true,
          payment_method: "online",
          payment_url: result.redirect_url,
          identifier,
          message: `Payment link generated. Complete payment of NPR ${amount} using this link.`,
          timestamp: new Date().toISOString(),
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } else {
      await sb.from("payment_transactions")
        .update({ status: "failed", api_response: result })
        .eq("identifier", identifier);

      return new Response(
        JSON.stringify({
          error: result.message?.[0] || "Payment initiation failed",
          identifier,
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  } catch (err: any) {
    console.error("Payment initiation error:", err);
    return new Response(
      JSON.stringify({ error: "Payment service unavailable. Please try manual payment." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
}

async function handlePaymentStatus(body: any) {
  const { identifier } = body;

  if (!identifier) {
    return new Response(
      JSON.stringify({ error: "identifier is required" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const sb = supabaseAdmin();
  const { data, error } = await sb
    .from("payment_transactions")
    .select("identifier, amount, credits, status, payment_gateway, created_at, completed_at")
    .eq("identifier", identifier)
    .single();

  if (error || !data) {
    return new Response(
      JSON.stringify({ error: "Transaction not found." }),
      { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  return new Response(
    JSON.stringify({
      ...data,
      timestamp: new Date().toISOString(),
    }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

async function handleCreditRequest(body: any) {
  const { name, email, whatsapp, amount, screenshot_url } = body;

  if (!name || !email || !amount) {
    return new Response(
      JSON.stringify({ error: "name, email, and amount are required" }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  const sb = supabaseAdmin();

  const { data: profile } = await sb
    .from("profiles")
    .select("id")
    .eq("email", email)
    .single();

  if (!profile) {
    return new Response(
      JSON.stringify({
        error:
          "No account found with this email. Please register first.",
      }),
      {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  const { data: request, error } = await sb
    .from("payment_requests")
    .insert({
      user_id: profile.id,
      user_email: email,
      user_name: name,
      amount: parseFloat(amount),
      credits: parseFloat(amount),
      remarks: whatsapp ? `WhatsApp: ${whatsapp}` : null,
      screenshot_url: screenshot_url || null,
      status: "pending",
    })
    .select()
    .single();

  if (error) {
    console.error("Credit request error:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to create credit request. " + error.message,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  return new Response(
    JSON.stringify({
      success: true,
      message: `Credit request of NPR ${amount} submitted successfully! Request ID: ${request.id.slice(0, 8)}. Our team will review it shortly.`,
      request_id: request.id,
      timestamp: new Date().toISOString(),
    }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

async function handleCleanupConversations() {
  const sb = supabaseAdmin();
  const tenDaysAgo = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString();

  const { error, count } = await sb
    .from("chatbot_conversations")
    .delete()
    .lt("created_at", tenDaysAgo);

  if (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  return new Response(
    JSON.stringify({
      success: true,
      message: `Cleaned up conversations older than 10 days.`,
      deleted: count ?? 0,
      timestamp: new Date().toISOString(),
    }),
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
      case "credit-request":
        return await handleCreditRequest(body);
      case "initiate-payment":
        return await handleInitiatePayment(body);
      case "payment-status":
        return await handlePaymentStatus(body);
      case "cleanup-conversations":
        return await handleCleanupConversations();
      default:
        return new Response(
          JSON.stringify({ error: `Unknown action: ${action}` }),
          {
            status: 400,
            headers: {
              ...corsHeaders,
              "Content-Type": "application/json",
            },
          }
        );
    }
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message || "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
