import { createClient } from "https://esm.sh/@supabase/supabase-js@2.76.0";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Content-Type": "application/json",
};

type IncomingMessagePayload = {
  phone: string;
  text: string;
  messageType: string;
  timestamp: string;
  event: string;
  instanceName: string | null;
  remoteJid: string;
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

function safeErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  try {
    return JSON.stringify(error);
  } catch {
    return "Unknown error";
  }
}

function payloadPreview(payload: unknown, maxChars = 3500): string {
  try {
    const serialized = JSON.stringify(payload);
    if (serialized.length <= maxChars) return serialized;
    return `${serialized.slice(0, maxChars)}...[truncated]`;
  } catch {
    return "unserializable payload";
  }
}

async function getWhatsAppConfig() {
  const db = supabaseAdmin();
  const { data, error } = await db.from("whatsapp_config").select("*").limit(1).single();
  if (error || !data) return null;
  return data;
}

function normalizePhoneValue(value: unknown): string {
  const raw = String(value || "");
  const numberPart = raw.includes("@") ? raw.split("@")[0] : raw;
  return numberPart.replace(/\D/g, "");
}

function parseJsonSafely(raw: string): any {
  try {
    return raw ? JSON.parse(raw) : null;
  } catch {
    return { raw };
  }
}

async function fetchEvolutionInstances(config: any): Promise<any[]> {
  if (!config?.server_url || !config?.api_key) return [];

  const res = await fetch(`${config.server_url}/instance/fetchInstances`, {
    headers: { apikey: config.api_key },
  });

  const raw = await res.text();
  const parsed = parseJsonSafely(raw);

  if (!res.ok) {
    throw new Error(`Failed to fetch instances: ${res.status} - ${raw}`);
  }

  if (Array.isArray(parsed)) return parsed;
  if (Array.isArray(parsed?.data)) return parsed.data;
  return [];
}

async function getResolvedInstanceName(config: any): Promise<string> {
  const configured = String(config?.instance_name || "").trim();
  if (!configured && !config?.server_url) return configured;

  try {
    const instances = await fetchEvolutionInstances(config);
    if (!instances.length) return configured;

    const configuredLower = configured.toLowerCase();
    const configuredDigits = normalizePhoneValue(configured);
    const connectedDigits = normalizePhoneValue(config?.connected_number);

    const byName = instances.find((instance: any) =>
      String(instance?.name || "").toLowerCase() === configuredLower,
    );

    const byProfileName = instances.find((instance: any) =>
      String(instance?.profileName || "").toLowerCase() === configuredLower,
    );

    const byNumber = instances.find((instance: any) => {
      const instanceNumber = normalizePhoneValue(instance?.number);
      const ownerNumber = normalizePhoneValue(instance?.ownerJid);
      if (connectedDigits && (instanceNumber === connectedDigits || ownerNumber === connectedDigits)) {
        return true;
      }
      if (configuredDigits && (instanceNumber === configuredDigits || ownerNumber === configuredDigits)) {
        return true;
      }
      return false;
    });

    const byOpenState = instances.find((instance: any) =>
      String(instance?.connectionStatus || "").toLowerCase() === "open",
    );

    const chosen = byName || byProfileName || byNumber || byOpenState || instances[0];
    const resolvedName = String(chosen?.name || configured).trim();

    if (!resolvedName) return configured;

    if (resolvedName !== configured) {
      const db = supabaseAdmin();
      await db
        .from("whatsapp_config")
        .update({
          instance_name: resolvedName,
          connected_number:
            normalizePhoneValue(chosen?.ownerJid) ||
            normalizePhoneValue(chosen?.number) ||
            config?.connected_number ||
            null,
          connection_status:
            String(chosen?.connectionStatus || "").toLowerCase() === "open"
              ? "connected"
              : config?.connection_status || "disconnected",
          updated_at: new Date().toISOString(),
        })
        .eq("id", config.id);
    }

    return resolvedName;
  } catch {
    return configured;
  }
}

async function logMessage(
  phoneNumber: string,
  direction: "inbound" | "outbound",
  message: string,
  sessionId: string,
  status = "sent",
  errorMessage?: string,
  metadata?: Record<string, unknown>,
) {
  const db = supabaseAdmin();
  await db.from("whatsapp_messages").insert({
    phone_number: phoneNumber,
    direction,
    message: (message || "").substring(0, 5000),
    session_id: sessionId,
    status,
    error_message: errorMessage,
    metadata: metadata || {},
  });
}

