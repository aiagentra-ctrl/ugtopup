import { ProductCardData } from '@/components/chat/ProductCardBubble';

export interface ChatApiResponse {
  reply: string;
  timestamp: string;
  product?: ProductCardData;
  products?: ProductCardData[];
  error?: boolean;
}

export interface OrderStatusResponse {
  orders: {
    order_number: string;
    product: string;
    package: string;
    status: string;
    price: number;
    created_at: string;
    confirmed_at: string | null;
    completed_at: string | null;
    canceled_at: string | null;
    cancellation_reason: string | null;
  }[];
  message?: string;
  timestamp?: string;
}

export interface CreditRequestResponse {
  success?: boolean;
  message: string;
  request_id?: string;
  error?: string;
  timestamp?: string;
}

export interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
}

const EDGE_FUNCTION_URL = `https://iwcqutzgtpbdowghalnl.supabase.co/functions/v1/chatbot-api`;
const REQUEST_TIMEOUT = 30000;
const SESSION_KEY = 'uiq-chat-session';
const API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml3Y3F1dHpndHBiZG93Z2hhbG5sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEwMDkxNDYsImV4cCI6MjA3NjU4NTE0Nn0.f_NA471WGd5doUunIq39i3kh1NXYA70g1vVwTJU70P4';

function getSessionId(): string {
  let session = localStorage.getItem(SESSION_KEY);
  if (!session) {
    session = `uiq-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem(SESSION_KEY, session);
  }
  return session;
}

export const sendChatMessage = async (
  message: string,
  history?: ConversationMessage[]
): Promise<ChatApiResponse> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

  try {
    const response = await fetch(EDGE_FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': API_KEY,
      },
      body: JSON.stringify({
        action: 'message',
        message: message.trim(),
        session_id: getSessionId(),
        history: history || [],
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    return await response.json();
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('Request timeout. AI is taking too long to respond.');
    }
    throw new Error(error.message || 'Failed to connect to AI service');
  }
};

export const getOrderStatus = async (orderId: string): Promise<OrderStatusResponse> => {
  const response = await fetch(EDGE_FUNCTION_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': API_KEY,
    },
    body: JSON.stringify({
      action: 'order-status',
      order_id: orderId.trim(),
    }),
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }

  return await response.json();
};

export const submitCreditRequest = async (data: {
  name: string;
  email: string;
  whatsapp: string;
  amount: string;
  screenshot_url?: string;
}): Promise<CreditRequestResponse> => {
  const response = await fetch(EDGE_FUNCTION_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': API_KEY,
    },
    body: JSON.stringify({
      action: 'credit-request',
      ...data,
    }),
  });

  return await response.json();
};

// Feedback submission
export const submitChatFeedback = async (data: {
  message_id: string;
  session_id: string;
  user_message?: string;
  bot_response?: string;
  rating: 'helpful' | 'not_helpful';
  comment?: string;
}): Promise<{ success: boolean; message: string }> => {
  try {
    const response = await fetch(EDGE_FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': API_KEY,
      },
      body: JSON.stringify({
        action: 'submit-feedback',
        ...data,
      }),
    });
    return await response.json();
  } catch {
    return { success: false, message: 'Failed to submit feedback' };
  }
};

export { getSessionId };

// Keep backward compat export
export const sendMessageToWebhook = async (
  message: string,
  _webhookUrl: string
): Promise<{ reply: string; timestamp: string }> => {
  const result = await sendChatMessage(message);
  return { reply: result.reply, timestamp: result.timestamp };
};
