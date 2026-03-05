import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface ChatbotSettings {
  id: string;
  is_enabled: boolean;
  webhook_url: string;
  welcome_message: string;
  button1_label: string;
  button1_enabled: boolean;
  button2_label: string;
  button2_enabled: boolean;
  button3_label: string;
  button3_enabled: boolean;
  payment_help_message: string;
  order_track_prompt: string;
  gmail_fallback_enabled: boolean;
  gmail_fallback_email: string | null;
}

const DEFAULT_SETTINGS: ChatbotSettings = {
  id: '',
  is_enabled: true,
  webhook_url: 'https://n8n.aiagentra.com/webhook/chatbot',
  welcome_message: '👋 Hi! I\'m UIQ, your AI assistant at UGC-Topup.\n\nI can help you with:\n• Product information\n• Order tracking\n• Account questions\n• General support\n\nWhat would you like to know?',
  button1_label: 'Basic Question / FAQ',
  button1_enabled: true,
  button2_label: 'Track Your Order',
  button2_enabled: true,
  button3_label: 'Prepaid / Payment',
  button3_enabled: true,
  payment_help_message: '## Payment Instructions\n\n### QR Payment\nScan our QR code to make payment directly.\n\n### Manual Transfer\nSend payment to our account and upload screenshot.\n\n### Need Help?\nContact us on WhatsApp for payment assistance.',
  order_track_prompt: 'Please enter your Order ID or email to track your order.',
  gmail_fallback_enabled: false,
  gmail_fallback_email: null,
};

export const useChatbotSettings = () => {
  const [settings, setSettings] = useState<ChatbotSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data, error } = await supabase
          .from('chatbot_settings')
          .select('*')
          .limit(1)
          .single();

        if (error) throw error;
        if (data) {
          setSettings(data as unknown as ChatbotSettings);
        }
      } catch (e) {
        console.error('Failed to load chatbot settings:', e);
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();

    // Real-time subscription
    const channel = supabase
      .channel('chatbot-settings-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'chatbot_settings' }, (payload) => {
        if (payload.new) {
          setSettings(payload.new as unknown as ChatbotSettings);
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  return { settings, loading };
};