async function sendWhatsAppReply(
  config: any,
  phone: string,
  text: string,
  delay = 1200,
  preferredInstanceName?: string,
) {
  const sendWithInstance = async (instanceName: string) => {
    const encodedInstanceName = encodeURIComponent(String(instanceName || "").trim());
    const url = `${config.server_url}/message/sendText/${encodedInstanceName}`;

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: config.api_key,
      },
      body: JSON.stringify({
        number: phone,
        text,
        delay,
      }),
    });

    const bodyText = await res.text();
    const parsed = parseJsonSafely(bodyText);
    return { res, bodyText, parsed, instanceName };
  };

  const initialInstanceName = String(preferredInstanceName || config.instance_name || "").trim();
  const firstAttempt = await sendWithInstance(initialInstanceName);

  if (firstAttempt.res.ok) {
    return {
      status: firstAttempt.res.status,
      data: firstAttempt.parsed,
      instanceNameUsed: firstAttempt.instanceName,
    };
  }

  const looksLikeMissingInstance =
    firstAttempt.res.status === 404 &&
    String(firstAttempt.bodyText || "").toLowerCase().includes("instance") &&
    String(firstAttempt.bodyText || "").toLowerCase().includes("does not exist");

  if (looksLikeMissingInstance) {
    const resolvedInstanceName = await getResolvedInstanceName(config);
    if (resolvedInstanceName && resolvedInstanceName !== initialInstanceName) {
      const retryAttempt = await sendWithInstance(resolvedInstanceName);
      if (retryAttempt.res.ok) {
        return {
          status: retryAttempt.res.status,
          data: retryAttempt.parsed,
          instanceNameUsed: retryAttempt.instanceName,
        };
      }
      throw new Error(`Evolution API error: ${retryAttempt.res.status} - ${retryAttempt.bodyText}`);
    }
  }

  throw new Error(`Evolution API error: ${firstAttempt.res.status} - ${firstAttempt.bodyText}`);
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
      message,
      platform: "whatsapp",
    }),
  });

  const bodyText = await res.text();
  let parsed: any = null;
  try {
    parsed = bodyText ? JSON.parse(bodyText) : null;
  } catch {
    parsed = { raw: bodyText };
  }

  if (!res.ok) {
    throw new Error(`Chatbot API error: ${res.status} - ${bodyText}`);
  }

  return parsed;
}

function ok(data: any, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: corsHeaders });
}

function err(message: string, status = 400) {
  return new Response(JSON.stringify({ error: message }), { status, headers: corsHeaders });
}

function normalizeEvent(event: unknown): string {
  return String(event || "").toLowerCase().replace(/[_-]/g, ".");
}

function getMessageText(messageObj: any): { text: string; type: string } {
  if (!messageObj || typeof messageObj !== "object") {
    return { text: "", type: "unknown" };
  }

  if (typeof messageObj.conversation === "string") {
    return { text: messageObj.conversation, type: "conversation" };
  }

  if (typeof messageObj.extendedTextMessage?.text === "string") {
    return { text: messageObj.extendedTextMessage.text, type: "extendedTextMessage" };
  }

  if (typeof messageObj.imageMessage?.caption === "string") {
    return { text: messageObj.imageMessage.caption, type: "imageMessage" };
  }

  if (typeof messageObj.videoMessage?.caption === "string") {
    return { text: messageObj.videoMessage.caption, type: "videoMessage" };
  }

  if (typeof messageObj.buttonsResponseMessage?.selectedDisplayText === "string") {
    return {
      text: messageObj.buttonsResponseMessage.selectedDisplayText,
      type: "buttonsResponseMessage",
    };
  }

  if (typeof messageObj.listResponseMessage?.title === "string") {
    return { text: messageObj.listResponseMessage.title, type: "listResponseMessage" };
  }

  if (typeof messageObj.templateButtonReplyMessage?.selectedDisplayText === "string") {
    return {
      text: messageObj.templateButtonReplyMessage.selectedDisplayText,
      type: "templateButtonReplyMessage",
    };
  }

  const firstKey = Object.keys(messageObj)[0] || "unknown";
  return { text: "", type: firstKey };
}

