import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  MessageSquare,
  Settings,
  Phone,
  BarChart3,
  Wifi,
  WifiOff,
  Eye,
  EyeOff,
  RefreshCw,
  Send,
  Loader2,
  ArrowDownUp,
  AlertTriangle,
  Copy,
  ExternalLink,
  Activity,
  Bug,
  FlaskConical,
} from "lucide-react";

interface WhatsAppConfig {
  id: string;
  is_enabled: boolean;
  instance_name: string;
  server_url: string | null;
  api_key: string | null;
  webhook_url: string | null;
  connected_number: string | null;
  connection_status: string;
  created_at: string;
  updated_at: string;
}

interface WhatsAppMessage {
  id: string;
  phone_number: string;
  direction: "inbound" | "outbound";
  message: string;
  session_id: string | null;
  status: string;
  error_message: string | null;
  metadata?: Record<string, any> | null;
  created_at: string;
}

interface WebhookHealth {
  status: "connected" | "not_receiving" | "error" | "disabled";
  last_webhook_event: string | null;
  last_webhook_event_received_at: string | null;
  last_message_timestamp: string | null;
  last_message_phone: string | null;
  last_response_status: string | null;
  inbound_last_hour: number;
  recent_errors: Array<{ created_at: string; error_message: string | null; phone_number: string }>;
  connection_status: string;
  config_enabled: boolean;
}

const WEBHOOK_URL = `https://iwcqutzgtpbdowghalnl.supabase.co/functions/v1/whatsapp-webhook`;

const formatDateTime = (value?: string | null) => {
  if (!value) return "—";
  return new Date(value).toLocaleString();
};

const getBadgeVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
  if (status === "connected" || status === "sent" || status === "received") return "default";
  if (status.includes("fail") || status === "error") return "destructive";
  if (status === "disabled" || status === "not_receiving") return "secondary";
  return "outline";
};

