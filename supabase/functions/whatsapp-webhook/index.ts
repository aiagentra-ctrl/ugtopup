import { createClient } from "https://esm.sh/@supabase/supabase-js@2.76.0";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Content-Type": "application/json",
};

function supabaseAdmin() {
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
}

// Rate limiting per phone number
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
function checkRateLimit(phone: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(phone);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(phone, { count: 1, resetAt: now + 60_000 });
    return true;
  }
  entry.count++;
  return entry.count <= 10;
}

setInterval(() => {
  const now = Date.now();
  for (const [key, val] of rateLimitMap) {
    if (now > val.resetAt) rateLimitMap.delete(key);
  }
}, 120_000);

async function getWhatsAppConfig() {
  const db = supabaseAdmin();
  const { data, error } = await db.from("whatsapp_config").select("*").limit(1).single();
  if (error || !data) return null;
  return data;
}

async function logMessage(
  phoneNumber: string,
  direction: "inbound" | "outbound",
  message: string,
  sessionId: string,
  status = "sent",
  errorMessage?: string,
  metadata?: Record<string, unknown>
) {
  const db = supabaseAdmin();
  await db.from("whatsapp_messages").insert({
    phone_number: phoneNumber,
    direction,
    message: message.substring(0, 5000),
    session_id: sessionId,
    status,
    error_message: errorMessage,
    metadata: metadata || {},
  });
}

async function sendWhatsAppReply(config: any, phone: string, text: string) {
  const url = `${config.server_url}/message/sendText/${config.instance_name}`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: config.api_key,
    },
    body: JSON.stringify({
      number: phone,
      text: text,
      delay: 1200, // typing simulation delay in ms
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Evolution API error: ${res.status} - ${err}`);
  }
  return await res.json();
}

async function callChatbotApi(sessionId: string, message: string) {
  const url = `${SUPABASE_URL}/functions/v1/chatbot-api`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({
      action: "message",
      session_id: sessionId,
      message: message,
      platform: "whatsapp",
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Chatbot API error: ${res.status} - ${err}`);
  }
  return await res.json();
}

function ok(data: any, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: corsHeaders });
}