function parseIncomingMessage(body: any): IncomingMessagePayload | null {
  const normalized = normalizeEvent(body?.event);
  const event = normalized || "messages.upsert";

  const firstArrayMessage = Array.isArray(body?.data?.messages)
    ? body.data.messages[0]
    : null;

  const rootData = firstArrayMessage || body?.data || {};
  const key = rootData?.key || body?.data?.key || {};
  const remoteJid =
    key?.remoteJid ||
    rootData?.remoteJid ||
    body?.data?.sender?.jid ||
    body?.data?.sender?.id ||
    "";

  const fromMe = Boolean(key?.fromMe ?? rootData?.fromMe ?? false);
  if (fromMe) return null;

  if (typeof remoteJid === "string" && (remoteJid.endsWith("@g.us") || remoteJid === "status@broadcast")) {
    return null;
  }

  let phone = "";
  if (typeof remoteJid === "string" && remoteJid) {
    phone = remoteJid.split("@")[0] || "";
  }

  if (!phone && body?.data?.sender?.number) {
    phone = String(body.data.sender.number).replace(/\D/g, "");
  }

  const messageObj = rootData?.message || body?.data?.message || {};
  const { text, type } = getMessageText(messageObj);
  const instanceName =
    body?.instance ||
    body?.instanceName ||
    body?.data?.instanceName ||
    body?.data?.instance?.instanceName ||
    null;

  const timestampRaw =
    rootData?.messageTimestamp ||
    rootData?.timestamp ||
    body?.data?.messageTimestamp ||
    body?.data?.timestamp ||
    Date.now();

  const timestamp = new Date(
    typeof timestampRaw === "number" && timestampRaw < 1000000000000
      ? timestampRaw * 1000
      : Number(timestampRaw) || Date.now(),
  ).toISOString();

  if (!phone) return null;

  return {
    phone,
    text: (text || "").trim(),
    messageType: type,
    timestamp,
    event,
    instanceName,
    remoteJid: String(remoteJid || ""),
  };
}

async function processIncomingMessage(
  config: any,
  incoming: IncomingMessagePayload,
  body: any,
  isSimulated = false,
) {
  const sessionId = `wa-${incoming.phone}`;

  if (!checkRateLimit(incoming.phone)) {
    await logMessage(
      incoming.phone,
      "inbound",
      incoming.text || "(rate limited)",
      sessionId,
      "rate_limited",
      undefined,
      {
        webhook_event: incoming.event,
        message_type: incoming.messageType,
        instance_name: incoming.instanceName || config.instance_name,
        simulated: isSimulated,
      },
    );
    return { ok: true, skipped: "rate_limited" };
  }

  await logMessage(
    incoming.phone,
    "inbound",
    incoming.text || "(no text)",
    sessionId,
    incoming.text ? "received" : "ignored_no_text",
    undefined,
    {
      webhook_event: incoming.event,
      message_type: incoming.messageType,
      remote_jid: incoming.remoteJid,
      instance_name: incoming.instanceName || config.instance_name,
      webhook_timestamp: incoming.timestamp,
      simulated: isSimulated,
      raw_payload_preview: payloadPreview(body),
    },
  );

  if (!incoming.text) {
    return { ok: true, skipped: "no_text" };
  }

  try {
    const chatResponse = await callChatbotApi(sessionId, incoming.text);
    const replyText =
      chatResponse?.reply ||
      chatResponse?.message ||
      "Sorry, I could not process your request.";

    const resolvedInstanceName = await getResolvedInstanceName(config);
    const evolutionResponse = await sendWhatsAppReply(
      config,
      incoming.phone,
      replyText,
      1200,
      resolvedInstanceName,
    );

    await logMessage(incoming.phone, "outbound", replyText, sessionId, "sent", undefined, {
      webhook_event: incoming.event,
      provider: "evolution",
      stage: "send_message",
      ai_input_preview: payloadPreview(incoming.text, 1200),
      ai_reply_preview: payloadPreview(replyText, 1200),
      ai_response_preview: payloadPreview(chatResponse),
      instance_name_used: evolutionResponse.instanceNameUsed,
      provider_status: evolutionResponse.status,
      provider_response_preview: payloadPreview(evolutionResponse.data),
      simulated: isSimulated,
    });

    return { ok: true, reply: replyText };
  } catch (error) {
    const errorMessage = safeErrorMessage(error);
    await logMessage(incoming.phone, "outbound", "", sessionId, "failed", errorMessage, {
      webhook_event: incoming.event,
      stage: "ai_or_send",
      ai_input_preview: payloadPreview(incoming.text, 1200),
      simulated: isSimulated,
    });

    try {
      const fallback = "Sorry, I'm having trouble right now. Please try again later or visit our website.";
      const fallbackInstanceName = await getResolvedInstanceName(config);
      const fallbackRes = await sendWhatsAppReply(
        config,
        incoming.phone,
        fallback,
        500,
        fallbackInstanceName,
      );
      await logMessage(incoming.phone, "outbound", fallback, sessionId, "sent", undefined, {
        provider: "evolution",
        stage: "fallback_send",
        provider_status: fallbackRes.status,
        provider_response_preview: payloadPreview(fallbackRes.data),
        instance_name_used: fallbackRes.instanceNameUsed,
        fallback: true,
        simulated: isSimulated,
      });
    } catch (fallbackError) {
      await logMessage(
        incoming.phone,
        "outbound",
        "",
        sessionId,
        "failed",
        safeErrorMessage(fallbackError),
        {
          stage: "fallback_send",
          ai_input_preview: payloadPreview(incoming.text, 1200),
          simulated: isSimulated,
        },
      );
    }

    return { ok: true, error: errorMessage };
  }
}

