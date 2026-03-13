import { createClient } from "https://esm.sh/@supabase/supabase-js@2.76.0";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

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

Deno.serve(async (req) => {
  // CORS
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
      },
    });
  }

  try {
    // Handle admin actions (test connection, get QR, etc.)
    if (req.method === "POST") {
      const contentType = req.headers.get("content-type") || "";
      
      let body: any;
      try {
        body = await req.json();
      } catch {
        return new Response(JSON.stringify({ error: "Invalid JSON" }), {
          status: 400,
          headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        });
      }

      // Admin actions from the dashboard
      if (body.admin_action) {
        const config = await getWhatsAppConfig();
        if (!config) {
          return new Response(JSON.stringify({ error: "WhatsApp not configured" }), {
            status: 400,
            headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
          });
        }

        switch (body.admin_action) {
          case "test-connection": {
            try {
              const res = await fetch(
                `${config.server_url}/instance/connectionState/${config.instance_name}`,
                { headers: { apikey: config.api_key } }
              );
              const data = await res.json();
              return new Response(JSON.stringify({ success: true, data }), {
                headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
              });
            } catch (e) {
              return new Response(
                JSON.stringify({ success: false, error: e.message }),
                { status: 500, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } }
              );
            }
          }

          case "get-qr": {
            try {
              // Create instance if needed, then get QR
              const createRes = await fetch(`${config.server_url}/instance/create`, {
                method: "POST",
                headers: { "Content-Type": "application/json", apikey: config.api_key },
                body: JSON.stringify({
                  instanceName: config.instance_name,
                  integration: "WHATSAPP-BAILEYS",
                  qrcode: true,
                }),
              });
              const createData = await createRes.json();
              
              // Connect to get QR
              const connectRes = await fetch(
                `${config.server_url}/instance/connect/${config.instance_name}`,
                { headers: { apikey: config.api_key } }
              );
              const connectData = await connectRes.json();
              
              // Update status
              const db = supabaseAdmin();
              await db.from("whatsapp_config").update({
                connection_status: "connecting",
                updated_at: new Date().toISOString(),
              }).eq("id", config.id);

              return new Response(
                JSON.stringify({ success: true, qr: connectData }),
                { headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } }
              );
            } catch (e) {
              return new Response(
                JSON.stringify({ success: false, error: e.message }),
                { status: 500, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } }
              );
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
              return new Response(
                JSON.stringify({ success: true }),
                { headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } }
              );
            } catch (e) {
              return new Response(
                JSON.stringify({ success: false, error: e.message }),
                { status: 500, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } }
              );
            }
          }

          case "set-webhook": {
            try {
              const webhookUrl = config.webhook_url || `${SUPABASE_URL}/functions/v1/whatsapp-webhook`;
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
              return new Response(
                JSON.stringify({ success: true, data }),
                { headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } }
              );
            } catch (e) {
              return new Response(
                JSON.stringify({ success: false, error: e.message }),
                { status: 500, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } }
              );
            }
          }

          default:
            return new Response(JSON.stringify({ error: "Unknown admin action" }), {
              status: 400,
              headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
            });
        }
      }

      // ── Webhook from Evolution API ──

      // Handle connection updates
      if (body.event === "connection.update") {
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
        return new Response(JSON.stringify({ ok: true }), {
          headers: { "Content-Type": "application/json" },
        });
      }

      // Handle incoming messages
      if (body.event === "messages.upsert" || body.data?.message || body.data?.key) {
        const config = await getWhatsAppConfig();
        if (!config || !config.is_enabled) {
          return new Response(JSON.stringify({ ok: true, skipped: "disabled" }), {
            headers: { "Content-Type": "application/json" },
          });
        }

        // Extract message details from Evolution API payload
        const msgData = body.data;
        if (!msgData) {
          return new Response(JSON.stringify({ ok: true }), {
            headers: { "Content-Type": "application/json" },
          });
        }

        // Skip if message is from us (fromMe)
        const key = msgData.key || {};
        if (key.fromMe) {
          return new Response(JSON.stringify({ ok: true }), {
            headers: { "Content-Type": "application/json" },
          });
        }

        // Extract phone and text
        const remoteJid = key.remoteJid || "";
        const phone = remoteJid.split("@")[0];
        if (!phone) {
          return new Response(JSON.stringify({ ok: true }), {
            headers: { "Content-Type": "application/json" },
          });
        }

        // Get message text (support different message types)
        const msgContent = msgData.message || {};
        const text =
          msgContent.conversation ||
          msgContent.extendedTextMessage?.text ||
          msgContent.imageMessage?.caption ||
          msgContent.videoMessage?.caption ||
          "";

        if (!text.trim()) {
          return new Response(JSON.stringify({ ok: true, skipped: "no_text" }), {
            headers: { "Content-Type": "application/json" },
          });
        }

        // Rate limit
        if (!checkRateLimit(phone)) {
          return new Response(JSON.stringify({ ok: true, skipped: "rate_limited" }), {
            headers: { "Content-Type": "application/json" },
          });
        }

        const sessionId = `wa-${phone}`;

        // Log inbound message
        await logMessage(phone, "inbound", text, sessionId);

        try {
          // Call chatbot API
          const chatResponse = await callChatbotApi(sessionId, text);
          const replyText = chatResponse.reply || chatResponse.message || "Sorry, I could not process your request.";

          // Send reply via Evolution API
          await sendWhatsAppReply(config, phone, replyText);

          // Log outbound message
          await logMessage(phone, "outbound", replyText, sessionId);
        } catch (e) {
          console.error("WhatsApp message processing error:", e);
          await logMessage(phone, "outbound", "", sessionId, "failed", e.message);
          
          // Try to send error reply
          try {
            await sendWhatsAppReply(
              config,
              phone,
              "Sorry, I'm having trouble right now. Please try again later or visit our website."
            );
          } catch {
            // ignore send failure
          }
        }

        return new Response(JSON.stringify({ ok: true }), {
          headers: { "Content-Type": "application/json" },
        });
      }

      // Unknown event
      return new Response(JSON.stringify({ ok: true }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response("Method not allowed", { status: 405 });
  } catch (e) {
    console.error("WhatsApp webhook error:", e);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  }
});
