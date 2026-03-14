import { createClient } from "https://esm.sh/@supabase/supabase-js@2.76.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const BASE_URL = "https://ugtopups.lovable.app/#";

function supabaseAdmin() {
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
}

// ── Rate Limiting ──

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 15;

function checkRateLimit(sessionId: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(sessionId);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(sessionId, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  entry.count++;
  return entry.count <= RATE_LIMIT_MAX;
}

setInterval(() => {
  const now = Date.now();
  for (const [key, val] of rateLimitMap) {
    if (now > val.resetAt) rateLimitMap.delete(key);
  }
}, 120_000);

// ── Product Constants ──

const PRODUCT_KEYWORDS = [
  "chatgpt", "netflix", "tiktok", "free fire", "freefire",
  "mobile legends", "ml", "roblox", "pubg", "garena",
  "youtube", "smile", "smilecoin", "unipin", "capcut",
];

const PRODUCT_ROUTES: Record<string, string> = {
  chatgpt: "/chatgpt", netflix: "/netflix", tiktok: "/tiktok-coins",
  "free fire": "/freefire-diamond", freefire: "/freefire-diamond",
  "mobile legends": "/mobile-legends", ml: "/mobile-legends",
  roblox: "/roblox-topup", pubg: "/pubg-mobile", garena: "/garena-shell",
  youtube: "/youtube", smile: "/smile-coin", smilecoin: "/smile-coin",
  unipin: "/unipin-uc",
};

const KEYWORD_TO_GAME: Record<string, string> = {
  chatgpt: "chatgpt", netflix: "netflix", tiktok: "tiktok",
  "free fire": "freefire", freefire: "freefire",
  "mobile legends": "mobile_legends", ml: "mobile_legends",
  roblox: "roblox", pubg: "pubg", garena: "garena",
  youtube: "youtube", smile: "smilecoin", smilecoin: "smilecoin",
  unipin: "unipin",
};

const GAME_LABELS: Record<string, { emoji: string; label: string; route: string }> = {
  freefire: { emoji: "🔥", label: "Free Fire Diamonds", route: "/freefire-diamond" },
  mobile_legends: { emoji: "⚔️", label: "Mobile Legends Diamonds", route: "/mobile-legends" },
  pubg: { emoji: "🎯", label: "PUBG Mobile UC", route: "/pubg-mobile" },
  roblox: { emoji: "🎮", label: "Roblox Robux", route: "/roblox-topup" },
  netflix: { emoji: "🎬", label: "Netflix", route: "/netflix" },
  tiktok: { emoji: "🎵", label: "TikTok Coins", route: "/tiktok-coins" },
  youtube: { emoji: "📺", label: "YouTube Premium", route: "/youtube" },
  chatgpt: { emoji: "🤖", label: "ChatGPT Plus", route: "/chatgpt" },
  garena: { emoji: "🐚", label: "Garena Shells", route: "/garena-shell" },
  smilecoin: { emoji: "😊", label: "Smile One", route: "/smile-coin" },
  unipin: { emoji: "🎯", label: "UniPin", route: "/unipin-uc" },
};

// Game-specific required fields for ordering
const GAME_REQUIRED_FIELDS: Record<string, string[]> = {
  freefire: ["email", "player_id"],
  mobile_legends: ["email", "player_id", "zone_id"],
  pubg: ["email", "player_id"],
  roblox: ["email"],
  netflix: ["email"],
  tiktok: ["email"],
  youtube: ["email"],
  chatgpt: ["email"],
  garena: ["email"],
  smilecoin: ["email"],
  unipin: ["email"],
};

// ── Helpers ──

async function getSettings() {
  const sb = supabaseAdmin();
  const { data } = await sb.from("chatbot_settings").select("*").limit(1).single();
  return data;
}

// ── RAG: Knowledge Base Search ──

async function searchKnowledgeBase(message: string): Promise<string | null> {
  const sb = supabaseAdmin();
  const lowerMsg = message.toLowerCase();

  const stopWords = new Set(["the", "and", "for", "are", "but", "not", "you", "all", "can", "had", "her", "was", "one", "our", "out", "how", "what", "when", "where", "who", "why", "this", "that", "with", "have", "from", "will", "your", "about", "does", "please", "help", "want", "need"]);
  const keywords = lowerMsg.replace(/[^a-z0-9\s]/g, "").split(/\s+/).filter((w) => w.length >= 3 && !stopWords.has(w));
  if (keywords.length === 0) return null;

  const searchKeywords = keywords.slice(0, 6);
  const orFilters = searchKeywords.flatMap((kw) => [`title.ilike.%${kw}%`, `content.ilike.%${kw}%`]).join(",");

  const { data, error } = await sb.from("knowledge_base").select("title, content, category, tags").eq("is_active", true).or(orFilters).limit(8);
  if (error || !data || data.length === 0) return null;

  const scored = data.map((entry: any) => {
    const text = `${entry.title} ${entry.content} ${(entry.tags || []).join(" ")}`.toLowerCase();
    let score = 0;
    for (const kw of searchKeywords) {
      if (text.includes(kw)) score++;
      if (entry.title.toLowerCase().includes(kw)) score += 2;
      if ((entry.tags || []).some((t: string) => t.toLowerCase().includes(kw))) score += 1;
    }
    return { ...entry, score };
  });
  scored.sort((a: any, b: any) => b.score - a.score);

  return scored.slice(0, 5).map((e: any) => `[${e.category.toUpperCase()}] ${e.title}\n${e.content}`).join("\n\n---\n\n");
}

// ── Product Search (Fuzzy + DB) ──

const FUZZY_ALIASES: Record<string, string[]> = {
  freefire: ["free fire", "freefire", "ff", "free fir", "frefire", "fre fire", "diamond", "diamonds", "diamon", "diamnd", "diamons"],
  mobile_legends: ["mobile legends", "mobile legend", "ml", "mlbb", "mobi legends", "diamond", "diamonds", "diamon", "diamnd", "diamons"],
  pubg: ["pubg", "pubg mobile", "pubgm", "battleground", "uc"],
  roblox: ["roblox", "robux", "rblx"],
  netflix: ["netflix", "netflex", "netfix"],
  tiktok: ["tiktok", "tik tok", "tikto", "tiktk", "tiktok coins"],
  youtube: ["youtube", "yt", "you tube", "youtub"],
  chatgpt: ["chatgpt", "chat gpt", "gpt", "openai"],
  garena: ["garena", "garena shell", "shell"],
  smilecoin: ["smile", "smilecoin", "smile coin", "smile one"],
  unipin: ["unipin", "uni pin", "unipi"],
};

function fuzzyMatchGame(query: string): string | null {
  const lower = query.toLowerCase().replace(/[^a-z0-9\s]/g, "").trim();
  const directMatch = PRODUCT_KEYWORDS.find((kw) => lower.includes(kw));
  if (directMatch) return KEYWORD_TO_GAME[directMatch] || directMatch;
  const SHARED_ALIASES = new Set(["diamond", "diamonds", "diamon", "diamnd", "diamons"]);
  for (const [game, aliases] of Object.entries(FUZZY_ALIASES)) {
    for (const alias of aliases) {
      if (SHARED_ALIASES.has(alias)) continue;
      if (lower.includes(alias)) return game;
    }
  }
  for (const alias of SHARED_ALIASES) {
    if (lower.includes(alias)) return null;
  }
  return null;
}

async function searchMultiGameProducts(query: string) {
  const sb = supabaseAdmin();
  const SHARED_ALIASES = new Set(["diamond", "diamonds", "diamon", "diamnd", "diamons"]);
  const lower = query.toLowerCase().replace(/[^a-z0-9\s]/g, "").trim();
  const words = lower.split(/\s+/);
  const hasSharedAlias = words.some(w => SHARED_ALIASES.has(w));
  if (!hasSharedAlias) return null;

  const { data: gamePrices } = await sb.from("game_product_prices")
    .select("package_name, package_id, price, currency, game, quantity, package_type")
    .eq("is_active", true)
    .ilike("package_name", "%diamond%")
    .order("game").order("display_order", { ascending: true })
    .limit(50);

  if (!gamePrices || gamePrices.length === 0) return null;
  return gamePrices.map((p: any) => ({
    name: p.package_name, package_id: p.package_id, price: p.price,
    currency: p.currency || "NPR", price_display: `${p.currency || "NPR"} ${p.price}`,
    image_url: null, link: getRouteForGame(p.game), delivery_time: "5–10 minutes",
    package_type: p.package_type, quantity: p.quantity, game: p.game,
  }));
}

// Format product results into a clean structured response
function formatProductResponse(products: any[]): string {
  if (!products || products.length === 0) return "";

  // Group by game
  const grouped: Record<string, any[]> = {};
  for (const p of products) {
    const game = p.game || "other";
    if (!grouped[game]) grouped[game] = [];
    grouped[game].push(p);
  }

  const gameKeys = Object.keys(grouped);
  const isSingleGame = gameKeys.length === 1;
  const gameInfo = GAME_LABELS[gameKeys[0]] || { emoji: "📦", label: gameKeys[0], route: "" };

  let response = "";

  if (isSingleGame) {
    response += `${gameInfo.emoji} **${gameInfo.label}**\n\n`;
    response += `Here are the available packages with real-time pricing:\n\n`;

    const packages = grouped[gameKeys[0]];
    // Group by package_type if available
    const byType: Record<string, any[]> = {};
    for (const p of packages) {
      const type = p.package_type || "topup";
      if (!byType[type]) byType[type] = [];
      byType[type].push(p);
    }

    for (const [type, pkgs] of Object.entries(byType)) {
      if (Object.keys(byType).length > 1) {
        response += `**${type === "topup" ? "📦 Top-Up Packages" : type === "special" ? "⭐ Special Packages" : `📦 ${type}`}**\n`;
      }
      const shown = pkgs.slice(0, 10);
      for (const p of shown) {
        response += `• **${p.name}** — NPR ${p.price}\n`;
      }
      if (pkgs.length > 10) {
        response += `• _...and ${pkgs.length - 10} more packages_\n`;
      }
      response += "\n";
    }

    if (gameInfo.route) {
      response += `🛒 **Buy Now:** ${BASE_URL}${gameInfo.route}\n`;
    }
    response += `⏱ **Delivery:** 5–10 minutes\n\n`;
    response += `💬 Want to order? Just tell me which package you'd like and I'll guide you through the process!`;
  } else {
    response += `💎 **Available Packages**\n\n`;
    for (const game of gameKeys) {
      const info = GAME_LABELS[game] || { emoji: "📦", label: game, route: "" };
      const packages = grouped[game];
      response += `${info.emoji} **${info.label}**\n`;
      const shown = packages.slice(0, 6);
      for (const p of shown) {
        response += `• **${p.name}** — NPR ${p.price}\n`;
      }
      if (packages.length > 6) {
        response += `• _...and ${packages.length - 6} more_\n`;
      }
      if (info.route) {
        response += `🛒 Buy: ${BASE_URL}${info.route}\n`;
      }
      response += "\n";
    }
    response += `⏱ **Delivery:** 5–10 minutes\n\n`;
    response += `💬 Tell me which game and package you'd like to order!`;
  }

  return response;
}

function getRouteForGame(game: string): string | null {
  const gameToRoute: Record<string, string> = {
    freefire: "/freefire-diamond", mobile_legends: "/mobile-legends",
    pubg: "/pubg-mobile", roblox: "/roblox-topup", netflix: "/netflix",
    tiktok: "/tiktok-coins", youtube: "/youtube", chatgpt: "/chatgpt",
    garena: "/garena-shell", smilecoin: "/smile-coin", unipin: "/unipin-uc",
  };
  return gameToRoute[game] || null;
}

async function searchProducts(query: string) {
  const sb = supabaseAdmin();
  const lowerMsg = query.toLowerCase().replace(/[^a-z0-9\s]/g, "").trim();
  if (!lowerMsg || lowerMsg.length < 2) return null;

  const matchedGame = fuzzyMatchGame(lowerMsg);
  const route = matchedGame ? getRouteForGame(matchedGame) : null;

  if (matchedGame) {
    const { data: gamePrices } = await sb.from("game_product_prices")
      .select("package_name, package_id, price, currency, game, quantity, package_type")
      .eq("is_active", true).eq("game", matchedGame)
      .order("display_order", { ascending: true }).limit(20);

    if (gamePrices && gamePrices.length > 0) {
      const { data: productInfo } = await sb.from("dynamic_products")
        .select("image_url, description").eq("is_active", true)
        .or(PRODUCT_KEYWORDS.filter(kw => KEYWORD_TO_GAME[kw] === matchedGame).map(kw => `title.ilike.%${kw}%`).join(","))
        .limit(1);
      const imageUrl = productInfo?.[0]?.image_url || null;
      const description = productInfo?.[0]?.description || null;

      return gamePrices.map((p: any) => ({
        name: p.package_name, package_id: p.package_id, price: p.price,
        currency: p.currency || "NPR", price_display: `${p.currency || "NPR"} ${p.price}`,
        image_url: imageUrl, link: route, delivery_time: "5–10 minutes",
        description, package_type: p.package_type, quantity: p.quantity, game: matchedGame,
      }));
    }
  }

  // Broad text search
  const searchWords = lowerMsg.split(/\s+/).filter(w => w.length >= 3);
  if (searchWords.length > 0) {
    const orFilters = searchWords.flatMap(w => [`package_name.ilike.%${w}%`, `game.ilike.%${w}%`]).join(",");
    const { data: broadPrices } = await sb.from("game_product_prices")
      .select("package_name, package_id, price, currency, game, quantity, package_type")
      .eq("is_active", true).or(orFilters)
      .order("display_order", { ascending: true }).limit(15);

    if (broadPrices && broadPrices.length > 0) {
      return broadPrices.map((p: any) => ({
        name: p.package_name, package_id: p.package_id, price: p.price,
        currency: p.currency || "NPR", price_display: `${p.currency || "NPR"} ${p.price}`,
        image_url: null, link: getRouteForGame(p.game), delivery_time: "5–10 minutes",
        package_type: p.package_type, quantity: p.quantity, game: p.game,
      }));
    }
  }

  // Dynamic products
  if (searchWords.length > 0) {
    const dynFilters = searchWords.map(w => `title.ilike.%${w}%`).join(",");
    const { data: dynProducts } = await sb.from("dynamic_products")
      .select("title, price, discount_price, image_url, link, description, features")
      .eq("is_active", true).or(dynFilters).limit(5);

    if (dynProducts && dynProducts.length > 0) {
      return dynProducts.map((p: any) => ({
        name: p.title, price: p.discount_price || p.price || 0,
        currency: "NPR", price_display: (p.discount_price || p.price) ? `NPR ${p.discount_price || p.price}` : "See product page",
        image_url: p.image_url, link: p.link, delivery_time: "5–10 minutes",
        description: p.description, features: p.features,
      }));
    }
  }

  // Products table fallback
  if (searchWords.length > 0) {
    const prodFilters = searchWords.flatMap(w => [`name.ilike.%${w}%`, `description.ilike.%${w}%`]).join(",");
    const { data: products } = await sb.from("products")
      .select("name, price, original_price, image_url, description, product_id, category")
      .eq("is_active", true).or(prodFilters).limit(5);

    if (products && products.length > 0) {
      return products.map((p: any) => ({
        name: p.name, package_id: p.product_id, price: p.price,
        currency: "NPR", price_display: `NPR ${p.price}`,
        image_url: p.image_url, link: getRouteForGame(p.category) || null,
        delivery_time: "5–10 minutes", description: p.description,
      }));
    }
  }

  return null;
}

// ── Conversation Memory ──

interface ConversationMessage {
  role: "user" | "assistant";
  content: string;
}

async function loadServerHistory(sessionId: string): Promise<ConversationMessage[]> {
  const sb = supabaseAdmin();
  const { data } = await sb.from("chatbot_conversations").select("role, message")
    .eq("session_id", sessionId).order("created_at", { ascending: false }).limit(10);
  if (!data || data.length === 0) return [];
  return data.reverse().map((r: any) => ({ role: r.role as "user" | "assistant", content: r.message }));
}

async function storeMessage(sessionId: string, platform: string, role: string, message: string) {
  const sb = supabaseAdmin();
  await sb.from("chatbot_conversations").insert({ session_id: sessionId, platform, role, message });
}

// ── AI Config ──

function getAIConfig(settings: any): { apiUrl: string; apiKey: string } {
  const provider = settings?.ai_provider || "lovable_ai";
  if (provider === "openrouter") {
    const apiKey = Deno.env.get("OPENROUTER_API_KEY") || "";
    if (!apiKey) throw new Error("OpenRouter API key not configured.");
    return { apiUrl: "https://openrouter.ai/api/v1/chat/completions", apiKey };
  }
  if (provider === "custom" && settings?.custom_api_url) {
    const keyName = settings.custom_api_key_name || "CUSTOM_AI_API_KEY";
    const apiKey = Deno.env.get(keyName) || "";
    if (!apiKey) throw new Error(`Custom AI API key not configured: ${keyName}`);
    return { apiUrl: settings.custom_api_url, apiKey };
  }
  const apiKey = Deno.env.get("LOVABLE_API_KEY") || "";
  if (!apiKey) throw new Error("AI not configured. LOVABLE_API_KEY missing.");
  return { apiUrl: "https://ai.gateway.lovable.dev/v1/chat/completions", apiKey };
}

// ── Tool Definitions for AI ──

const AI_TOOLS = [
  {
    type: "function",
    function: {
      name: "search_products",
      description: "Search for products and their real-time prices from the database. Use when user asks about any product, game, pricing, packages, diamonds, coins, subscriptions, or top-ups.",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "Product search query (e.g. 'free fire diamonds', 'netflix', 'roblox robux')" },
        },
        required: ["query"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "place_order",
      description: "Place an order for a product. ONLY use this after you have collected ALL required details from the user: email, package selection, and game-specific IDs (player_id, zone_id). Do NOT call this until you have confirmed all details with the user.",
      parameters: {
        type: "object",
        properties: {
          email: { type: "string", description: "User's registered email address" },
          package_id: { type: "string", description: "The package_id of the product to order" },
          player_id: { type: "string", description: "Game player ID (required for Free Fire, Mobile Legends, PUBG)" },
          zone_id: { type: "string", description: "Game zone/server ID (required for Mobile Legends)" },
        },
        required: ["email", "package_id"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "check_order_status",
      description: "Check the status of an order. Use when user asks about their order status, tracking, or provides an order number or email to check orders.",
      parameters: {
        type: "object",
        properties: {
          order_id: { type: "string", description: "Order number or user email to look up orders" },
        },
        required: ["order_id"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "initiate_payment",
      description: "Generate a Nepal payment link (eSewa/Khalti) for credit top-up. Use ONLY after confirming the user's email and amount. Returns a payment URL the user can click to pay.",
      parameters: {
        type: "object",
        properties: {
          email: { type: "string", description: "User's registered email address" },
          amount: { type: "number", description: "Payment amount in NPR (1-100000)" },
        },
        required: ["email", "amount"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "check_payment_status",
      description: "Check payment transaction status. Use when user asks about their payment status and provides a payment identifier.",
      parameters: {
        type: "object",
        properties: {
          identifier: { type: "string", description: "Payment transaction identifier" },
        },
        required: ["identifier"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "request_credit",
      description: "Submit a credit top-up request after manual payment. Use when user wants to request credit, has paid manually, or wants to submit payment proof.",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string", description: "User's full name" },
          email: { type: "string", description: "User's registered email" },
          amount: { type: "number", description: "Amount in NPR" },
          whatsapp: { type: "string", description: "User's WhatsApp number (optional)" },
          screenshot_url: { type: "string", description: "URL of payment screenshot (optional)" },
        },
        required: ["name", "email", "amount"],
        additionalProperties: false,
      },
    },
  },
];

// ── Tool Execution ──

async function executeSearchProducts(args: any): Promise<any> {
  const query = args?.query || args?.message || "";
  if (!query || typeof query !== "string" || query.trim().length === 0) {
    return { found: false, message: "Please specify a product name to search for." };
  }
  const products = await searchProducts(query);
  if (!products || products.length === 0) {
    return { found: false, message: "No products found matching this query. We may add this product soon!" };
  }
  return { found: true, products, count: products.length };
}

async function executePlaceOrder(args: any, platform: string, sessionId: string): Promise<any> {
  const sb = supabaseAdmin();
  const { email, package_id, player_id, zone_id } = args;

  const { data: pkg } = await sb.from("game_product_prices").select("*")
    .eq("package_id", package_id).eq("is_active", true).single();
  if (!pkg) return { success: false, error: "Package not found or inactive.", package_id };

  const { data: profile } = await sb.from("profiles").select("id, email, username, balance")
    .eq("email", email).single();
  if (!profile) return { success: false, error: "No account found with this email. Please register at https://ugtopups.lovable.app first." };

  const price = Number(pkg.price);
  if ((profile.balance || 0) < price) {
    return {
      success: false, error: "insufficient_credits",
      message: `Insufficient credits. Your balance: NPR ${profile.balance || 0}, Required: NPR ${price}. Please top up your credits first.`,
      balance: profile.balance || 0, required: price,
      topup_link: `${BASE_URL}/dashboard`,
    };
  }

  const productDetails: any = { player_id: player_id || "" };
  if (zone_id) productDetails.zone_id = zone_id;
  productDetails.source = platform || "chatbot_api";

  const gameToCategoryMap: Record<string, string> = {
    freefire: "freefire", mobile_legends: "mobile_legends", pubg: "pubg",
    roblox: "roblox", netflix: "netflix", tiktok: "tiktok", youtube: "youtube",
    chatgpt: "chatgpt", garena: "garena", smilecoin: "smilecoin", unipin: "unipin",
  };
  const category = gameToCategoryMap[pkg.game] || pkg.game;
  const orderNumber = (profile.username || email.split("@")[0]).toLowerCase() + "-" + Math.random().toString(36).slice(2, 5);

  const { data: updatedProfile, error: deductErr } = await sb.from("profiles")
    .update({ balance: profile.balance - price }).eq("id", profile.id).gte("balance", price)
    .select("balance").single();

  if (deductErr || !updatedProfile) {
    return { success: false, error: "Balance changed during order. Please try again." };
  }

  const { data: order, error: orderErr } = await sb.from("product_orders").insert({
    user_id: profile.id, user_email: profile.email,
    user_name: profile.username || email.split("@")[0],
    order_number: orderNumber, product_category: category,
    product_name: pkg.package_name, package_name: pkg.package_name,
    quantity: pkg.quantity, price, credits_deducted: price,
    product_details: productDetails, payment_method: "credit", status: "pending",
    metadata: { source: platform || "chatbot_api", session_id: sessionId || null },
  }).select("id, order_number").single();

  if (orderErr) {
    await sb.from("profiles").update({ balance: profile.balance }).eq("id", profile.id);
    return { success: false, error: "Failed to create order. " + orderErr.message };
  }

  await sb.from("activity_logs").insert({
    actor_id: profile.id, actor_email: profile.email,
    activity_type: "order_created", action: "Chatbot Order Placed",
    description: `Order ${orderNumber} placed via chatbot API. ${price} credits deducted.`,
    target_type: "order", target_id: order.id,
    metadata: { order_number: orderNumber, price, product: pkg.package_name, source: "chatbot_api" },
  });

  return {
    success: true, order_number: orderNumber, order_id: order.id,
    product: pkg.package_name, price, new_balance: updatedProfile.balance,
    game: pkg.game,
  };
}

async function executeCheckOrderStatus(args: any): Promise<any> {
  const sb = supabaseAdmin();
  const orderId = args.order_id?.trim();
  if (!orderId) return { error: "Order ID or email is required." };

  const { data, error } = await sb.from("product_orders")
    .select("order_number, product_name, package_name, status, price, created_at, confirmed_at, completed_at, canceled_at, cancellation_reason")
    .or(`order_number.eq.${orderId},user_email.eq.${orderId}`)
    .order("created_at", { ascending: false }).limit(5);

  if (error) return { error: error.message };
  if (!data || data.length === 0) return { found: false, message: `No orders found for "${orderId}".` };

  return {
    found: true,
    orders: data.map((o: any) => ({
      order_number: o.order_number, product: o.product_name, package: o.package_name,
      status: o.status, price: o.price, created_at: o.created_at,
      confirmed_at: o.confirmed_at, completed_at: o.completed_at,
      canceled_at: o.canceled_at, cancellation_reason: o.cancellation_reason,
    })),
  };
}

async function executeInitiatePayment(args: any): Promise<any> {
  const sb = supabaseAdmin();
  const { email, amount } = args;
  if (!email || !amount || amount < 1 || amount > 100000) {
    return { success: false, error: "Valid email and amount (1-100000) are required." };
  }

  const { data: profile } = await sb.from("profiles").select("id, email, username, full_name")
    .eq("email", email).single();
  if (!profile) return { success: false, error: "No account found with this email." };

  const identifier = `UG${profile.id.slice(0, 4)}${Date.now().toString(36)}`;

  const { error: insertErr } = await sb.from("payment_transactions").insert({
    user_id: profile.id, user_email: email, identifier,
    amount: Number(amount), credits: Number(amount), status: "initiated",
  });
  if (insertErr) return { success: false, error: "Failed to create payment record." };

  const mode = Deno.env.get("APINEPAL_MODE") || "test";
  const publicKey = Deno.env.get("APINEPAL_PUBLIC_KEY");
  const secretKey = Deno.env.get("APINEPAL_SECRET_KEY");

  if (!publicKey || !secretKey) {
    return {
      success: true, payment_method: "manual", identifier,
      message: `Payment gateway not configured. Please send NPR ${amount} via bank transfer and submit a credit request.`,
    };
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

      return {
        success: true, payment_method: "online", payment_url: result.redirect_url,
        identifier, amount,
        message: `Payment link generated for NPR ${amount}.`,
      };
    } else {
      await sb.from("payment_transactions")
        .update({ status: "failed", api_response: result })
        .eq("identifier", identifier);
      return { success: false, error: result.message?.[0] || "Payment initiation failed." };
    }
  } catch (err: any) {
    return { success: false, error: "Payment service unavailable. Please try manual payment." };
  }
}

async function executeCheckPaymentStatus(args: any): Promise<any> {
  const sb = supabaseAdmin();
  const { data, error } = await sb.from("payment_transactions")
    .select("identifier, amount, credits, status, payment_gateway, created_at, completed_at")
    .eq("identifier", args.identifier).single();
  if (error || !data) return { found: false, error: "Transaction not found." };
  return { found: true, ...data };
}

async function executeRequestCredit(args: any): Promise<any> {
  const sb = supabaseAdmin();
  const { name, email, amount, whatsapp, screenshot_url } = args;

  const { data: profile } = await sb.from("profiles").select("id").eq("email", email).single();
  if (!profile) return { success: false, error: "No account found with this email." };

  const { data: request, error } = await sb.from("payment_requests").insert({
    user_id: profile.id, user_email: email, user_name: name,
    amount: Number(amount), credits: Number(amount),
    remarks: whatsapp ? `WhatsApp: ${whatsapp}` : null,
    screenshot_url: screenshot_url || null, status: "pending",
  }).select("id").single();

  if (error) return { success: false, error: "Failed to create credit request." };

  return {
    success: true, request_id: request.id,
    message: `Credit request of NPR ${amount} submitted successfully.`,
  };
}

async function executeTool(name: string, args: any, platform: string, sessionId: string): Promise<any> {
  switch (name) {
    case "search_products": return executeSearchProducts(args);
    case "place_order": return executePlaceOrder(args, platform, sessionId);
    case "check_order_status": return executeCheckOrderStatus(args);
    case "initiate_payment": return executeInitiatePayment(args);
    case "check_payment_status": return executeCheckPaymentStatus(args);
    case "request_credit": return executeRequestCredit(args);
    default: return { error: `Unknown tool: ${name}` };
  }
}

// ── Build System Prompt ──

function buildSystemPrompt(settings: any, knowledgeContext: string | null, effectiveProducts: any[] | null): string {
  let prompt = `You are **UIQ**, a professional AI sales assistant for **UG Gaming Top-Up** (ugtopups.lovable.app).
Your job is to help users find products, place orders, and complete payments — like a real shop assistant.

## YOUR PERSONALITY
- Friendly, professional, and helpful
- Use clean formatting with markdown: **bold** headings, bullet points, line breaks
- Use relevant emojis sparingly for visual appeal (🎮 💎 🛒 ✅ etc.)
- Keep responses concise but complete
- Always sound confident about product information

## RESPONSE FORMAT RULES
Always structure your responses clearly. Never send raw data or unformatted text.

When showing products, use this format:
\`\`\`
**Product Name**
💰 Price: NPR [price]
📦 Package: [details]
⏱ Delivery: 5–10 minutes

🛒 Buy now: [link]
\`\`\`

When showing order confirmations:
\`\`\`
✅ **Order Confirmed**

📋 **Order Summary**
• Order ID: [order_number]
• Product: [name]
• Amount: NPR [price]
• Status: Pending

Your order will be processed shortly!
\`\`\`

When showing payment links:
\`\`\`
💳 **Payment Details**

• Amount: NPR [amount]
• Payment ID: [identifier]

🔗 **Pay Here:** [payment_url]

**Steps to complete:**
1. Click the payment link above
2. Choose your payment method (eSewa/Khalti)
3. Complete the payment
4. Return here — I'll confirm your payment!
\`\`\`

## ORDER PROCESS (CRITICAL — follow this exactly)
When a user wants to buy/order something, you MUST collect information step-by-step. Do NOT place an order until you have ALL required details.

**Step 1:** Ask which specific package they want (show options if unclear)
**Step 2:** Ask for their registered email address
**Step 3:** Ask for game-specific details:
  - Free Fire: Player ID
  - Mobile Legends: Player ID + Zone ID
  - PUBG Mobile: Player ID
  - Other products: Email only
**Step 4:** Confirm all details with the user before placing the order
**Step 5:** Only then use the place_order tool

If the user doesn't have enough credits, suggest adding credits first using the payment system.

## PAYMENT PROCESS
When user wants to add credits/pay:
1. Ask for their email and amount
2. Use initiate_payment tool to generate a payment link
3. Share the payment link with clear instructions
4. Tell them to let you know once payment is complete so you can verify

## TOOL USAGE RULES
- For product queries: If AVAILABLE PRODUCTS section has data, use that directly. Do NOT call search_products again.
- For orders: ONLY call place_order after collecting ALL required info
- For payments: ONLY call initiate_payment after confirming email and amount
- For order tracking: Use check_order_status with order number or email
- For general questions: Respond directly WITHOUT any tools

## CRITICAL RULES
- NEVER say a product is "not found" or "not available" if product data is provided in the AVAILABLE PRODUCTS section
- ALWAYS show real prices from the database
- ALWAYS include buy links when showing products
- Format ALL responses with proper markdown structure
- When unsure about a product, suggest visiting the website: ${BASE_URL}/products`;

  if (knowledgeContext) {
    prompt += `\n\n---\n📚 **KNOWLEDGE BASE**\n${knowledgeContext}\n---`;
  }

  if (effectiveProducts && effectiveProducts.length > 0) {
    const productContext = effectiveProducts.map((p: any) =>
      `• ${p.name} | NPR ${p.price} | Package ID: ${p.package_id || 'N/A'} | Game: ${p.game || 'N/A'} | Link: ${p.link ? BASE_URL + p.link : 'N/A'}`
    ).join("\n");
    prompt += `\n\n---\n🛍️ **AVAILABLE PRODUCTS** (Real-time database prices — USE THIS DATA)\n${productContext}\n---\n⚠️ The above products are CONFIRMED available. Present them with prices and links. Do NOT say products are not found. Do NOT call search_products tool.`;
  } else {
    prompt += `\n\nIf the user asks about a product not in our database, say: "This product isn't currently available on our website, but it may be added soon! Check out our full catalog at ${BASE_URL}/products"`;
  }

  prompt += `\n\n---\n💳 **PAYMENT INFO**
• Online payment: eSewa / Khalti via API Nepal gateway
• Manual payment: QR code or bank transfer
• Add credits: Dashboard → Add Credit
• Website: https://ugtopups.lovable.app
---`;

  // Add custom system prompt from settings if available
  if (settings?.ai_system_prompt && settings.ai_system_prompt.trim()) {
    prompt += `\n\n---\n**ADDITIONAL INSTRUCTIONS**\n${settings.ai_system_prompt}\n---`;
  }

  return prompt;
}

// ── Unified AI Brain ──

async function handleUnifiedMessage(body: any) {
  const { message, session_id, history, platform } = body;
  const effectivePlatform = platform || "web";
  const effectiveSessionId = session_id || "anonymous";

  if (!message || typeof message !== "string" || message.length > 2000) {
    return jsonResponse({ success: false, error: "message is required (string, max 2000 chars)" }, 400);
  }

  if (!checkRateLimit(effectiveSessionId)) {
    return jsonResponse({
      success: false, action: "rate_limited",
      reply: "⏳ You're sending messages too quickly. Please wait a moment and try again.",
    }, 429);
  }

  const settings = await getSettings();
  if (settings && !settings.is_enabled) {
    return jsonResponse({ success: false, reply: "🔧 Our chatbot is currently offline for maintenance. Please try again later!", action: "disabled" });
  }

  // Load conversation history
  let conversationHistory: ConversationMessage[] = [];
  if (effectivePlatform !== "web" && session_id) {
    conversationHistory = await loadServerHistory(session_id);
  } else if (Array.isArray(history)) {
    conversationHistory = history;
  }

  // Store user message
  if (session_id) {
    await storeMessage(session_id, effectivePlatform, "user", message);
  }

  // Pre-fetch RAG context in parallel
  const [productResults, multiGameResults, knowledgeContext] = await Promise.all([
    searchProducts(message),
    searchMultiGameProducts(message),
    searchKnowledgeBase(message),
  ]);

  const effectiveProducts = (productResults && productResults.length > 0) ? productResults : multiGameResults;

  // Build AI config
  const { apiUrl, apiKey } = getAIConfig(settings);
  const model = settings?.ai_model || "google/gemini-3-flash-preview";

  const systemPrompt = buildSystemPrompt(settings, knowledgeContext, effectiveProducts);

  // Build messages array
  const aiMessages: { role: string; content: string }[] = [{ role: "system", content: systemPrompt }];
  if (conversationHistory.length > 0) {
    for (const msg of conversationHistory.slice(-10)) {
      aiMessages.push({ role: msg.role, content: msg.content });
    }
  }
  aiMessages.push({ role: "user", content: message });

  try {
    // First AI call with tools
    const aiResponse = await fetch(apiUrl, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model, messages: aiMessages, tools: AI_TOOLS }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error("AI error:", aiResponse.status, errText);
      if (aiResponse.status === 429) throw new Error("AI is busy right now. Please try again in a moment.");
      if (aiResponse.status === 402) throw new Error("AI service quota reached. Please try again later.");
      throw new Error("AI service error");
    }

    const aiData = await aiResponse.json();
    const choice = aiData.choices?.[0];

    // Handle tool calls
    if (choice?.message?.tool_calls && choice.message.tool_calls.length > 0) {
      const toolResults: any[] = [];
      let detectedAction = "message";
      let actionData: any = {};

      for (const toolCall of choice.message.tool_calls) {
        const toolName = toolCall.function.name;
        let toolArgs: any;
        try {
          toolArgs = JSON.parse(toolCall.function.arguments);
        } catch {
          toolArgs = {};
        }

        console.log(`Tool call: ${toolName}`, toolArgs);
        const result = await executeTool(toolName, toolArgs, effectivePlatform, effectiveSessionId);

        const actionMap: Record<string, string> = {
          search_products: "product_search",
          place_order: "order",
          check_order_status: "order_status",
          initiate_payment: "payment",
          check_payment_status: "payment_status",
          request_credit: "credit_request",
        };
        detectedAction = actionMap[toolName] || "message";
        actionData = result;

        toolResults.push({
          role: "tool",
          tool_call_id: toolCall.id,
          content: JSON.stringify(result),
        });
      }

      // Second AI call with tool results — AI will format the response
      const followUpMessages = [
        ...aiMessages,
        choice.message,
        ...toolResults,
      ];

      const followUpResponse = await fetch(apiUrl, {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model, messages: followUpMessages }),
      });

      let finalReply = "I processed your request.";
      if (followUpResponse.ok) {
        const followUpData = await followUpResponse.json();
        finalReply = followUpData.choices?.[0]?.message?.content || finalReply;
      }

      // Safety: if tool returned products but AI still says not found, override
      if (detectedAction === "product_search" && actionData?.found && actionData?.products?.length > 0) {
        const NOT_FOUND_PHRASES = ["not found", "not available", "don't have", "doesn't exist", "couldn't find", "no product"];
        if (NOT_FOUND_PHRASES.some(p => finalReply.toLowerCase().includes(p))) {
          finalReply = formatProductResponse(actionData.products);
        }
      }

      if (session_id) {
        await storeMessage(session_id, effectivePlatform, "assistant", finalReply);
      }

      return jsonResponse({
        success: true, reply: finalReply, action: detectedAction,
        data: actionData, timestamp: new Date().toISOString(),
        ...(actionData.products ? { products: actionData.products, product: actionData.products[0] } : {}),
      });
    }

    // No tool calls - direct AI response
    let aiReply = choice?.message?.content || "I couldn't generate a response. Please try again.";

    // SAFETY CHECK: If AI says "not found" but we have products, override
    const NOT_FOUND_PHRASES = ["not found", "not available", "don't have", "doesn't exist", "isn't found", "no product", "not currently available", "couldn't find"];
    const aiReplyLower = aiReply.toLowerCase();
    const aiSaysNotFound = NOT_FOUND_PHRASES.some(phrase => aiReplyLower.includes(phrase));

    if (aiSaysNotFound && effectiveProducts && effectiveProducts.length > 0) {
      console.log("AI safety check triggered: overriding 'not found' with real product data");
      aiReply = formatProductResponse(effectiveProducts);
    }

    if (session_id) {
      await storeMessage(session_id, effectivePlatform, "assistant", aiReply);
    }

    return jsonResponse({
      success: true, reply: aiReply,
      action: effectiveProducts && effectiveProducts.length > 0 ? "product_search" : "message",
      data: effectiveProducts && effectiveProducts.length > 0 ? { products: effectiveProducts } : {},
      timestamp: new Date().toISOString(),
      ...(effectiveProducts && effectiveProducts.length > 0 ? { products: effectiveProducts, product: effectiveProducts[0] } : {}),
    });

  } catch (err: any) {
    console.error("Brain error:", err.message);

    // Fallback: if we have product data, return it even without AI
    if (effectiveProducts && effectiveProducts.length > 0) {
      const fallbackReply = formatProductResponse(effectiveProducts);
      if (session_id) {
        await storeMessage(session_id, effectivePlatform, "assistant", fallbackReply);
      }
      return jsonResponse({
        success: true, reply: fallbackReply, action: "product_search",
        data: { products: effectiveProducts },
        products: effectiveProducts, product: effectiveProducts[0],
        timestamp: new Date().toISOString(),
      });
    }

    return jsonResponse({
      success: false, reply: `❌ ${err.message}`,
      action: "error", data: {}, timestamp: new Date().toISOString(),
    });
  }
}

// ── Legacy Direct Action Handlers (backward compat) ──

async function handleFeedback(body: any) {
  const { message_id, session_id, user_message, bot_response, rating, comment } = body;
  if (!message_id || !session_id || !rating || !["helpful", "not_helpful"].includes(rating)) {
    return jsonResponse({ success: false, error: "message_id, session_id, and valid rating required" }, 400);
  }
  const sb = supabaseAdmin();
  const { error } = await sb.from("chatbot_feedback").insert({
    message_id, session_id, user_message: user_message || null,
    bot_response: bot_response || null, rating, comment: comment || null,
  });
  if (error) return jsonResponse({ success: false, error: "Failed to save feedback" }, 500);
  return jsonResponse({ success: true, action: "feedback", reply: "✅ Feedback recorded. Thank you!", timestamp: new Date().toISOString() });
}

async function handleTestConnection() {
  try {
    const settings = await getSettings();
    const { apiUrl, apiKey } = getAIConfig(settings);
    const model = settings?.ai_model || "google/gemini-3-flash-preview";

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model, messages: [
          { role: "system", content: "You are a test assistant." },
          { role: "user", content: "Say hello in one word." },
        ], max_tokens: 10,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      return jsonResponse({
        success: false, error: `API returned ${response.status}: ${errText.slice(0, 200)}`,
        provider: settings?.ai_provider || "lovable_ai", model,
      });
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content || "OK";
    return jsonResponse({
      success: true, reply: `Connection successful! Model: "${reply}"`,
      provider: settings?.ai_provider || "lovable_ai", model,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    return jsonResponse({ success: false, error: err.message || "Connection test failed" });
  }
}

async function handleCleanupConversations() {
  const sb = supabaseAdmin();
  const fifteenDaysAgo = new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString();
  const { error, count } = await sb.from("chatbot_conversations").delete().lt("created_at", fifteenDaysAgo);
  if (error) return jsonResponse({ success: false, error: error.message }, 500);
  return jsonResponse({
    success: true, action: "cleanup", reply: `Cleaned ${count ?? 0} old conversations.`,
    data: { deleted: count ?? 0 }, timestamp: new Date().toISOString(),
  });
}

// ── Response Helper ──

function jsonResponse(body: any, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// ── Main Router ──

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const action = body.action;

    switch (action) {
      case "submit-feedback":
        return await handleFeedback(body);
      case "cleanup-conversations":
        return await handleCleanupConversations();
      case "test-connection":
        return await handleTestConnection();
      default:
        if (action === "order") {
          const result = await executePlaceOrder(body, body.platform || "api", body.session_id || "");
          return jsonResponse({ success: result.success !== false, reply: result.message || result.error, action: "order", data: result, timestamp: new Date().toISOString() });
        }
        if (action === "order-status") {
          const result = await executeCheckOrderStatus(body);
          return jsonResponse({ success: !result.error, reply: result.message || (result.found ? `Found ${result.orders?.length} order(s).` : result.message), action: "order_status", data: result, timestamp: new Date().toISOString() });
        }
        if (action === "initiate-payment") {
          const result = await executeInitiatePayment(body);
          return jsonResponse({ success: result.success, reply: result.message || result.error, action: "payment", data: result, timestamp: new Date().toISOString() });
        }
        if (action === "payment-status") {
          const result = await executeCheckPaymentStatus(body);
          return jsonResponse({ success: result.found, reply: result.found ? `Payment ${result.status}` : result.error, action: "payment_status", data: result, timestamp: new Date().toISOString() });
        }
        if (action === "credit-request") {
          const result = await executeRequestCredit(body);
          return jsonResponse({ success: result.success, reply: result.message || result.error, action: "credit_request", data: result, timestamp: new Date().toISOString() });
        }

        return await handleUnifiedMessage(body);
    }
  } catch (err: any) {
    return jsonResponse({ success: false, error: err.message || "Internal server error" }, 500);
  }
});
