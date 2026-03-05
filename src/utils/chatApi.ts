export interface WebhookPayload {
  message: string;
  timestamp: string;
  sessionId: string;
  source: string;
}

export interface WebhookResponse {
  reply: string;
  timestamp: string;
  error?: string;
}

const SESSION_KEY = 'uiq-chat-session';
const REQUEST_TIMEOUT = 30000;

function getSessionId(): string {
  let session = localStorage.getItem(SESSION_KEY);
  if (!session) {
    session = `uiq-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem(SESSION_KEY, session);
  }
  return session;
}

export const sendMessageToWebhook = async (
  message: string,
  webhookUrl: string
): Promise<WebhookResponse> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json, text/plain;q=0.9, */*;q=0.8'
      },
      body: JSON.stringify({
        message: message.trim(),
        timestamp: new Date().toISOString(),
        sessionId: getSessionId(),
        source: 'UGC-Topup Website'
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Webhook error: ${response.status}`);
    }

    const raw = await response.text();
    try {
      const data = JSON.parse(raw);
      return {
        reply: data.reply ?? data.message ?? data.answer ?? 'No response received',
        timestamp: data.timestamp ?? new Date().toISOString()
      };
    } catch {
      return {
        reply: raw?.trim() || 'No response received',
        timestamp: new Date().toISOString()
      };
    }
  } catch (error: any) {
    clearTimeout(timeoutId);
    
    if (error.name === 'AbortError') {
      throw new Error('Request timeout. AI is taking too long to respond.');
    }
    
    throw new Error(error.message || 'Failed to connect to AI service');
  }
};
