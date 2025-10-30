import { useState, useCallback, useRef, useEffect } from 'react';

export interface ChatMessage {
  id: string;
  content: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  quickReplies?: string[];
}

interface ChatState {
  messages: ChatMessage[];
  isOpen: boolean;
  isMinimized: boolean;
  isLoading: boolean;
  sessionId: string;
  conversationId: string;
}

const STORAGE_KEY = 'ugc-chat-session';
const MINIMIZED_KEY = 'ugc-chat-minimized';
const WEBHOOK_URL = 'https://n8n.aiagentra.com/webhook/chatbot';
const WEBHOOK_TIMEOUT = 30000; // 30 seconds

// Generate UUID for conversation
const generateUUID = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

// Generate unique session ID
const generateSessionId = (): string => {
  const timestamp = Date.now();
  const randomStr = Math.random().toString(36).substring(2, 9);
  return `ugc-${timestamp}-${randomStr}`;
};

// Get or create session ID from localStorage
const getSessionId = (): string => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    try {
      const data = JSON.parse(stored);
      if (data.sessionId && data.timestamp) {
        // Session valid for 24 hours
        const age = Date.now() - data.timestamp;
        if (age < 24 * 60 * 60 * 1000) {
          return data.sessionId;
        }
      }
    } catch (e) {
      console.error('Error parsing session:', e);
    }
  }
  
  const newSessionId = generateSessionId();
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    sessionId: newSessionId,
    timestamp: Date.now()
  }));
  return newSessionId;
};

export const useChatBot = () => {
  const [state, setState] = useState<ChatState>({
    messages: [],
    isOpen: false,
    isMinimized: false,
    isLoading: false,
    sessionId: '',
    conversationId: ''
  });
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const hasShownWelcome = useRef(false);

  // Initialize minimized state from localStorage
  useEffect(() => {
    const minimized = localStorage.getItem(MINIMIZED_KEY) === 'true';
    if (minimized) {
      setState(prev => ({ ...prev, isMinimized: true }));
    }
  }, []);

  // Initialize session and show welcome message
  useEffect(() => {
    if (state.isOpen && !state.isMinimized && !hasShownWelcome.current && state.messages.length === 0) {
      const sessionId = getSessionId();
      const conversationId = generateUUID();
      setState(prev => ({ ...prev, sessionId, conversationId }));
      
      // Add welcome message with quick replies
      const welcomeMessage: ChatMessage = {
        id: 'welcome-' + Date.now(),
        content: 'Hi! Welcome to UGC-Topup. How can I help you today? 🎮',
        sender: 'bot',
        timestamp: new Date(),
        quickReplies: ['Check order status', 'Browse products', 'Talk to support']
      };
      
      setState(prev => ({
        ...prev,
        messages: [welcomeMessage]
      }));
      
      hasShownWelcome.current = true;
    }
  }, [state.isOpen, state.isMinimized, state.messages.length]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [state.messages]);

  const toggleChat = useCallback(() => {
    setState(prev => {
      const newIsOpen = !prev.isOpen;
      if (newIsOpen && prev.isMinimized) {
        localStorage.setItem(MINIMIZED_KEY, 'false');
        return { ...prev, isOpen: true, isMinimized: false };
      }
      return { ...prev, isOpen: newIsOpen };
    });
  }, []);

  const closeChat = useCallback(() => {
    setState(prev => ({ ...prev, isOpen: false }));
  }, []);

  const minimizeChat = useCallback(() => {
    setState(prev => ({ ...prev, isMinimized: true }));
    localStorage.setItem(MINIMIZED_KEY, 'true');
  }, []);

  const sendMessage = useCallback(async (content: string) => {
    const trimmedContent = content.trim();
    if (!trimmedContent || state.isLoading) return;

    // Add user message immediately
    const userMessage: ChatMessage = {
      id: 'user-' + Date.now(),
      content: trimmedContent,
      sender: 'user',
      timestamp: new Date()
    };

    setState(prev => ({
      ...prev,
      messages: [...prev.messages, userMessage],
      isLoading: true
    }));

    try {
      // Prepare enhanced webhook payload
      const payload = {
        conversation_id: state.conversationId || generateUUID(),
        user_id: `guest-${state.sessionId}`,
        message: trimmedContent,
        metadata: {
          page_url: window.location.href,
          timestamp: new Date().toISOString(),
          user_agent: navigator.userAgent,
          source: 'UGC-Topup Website'
        }
      };

      console.log('📤 Sending message to webhook:', {
        url: WEBHOOK_URL,
        payload: payload
      });

      // Send to webhook with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), WEBHOOK_TIMEOUT);

      const response = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      console.log('📥 Webhook response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'No error details');
        console.error('❌ Webhook error response:', errorText);
        throw new Error(`Webhook returned ${response.status}: ${errorText}`);
      }

      const responseText = await response.text();
      console.log('📥 Raw webhook response:', responseText);

      let data;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        console.error('❌ Failed to parse JSON response:', e);
        throw new Error('Invalid response format from webhook');
      }

      const botResponseText = data.message || data.response || data.reply || data.answer || 'Thank you for your message. Our team will assist you shortly.';
      const quickReplies = data.quick_replies || data.quickReplies || [];

      console.log('✅ Bot response:', botResponseText, 'Quick replies:', quickReplies);

      // Add bot response
      const botMessage: ChatMessage = {
        id: 'bot-' + Date.now(),
        content: botResponseText,
        sender: 'bot',
        timestamp: new Date(),
        quickReplies: quickReplies.length > 0 ? quickReplies : undefined
      };

      setState(prev => ({
        ...prev,
        messages: [...prev.messages, botMessage],
        isLoading: false
      }));

    } catch (error: any) {
      console.error('❌ Chat error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });

      let errorMessage = 'Something went wrong. Please try again.';
      
      if (error.name === 'AbortError') {
        errorMessage = 'Response timeout. The service is taking too long to respond. Please try again.';
      } else if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        errorMessage = "Connection blocked. This might be a CORS issue. Please contact support.";
      } else if (error.message.includes('Invalid response format')) {
        errorMessage = "Service error. The response format was invalid. Please try again.";
      } else if (error.message.includes('Webhook returned')) {
        const statusMatch = error.message.match(/Webhook returned (\d+)/);
        const status = statusMatch ? statusMatch[1] : 'unknown';
        if (status === '404') {
          errorMessage = "Service not found. The chatbot service may be temporarily unavailable.";
        } else if (status === '500' || status === '502' || status === '503') {
          errorMessage = "Service temporarily unavailable. Please try again in a moment.";
        } else {
          errorMessage = `Service error (${status}). Please try again or contact support.`;
        }
      }

      const errorBotMessage: ChatMessage = {
        id: 'bot-error-' + Date.now(),
        content: errorMessage,
        sender: 'bot',
        timestamp: new Date()
      };

      setState(prev => ({
        ...prev,
        messages: [...prev.messages, errorBotMessage],
        isLoading: false
      }));
    }
  }, [state.isLoading, state.sessionId]);

  return {
    messages: state.messages,
    isOpen: state.isOpen,
    isMinimized: state.isMinimized,
    isLoading: state.isLoading,
    toggleChat,
    closeChat,
    minimizeChat,
    sendMessage,
    messagesEndRef
  };
};
