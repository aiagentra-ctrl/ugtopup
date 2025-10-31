import { useState, useEffect, useRef } from 'react';
import { sendMessageToWebhook } from '@/utils/chatApi';

export interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

const MESSAGE_HISTORY_KEY = 'uiq-chat-history';
const MAX_STORED_MESSAGES = 50;

const WELCOME_MESSAGE: Message = {
  id: 'welcome',
  text: '👋 Hi! I\'m UIQ, your AI assistant at UGC-Topup.\n\nI can help you with:\n• Product information\n• Order tracking\n• Account questions\n• General support\n\nWhat would you like to know?',
  sender: 'bot',
  timestamp: new Date()
};

export const useChat = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load message history from localStorage
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

  // Show welcome message on first open if no history
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([WELCOME_MESSAGE]);
    }
  }, [isOpen, messages.length]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Persist messages to localStorage (limit to MAX_STORED_MESSAGES)
  useEffect(() => {
    if (messages.length > 0) {
      const toStore = messages.slice(-MAX_STORED_MESSAGES);
      localStorage.setItem(MESSAGE_HISTORY_KEY, JSON.stringify(toStore));
    }
  }, [messages]);

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
      const response = await sendMessageToWebhook(text);
      
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

  const toggleChat = () => {
    setIsOpen(!isOpen);
  };

  const closeChat = () => {
    setIsOpen(false);
  };

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
    messagesEndRef
  };
};
