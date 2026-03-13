import { useState, useEffect, useCallback } from "react";
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
import {
  MessageSquare, Settings, Phone, BarChart3, Wifi, WifiOff,
  QrCode, Eye, EyeOff, RefreshCw, Send, Trash2, Loader2,
  ArrowDownUp, CheckCircle2, XCircle, AlertTriangle
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
  direction: string;
  message: string;
  session_id: string | null;
  status: string;
  error_message: string | null;
  created_at: string;
}

export function WhatsAppChatbot() {
  const [config, setConfig] = useState<WhatsAppConfig | null>(null);
  const [messages, setMessages] = useState<WhatsAppMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [gettingQr, setGettingQr] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [settingWebhook, setSettingWebhook] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [qrData, setQrData] = useState<string | null>(null);
  const [phoneFilter, setPhoneFilter] = useState("");
  const [stats, setStats] = useState({ today: 0, week: 0, active: 0, errors: 0 });

  // Form state
  const [formServerUrl, setFormServerUrl] = useState("");
  const [formApiKey, setFormApiKey] = useState("");
  const [formInstanceName, setFormInstanceName] = useState("");
  const [formWebhookUrl, setFormWebhookUrl] = useState("");
  const [formEnabled, setFormEnabled] = useState(false);

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
      setFormWebhookUrl(c.webhook_url || "");
      setFormEnabled(c.is_enabled);
    }
  }, []);

  const loadMessages = useCallback(async () => {
    let query = supabase
      .from("whatsapp_messages")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);

    if (phoneFilter) {
      query = query.ilike("phone_number", `%${phoneFilter}%`);
    }

    const { data } = await query;
    if (data) setMessages(data as unknown as WhatsAppMessage[]);
  }, [phoneFilter]);

  const loadStats = useCallback(async () => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const weekStart = new Date(now.getTime() - 7 * 86400000).toISOString();

    const [todayRes, weekRes, errRes] = await Promise.all([
      supabase.from("whatsapp_messages").select("id", { count: "exact", head: true }).gte("created_at", todayStart),
      supabase.from("whatsapp_messages").select("id", { count: "exact", head: true }).gte("created_at", weekStart),
      supabase.from("whatsapp_messages").select("id", { count: "exact", head: true }).eq("status", "failed"),
    ]);

    // Count unique sessions today for active conversations
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

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await Promise.all([loadConfig(), loadMessages(), loadStats()]);
      setLoading(false);
    };
    init();
  }, [loadConfig, loadMessages, loadStats]);

  // Auto-refresh messages every 30s
  useEffect(() => {
    const interval = setInterval(() => {
      loadMessages();
      loadStats();
    }, 30000);
    return () => clearInterval(interval);
  }, [loadMessages, loadStats]);

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
          webhook_url: formWebhookUrl,
          is_enabled: formEnabled,
          updated_at: new Date().toISOString(),
        } as any)
        .eq("id", config.id);

      if (error) throw error;
      toast.success("Configuration saved");
      await loadConfig();
    } catch (e: any) {
      toast.error("Failed to save: " + e.message);
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
        toast.success("Connection successful! Status: " + JSON.stringify(data.data?.instance?.state || data.data));
        await loadConfig();
      } else {
        toast.error("Connection failed: " + (data?.error || "Unknown error"));
      }
    } catch (e: any) {
      toast.error("Test failed: " + e.message);
    } finally {
      setTesting(false);
    }
  };

  const handleGetQR = async () => {
    setGettingQr(true);
    setQrData(null);
    try {
      const { data, error } = await supabase.functions.invoke("whatsapp-webhook", {
        body: { admin_action: "get-qr" },
      });
      if (error) throw error;
      if (data?.success) {
        const base64 = data.qr?.base64 || data.qr?.qrcode?.base64 || null;
        const pairingCode = data.qr?.pairingCode || data.qr?.code || null;
        if (base64) {
          setQrData(base64);
          toast.success("QR code generated! Scan with WhatsApp.");
        } else if (pairingCode) {
          setQrData(null);
          toast.success("Pairing code: " + pairingCode);
        } else {
          toast.info("Instance created. Check connection status.");
        }
      } else {
        toast.error("Failed: " + (data?.error || "Unknown error"));
      }
    } catch (e: any) {
      toast.error("Failed to get QR: " + e.message);
    } finally {
      setGettingQr(false);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm("Are you sure you want to disconnect this WhatsApp number?")) return;
    setDisconnecting(true);
    try {
      const { data, error } = await supabase.functions.invoke("whatsapp-webhook", {
        body: { admin_action: "disconnect" },
      });
      if (error) throw error;
      toast.success("Disconnected successfully");
      setQrData(null);
      await loadConfig();
    } catch (e: any) {
      toast.error("Failed: " + e.message);
    } finally {
      setDisconnecting(false);
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
        toast.success("Webhook configured successfully");
      } else {
        toast.error("Failed: " + (data?.error || "Unknown error"));
      }
    } catch (e: any) {
      toast.error("Failed: " + e.message);
    } finally {
      setSettingWebhook(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const statusColor = config?.connection_status === "connected" ? "text-green-500" : config?.connection_status === "connecting" ? "text-yellow-500" : "text-red-500";

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <MessageSquare className="h-8 w-8 text-primary" />
              <div>
                <p className="text-2xl font-bold">{stats.today}</p>
                <p className="text-xs text-muted-foreground">Messages Today</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Phone className="h-8 w-8 text-primary" />
              <div>
                <p className="text-2xl font-bold">{stats.active}</p>
                <p className="text-xs text-muted-foreground">Active Chats</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <BarChart3 className="h-8 w-8 text-primary" />
              <div>
                <p className="text-2xl font-bold">{stats.week}</p>
                <p className="text-xs text-muted-foreground">This Week</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-8 w-8 text-destructive" />
              <div>
                <p className="text-2xl font-bold">{stats.errors}</p>
                <p className="text-xs text-muted-foreground">Errors</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Connection Status Banner */}
      <Card className={config?.connection_status === "connected" ? "border-green-500/30 bg-green-500/5" : "border-destructive/30 bg-destructive/5"}>
        <CardContent className="py-4 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            {config?.connection_status === "connected" ? (
              <Wifi className="h-5 w-5 text-green-500" />
            ) : (
              <WifiOff className="h-5 w-5 text-destructive" />
            )}
            <div>
              <p className="font-medium">
                Status: <span className={statusColor}>{config?.connection_status || "unknown"}</span>
              </p>
              {config?.connected_number && (
                <p className="text-sm text-muted-foreground">Connected: +{config.connected_number}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={formEnabled ? "default" : "secondary"}>
              {formEnabled ? "Enabled" : "Disabled"}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="config" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="config" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Configuration
          </TabsTrigger>
          <TabsTrigger value="number" className="flex items-center gap-2">
            <Phone className="h-4 w-4" />
            Number
          </TabsTrigger>
          <TabsTrigger value="logs" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Messages
          </TabsTrigger>
        </TabsList>

        {/* Configuration Tab */}
        <TabsContent value="config" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>API Configuration</CardTitle>
              <CardDescription>Configure your Evolution API connection for WhatsApp</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Enable WhatsApp Chatbot</Label>
                  <p className="text-xs text-muted-foreground">Turn on/off the WhatsApp chatbot</p>
                </div>
                <Switch checked={formEnabled} onCheckedChange={setFormEnabled} />
              </div>

              <div className="space-y-2">
                <Label>Server URL</Label>
                <Input
                  value={formServerUrl}
                  onChange={(e) => setFormServerUrl(e.target.value)}
                  placeholder="http://your-evolution-api-server.com"
                />
              </div>

              <div className="space-y-2">
                <Label>API Key</Label>
                <div className="flex gap-2">
                  <Input
                    type={showApiKey ? "text" : "password"}
                    value={formApiKey}
                    onChange={(e) => setFormApiKey(e.target.value)}
                    placeholder="Enter Evolution API key"
                    className="flex-1"
                  />
                  <Button variant="outline" size="icon" onClick={() => setShowApiKey(!showApiKey)}>
                    {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Instance Name</Label>
                <Input
                  value={formInstanceName}
                  onChange={(e) => setFormInstanceName(e.target.value)}
                  placeholder="ugc-topup"
                />
              </div>

              <div className="space-y-2">
                <Label>Webhook URL</Label>
                <Input
                  value={formWebhookUrl}
                  onChange={(e) => setFormWebhookUrl(e.target.value)}
                  placeholder="Auto-generated webhook URL"
                />
                <p className="text-xs text-muted-foreground">This URL receives incoming WhatsApp messages</p>
              </div>

              <div className="flex flex-wrap gap-3 pt-4">
                <Button onClick={handleSave} disabled={saving}>
                  {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Save Configuration
                </Button>
                <Button variant="outline" onClick={handleTestConnection} disabled={testing}>
                  {testing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  <Wifi className="h-4 w-4 mr-2" />
                  Test Connection
                </Button>
                <Button variant="outline" onClick={handleSetWebhook} disabled={settingWebhook}>
                  {settingWebhook && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  <ArrowDownUp className="h-4 w-4 mr-2" />
                  Set Webhook
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Number Management Tab */}
        <TabsContent value="number" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>WhatsApp Number Management</CardTitle>
              <CardDescription>Connect, disconnect, or replace your WhatsApp number</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {config?.connection_status === "connected" ? (
                <div className="space-y-4">
                  <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="h-6 w-6 text-green-500" />
                      <div>
                        <p className="font-medium">Connected</p>
                        <p className="text-sm text-muted-foreground">
                          Number: +{config.connected_number}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Instance: {config.instance_name}
                        </p>
                      </div>
                    </div>
                  </div>
                  <Button variant="destructive" onClick={handleDisconnect} disabled={disconnecting}>
                    {disconnecting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    <Trash2 className="h-4 w-4 mr-2" />
                    Disconnect Number
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="p-4 rounded-lg bg-muted border border-border">
                    <div className="flex items-center gap-3">
                      <XCircle className="h-6 w-6 text-muted-foreground" />
                      <div>
                        <p className="font-medium">Not Connected</p>
                        <p className="text-sm text-muted-foreground">
                          Scan the QR code with WhatsApp to connect
                        </p>
                      </div>
                    </div>
                  </div>

                  <Button onClick={handleGetQR} disabled={gettingQr}>
                    {gettingQr ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <QrCode className="h-4 w-4 mr-2" />
                    )}
                    Generate QR Code
                  </Button>

                  {qrData && (
                    <div className="flex flex-col items-center gap-3 p-6 bg-white rounded-lg border">
                      <p className="font-medium text-foreground">Scan this QR with WhatsApp</p>
                      <img
                        src={qrData.startsWith("data:") ? qrData : `data:image/png;base64,${qrData}`}
                        alt="WhatsApp QR Code"
                        className="w-64 h-64"
                      />
                      <p className="text-sm text-muted-foreground">
                        Open WhatsApp → Settings → Linked Devices → Link a Device
                      </p>
                    </div>
                  )}

                  <Button
                    variant="outline"
                    onClick={() => { loadConfig(); setQrData(null); }}
                    className="w-full"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh Status
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Message Logs Tab */}
        <TabsContent value="logs" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <CardTitle>Message Logs</CardTitle>
                  <CardDescription>View incoming and outgoing WhatsApp messages</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="Filter by phone..."
                    value={phoneFilter}
                    onChange={(e) => setPhoneFilter(e.target.value)}
                    className="w-48"
                  />
                  <Button variant="outline" size="icon" onClick={() => { loadMessages(); loadStats(); }}>
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
                  <p className="text-sm">Messages will appear here when users chat on WhatsApp</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Phone</TableHead>
                        <TableHead>Direction</TableHead>
                        <TableHead>Message</TableHead>
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
                          <TableCell className="max-w-[300px] truncate" title={msg.message}>
                            {msg.message || <span className="text-muted-foreground italic">empty</span>}
                          </TableCell>
                          <TableCell>
                            <Badge variant={msg.status === "failed" ? "destructive" : "outline"}>
                              {msg.status}
                            </Badge>
                            {msg.error_message && (
                              <p className="text-xs text-destructive mt-1">{msg.error_message}</p>
                            )}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                            {new Date(msg.created_at).toLocaleString()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
