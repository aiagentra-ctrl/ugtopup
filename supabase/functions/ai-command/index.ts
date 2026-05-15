// supabase/functions/ai-command/index.ts
// AI Command Dashboard backend.
// - Authenticates the caller and verifies admin via has_role()
// - Calls Lovable AI Gateway with tool-calling
// - Tools: query_data (read whitelisted aggregates) + propose_write (returns preview to client)
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

const SYSTEM_PROMPT = `You are an AI Command assistant for a gaming top-up store admin panel (Nepal market, NPR currency).
You can READ data via the "query_data" tool and PROPOSE WRITES via "propose_write".
Never invent data — always call query_data for facts. Never execute writes directly; always propose them so the admin can confirm.

Available read intents (pass as { intent, params }):
- today_sales         -> revenue, order count, top 3 products today, vs yesterday
- pending_orders      -> list of pending product_orders
- low_stock           -> products with low stock (game_product_prices where stock < threshold)
- credit_requests     -> pending payment_requests
- top_products        -> {period: 'week'|'month'} top selling products
- monthly_report      -> {month?: 'YYYY-MM'} aggregated report
- support_tickets     -> open tickets
- user_activity       -> today's signups + activity feed
- recent_changelogs   -> recent ai_changelogs

Available write actions (propose_write):
- update_banner, update_price, disable_product, update_stock,
- complete_order, cancel_order, approve_credit, reject_credit,
- create_coupon, disable_offer, send_notification, publish_announcement

Always respond with a short chat_text (1-2 sentences) AND, when relevant, return the data via tool calls. Be concise.`;