function err(message: string, status = 400) {
  return new Response(JSON.stringify({ error: message }), { status, headers: corsHeaders });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (req.method !== "POST") {
      return err("Method not allowed", 405);
    }

    let body: any;
    try {
      body = await req.json();
    } catch {
      return err("Invalid JSON", 400);
    }

    // ── Admin actions from the dashboard ──
    if (body.admin_action) {
      const config = await getWhatsAppConfig();
      if (!config) return err("WhatsApp not configured");

      switch (body.admin_action) {
        case "test-connection": {
          try {
            const res = await fetch(
              `${config.server_url}/instance/connectionState/${config.instance_name}`,
              { headers: { apikey: config.api_key } }
            );
            const data = await res.json();

            // Update config status based on response
            const db = supabaseAdmin();
            const state = data?.instance?.state || data?.state;
            if (state === "open") {
              await db.from("whatsapp_config").update({
                connection_status: "connected",
                updated_at: new Date().toISOString(),
              }).eq("id", config.id);
            }

            return ok({ success: true, data });
          } catch (e) {
            return err(e.message, 500);
          }
        }

        case "get-qr": {
          try {
            // Create instance if needed
            await fetch(`${config.server_url}/instance/create`, {
              method: "POST",
              headers: { "Content-Type": "application/json", apikey: config.api_key },
              body: JSON.stringify({
                instanceName: config.instance_name,
                integration: "WHATSAPP-BAILEYS",
                qrcode: true,
              }),
            });

            // Connect to get QR
            const connectRes = await fetch(
              `${config.server_url}/instance/connect/${config.instance_name}`,
              { headers: { apikey: config.api_key } }
            );
            const connectData = await connectRes.json();

            const db = supabaseAdmin();
            await db.from("whatsapp_config").update({
              connection_status: "connecting",
              updated_at: new Date().toISOString(),
            }).eq("id", config.id);

            return ok({ success: true, qr: connectData });
          } catch (e) {
            return err(e.message, 500);
          }
        }

        case "disconnect": {
          try {
            await fetch(`${config.server_url}/instance/logout/${config.instance_name}`, {
              method: "DELETE",
              headers: { apikey: config.api_key },
            });
            const db = supabaseAdmin();
            await db.from("whatsapp_config").update({
              connection_status: "disconnected",
              connected_number: null,
              updated_at: new Date().toISOString(),
            }).eq("id", config.id);
            return ok({ success: true });
          } catch (e) {
            return err(e.message, 500);
          }
        }

        case "set-webhook": {
          try {
            const webhookUrl = `${SUPABASE_URL}/functions/v1/whatsapp-webhook`;
            const res = await fetch(`${config.server_url}/webhook/set/${config.instance_name}`, {
              method: "POST",
              headers: { "Content-Type": "application/json", apikey: config.api_key },
              body: JSON.stringify({
                webhook: {
                  enabled: true,
                  url: webhookUrl,
                  webhookByEvents: false,
                  events: ["MESSAGES_UPSERT", "CONNECTION_UPDATE"],
                },
              }),
            });
            const data = await res.json();

            // Also update webhook_url in config
            const db = supabaseAdmin();
            await db.from("whatsapp_config").update({
              webhook_url: webhookUrl,
              updated_at: new Date().toISOString(),
            }).eq("id", config.id);

            return ok({ success: true, data, webhook_url: webhookUrl });
          } catch (e) {
            return err(e.message, 500);
          }
        }

        case "fetch-instance-info": {
          try {
            const res = await fetch(
              `${config.server_url}/instance/fetchInstances`,
              { headers: { apikey: config.api_key } }
            );
            const data = await res.json();
            return ok({ success: true, data });
          } catch (e) {
            return err(e.message, 500);
          }
        }

        case "send-message": {
          // Admin sends a manual message to a phone number
          const { phone, message } = body;
          if (!phone || !message) return err("phone and message are required");
          try {
            await sendWhatsAppReply(config, phone, message);
            const sessionId = `wa-${phone}`;
            await logMessage(phone, "outbound", message, sessionId, "sent", undefined, { manual: true });
            return ok({ success: true });
          } catch (e) {
            return err(e.message, 500);
          }
        }

        default:
          return err("Unknown admin action");
      }
    }

    // ── Webhook events from Evolution API ──

    // Normalize Evolution v2 event names
    const event = body.event || "";
    const normalizedEvent = event.toLowerCase().replace(/_/g, ".");

    // Handle connection updates
    if (normalizedEvent === "connection.update") {
      const db = supabaseAdmin();
      const state = body.data?.state || body.data?.status;
      if (state === "open") {
        const jid = body.data?.instance?.wuid || body.data?.wuid || "";
        const number = jid.split("@")[0] || "";
        await db.from("whatsapp_config").update({
          connection_status: "connected",
          connected_number: number,
          updated_at: new Date().toISOString(),
        }).eq("instance_name", body.instance || "ugc-topup");
      } else if (state === "close") {
        await db.from("whatsapp_config").update({
          connection_status: "disconnected",
          updated_at: new Date().toISOString(),
        }).eq("instance_name", body.instance || "ugc-topup");
      }
      return ok({ ok: true });
    }

    // Handle incoming messages (Evolution v2: MESSAGES_UPSERT or messages.upsert)
    if (normalizedEvent === "messages.upsert" || body.data?.message || body.data?.key) {
      const config = await getWhatsAppConfig();
      if (!config || !config.is_enabled) {
        return ok({ ok: true, skipped: "disabled" });
      }

      const msgData = body.data;
      if (!msgData) return ok({ ok: true });

      const key = msgData.key || {};
      if (key.fromMe) return ok({ ok: true });

      const remoteJid = key.remoteJid || "";
      // Skip group messages and status broadcasts
      if (remoteJid.endsWith("@g.us") || remoteJid === "status@broadcast") {
        return ok({ ok: true, skipped: "group_or_status" });
      }

      const phone = remoteJid.split("@")[0];
      if (!phone) return ok({ ok: true });

      const msgContent = msgData.message || {};
      const text =
        msgContent.conversation ||
        msgContent.extendedTextMessage?.text ||
        msgContent.imageMessage?.caption ||
        msgContent.videoMessage?.caption ||
        "";

      if (!text.trim()) return ok({ ok: true, skipped: "no_text" });
      if (!checkRateLimit(phone)) return ok({ ok: true, skipped: "rate_limited" });

      const sessionId = `wa-${phone}`;
      await logMessage(phone, "inbound", text, sessionId);

      try {
        const chatResponse = await callChatbotApi(sessionId, text);
        const replyText = chatResponse.reply || chatResponse.message || "Sorry, I could not process your request.";
        await sendWhatsAppReply(config, phone, replyText);
        await logMessage(phone, "outbound", replyText, sessionId);
      } catch (e) {
        console.error("WhatsApp message processing error:", e);
        await logMessage(phone, "outbound", "", sessionId, "failed", e.message);
        try {
          await sendWhatsAppReply(config, phone, "Sorry, I'm having trouble right now. Please try again later or visit our website.");
        } catch { /* ignore */ }
      }

      return ok({ ok: true });
    }

    return ok({ ok: true });
  } catch (e) {
    console.error("WhatsApp webhook error:", e);
    return err("Internal error", 500);
  }
});
