import { useState, useEffect, useRef } from 'react';
import { sendMessageToWebhook } from '@/utils/chatApi';
import { ChatbotSettings } from '@/hooks/useChatbotSettings';

export interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

export type ChatMode = 'welcome' | 'faq' | 'order' | 'payment';

const MESSAGE_HISTORY_KEY = 'uiq-chat-history';
const MAX_STORED_MESSAGES = 50;

export const useChat = (settings: ChatbotSettings | null) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [chatMode, setChatMode] = useState<ChatMode>('welcome');
  const [showQuickReplies, setShowQuickReplies] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load message history
  useEffect(() => {
    const history = localStorage.getItem(MESSAGE_HISTORY_KEY);
    if (history) {
      try {
        const parsed = JSON.parse(history);
        const messagesWithDates = parsed.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }));
        setMessages(messagesWithDates);
      } catch (e) {
        console.error('Failed to load chat history:', e);
      }
    }
  }, []);

  // Show welcome message on first open
  useEffect(() => {
    if (isOpen && messages.length === 0 && settings) {
      const welcomeMsg: Message = {
        id: 'welcome',
        text: settings.welcome_message,
        sender: 'bot',
        timestamp: new Date()
      };
      setMessages([welcomeMsg]);
      setShowQuickReplies(true);
      setChatMode('welcome');
    }
  }, [isOpen, messages.length, settings]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, showQuickReplies]);

  // Persist messages
  useEffect(() => {
    if (messages.length > 0) {
      const toStore = messages.slice(-MAX_STORED_MESSAGES);
      localStorage.setItem(MESSAGE_HISTORY_KEY, JSON.stringify(toStore));
    }
  }, [messages]);

  const addBotMessage = (text: string) => {
    const botMsg: Message = {
      id: `bot-${Date.now()}`,
      text,
      sender: 'bot',
      timestamp: new Date()
    };
    setMessages(prev => [...prev, botMsg]);
  };

  const selectMode = (mode: ChatMode) => {
    setChatMode(mode);
    setShowQuickReplies(false);

    if (mode === 'faq') {
      addBotMessage('💬 Ask me anything! Type your question below and I\'ll help you out.');
    } else if (mode === 'order') {
      // Order tracker widget will be shown by ChatWidget
    } else if (mode === 'payment') {
      if (settings) {
        addBotMessage(settings.payment_help_message);
      }
      // Show quick replies again after payment info
      setTimeout(() => setShowQuickReplies(true), 100);
      setChatMode('welcome');
    }
  };

  const sendMessage = async (text: string) => {
    if (!text.trim() || isTyping) return;

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      text: text.trim(),
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setIsTyping(true);
    setError(null);

    try {
      const webhookUrl = settings?.webhook_url || 'https://n8n.aiagentra.com/webhook/chatbot';
      const response = await sendMessageToWebhook(text, webhookUrl);

      const botMsg: Message = {
        id: `bot-${Date.now()}`,
        text: response.reply,
        sender: 'bot',
        timestamp: new Date(response.timestamp)
      };

      setMessages(prev => [...prev, botMsg]);
    } catch (err: any) {
      const errorMsg: Message = {
        id: `error-${Date.now()}`,
        text: `❌ ${err.message}`,
        sender: 'bot',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, errorMsg]);
      setError(err.message);
    } finally {
      setIsTyping(false);
    }
  };

  const handleOrderResult = (text: string) => {
    addBotMessage(text);
    setChatMode('welcome');
    setTimeout(() => setShowQuickReplies(true), 100);
  };

  const toggleChat = () => setIsOpen(!isOpen);
  const closeChat = () => setIsOpen(false);

  return {
    isOpen,
    setIsOpen,
    toggleChat,
    closeChat,
    messages,
    inputValue,
    setInputValue,
    isTyping,
    error,
    sendMessage,
    messagesEndRef,
    chatMode,
    showQuickReplies,
    selectMode,
    handleOrderResult,
  };
};