const TOOLS = [
  {
    type: "function",
    function: {
      name: "query_data",
      description: "Fetch admin data for the right panel.",
      parameters: {
        type: "object",
        properties: {
          intent: { type: "string" },
          params: { type: "object", additionalProperties: true },
        },
        required: ["intent"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "propose_write",
      description: "Propose a write action that the admin must confirm.",
      parameters: {
        type: "object",
        properties: {
          action: { type: "string" },
          table: { type: "string" },
          record_id: { type: "string" },
          old_value: { type: "object", additionalProperties: true },
          new_value: { type: "object", additionalProperties: true },
          confirmation_message: { type: "string" },
        },
        required: ["action", "table", "new_value", "confirmation_message"],
        additionalProperties: false,
      },
    },
  },
];

async function runQuery(supabase: any, intent: string, params: Record<string, any> = {}) {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today.getTime() - 86400000);
  const tomorrow = new Date(today.getTime() + 86400000);

  switch (intent) {
    case "today_sales": {
      const { data: todayOrders } = await supabase
        .from("product_orders")
        .select("id, price, product_name, created_at, status")
        .gte("created_at", today.toISOString())
        .lt("created_at", tomorrow.toISOString());
      const { data: yOrders } = await supabase
        .from("product_orders")
        .select("price")
        .gte("created_at", yesterday.toISOString())
        .lt("created_at", today.toISOString());
      const revenue = (todayOrders ?? []).reduce((s: number, o: any) => s + Number(o.price || 0), 0);
      const yRevenue = (yOrders ?? []).reduce((s: number, o: any) => s + Number(o.price || 0), 0);
      const productCounts: Record<string, { units: number; revenue: number }> = {};
      for (const o of todayOrders ?? []) {
        const k = o.product_name || "Unknown";
        productCounts[k] ??= { units: 0, revenue: 0 };
        productCounts[k].units += 1;
        productCounts[k].revenue += Number(o.price || 0);
      }
      const top = Object.entries(productCounts)
        .map(([name, v]) => ({ name, ...v }))
        .sort((a, b) => b.units - a.units).slice(0, 3);
      // hourly buckets
      const hourly = Array.from({ length: 24 }, (_, h) => ({ hour: h, revenue: 0, orders: 0 }));
      for (const o of todayOrders ?? []) {
        const h = new Date(o.created_at).getHours();
        hourly[h].revenue += Number(o.price || 0);
        hourly[h].orders += 1;
      }
      return {
        kind: "sales_summary",
        data: {
          revenue, orders: (todayOrders ?? []).length,
          avg: (todayOrders?.length ?? 0) > 0 ? revenue / (todayOrders!.length) : 0,
          comparison_pct: yRevenue ? ((revenue - yRevenue) / yRevenue) * 100 : null,
          top, hourly,
        },
      };
    }
    case "pending_orders": {
      const { data } = await supabase.from("product_orders")
        .select("id, order_number, user_email, product_name, package_name, price, created_at, status")
        .eq("status", "pending").order("created_at", { ascending: false }).limit(50);
      return { kind: "pending_orders", data: { items: data ?? [] } };
    }
    case "low_stock": {
      const threshold = Number(params.threshold ?? 10);
      const { data } = await supabase.from("game_product_prices")
        .select("id, game, package_id, label, price, stock, is_active")
        .lt("stock", threshold).eq("is_active", true).order("stock", { ascending: true }).limit(50);
      return { kind: "low_stock", data: { items: data ?? [], threshold } };
    }
    case "credit_requests": {
      const { data } = await supabase.from("payment_requests")
        .select("id, user_email, user_name, amount, credits, payment_method, screenshot_path, created_at, status")
        .eq("status", "pending").order("created_at", { ascending: false }).limit(50);
      return { kind: "credit_requests_list", data: { items: data ?? [] } };
    }
    case "top_products": {
      const days = params.period === "month" ? 30 : 7;
      const since = new Date(Date.now() - days * 86400000).toISOString();
      const { data } = await supabase.from("product_orders")
        .select("product_name, price").gte("created_at", since);
      const map: Record<string, { units: number; revenue: number }> = {};
      for (const o of data ?? []) {
        const k = o.product_name || "Unknown";
        map[k] ??= { units: 0, revenue: 0 };
        map[k].units += 1; map[k].revenue += Number(o.price || 0);
      }
      const items = Object.entries(map).map(([name, v]) => ({ name, ...v }))
        .sort((a, b) => b.units - a.units).slice(0, 5);
      return { kind: "top_products", data: { items, period: params.period ?? "week" } };
    }
    case "monthly_report": {
      const month = params.month ?? new Date().toISOString().slice(0, 7);
      const start = new Date(month + "-01T00:00:00Z");
      const end = new Date(start); end.setUTCMonth(end.getUTCMonth() + 1);
      const { data } = await supabase.from("product_orders")
        .select("price, product_category, created_at")
        .gte("created_at", start.toISOString()).lt("created_at", end.toISOString());
      const revenue = (data ?? []).reduce((s, o: any) => s + Number(o.price || 0), 0);
      const daily: Record<string, number> = {};
      const cat: Record<string, number> = {};
      for (const o of data ?? []) {
        const d = (o.created_at as string).slice(0, 10);
        daily[d] = (daily[d] ?? 0) + Number(o.price || 0);
        const c = o.product_category || "other";
        cat[c] = (cat[c] ?? 0) + Number(o.price || 0);
      }
      const { count: newUsers } = await supabase.from("profiles")
        .select("id", { count: "exact", head: true })
        .gte("created_at", start.toISOString()).lt("created_at", end.toISOString());
      return {
        kind: "monthly_report",
        data: {
          month, revenue, orders: (data ?? []).length, new_users: newUsers ?? 0,
          daily: Object.entries(daily).map(([day, value]) => ({ day, value })).sort((a, b) => a.day.localeCompare(b.day)),
          categories: Object.entries(cat).map(([name, value]) => ({ name, value })),
        },
      };
    }
    case "support_tickets": {
      const { data } = await supabase.from("support_tickets")
        .select("id, subject, priority, status, user_email, created_at")
        .neq("status", "closed").order("created_at", { ascending: false }).limit(50);
      return { kind: "support_tickets", data: { items: data ?? [] } };
    }
    case "user_activity": {
      const { count: signups } = await supabase.from("profiles")
        .select("id", { count: "exact", head: true })
        .gte("created_at", today.toISOString());
      const { data: feed } = await supabase.from("activity_logs")
        .select("actor_email, action, description, created_at")
        .gte("created_at", today.toISOString())
        .order("created_at", { ascending: false }).limit(30);
      return { kind: "user_activity", data: { signups: signups ?? 0, feed: feed ?? [] } };
    }
    case "recent_changelogs": {
      const { data } = await supabase.from("ai_changelogs")
        .select("*").order("performed_at", { ascending: false }).limit(50);
      return { kind: "recent_changelogs", data: { items: data ?? [] } };
    }
    default:
      return { kind: "text", data: { message: `Unknown intent: ${intent}` } };
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const auth = req.headers.get("Authorization") ?? "";
    if (!auth) return new Response(JSON.stringify({ error: "Missing auth" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    // Authenticated client (RLS for the user)
    const userClient = createClient(SUPABASE_URL, SERVICE_KEY, {
      global: { headers: { Authorization: auth } },
    });
    const { data: userRes } = await userClient.auth.getUser();
    const user = userRes?.user;
    if (!user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    // Verify admin
    const admin = createClient(SUPABASE_URL, SERVICE_KEY);
    const { data: isAdmin } = await admin.rpc("has_role", { _user_id: user.id, _role: "admin" });
    const { data: isSuper } = await admin.rpc("has_role", { _user_id: user.id, _role: "super_admin" });
    const { data: isSub } = await admin.rpc("has_role", { _user_id: user.id, _role: "sub_admin" });
    if (!isAdmin && !isSuper && !isSub) {
      return new Response(JSON.stringify({ error: "Admin access required" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "LOVABLE_API_KEY missing" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const body = await req.json();
    const messages = body.messages ?? [];
    const model = body.model ?? "google/gemini-2.5-pro";

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: SYSTEM_PROMPT + `\nCurrent admin: ${user.email}\nNow: ${new Date().toISOString()}` },
          ...messages,
        ],
        tools: TOOLS,
        tool_choice: "auto",
      }),
    });

    if (aiResp.status === 429) return new Response(JSON.stringify({ error: "Rate limited" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    if (aiResp.status === 402) return new Response(JSON.stringify({ error: "AI credits exhausted" }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    if (!aiResp.ok) {
      const t = await aiResp.text();
      console.error("ai-command gateway error", aiResp.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const aiJson = await aiResp.json();
    const choice = aiJson.choices?.[0]?.message;
    const toolCall = choice?.tool_calls?.[0];
    let panel: any = null;
    let chat_text: string = choice?.content ?? "";

    if (toolCall) {
      const name = toolCall.function?.name;
      let args: any = {};
      try { args = JSON.parse(toolCall.function?.arguments || "{}"); } catch { /* */ }
      if (name === "query_data") {
        const result = await runQuery(admin, args.intent, args.params || {});
        panel = result;
        if (!chat_text) chat_text = `Here is the latest ${String(args.intent).replace(/_/g, " ")}.`;
      } else if (name === "propose_write") {
        panel = { kind: "write_preview", data: args };
        if (!chat_text) chat_text = args.confirmation_message ?? "Please confirm the change.";
      }
    }

    return new Response(JSON.stringify({ chat_text, panel }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ai-command error", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