async function getWebhookHealth(config: any) {
  const db = supabaseAdmin();
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

  const [lastInboundRes, lastOutboundRes, failedRes, inboundLastHourRes] = await Promise.all([
    db
      .from("whatsapp_messages")
      .select("created_at, status, metadata, phone_number")
      .eq("direction", "inbound")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    db
      .from("whatsapp_messages")
      .select("created_at, status, metadata")
      .eq("direction", "outbound")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    db
      .from("whatsapp_messages")
      .select("created_at, error_message, phone_number", { head: false })
      .eq("status", "failed")
      .order("created_at", { ascending: false })
      .limit(10),
    db
      .from("whatsapp_messages")
      .select("id", { count: "exact", head: true })
      .eq("direction", "inbound")
      .gte("created_at", oneHourAgo),
  ]);

  const lastInbound = lastInboundRes.data;
  const lastOutbound = lastOutboundRes.data;
  const failedMessages = failedRes.data || [];
  const inboundLastHour = inboundLastHourRes.count || 0;

  let status: "connected" | "not_receiving" | "error" | "disabled" = "not_receiving";

  if (!config?.is_enabled) {
    status = "disabled";
  } else if (failedMessages.length > 0 && !lastInbound) {
    status = "error";
  } else if (lastInbound) {
    const minutesSinceInbound =
      (Date.now() - new Date(lastInbound.created_at).getTime()) / 60000;
    status = minutesSinceInbound <= 30 ? "connected" : "not_receiving";
  }

  return {
    success: true,
    status,
    config_enabled: Boolean(config?.is_enabled),
    connection_status: config?.connection_status || "unknown",
    last_webhook_event: (lastInbound?.metadata as any)?.webhook_event || null,
    last_webhook_event_received_at: lastInbound?.created_at || null,
    last_message_timestamp: lastInbound?.created_at || null,
    last_message_phone: lastInbound?.phone_number || null,
    last_response_status: lastOutbound?.status || null,
    inbound_last_hour: inboundLastHour,
    recent_errors: failedMessages,
  };
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
              { headers: { apikey: config.api_key } },
            );
            const data = await res.json();

            const db = supabaseAdmin();
            const state = data?.instance?.state || data?.state;
            await db
              .from("whatsapp_config")
              .update({
                connection_status: state === "open" ? "connected" : "disconnected",
                updated_at: new Date().toISOString(),
              })
              .eq("id", config.id);

            return ok({ success: true, data });
          } catch (error) {
            return err(safeErrorMessage(error), 500);
          }
        }

        case "get-qr": {
          // QR system removed - webhook-only integration
          return ok({ success: false, error: "QR system has been removed. This is a webhook-only integration." });
        }

        case "disconnect": {
          try {
            await fetch(`${config.server_url}/instance/logout/${config.instance_name}`, {
              method: "DELETE",
              headers: { apikey: config.api_key },
            });

            const db = supabaseAdmin();
            await db
              .from("whatsapp_config")
              .update({
                connection_status: "disconnected",
                connected_number: null,
                updated_at: new Date().toISOString(),
              })
              .eq("id", config.id);

            return ok({ success: true });
          } catch (error) {
            return err(safeErrorMessage(error), 500);
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

            const db = supabaseAdmin();
            await db
              .from("whatsapp_config")
              .update({
                webhook_url: webhookUrl,
                updated_at: new Date().toISOString(),
              })
              .eq("id", config.id);

            return ok({ success: true, data, webhook_url: webhookUrl });
          } catch (error) {
            return err(safeErrorMessage(error), 500);
          }
        }

        case "fetch-instance-info": {
          try {
            const res = await fetch(`${config.server_url}/instance/fetchInstances`, {
              headers: { apikey: config.api_key },
            });
            const data = await res.json();
            return ok({ success: true, data });
          } catch (error) {
            return err(safeErrorMessage(error), 500);
          }
        }

        case "send-message": {
          const { phone, message } = body;
          if (!phone || !message) return err("phone and message are required");

          try {
            const sendResult = await sendWhatsAppReply(config, String(phone), String(message), 600);
            const sessionId = `wa-${phone}`;
            await logMessage(String(phone), "outbound", String(message), sessionId, "sent", undefined, {
              manual: true,
              provider_status: sendResult.status,
              provider_response_preview: payloadPreview(sendResult.data),
            });
            return ok({ success: true });
          } catch (error) {
            return err(safeErrorMessage(error), 500);
          }
        }

        case "test-webhook": {
          const phone = String(body.phone || config.connected_number || "").replace(/\D/g, "");
          const message = String(body.message || "Hello from webhook test").trim();

          if (!phone) {
            return err("Phone number is required for webhook test", 400);
          }

          const simulatedIncoming: IncomingMessagePayload = {
            phone,
            text: message,
            messageType: "conversation",
            timestamp: new Date().toISOString(),
            event: "messages.upsert",
            instanceName: config.instance_name,
            remoteJid: `${phone}@s.whatsapp.net`,
          };

          const result = await processIncomingMessage(
            config,
            simulatedIncoming,
            {
              event: "MESSAGES_UPSERT",
              data: {
                key: { fromMe: false, remoteJid: `${phone}@s.whatsapp.net` },
                message: { conversation: message },
              },
              simulated: true,
            },
            true,
          );

          return ok({ success: true, result });
        }

        case "health-check": {
          try {
            const health = await getWebhookHealth(config);
            return ok(health);
          } catch (error) {
            return err(safeErrorMessage(error), 500);
          }
        }

        default:
          return err("Unknown admin action");
      }
    }

    // ── Webhook events from Evolution API ──
    const config = await getWhatsAppConfig();
    if (!config) return ok({ ok: true, skipped: "missing_config" });

    // Optional signature check (if Evolution sends apikey header/body)
    const incomingApiKey = req.headers.get("apikey") || body?.apikey || body?.data?.apikey;
    if (incomingApiKey && incomingApiKey !== config.api_key) {
      return err("Invalid webhook signature", 401);
    }

    const normalizedEvent = normalizeEvent(body.event);

    if (normalizedEvent === "connection.update") {
      const db = supabaseAdmin();
      const state = body?.data?.state || body?.data?.status;

      if (state === "open") {
        const jid = body?.data?.instance?.wuid || body?.data?.wuid || "";
        const number = typeof jid === "string" ? jid.split("@")[0] || "" : "";

        await db
          .from("whatsapp_config")
          .update({
            connection_status: "connected",
            connected_number: number || config.connected_number,
            updated_at: new Date().toISOString(),
          })
          .eq("instance_name", body.instance || config.instance_name);
      } else if (state === "close") {
        await db
          .from("whatsapp_config")
          .update({
            connection_status: "disconnected",
            updated_at: new Date().toISOString(),
          })
          .eq("instance_name", body.instance || config.instance_name);
      }

      return ok({ ok: true });
    }

    const incoming = parseIncomingMessage(body);

    if (!incoming) {
      return ok({ ok: true, skipped: "ignored_event_or_message" });
    }

    if (!config.is_enabled) {
      await logMessage(
        incoming.phone,
        "inbound",
        incoming.text || "(disabled)",
        `wa-${incoming.phone}`,
        "ignored_disabled",
        undefined,
        {
          webhook_event: incoming.event,
          message_type: incoming.messageType,
          raw_payload_preview: payloadPreview(body),
        },
      );
      return ok({ ok: true, skipped: "disabled" });
    }

    const processed = await processIncomingMessage(config, incoming, body, false);
    return ok(processed);
  } catch (error) {
    console.error("WhatsApp webhook error:", error);
    return err("Internal error", 500);
  }
});
