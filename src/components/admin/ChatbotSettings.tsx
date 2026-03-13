import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { Bot, Save, Eye, Brain, MessageCircle, Package, CreditCard, Mail, Loader2, Send, Play, User, Zap, CheckCircle, XCircle } from 'lucide-react';

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

interface TestMessage {
  role: 'user' | 'bot';
  text: string;
}

const AI_PROVIDERS = [
  { value: 'openrouter', label: 'OpenRouter (Default)', description: 'Access 100+ models via OpenRouter API' },
  { value: 'lovable_ai', label: 'Lovable AI (Built-in)', description: 'Powered by OpenAI & Google Gemini' },
  { value: 'custom', label: 'Custom API', description: 'Point to any OpenAI-compatible endpoint' },
];

const OPENROUTER_MODELS = [
  { value: 'arcee-ai/trinity-mini:free', label: 'Arcee Trinity Mini (Free)' },
  { value: 'arcee-ai/trinity-mini', label: 'Arcee Trinity Mini' },
  { value: 'openai/gpt-4o-mini', label: 'OpenAI GPT-4o Mini' },
  { value: 'openai/gpt-4o', label: 'OpenAI GPT-4o' },
  { value: 'google/gemini-flash-1.5', label: 'Google Gemini Flash 1.5' },
  { value: 'google/gemini-2.5-flash', label: 'Google Gemini 2.5 Flash' },
  { value: 'meta-llama/llama-3.1-8b-instruct:free', label: 'Llama 3.1 8B (Free)' },
  { value: 'mistralai/mistral-7b-instruct:free', label: 'Mistral 7B (Free)' },
  { value: 'deepseek/deepseek-chat', label: 'DeepSeek Chat' },
];

const LOVABLE_AI_MODELS = [
  { value: 'google/gemini-3-flash-preview', label: 'Gemini 3 Flash (Fast, Recommended)' },
  { value: 'google/gemini-2.5-flash', label: 'Gemini 2.5 Flash (Balanced)' },
  { value: 'google/gemini-2.5-pro', label: 'Gemini 2.5 Pro (Best Quality)' },
  { value: 'openai/gpt-5-nano', label: 'GPT-5 Nano (Fast & Cheap)' },
  { value: 'openai/gpt-5-mini', label: 'GPT-5 Mini (Balanced)' },
  { value: 'openai/gpt-5', label: 'GPT-5 (Best Quality)' },
];

const EDGE_FUNCTION_URL = `https://iwcqutzgtpbdowghalnl.supabase.co/functions/v1/chatbot-api`;
const API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml3Y3F1dHpndHBiZG93Z2hhbG5sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEwMDkxNDYsImV4cCI6MjA3NjU4NTE0Nn0.f_NA471WGd5doUunIq39i3kh1NXYA70g1vVwTJU70P4';