export function WhatsAppChatbot() {
  const [config, setConfig] = useState<WhatsAppConfig | null>(null);
  const [messages, setMessages] = useState<WhatsAppMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testingWebhook, setTestingWebhook] = useState(false);
  const [settingWebhook, setSettingWebhook] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [phoneFilter, setPhoneFilter] = useState("");
  const [stats, setStats] = useState({ today: 0, week: 0, active: 0, errors: 0 });
  const [health, setHealth] = useState<WebhookHealth | null>(null);

  // Form state
  const [formServerUrl, setFormServerUrl] = useState("");
  const [formApiKey, setFormApiKey] = useState("");
  const [formInstanceName, setFormInstanceName] = useState("");
  const [formWebhookUrl, setFormWebhookUrl] = useState("");
  const [formEnabled, setFormEnabled] = useState(false);

  // Conversations state
  const [conversations, setConversations] = useState<
    { phone: string; lastMsg: string; lastTime: string; unread: number }[]
  >([]);
  const [selectedPhone, setSelectedPhone] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<WhatsAppMessage[]>([]);
  const [manualReply, setManualReply] = useState("");
  const [sendingReply, setSendingReply] = useState(false);

  // Test webhook state
  const [testPhone, setTestPhone] = useState("");
  const [testMessage, setTestMessage] = useState("Hello, this is a webhook test message");

  const chatEndRef = useRef<HTMLDivElement>(null);

  const loadConfig = useCallback(async () => {
    const { data, error } = await supabase.from("whatsapp_config").select("*").limit(1).single();
    if (error) {
      console.error("Error loading config:", error);
      return;
    }

    if (data) {
      const c = data as unknown as WhatsAppConfig;
      setConfig(c);
      setFormServerUrl(c.server_url || "");
      setFormApiKey(c.api_key || "");
      setFormInstanceName(c.instance_name || "");
      setFormWebhookUrl(c.webhook_url || WEBHOOK_URL);
      setFormEnabled(c.is_enabled);
      setTestPhone(c.connected_number ? `+${c.connected_number}` : "");
    }
  }, []);

  const loadMessages = useCallback(async () => {
    let query = supabase
      .from("whatsapp_messages")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(300);

    if (phoneFilter) query = query.ilike("phone_number", `%${phoneFilter}%`);

    const { data } = await query;
    if (data) {
      const msgs = data as unknown as WhatsAppMessage[];
      setMessages(msgs);

      const convMap = new Map<string, { lastMsg: string; lastTime: string; unread: number }>();
      for (const m of msgs) {
        if (!convMap.has(m.phone_number)) {
          convMap.set(m.phone_number, {
            lastMsg: m.message,
            lastTime: m.created_at,
            unread: m.direction === "inbound" ? 1 : 0,
          });
        }
      }
      setConversations(Array.from(convMap.entries()).map(([phone, d]) => ({ phone, ...d })));
    }
  }, [phoneFilter]);

  const loadChatForPhone = useCallback(async (phone: string) => {
    const { data } = await supabase
      .from("whatsapp_messages")
      .select("*")
      .eq("phone_number", phone)
      .order("created_at", { ascending: true })
      .limit(300);

    if (data) setChatMessages(data as unknown as WhatsAppMessage[]);
  }, []);

  const loadStats = useCallback(async () => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const weekStart = new Date(now.getTime() - 7 * 86400000).toISOString();

    const [todayRes, weekRes, errRes] = await Promise.all([
      supabase.from("whatsapp_messages").select("id", { count: "exact", head: true }).gte("created_at", todayStart),
      supabase.from("whatsapp_messages").select("id", { count: "exact", head: true }).gte("created_at", weekStart),
      supabase.from("whatsapp_messages").select("id", { count: "exact", head: true }).eq("status", "failed"),
    ]);

    const { data: activeSessions } = await supabase
      .from("whatsapp_messages")
      .select("session_id")
      .gte("created_at", todayStart)
      .eq("direction", "inbound");

    const uniqueSessions = new Set(activeSessions?.map((m: any) => m.session_id).filter(Boolean));

    setStats({
      today: todayRes.count || 0,
      week: weekRes.count || 0,
      active: uniqueSessions.size,
      errors: errRes.count || 0,
    });
  }, []);

  const loadHealth = useCallback(async () => {
    try {
      const { data, error } = await supabase.functions.invoke("whatsapp-webhook", {
        body: { admin_action: "health-check" },
      });
      if (error) throw error;
      if (data?.success) {
        setHealth(data as WebhookHealth);
      }
    } catch (error) {
      console.error("health-check failed", error);
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await Promise.all([loadConfig(), loadMessages(), loadStats(), loadHealth()]);
      setLoading(false);
    };
    init();
  }, [loadConfig, loadMessages, loadStats, loadHealth]);

  useEffect(() => {
    const interval = setInterval(() => {
      loadMessages();
      loadStats();
      loadHealth();
    }, 30000);
    return () => clearInterval(interval);
  }, [loadMessages, loadStats, loadHealth]);

  useEffect(() => {
    if (!selectedPhone) return;
    loadChatForPhone(selectedPhone);
    const interval = setInterval(() => loadChatForPhone(selectedPhone), 10000);
    return () => clearInterval(interval);
  }, [selectedPhone, loadChatForPhone]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  const handleSave = async () => {
    if (!config) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from("whatsapp_config")
        .update({
          server_url: formServerUrl,
          api_key: formApiKey,
          instance_name: formInstanceName,
          webhook_url: formWebhookUrl || WEBHOOK_URL,
          is_enabled: formEnabled,
          updated_at: new Date().toISOString(),
        } as any)
        .eq("id", config.id);
      if (error) throw error;
      toast.success("Configuration saved");
      await Promise.all([loadConfig(), loadHealth()]);
    } catch (e: any) {
      toast.error(`Failed to save: ${e.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleTestConnection = async () => {
    setTesting(true);
    try {
      const { data, error } = await supabase.functions.invoke("whatsapp-webhook", {
        body: { admin_action: "test-connection" },
      });
      if (error) throw error;
      if (data?.success) {
        toast.success(`Connection successful: ${JSON.stringify(data.data?.instance?.state || data.data)}`);
        await Promise.all([loadConfig(), loadHealth()]);
      } else {
        toast.error(`Connection failed: ${data?.error || "Unknown error"}`);
      }
    } catch (e: any) {
      toast.error(`Test failed: ${e.message}`);
    } finally {
      setTesting(false);
    }
  };

  const handleSetWebhook = async () => {
    setSettingWebhook(true);
    try {
      const { data, error } = await supabase.functions.invoke("whatsapp-webhook", {
        body: { admin_action: "set-webhook" },
      });
      if (error) throw error;
      if (data?.success) {
        toast.success("Webhook configured");
        await Promise.all([loadConfig(), loadHealth()]);
      } else {
        toast.error(`Failed: ${data?.error || "Unknown"}`);
      }
    } catch (e: any) {
      toast.error(`Failed: ${e.message}`);
    } finally {
      setSettingWebhook(false);
    }
  };

  const handleSendManualReply = async () => {
    if (!selectedPhone || !manualReply.trim()) return;
    setSendingReply(true);
    try {
      const { data, error } = await supabase.functions.invoke("whatsapp-webhook", {
        body: { admin_action: "send-message", phone: selectedPhone, message: manualReply.trim() },
      });
      if (error) throw error;
      if (data?.success) {
        toast.success("Message sent");
        setManualReply("");
        await Promise.all([loadChatForPhone(selectedPhone), loadMessages(), loadHealth()]);
      } else {
        toast.error(`Failed: ${data?.error || "Unknown"}`);
      }
    } catch (e: any) {
      toast.error(`Failed: ${e.message}`);
    } finally {
      setSendingReply(false);
    }
  };

  const handleTestWebhook = async () => {
    const normalizedPhone = testPhone.replace(/\D/g, "");
    if (!normalizedPhone) {
      toast.error("Enter a phone number for webhook test");
      return;
    }

    setTestingWebhook(true);
    try {
      const { data, error } = await supabase.functions.invoke("whatsapp-webhook", {
        body: {
          admin_action: "test-webhook",
          phone: normalizedPhone,
          message: testMessage.trim() || "Webhook test",
        },
      });
      if (error) throw error;
      if (data?.success) {
        toast.success("Webhook test completed");
        await Promise.all([loadMessages(), loadStats(), loadHealth()]);
        if (!selectedPhone) setSelectedPhone(normalizedPhone);
      } else {
        toast.error(`Test failed: ${data?.error || "Unknown"}`);
      }
    } catch (error: any) {
      toast.error(`Test failed: ${error.message}`);
    } finally {
      setTestingWebhook(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied");
  };

  const inboundMessages = useMemo(
    () => messages.filter((m) => m.direction === "inbound"),
    [messages],
  );

  const failedMessages = useMemo(
    () => messages.filter((m) => m.status === "failed" || Boolean(m.error_message)),
    [messages],
  );

  const webhookMonitorRows = useMemo(
    () => inboundMessages.slice(0, 50),
    [inboundMessages],
  );

  const lastInbound = inboundMessages[0];
  const showNotReceivingAlert =
    Boolean(formEnabled) && (!lastInbound || (Date.now() - new Date(lastInbound.created_at).getTime()) / 60000 > 30);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: MessageSquare, label: "Messages Today", value: stats.today },
          { icon: Phone, label: "Active Chats", value: stats.active },
          { icon: BarChart3, label: "This Week", value: stats.week },
          { icon: AlertTriangle, label: "Errors", value: stats.errors },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <s.icon className="h-7 w-7 text-primary" />
                <div>
                  <p className="text-2xl font-bold">{s.value}</p>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardContent className="py-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            {health?.status === "connected" ? (
              <Wifi className="h-5 w-5 text-primary" />
            ) : (
              <WifiOff className="h-5 w-5 text-muted-foreground" />
            )}
            <div>
              <p className="font-medium flex items-center gap-2">
                Webhook Status:
                <Badge variant={getBadgeVariant(health?.status || "unknown")}>{health?.status || "unknown"}</Badge>
              </p>
              <p className="text-sm text-muted-foreground">
                Last webhook event: {health?.last_webhook_event || "—"} • {formatDateTime(health?.last_webhook_event_received_at)}
              </p>
              <p className="text-sm text-muted-foreground">
                Last response status: {health?.last_response_status || "—"} • Incoming last hour: {health?.inbound_last_hour || 0}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={formEnabled ? "default" : "secondary"}>{formEnabled ? "Enabled" : "Disabled"}</Badge>
            <Button variant="outline" size="sm" onClick={() => Promise.all([loadHealth(), loadConfig()])}>
              <RefreshCw className="h-4 w-4 mr-2" />Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {showNotReceivingAlert && (
        <Card>
          <CardContent className="py-3 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-destructive" />
            <p className="text-sm">
              Webhook is enabled but no recent inbound messages were received. Verify Evolution webhook URL and events configuration.
            </p>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="config" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="config" className="flex items-center gap-2"><Settings className="h-4 w-4" />Config</TabsTrigger>
          <TabsTrigger value="conversations" className="flex items-center gap-2"><MessageSquare className="h-4 w-4" />Chats</TabsTrigger>
          <TabsTrigger value="logs" className="flex items-center gap-2"><BarChart3 className="h-4 w-4" />Logs</TabsTrigger>
          <TabsTrigger value="debug" className="flex items-center gap-2"><Bug className="h-4 w-4" />Debug</TabsTrigger>
        </TabsList>

        <TabsContent value="config" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2"><ExternalLink className="h-5 w-5" />Webhook URL</CardTitle>
              <CardDescription>Add this in Evolution API dashboard webhook settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-2">
                <Input value={WEBHOOK_URL} readOnly className="font-mono text-sm" />
                <Button variant="outline" size="icon" onClick={() => copyToClipboard(WEBHOOK_URL)}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <div className="text-sm text-muted-foreground space-y-1">
                <p className="font-medium">Required events:</p>
                <p><code className="bg-muted px-1 rounded">MESSAGES_UPSERT</code>, <code className="bg-muted px-1 rounded">CONNECTION_UPDATE</code></p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" onClick={handleSetWebhook} disabled={settingWebhook}>
                  {settingWebhook && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  <ArrowDownUp className="h-4 w-4 mr-2" />Set Webhook Automatically
                </Button>
                <Button variant="outline" onClick={handleTestConnection} disabled={testing}>
                  {testing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  <Wifi className="h-4 w-4 mr-2" />Test Connection
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2"><FlaskConical className="h-5 w-5" />Webhook Testing Tool</CardTitle>
              <CardDescription>Simulates an incoming message and validates reply flow</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid md:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Test phone number</Label>
                  <Input value={testPhone} onChange={(e) => setTestPhone(e.target.value)} placeholder="+9779708562001" />
                </div>
                <div className="space-y-2">
                  <Label>Test message</Label>
                  <Input value={testMessage} onChange={(e) => setTestMessage(e.target.value)} placeholder="Hello" />
                </div>
              </div>
              <Button onClick={handleTestWebhook} disabled={testingWebhook}>
                {testingWebhook && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Run Webhook Test
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>API Configuration</CardTitle>
              <CardDescription>Connected number: <span className="font-mono font-bold">+9779826884653</span> (9779826884653@s.whatsapp.net)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Enable WhatsApp Chatbot</Label>
                  <p className="text-xs text-muted-foreground">Webhook receives messages even while disabled, but bot replies only when enabled.</p>
                </div>
                <Switch checked={formEnabled} onCheckedChange={setFormEnabled} />
              </div>

              <div className="space-y-2">
                <Label>Server URL</Label>
                <Input value={formServerUrl} onChange={(e) => setFormServerUrl(e.target.value)} placeholder="https://your-evolution-server" />
              </div>

              <div className="space-y-2">
                <Label>API Key</Label>
                <div className="flex gap-2">
                  <Input
                    type={showApiKey ? "text" : "password"}
                    value={formApiKey}
                    onChange={(e) => setFormApiKey(e.target.value)}
                    placeholder="Evolution API key"
                    className="flex-1"
                  />
                  <Button variant="outline" size="icon" onClick={() => setShowApiKey((v) => !v)}>
                    {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Instance Name</Label>
                <Input value={formInstanceName} onChange={(e) => setFormInstanceName(e.target.value)} placeholder="whtapp" />
              </div>

              <Button onClick={handleSave} disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Save Configuration
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Number tab removed - webhook-only integration */}

        <TabsContent value="conversations" className="space-y-4">
          <Card>
            <CardContent className="p-0">
              <div className="flex h-[620px] border rounded-lg overflow-hidden">
                <div className="w-1/3 border-r flex flex-col">
                  <div className="p-3 border-b">
                    <Input placeholder="Search phone..." value={phoneFilter} onChange={(e) => setPhoneFilter(e.target.value)} className="h-8 text-sm" />
                  </div>
                  <ScrollArea className="flex-1">
                    {conversations.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-8">No conversations yet</p>
                    ) : (
                      conversations.map((c) => (
                        <button
                          key={c.phone}
                          onClick={() => setSelectedPhone(c.phone)}
                          className={`w-full text-left px-3 py-3 border-b hover:bg-muted/50 transition-colors ${selectedPhone === c.phone ? "bg-muted" : ""}`}
                        >
                          <div className="flex justify-between items-start gap-2">
                            <p className="font-mono text-sm font-medium truncate">+{c.phone}</p>
                            <span className="text-[10px] text-muted-foreground whitespace-nowrap">{new Date(c.lastTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                          </div>
                          <p className="text-xs text-muted-foreground truncate mt-0.5">{c.lastMsg || "..."}</p>
                        </button>
                      ))
                    )}
                  </ScrollArea>
                </div>

                <div className="flex-1 flex flex-col">
                  {!selectedPhone ? (
                    <div className="flex-1 flex items-center justify-center text-muted-foreground">
                      <div className="text-center">
                        <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-30" />
                        <p>Select a conversation</p>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="px-4 py-3 border-b bg-muted/30 flex items-center justify-between">
                        <div>
                          <p className="font-medium font-mono">+{selectedPhone}</p>
                          <p className="text-xs text-muted-foreground">{chatMessages.length} messages</p>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => loadChatForPhone(selectedPhone)}>
                          <RefreshCw className="h-4 w-4" />
                        </Button>
                      </div>

                      <ScrollArea className="flex-1 p-4">
                        <div className="space-y-2">
                          {chatMessages.map((msg) => (
                            <div key={msg.id} className={`flex ${msg.direction === "outbound" ? "justify-end" : "justify-start"}`}>
                              <div
                                className={`max-w-[75%] rounded-lg px-3 py-2 text-sm ${
                                  msg.direction === "outbound"
                                    ? "bg-primary text-primary-foreground"
                                    : "bg-muted text-foreground"
                                } ${msg.status === "failed" ? "border border-destructive" : ""}`}
                              >
                                <p className="whitespace-pre-wrap break-words">{msg.message || <span className="italic opacity-70">empty</span>}</p>
                                <p className="text-[10px] mt-1 opacity-80">
                                  {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                  {msg.status === "failed" && " • Failed"}
                                </p>
                              </div>
                            </div>
                          ))}
                          <div ref={chatEndRef} />
                        </div>
                      </ScrollArea>

                      <div className="p-3 border-t flex gap-2">
                        <Textarea
                          value={manualReply}
                          onChange={(e) => setManualReply(e.target.value)}
                          placeholder="Type manual reply..."
                          className="min-h-[40px] max-h-[100px] resize-none"
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                              e.preventDefault();
                              handleSendManualReply();
                            }
                          }}
                        />
                        <Button onClick={handleSendManualReply} disabled={sendingReply || !manualReply.trim()} size="icon" className="shrink-0">
                          {sendingReply ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logs" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <CardTitle>Message Logs</CardTitle>
                  <CardDescription>Incoming and outgoing WhatsApp message events</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Input placeholder="Filter phone..." value={phoneFilter} onChange={(e) => setPhoneFilter(e.target.value)} className="w-48" />
                  <Button variant="outline" size="icon" onClick={() => Promise.all([loadMessages(), loadStats(), loadHealth()])}>
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {messages.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p>No messages yet</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Phone</TableHead>
                        <TableHead>Direction</TableHead>
                        <TableHead>Message</TableHead>
                        <TableHead>Event</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Time</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {messages.map((msg) => (
                        <TableRow key={msg.id} className={msg.status === "failed" ? "bg-destructive/5" : ""}>
                          <TableCell className="font-mono text-sm">{msg.phone_number}</TableCell>
                          <TableCell>
                            <Badge variant={msg.direction === "inbound" ? "default" : "secondary"}>
                              {msg.direction === "inbound" ? "IN" : "OUT"}
                            </Badge>
                          </TableCell>
                          <TableCell className="max-w-[260px] truncate" title={msg.message}>{msg.message || "—"}</TableCell>
                          <TableCell className="text-xs text-muted-foreground max-w-[140px] truncate" title={msg.metadata?.webhook_event || ""}>
                            {msg.metadata?.webhook_event || "—"}
                          </TableCell>
                          <TableCell>
                            <Badge variant={getBadgeVariant(msg.status)}>{msg.status}</Badge>
                            {msg.error_message && <p className="text-xs text-destructive mt-1">{msg.error_message}</p>}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground whitespace-nowrap">{formatDateTime(msg.created_at)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="debug" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Activity className="h-5 w-5" />Webhook Monitor</CardTitle>
              <CardDescription>Latest incoming webhook payload summaries and timestamps</CardDescription>
            </CardHeader>
            <CardContent>
              {webhookMonitorRows.length === 0 ? (
                <p className="text-sm text-muted-foreground">No inbound webhook events recorded yet.</p>
              ) : (
                <div className="space-y-3 max-h-[320px] overflow-auto pr-1">
                  {webhookMonitorRows.map((row) => (
                    <div key={row.id} className="border rounded-md p-3 space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-medium font-mono">+{row.phone_number}</p>
                        <Badge variant={getBadgeVariant(row.status)}>{row.status}</Badge>
                      </div>
                      <p className="text-sm">{row.message || "(empty)"}</p>
                      <p className="text-xs text-muted-foreground">Event: {row.metadata?.webhook_event || "—"} • Type: {row.metadata?.message_type || "—"}</p>
                      <p className="text-xs text-muted-foreground">{formatDateTime(row.created_at)}</p>
                      {row.metadata?.raw_payload_preview && (
                        <details>
                          <summary className="cursor-pointer text-xs text-muted-foreground">Show payload preview</summary>
                          <pre className="mt-2 text-[11px] bg-muted rounded p-2 overflow-auto whitespace-pre-wrap break-all">{row.metadata.raw_payload_preview}</pre>
                        </details>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><AlertTriangle className="h-5 w-5" />Error Monitoring</CardTitle>
              <CardDescription>Webhook/chatbot/provider failures to help locate broken step</CardDescription>
            </CardHeader>
            <CardContent>
              {failedMessages.length === 0 ? (
                <p className="text-sm text-muted-foreground">No failures detected in recent logs.</p>
              ) : (
                <div className="space-y-2">
                  {failedMessages.slice(0, 20).map((row) => (
                    <div key={row.id} className="border border-destructive/30 rounded-md p-3">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <p className="text-sm font-mono">+{row.phone_number}</p>
                        <span className="text-xs text-muted-foreground">{formatDateTime(row.created_at)}</span>
                      </div>
                      <p className="text-sm">{row.error_message || "Unknown error"}</p>
                      <p className="text-xs text-muted-foreground mt-1">Stage: {row.metadata?.stage || row.metadata?.provider || "unknown"}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
