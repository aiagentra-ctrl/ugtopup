import { createClient } from "https://esm.sh/@supabase/supabase-js@2.76.0";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-api-key, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
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

// ── Helpers ──

function generateFlowId(): string {
  return `flow-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

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
  try { return JSON.stringify(error); } catch { return "Unknown error"; }
}

function payloadPreview(payload: unknown, maxChars = 3500): string {
  try {
    const s = JSON.stringify(payload);
    return s.length <= maxChars ? s : `${s.slice(0, maxChars)}...[truncated]`;
  } catch { return "unserializable"; }
}

function safeBool(val: unknown): boolean {
  if (typeof val === "boolean") return val;
  if (typeof val === "string") return val.toLowerCase() === "true" || val === "1";
  if (typeof val === "number") return val !== 0;
  return false;
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
  try { return raw ? JSON.parse(raw) : null; } catch { return { raw }; }
}

// ── Flow logging (3-stage telemetry) ──

async function logFlow(
  flowId: string,
  stage: "incoming_webhook" | "ai_processing" | "send_message",
  status: "received" | "processing" | "success" | "failed" | "skipped",
  phone: string,
  sessionId: string,
  requestPayload?: unknown,
  responsePayload?: unknown,
  errorMessage?: string,
) {
  try {
    const db = supabaseAdmin();
    await db.from("whatsapp_message_flows").insert({
      flow_id: flowId,
      phone_number: phone,
      session_id: sessionId,
      stage,
      status,
      request_payload: requestPayload ? JSON.parse(JSON.stringify(requestPayload)) : null,
      response_payload: responsePayload ? JSON.parse(JSON.stringify(responsePayload)) : null,
      error_message: errorMessage || null,
    });
  } catch (e) {
    console.error("logFlow error:", e);
  }
}

// ── Legacy message logging (keep for Chats/Logs tabs) ──

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

// ── Evolution API helpers ──

async function fetchEvolutionInstances(config: any): Promise<any[]> {
  if (!config?.server_url || !config?.api_key) return [];
  const res = await fetch(`${config.server_url}/instance/fetchInstances`, {
    headers: { apikey: config.api_key },
  });
  const raw = await res.text();
  const parsed = parseJsonSafely(raw);
  if (!res.ok) throw new Error(`Failed to fetch instances: ${res.status} - ${raw}`);
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
    const byName = instances.find((i: any) => String(i?.name || "").toLowerCase() === configuredLower);
    const byProfileName = instances.find((i: any) => String(i?.profileName || "").toLowerCase() === configuredLower);
    const byNumber = instances.find((i: any) => {
      const iNum = normalizePhoneValue(i?.number);
      const oNum = normalizePhoneValue(i?.ownerJid);
      return (connectedDigits && (iNum === connectedDigits || oNum === connectedDigits)) ||
             (configuredDigits && (iNum === configuredDigits || oNum === configuredDigits));
    });
    const byOpen = instances.find((i: any) => String(i?.connectionStatus || "").toLowerCase() === "open");
    const chosen = byName || byProfileName || byNumber || byOpen || instances[0];
    const resolvedName = String(chosen?.name || configured).trim();
    if (!resolvedName) return configured;
    if (resolvedName !== configured) {
      const db = supabaseAdmin();
      await db.from("whatsapp_config").update({
        instance_name: resolvedName,
        connected_number: normalizePhoneValue(chosen?.ownerJid) || normalizePhoneValue(chosen?.number) || config?.connected_number || null,
        connection_status: String(chosen?.connectionStatus || "").toLowerCase() === "open" ? "connected" : config?.connection_status || "disconnected",
        updated_at: new Date().toISOString(),
      }).eq("id", config.id);
    }
    return resolvedName;
  } catch { return configured; }
}

async function sendWhatsAppReply(config: any, phone: string, text: string, delay = 1200, preferredInstanceName?: string) {
  const sendWithInstance = async (instanceName: string) => {
    const url = `${config.server_url}/message/sendText/${encodeURIComponent(String(instanceName || "").trim())}`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: config.api_key },
      body: JSON.stringify({ number: phone, text, delay }),
    });
    const bodyText = await res.text();
    const parsed = parseJsonSafely(bodyText);
    return { res, bodyText, parsed, instanceName };
  };

  const initialName = String(preferredInstanceName || config.instance_name || "").trim();
  const first = await sendWithInstance(initialName);
  if (first.res.ok) return { status: first.res.status, data: first.parsed, instanceNameUsed: first.instanceName };

  const missing404 = first.res.status === 404 && String(first.bodyText || "").toLowerCase().includes("instance");
  if (missing404) {
    const resolved = await getResolvedInstanceName(config);
    if (resolved && resolved !== initialName) {
      const retry = await sendWithInstance(resolved);
      if (retry.res.ok) return { status: retry.res.status, data: retry.parsed, instanceNameUsed: retry.instanceName };
      throw new Error(`Evolution API error: ${retry.res.status} - ${retry.bodyText}`);
    }
  }
  throw new Error(`Evolution API error: ${first.res.status} - ${first.bodyText}`);
}

// ── AI call with timeout ──

async function callChatbotApi(sessionId: string, message: string, timeoutMs = 25000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const url = `${SUPABASE_URL}/functions/v1/chatbot-api`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({ action: "message", session_id: sessionId, message, platform: "whatsapp" }),
      signal: controller.signal,
    });
    clearTimeout(timer);
    const bodyText = await res.text();
    let parsed: any;
    try { parsed = JSON.parse(bodyText); } catch { parsed = { raw: bodyText }; }
    if (!res.ok) throw new Error(`Chatbot API error: ${res.status} - ${bodyText}`);
    return parsed;
  } catch (e: any) {
    clearTimeout(timer);
    if (e.name === "AbortError") throw new Error("AI request timed out after " + timeoutMs + "ms");
    throw e;
  }
}

// ── Message parsing ──

function normalizeEvent(event: unknown): string {
  return String(event || "").toLowerCase().replace(/[_-]/g, ".");
}

function getMessageText(obj: any): { text: string; type: string } {
  if (!obj || typeof obj !== "object") return { text: "", type: "unknown" };
  if (typeof obj.conversation === "string") return { text: obj.conversation, type: "conversation" };
  if (typeof obj.extendedTextMessage?.text === "string") return { text: obj.extendedTextMessage.text, type: "extendedTextMessage" };
  if (typeof obj.imageMessage?.caption === "string") return { text: obj.imageMessage.caption, type: "imageMessage" };
  if (typeof obj.videoMessage?.caption === "string") return { text: obj.videoMessage.caption, type: "videoMessage" };
  if (typeof obj.buttonsResponseMessage?.selectedDisplayText === "string") return { text: obj.buttonsResponseMessage.selectedDisplayText, type: "buttonsResponseMessage" };
  if (typeof obj.listResponseMessage?.title === "string") return { text: obj.listResponseMessage.title, type: "listResponseMessage" };
  if (typeof obj.templateButtonReplyMessage?.selectedDisplayText === "string") return { text: obj.templateButtonReplyMessage.selectedDisplayText, type: "templateButtonReplyMessage" };
  return { text: "", type: Object.keys(obj)[0] || "unknown" };
}

interface ParseResult {
  incoming: IncomingMessagePayload | null;
  skipReason: string | null;
}

function parseIncomingMessage(body: any): ParseResult {
  const normalized = normalizeEvent(body?.event);
  const event = normalized || "messages.upsert";

  // Extract messages array from various Evolution payload shapes
  const firstArrayMessage = Array.isArray(body?.data?.messages) ? body.data.messages[0]
    : Array.isArray(body?.data) ? body.data[0]
    : null;

  const rootData = firstArrayMessage || body?.data || {};
  const key = rootData?.key || body?.data?.key || {};
  const remoteJid = key?.remoteJid || rootData?.remoteJid || body?.data?.sender?.jid || body?.data?.sender?.id || "";

  // Safe boolean parse for fromMe
  const fromMe = safeBool(key?.fromMe ?? rootData?.fromMe ?? false);
  if (fromMe) return { incoming: null, skipReason: "ignored_from_me" };

  if (typeof remoteJid === "string" && (remoteJid.endsWith("@g.us") || remoteJid === "status@broadcast")) {
    return { incoming: null, skipReason: "ignored_group" };
  }

  let phone = "";
  if (typeof remoteJid === "string" && remoteJid) phone = remoteJid.split("@")[0] || "";
  if (!phone && body?.data?.sender?.number) phone = String(body.data.sender.number).replace(/\D/g, "");

  const messageObj = rootData?.message || body?.data?.message || {};
  const { text, type } = getMessageText(messageObj);
  const instanceName = body?.instance || body?.instanceName || body?.data?.instanceName || body?.data?.instance?.instanceName || null;

  const tsRaw = rootData?.messageTimestamp || rootData?.timestamp || body?.data?.messageTimestamp || body?.data?.timestamp || Date.now();
  const timestamp = new Date(
    typeof tsRaw === "number" && tsRaw < 1000000000000 ? tsRaw * 1000 : Number(tsRaw) || Date.now(),
  ).toISOString();

  if (!phone) return { incoming: null, skipReason: "missing_phone" };

  const incoming: IncomingMessagePayload = {
    phone,
    text: (text || "").trim(),
    messageType: type,
    timestamp,
    event,
    instanceName,
    remoteJid: String(remoteJid || ""),
  };

  if (!incoming.text) return { incoming, skipReason: "missing_text" };

  return { incoming, skipReason: null };
}

// ── Process incoming message (full pipeline) ──

async function processIncomingMessage(
  config: any,
  incoming: IncomingMessagePayload,
  body: any,
  isSimulated: boolean,
  flowId: string,
) {
  const sessionId = `wa-${incoming.phone}`;

  // Rate limit check
  if (!checkRateLimit(incoming.phone)) {
    await logFlow(flowId, "incoming_webhook", "skipped", incoming.phone, sessionId, { reason: "rate_limited", text: incoming.text });
    await logMessage(incoming.phone, "inbound", incoming.text || "(rate limited)", sessionId, "rate_limited");
    return { ok: true, skipped: "rate_limited" };
  }

  // Stage 1: Incoming webhook already logged before this function

  // Log legacy inbound
  await logMessage(incoming.phone, "inbound", incoming.text, sessionId, "received", undefined, {
    webhook_event: incoming.event, message_type: incoming.messageType, remote_jid: incoming.remoteJid,
    instance_name: incoming.instanceName || config.instance_name, simulated: isSimulated,
    flow_id: flowId,
  });

  // Stage 2: AI Processing
  let replyText: string;
  try {
    await logFlow(flowId, "ai_processing", "processing", incoming.phone, sessionId, {
      prompt: incoming.text, session_id: sessionId,
    });

    const chatResponse = await callChatbotApi(sessionId, incoming.text);
    replyText = chatResponse?.reply || chatResponse?.message || "Sorry, I could not process your request.";

    await logFlow(flowId, "ai_processing", "success", incoming.phone, sessionId,
      { prompt: incoming.text },
      { reply: replyText, raw_preview: payloadPreview(chatResponse, 2000) },
    );
  } catch (aiError) {
    const aiErrMsg = safeErrorMessage(aiError);
    await logFlow(flowId, "ai_processing", "failed", incoming.phone, sessionId,
      { prompt: incoming.text }, null, aiErrMsg,
    );

    // Try sending fallback
    replyText = "Sorry, I'm having trouble right now. Please try again later or visit our website.";
    try {
      const fallbackInstance = await getResolvedInstanceName(config);
      const fallbackRes = await sendWhatsAppReply(config, incoming.phone, replyText, 500, fallbackInstance);
      await logFlow(flowId, "send_message", "success", incoming.phone, sessionId,
        { number: incoming.phone, text: replyText, instance: fallbackRes.instanceNameUsed, fallback: true },
        { status: fallbackRes.status, data_preview: payloadPreview(fallbackRes.data, 1000) },
      );
      await logMessage(incoming.phone, "outbound", replyText, sessionId, "sent", undefined, { flow_id: flowId, fallback: true });
    } catch (fallbackErr) {
      await logFlow(flowId, "send_message", "failed", incoming.phone, sessionId,
        { number: incoming.phone, text: replyText, fallback: true }, null, safeErrorMessage(fallbackErr),
      );
      await logMessage(incoming.phone, "outbound", "", sessionId, "failed", safeErrorMessage(fallbackErr), { flow_id: flowId, fallback: true });
    }
    return { ok: true, error: aiErrMsg };
  }

  // Stage 3: Send Message
  try {
    const resolvedInstance = await getResolvedInstanceName(config);
    await logFlow(flowId, "send_message", "processing", incoming.phone, sessionId, {
      number: incoming.phone, text: replyText, instance: resolvedInstance, delay: 1200,
    });

    const sendResult = await sendWhatsAppReply(config, incoming.phone, replyText, 1200, resolvedInstance);

    await logFlow(flowId, "send_message", "success", incoming.phone, sessionId,
      { number: incoming.phone, text: replyText, instance: sendResult.instanceNameUsed },
      { status: sendResult.status, data_preview: payloadPreview(sendResult.data, 1000) },
    );

    await logMessage(incoming.phone, "outbound", replyText, sessionId, "sent", undefined, {
      flow_id: flowId, instance_name_used: sendResult.instanceNameUsed,
      provider_status: sendResult.status, provider_response_preview: payloadPreview(sendResult.data),
    });

    return { ok: true, reply: replyText };
  } catch (sendError) {
    const sendErrMsg = safeErrorMessage(sendError);
    await logFlow(flowId, "send_message", "failed", incoming.phone, sessionId,
      { number: incoming.phone, text: replyText }, null, sendErrMsg,
    );
    await logMessage(incoming.phone, "outbound", replyText, sessionId, "failed", sendErrMsg, { flow_id: flowId });
    return { ok: true, error: sendErrMsg };
  }
}

// ── Health check ──

async function getWebhookHealth(config: any) {
  const db = supabaseAdmin();
  const oneHourAgo = new Date(Date.now() - 3600000).toISOString();
  const [lastInR, lastOutR, failedR, countR] = await Promise.all([
    db.from("whatsapp_messages").select("created_at, status, metadata, phone_number").eq("direction", "inbound").order("created_at", { ascending: false }).limit(1).maybeSingle(),
    db.from("whatsapp_messages").select("created_at, status, metadata").eq("direction", "outbound").order("created_at", { ascending: false }).limit(1).maybeSingle(),
    db.from("whatsapp_messages").select("created_at, error_message, phone_number").eq("status", "failed").order("created_at", { ascending: false }).limit(10),
    db.from("whatsapp_messages").select("id", { count: "exact", head: true }).eq("direction", "inbound").gte("created_at", oneHourAgo),
  ]);
  const lastIn = lastInR.data;
  let status: "connected" | "not_receiving" | "error" | "disabled" = "not_receiving";
  if (!config?.is_enabled) status = "disabled";
  else if ((failedR.data || []).length > 0 && !lastIn) status = "error";
  else if (lastIn) {
    status = (Date.now() - new Date(lastIn.created_at).getTime()) / 60000 <= 30 ? "connected" : "not_receiving";
  }
  return {
    success: true, status, config_enabled: Boolean(config?.is_enabled),
    connection_status: config?.connection_status || "unknown",
    last_webhook_event: (lastIn?.metadata as any)?.webhook_event || null,
    last_webhook_event_received_at: lastIn?.created_at || null,
    last_message_timestamp: lastIn?.created_at || null,
    last_message_phone: lastIn?.phone_number || null,
    last_response_status: lastOutR.data?.status || null,
    inbound_last_hour: countR.count || 0,
    recent_errors: failedR.data || [],
  };
}

// ── Response helpers ──

function ok(data: any, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: corsHeaders });
}
function err(message: string, status = 400) {
  return new Response(JSON.stringify({ error: message }), { status, headers: corsHeaders });
}

// ── Extract API key from various header formats ──

function extractApiKey(req: Request, body: any): string | null {
  return req.headers.get("apikey")
    || req.headers.get("x-api-key")
    || (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "").trim()
    || body?.apikey
    || body?.data?.apikey
    || null;
}

// ── Main handler ──

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (req.method !== "POST") return err("Method not allowed", 405);

    let body: any;
    try { body = await req.json(); } catch { return err("Invalid JSON", 400); }

    // ── Admin actions ──
    if (body.admin_action) {
      const config = await getWhatsAppConfig();
      if (!config) return err("WhatsApp not configured");

      switch (body.admin_action) {
        case "test-connection": {
          try {
            const instanceName = await getResolvedInstanceName(config);
            const res = await fetch(`${config.server_url}/instance/connectionState/${encodeURIComponent(instanceName)}`, { headers: { apikey: config.api_key } });
            const raw = await res.text();
            const data = parseJsonSafely(raw);
            if (!res.ok) return err(`Evolution API error: ${res.status} - ${raw}`, 502);
            const db = supabaseAdmin();
            const state = data?.instance?.state || data?.state;
            await db.from("whatsapp_config").update({
              instance_name: instanceName,
              connection_status: state === "open" ? "connected" : "disconnected",
              updated_at: new Date().toISOString(),
            }).eq("id", config.id);
            return ok({ success: true, data, instance_name: instanceName });
          } catch (error) { return err(safeErrorMessage(error), 500); }
        }

        case "set-webhook": {
          try {
            const webhookUrl = `${SUPABASE_URL}/functions/v1/whatsapp-webhook`;
            const instanceName = await getResolvedInstanceName(config);
            const res = await fetch(`${config.server_url}/webhook/set/${encodeURIComponent(instanceName)}`, {
              method: "POST",
              headers: { "Content-Type": "application/json", apikey: config.api_key },
              body: JSON.stringify({ webhook: { enabled: true, url: webhookUrl, webhookByEvents: true, events: ["MESSAGES_UPSERT", "CONNECTION_UPDATE"] } }),
            });
            const raw = await res.text();
            const data = parseJsonSafely(raw);
            if (!res.ok) return err(`Evolution API error: ${res.status} - ${raw}`, 502);
            const db = supabaseAdmin();
            await db.from("whatsapp_config").update({ instance_name: instanceName, webhook_url: webhookUrl, updated_at: new Date().toISOString() }).eq("id", config.id);
            return ok({ success: true, data, webhook_url: webhookUrl, instance_name: instanceName });
          } catch (error) { return err(safeErrorMessage(error), 500); }
        }

        case "fetch-instance-info": {
          try {
            const res = await fetch(`${config.server_url}/instance/fetchInstances`, { headers: { apikey: config.api_key } });
            const raw = await res.text();
            if (!res.ok) return err(`Evolution API error: ${res.status} - ${raw}`, 502);
            return ok({ success: true, data: parseJsonSafely(raw) });
          } catch (error) { return err(safeErrorMessage(error), 500); }
        }

        case "send-message": {
          const { phone, message } = body;
          if (!phone || !message) return err("phone and message are required");
          try {
            const resolved = await getResolvedInstanceName(config);
            const result = await sendWhatsAppReply(config, String(phone), String(message), 600, resolved);
            await logMessage(String(phone), "outbound", String(message), `wa-${phone}`, "sent", undefined, {
              manual: true, instance_name_used: result.instanceNameUsed, provider_status: result.status,
            });
            return ok({ success: true });
          } catch (error) { return err(safeErrorMessage(error), 500); }
        }

        case "test-webhook": {
          const phone = String(body.phone || config.connected_number || "").replace(/\D/g, "");
          const message = String(body.message || "Hello from webhook test").trim();
          if (!phone) return err("Phone number is required for webhook test", 400);

          const flowId = generateFlowId();
          const simulatedIncoming: IncomingMessagePayload = {
            phone, text: message, messageType: "conversation",
            timestamp: new Date().toISOString(), event: "messages.upsert",
            instanceName: config.instance_name, remoteJid: `${phone}@s.whatsapp.net`,
          };

          const simulatedBody = {
            event: "MESSAGES_UPSERT",
            data: { key: { fromMe: false, remoteJid: `${phone}@s.whatsapp.net` }, message: { conversation: message } },
            simulated: true,
          };

          // Log incoming stage
          await logFlow(flowId, "incoming_webhook", "received", phone, `wa-${phone}`, {
            raw_payload: payloadPreview(simulatedBody), event: "MESSAGES_UPSERT", simulated: true,
          });

          const result = await processIncomingMessage(config, simulatedIncoming, simulatedBody, true, flowId);
          return ok({ success: true, result, flow_id: flowId });
        }

        case "health-check": {
          try { return ok(await getWebhookHealth(config)); }
          catch (error) { return err(safeErrorMessage(error), 500); }
        }

        default:
          return err("Unknown admin action");
      }
    }

    // ── Webhook events from Evolution API ──
    const flowId = generateFlowId();
    const config = await getWhatsAppConfig();

    if (!config) {
      await logFlow(flowId, "incoming_webhook", "skipped", "", "", { reason: "missing_config", raw: payloadPreview(body) });
      return ok({ ok: true, skipped: "missing_config" });
    }

    // Flexible API key validation
    const incomingApiKey = extractApiKey(req, body);
    if (incomingApiKey && incomingApiKey !== config.api_key && incomingApiKey !== SUPABASE_ANON_KEY) {
      await logFlow(flowId, "incoming_webhook", "failed", "", "", {
        reason: "api_key_mismatch", key_preview: String(incomingApiKey).slice(0, 8),
        raw: payloadPreview(body),
      }, null, "API key mismatch");
      return err("Invalid webhook signature", 401);
    }

    const normalizedEvent = normalizeEvent(body.event);

    // Handle connection updates
    if (normalizedEvent === "connection.update") {
      const db = supabaseAdmin();
      const state = body?.data?.state || body?.data?.status;
      if (state === "open") {
        const jid = body?.data?.instance?.wuid || body?.data?.wuid || "";
        const number = typeof jid === "string" ? jid.split("@")[0] || "" : "";
        await db.from("whatsapp_config").update({
          instance_name: String(body.instance || config.instance_name || "").trim() || config.instance_name,
          connection_status: "connected",
          connected_number: number || config.connected_number,
          updated_at: new Date().toISOString(),
        }).eq("id", config.id);
      } else if (state === "close") {
        await db.from("whatsapp_config").update({
          instance_name: String(body.instance || config.instance_name || "").trim() || config.instance_name,
          connection_status: "disconnected",
          updated_at: new Date().toISOString(),
        }).eq("id", config.id);
      }
      await logFlow(flowId, "incoming_webhook", "success", "", "", { event: "connection.update", state });
      return ok({ ok: true });
    }

    // Parse message
    const { incoming, skipReason } = parseIncomingMessage(body);

    // Always log the incoming stage regardless of parse outcome
    const phone = incoming?.phone || "";
    const sessionId = phone ? `wa-${phone}` : `wa-webhook-${Date.now()}`;

    await logFlow(flowId, "incoming_webhook", incoming && !skipReason ? "received" : "skipped", phone, sessionId, {
      raw_payload: payloadPreview(body, 4000),
      event: normalizedEvent,
      skip_reason: skipReason || null,
      phone_parsed: phone,
      text_parsed: incoming?.text || null,
    });

    if (!incoming || skipReason === "ignored_from_me" || skipReason === "ignored_group" || skipReason === "missing_phone") {
      if (skipReason) {
        await logMessage("webhook", "inbound", `(${skipReason})`, sessionId, skipReason, undefined, {
          webhook_event: normalizedEvent, raw_payload_preview: payloadPreview(body),
        });
      }
      return ok({ ok: true, skipped: skipReason || "ignored_event" });
    }

    if (skipReason === "missing_text") {
      await logMessage(incoming.phone, "inbound", "(no text)", sessionId, "ignored_no_text", undefined, {
        webhook_event: incoming.event, message_type: incoming.messageType,
      });
      await logFlow(flowId, "ai_processing", "skipped", phone, sessionId, { reason: "no_text" });
      await logFlow(flowId, "send_message", "skipped", phone, sessionId, { reason: "no_text" });
      return ok({ ok: true, skipped: "no_text" });
    }

    if (!config.is_enabled) {
      await logMessage(incoming.phone, "inbound", incoming.text || "(disabled)", sessionId, "ignored_disabled", undefined, {
        webhook_event: incoming.event, message_type: incoming.messageType,
      });
      await logFlow(flowId, "ai_processing", "skipped", phone, sessionId, { reason: "bot_disabled" });
      await logFlow(flowId, "send_message", "skipped", phone, sessionId, { reason: "bot_disabled" });
      return ok({ ok: true, skipped: "disabled" });
    }

    const processed = await processIncomingMessage(config, incoming, body, false, flowId);
    return ok(processed);
  } catch (error) {
    console.error("WhatsApp webhook error:", error);
    return err("Internal error", 500);
  }
});