export const ChatbotSettings = () => {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showTestChat, setShowTestChat] = useState(false);
  const [testMessages, setTestMessages] = useState<TestMessage[]>([]);
  const [testInput, setTestInput] = useState('');
  const [testLoading, setTestLoading] = useState(false);
  const [connectionTestResult, setConnectionTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [testingConnection, setTestingConnection] = useState(false);
  const [customModelInput, setCustomModelInput] = useState('');
  const testEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  useEffect(() => {
    testEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [testMessages]);

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
          custom_api_url: settings.custom_api_url,
          custom_api_key_name: settings.custom_api_key_name,
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

  const sendTestMessage = async () => {
    if (!testInput.trim() || testLoading) return;
    const userMsg = testInput.trim();
    setTestInput('');
    setTestMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setTestLoading(true);

    try {
      const history = testMessages.map(m => ({
        role: m.role === 'user' ? 'user' as const : 'assistant' as const,
        content: m.text,
      }));

      const response = await fetch(EDGE_FUNCTION_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'apikey': API_KEY },
        body: JSON.stringify({
          action: 'message',
          message: userMsg,
          session_id: `admin-test-${Date.now()}`,
          history,
        }),
      });

      const data = await response.json();
      setTestMessages(prev => [...prev, { role: 'bot', text: data.reply || data.error || 'No response' }]);
    } catch (err: any) {
      setTestMessages(prev => [...prev, { role: 'bot', text: `❌ Error: ${err.message}` }]);
    } finally {
      setTestLoading(false);
    }
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
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Bot className="h-6 w-6 text-primary" /> AI Chatbot Settings
          </h2>
          <p className="text-sm text-muted-foreground mt-1">Configure your AI chatbot — no external tools needed</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={() => { setShowTestChat(!showTestChat); if (!showTestChat) setShowPreview(false); }}>
            <Play className="h-4 w-4 mr-2" />
            {showTestChat ? 'Hide' : 'Try'} Chatbot
          </Button>
          <Button variant="outline" size="sm" onClick={() => { setShowPreview(!showPreview); if (!showPreview) setShowTestChat(false); }}>
            <Eye className="h-4 w-4 mr-2" />
            {showPreview ? 'Hide' : 'Show'} Preview
          </Button>
          <Button size="sm" onClick={handleSave} disabled={saving}>
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

          {/* AI API Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Brain className="h-4 w-4" /> AI API Configuration
              </CardTitle>
              <CardDescription>Configure AI provider, API key, and model — easy setup for admins</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Provider Selection */}
              <div>
                <Label>AI Provider</Label>
                <Select value={settings.ai_provider} onValueChange={(v) => {
                  update('ai_provider', v);
                  setConnectionTestResult(null);
                  // Set sensible default model when switching
                  if (v === 'openrouter') update('ai_model', 'arcee-ai/trinity-mini:free');
                  else if (v === 'lovable_ai') update('ai_model', 'google/gemini-3-flash-preview');
                }}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {AI_PROVIDERS.map(p => (
                      <SelectItem key={p.value} value={p.value}>
                        {p.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">
                  {AI_PROVIDERS.find(p => p.value === settings.ai_provider)?.description || ''}
                </p>
              </div>

              {/* OpenRouter Info */}
              {settings.ai_provider === 'openrouter' && (
                <div className="space-y-3 p-3 rounded-lg border border-border bg-muted/30">
                  <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                    <Zap className="h-4 w-4 text-primary" />
                    OpenRouter Connected
                  </div>
                  <p className="text-xs text-muted-foreground">
                    API key is securely stored as an Edge Function secret (OPENROUTER_API_KEY). 
                    To change the key, update it in your Supabase Dashboard → Edge Functions → Secrets.
                  </p>
                </div>
              )}

              {/* Custom Provider Config */}
              {settings.ai_provider === 'custom' && (
                <div className="space-y-3 p-3 rounded-lg border border-border bg-muted/30">
                  <div>
                    <Label>Custom API URL</Label>
                    <Input
                      value={settings.custom_api_url || ''}
                      onChange={(e) => update('custom_api_url', e.target.value || null)}
                      placeholder="https://api.openai.com/v1/chat/completions"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>API Key Secret Name</Label>
                    <Input
                      value={settings.custom_api_key_name || ''}
                      onChange={(e) => update('custom_api_key_name', e.target.value || null)}
                      placeholder="CUSTOM_AI_API_KEY"
                      className="mt-1"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Store your API key as a Supabase Edge Function secret with this name
                    </p>
                  </div>
                </div>
              )}

              {/* Model Selection */}
              <div>
                <Label>AI Model</Label>
                <Select value={settings.ai_model} onValueChange={(v) => {
                  if (v === '__custom__') return;
                  update('ai_model', v);
                }}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(settings.ai_provider === 'openrouter' ? OPENROUTER_MODELS : LOVABLE_AI_MODELS).map(m => (
                      <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Manual model input for OpenRouter/Custom */}
              {(settings.ai_provider === 'openrouter' || settings.ai_provider === 'custom') && (
                <div>
                  <Label>Or enter model manually</Label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      value={customModelInput}
                      onChange={(e) => setCustomModelInput(e.target.value)}
                      placeholder="e.g. openai/gpt-4o-mini"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={!customModelInput.trim()}
                      onClick={() => {
                        update('ai_model', customModelInput.trim());
                        setCustomModelInput('');
                        toast.success(`Model set to: ${customModelInput.trim()}`);
                      }}
                    >
                      Set
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Current model: <span className="font-mono text-foreground">{settings.ai_model}</span>
                  </p>
                </div>
              )}

              {/* Test Connection Button */}
              <div className="pt-2 border-t border-border">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={testingConnection}
                  onClick={async () => {
                    setTestingConnection(true);
                    setConnectionTestResult(null);
                    try {
                      // Save settings first
                      await handleSave();
                      // Then test
                      const response = await fetch(EDGE_FUNCTION_URL, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', 'apikey': API_KEY },
                        body: JSON.stringify({ action: 'test-connection' }),
                      });
                      const data = await response.json();
                      setConnectionTestResult({
                        success: data.success,
                        message: data.message || data.error || 'Unknown result',
                      });
                    } catch (err: any) {
                      setConnectionTestResult({
                        success: false,
                        message: err.message || 'Connection test failed',
                      });
                    } finally {
                      setTestingConnection(false);
                    }
                  }}
                >
                  {testingConnection ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Zap className="h-4 w-4 mr-2" />
                  )}
                  Test API Connection
                </Button>

                {connectionTestResult && (
                  <div className={`mt-2 p-2 rounded-lg text-sm flex items-start gap-2 ${
                    connectionTestResult.success 
                      ? 'bg-green-500/10 text-green-700 dark:text-green-400'
                      : 'bg-destructive/10 text-destructive'
                  }`}>
                    {connectionTestResult.success 
                      ? <CheckCircle className="h-4 w-4 mt-0.5 shrink-0" />
                      : <XCircle className="h-4 w-4 mt-0.5 shrink-0" />
                    }
                    <span>{connectionTestResult.message}</span>
                  </div>
                )}
              </div>

              {/* System Prompt */}
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

        {/* Right: Preview or Test Chat */}
        <div className="lg:sticky lg:top-24 h-fit">
          {/* Try Chatbot Panel */}
          {showTestChat && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Play className="h-4 w-4 text-primary" /> Test Chatbot
                  </CardTitle>
                  <Button variant="ghost" size="sm" onClick={() => setTestMessages([])}>Clear</Button>
                </div>
                <CardDescription>Simulate a user conversation to verify AI responses</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="w-full rounded-xl border border-border overflow-hidden">
                  {/* Chat header */}
                  <div className="bg-gradient-to-br from-primary to-secondary text-primary-foreground px-4 py-3">
                    <h3 className="font-semibold text-sm">Admin Test Mode</h3>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="w-2 h-2 rounded-full bg-green-400" />
                      <span className="text-xs opacity-90">
                        {[...OPENROUTER_MODELS, ...LOVABLE_AI_MODELS].find(m => m.value === settings.ai_model)?.label || settings.ai_model}
                      </span>
                    </div>
                  </div>

                  {/* Messages */}
                  <ScrollArea className="h-[350px] p-3 bg-background">
                    <div className="space-y-3">
                      {testMessages.length === 0 && (
                        <p className="text-xs text-muted-foreground text-center py-8">
                          Send a message to test the chatbot's responses.<br />
                          Try asking about products, orders, or payments.
                        </p>
                      )}
                      {testMessages.map((msg, i) => (
                        <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                          <div className={`flex items-start gap-2 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                              msg.role === 'user' ? 'bg-primary/20' : 'bg-secondary/20'
                            }`}>
                              {msg.role === 'user' ? <User className="h-3 w-3 text-primary" /> : <Bot className="h-3 w-3 text-secondary" />}
                            </div>
                            <div className={`px-3 py-2 rounded-xl text-sm ${
                              msg.role === 'user'
                                ? 'bg-primary text-primary-foreground rounded-br-md'
                                : 'bg-card border border-border text-card-foreground rounded-bl-md'
                            }`}>
                              <p className="whitespace-pre-wrap">{msg.text}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                      {testLoading && (
                        <div className="flex justify-start">
                          <div className="bg-card border border-border rounded-xl rounded-bl-md px-4 py-2">
                            <div className="flex gap-1">
                              <span className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                              <span className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                              <span className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                            </div>
                          </div>
                        </div>
                      )}
                      <div ref={testEndRef} />
                    </div>
                  </ScrollArea>

                  {/* Input */}
                  <div className="p-3 border-t border-border bg-card">
                    <form onSubmit={(e) => { e.preventDefault(); sendTestMessage(); }} className="flex gap-2">
                      <Input
                        value={testInput}
                        onChange={(e) => setTestInput(e.target.value)}
                        placeholder="Test a message..."
                        disabled={testLoading}
                        className="text-sm"
                      />
                      <Button type="submit" size="icon" disabled={testLoading || !testInput.trim()}>
                        <Send className="h-4 w-4" />
                      </Button>
                    </form>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Static Preview */}
          {showPreview && (
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
          )}
        </div>
      </div>
    </div>
  );
};
