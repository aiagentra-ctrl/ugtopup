import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Bot, Save, Eye, Brain, MessageCircle, Package, CreditCard, Mail, Loader2 } from 'lucide-react';

interface Settings {
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
  ai_provider: string;
  ai_model: string;
  ai_system_prompt: string;
  custom_api_url: string | null;
  custom_api_key_name: string | null;
}

const AI_MODELS = [
  { value: 'google/gemini-3-flash-preview', label: 'Gemini 3 Flash (Fast, Recommended)' },
  { value: 'google/gemini-2.5-flash', label: 'Gemini 2.5 Flash (Balanced)' },
  { value: 'google/gemini-2.5-pro', label: 'Gemini 2.5 Pro (Best Quality)' },
  { value: 'google/gemini-3-pro-preview', label: 'Gemini 3 Pro (Next-Gen)' },
  { value: 'openai/gpt-5-nano', label: 'GPT-5 Nano (Fast & Cheap)' },
  { value: 'openai/gpt-5-mini', label: 'GPT-5 Mini (Balanced)' },
  { value: 'openai/gpt-5', label: 'GPT-5 (Best Quality)' },
];

export const ChatbotSettings = () => {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('chatbot_settings')
        .select('*')
        .limit(1)
        .single();
      if (error) throw error;
      setSettings(data as unknown as Settings);
    } catch (e) {
      console.error('Error fetching chatbot settings:', e);
      toast.error('Failed to load chatbot settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!settings) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('chatbot_settings')
        .update({
          is_enabled: settings.is_enabled,
          webhook_url: settings.webhook_url,
          welcome_message: settings.welcome_message,
          button1_label: settings.button1_label,
          button1_enabled: settings.button1_enabled,
          button2_label: settings.button2_label,
          button2_enabled: settings.button2_enabled,
          button3_label: settings.button3_label,
          button3_enabled: settings.button3_enabled,
          payment_help_message: settings.payment_help_message,
          order_track_prompt: settings.order_track_prompt,
          gmail_fallback_enabled: settings.gmail_fallback_enabled,
          gmail_fallback_email: settings.gmail_fallback_email,
          ai_provider: settings.ai_provider,
          ai_model: settings.ai_model,
          ai_system_prompt: settings.ai_system_prompt,
        } as any)
        .eq('id', settings.id);
      if (error) throw error;
      toast.success('Chatbot settings saved successfully!');
    } catch (e: any) {
      toast.error('Failed to save: ' + e.message);
    } finally {
      setSaving(false);
    }
  };

  const update = <K extends keyof Settings>(key: K, value: Settings[K]) => {
    setSettings(prev => prev ? { ...prev, [key]: value } : prev);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!settings) return <p className="text-muted-foreground">No settings found.</p>;

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Bot className="h-6 w-6 text-primary" /> AI Chatbot Settings
          </h2>
          <p className="text-sm text-muted-foreground mt-1">Configure your AI chatbot — no external tools needed</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowPreview(!showPreview)}>
            <Eye className="h-4 w-4 mr-2" />
            {showPreview ? 'Hide' : 'Show'} Preview
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            Save Settings
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Settings */}
        <div className="space-y-6">
          {/* Enable/Disable */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Chatbot Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <Label htmlFor="chatbot-enabled">Enable Chatbot</Label>
                <Switch
                  id="chatbot-enabled"
                  checked={settings.is_enabled}
                  onCheckedChange={(v) => update('is_enabled', v)}
                />
              </div>
            </CardContent>
          </Card>

          {/* AI Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Brain className="h-4 w-4" /> AI Engine
              </CardTitle>
              <CardDescription>Direct AI integration — no n8n or webhooks needed</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>AI Provider</Label>
                <Select value={settings.ai_provider} onValueChange={(v) => update('ai_provider', v)}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="lovable_ai">Lovable AI (Built-in, Recommended)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">Powered by OpenAI & Google Gemini — no API key needed</p>
              </div>

              <div>
                <Label>AI Model</Label>
                <Select value={settings.ai_model} onValueChange={(v) => update('ai_model', v)}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {AI_MODELS.map(m => (
                      <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>AI System Prompt</Label>
                <Textarea
                  value={settings.ai_system_prompt}
                  onChange={(e) => update('ai_system_prompt', e.target.value)}
                  rows={5}
                  className="mt-1"
                  placeholder="Define the AI personality and instructions..."
                />
                <p className="text-xs text-muted-foreground mt-1">This prompt defines how the AI behaves and responds</p>
              </div>
            </CardContent>
          </Card>

          {/* Gmail Fallback */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Mail className="h-4 w-4" /> Gmail Fallback
              </CardTitle>
              <CardDescription>Backup when AI fails</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="gmail-enabled">Enable Gmail Fallback</Label>
                <Switch
                  id="gmail-enabled"
                  checked={settings.gmail_fallback_enabled}
                  onCheckedChange={(v) => update('gmail_fallback_enabled', v)}
                />
              </div>
              {settings.gmail_fallback_enabled && (
                <div>
                  <Label htmlFor="gmail-email">Fallback Email</Label>
                  <Input
                    id="gmail-email"
                    type="email"
                    value={settings.gmail_fallback_email || ''}
                    onChange={(e) => update('gmail_fallback_email', e.target.value || null)}
                    placeholder="support@example.com"
                    className="mt-1"
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Welcome Message */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Welcome Message</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={settings.welcome_message}
                onChange={(e) => update('welcome_message', e.target.value)}
                rows={5}
              />
            </CardContent>
          </Card>

          {/* Quick Reply Buttons */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Quick Reply Buttons</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Button 1 */}
              <div className="space-y-2 p-3 rounded-lg border border-border">
                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-2"><MessageCircle className="h-3.5 w-3.5" /> Button 1 (FAQ)</Label>
                  <Switch checked={settings.button1_enabled} onCheckedChange={(v) => update('button1_enabled', v)} />
                </div>
                {settings.button1_enabled && (
                  <Input value={settings.button1_label} onChange={(e) => update('button1_label', e.target.value)} placeholder="Button label" />
                )}
              </div>

              {/* Button 2 */}
              <div className="space-y-2 p-3 rounded-lg border border-border">
                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-2"><Package className="h-3.5 w-3.5" /> Button 2 (Order Track)</Label>
                  <Switch checked={settings.button2_enabled} onCheckedChange={(v) => update('button2_enabled', v)} />
                </div>
                {settings.button2_enabled && (
                  <>
                    <Input value={settings.button2_label} onChange={(e) => update('button2_label', e.target.value)} placeholder="Button label" />
                    <Textarea
                      value={settings.order_track_prompt}
                      onChange={(e) => update('order_track_prompt', e.target.value)}
                      rows={2}
                      placeholder="Prompt text for order tracking..."
                    />
                  </>
                )}
              </div>

              {/* Button 3 */}
              <div className="space-y-2 p-3 rounded-lg border border-border">
                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-2"><CreditCard className="h-3.5 w-3.5" /> Button 3 (Payment)</Label>
                  <Switch checked={settings.button3_enabled} onCheckedChange={(v) => update('button3_enabled', v)} />
                </div>
                {settings.button3_enabled && (
                  <>
                    <Input value={settings.button3_label} onChange={(e) => update('button3_label', e.target.value)} placeholder="Button label" />
                    <Textarea
                      value={settings.payment_help_message}
                      onChange={(e) => update('payment_help_message', e.target.value)}
                      rows={6}
                      placeholder="Payment help instructions (markdown supported)..."
                    />
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right: Preview */}
        {showPreview && (
          <div className="lg:sticky lg:top-24 h-fit">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Live Preview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="w-full max-w-sm mx-auto rounded-2xl border border-border overflow-hidden shadow-lg">
                  {/* Header */}
                  <div className="bg-gradient-to-br from-primary to-secondary text-primary-foreground p-4">
                    <h3 className="font-semibold text-sm">Chat with UIQ</h3>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="w-2 h-2 rounded-full bg-green-400" />
                      <span className="text-xs opacity-90">AI is online</span>
                    </div>
                  </div>

                  {/* Messages */}
                  <div className="p-4 space-y-3 bg-background min-h-[200px]">
                    <div className="bg-card border border-border rounded-2xl rounded-bl-md px-4 py-3 max-w-[85%]">
                      <p className="text-xs whitespace-pre-wrap text-card-foreground">{settings.welcome_message}</p>
                    </div>

                    {/* Buttons Preview */}
                    <div className="flex flex-wrap gap-1.5">
                      {settings.button1_enabled && (
                        <span className="px-3 py-1.5 text-[10px] font-medium rounded-full bg-primary/10 border border-primary/20 text-primary">
                          {settings.button1_label}
                        </span>
                      )}
                      {settings.button2_enabled && (
                        <span className="px-3 py-1.5 text-[10px] font-medium rounded-full bg-primary/10 border border-primary/20 text-primary">
                          {settings.button2_label}
                        </span>
                      )}
                      {settings.button3_enabled && (
                        <span className="px-3 py-1.5 text-[10px] font-medium rounded-full bg-primary/10 border border-primary/20 text-primary">
                          {settings.button3_label}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Input */}
                  <div className="p-3 border-t border-border bg-card">
                    <div className="bg-input rounded-xl px-3 py-2 text-xs text-muted-foreground">
                      Type your message...
                    </div>
                  </div>
                </div>

                {/* AI Model info */}
                <div className="mt-3 p-2 bg-muted rounded-lg">
                  <p className="text-[10px] text-muted-foreground text-center">
                    Powered by <span className="font-medium">{AI_MODELS.find(m => m.value === settings.ai_model)?.label || settings.ai_model}</span>
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};
