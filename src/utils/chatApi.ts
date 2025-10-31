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

const WEBHOOK_URL = 'https://n8n.aiagentra.com/webhook/chatbot';
const SESSION_KEY = 'uiq-chat-session';
const REQUEST_TIMEOUT = 30000; // 30 seconds

// Generate or retrieve session ID
function getSessionId(): string {
  let session = localStorage.getItem(SESSION_KEY);
  if (!session) {
    session = `uiq-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem(SESSION_KEY, session);
  }
  return session;
}

export const sendMessageToWebhook = async (
  message: string
): Promise<WebhookResponse> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

  try {
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
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

    const data = await response.json();
    return {
      reply: data.reply || data.message || data.answer || 'No response received',
      timestamp: data.timestamp || new Date().toISOString()
    };
  } catch (error: any) {
    clearTimeout(timeoutId);
    
    if (error.name === 'AbortError') {
      throw new Error('Request timeout. AI is taking too long to respond.');
    }
    
    throw new Error(error.message || 'Failed to connect to AI service');
  }
};
