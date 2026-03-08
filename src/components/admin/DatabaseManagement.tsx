import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Database, Settings, Archive, Activity, Trash2, RefreshCw, Download, RotateCcw,
} from "lucide-react";
import { format } from "date-fns";

interface CleanupSetting {
  id: string;
  setting_key: string;
  setting_value: number;
  description: string;
  is_enabled: boolean;
  last_run_at: string | null;
}

interface CleanupLog {
  id: string;
  cleanup_type: string;
  records_affected: number;
  details: string;
  created_at: string;
}

interface ArchivedOrder {
  id: string;
  order_number: string;
  user_email: string;
  product_name: string;
  package_name: string;
  price: number;
  status: string;
  created_at: string;
  archived_at: string;
}

export function DatabaseManagement() {
  const [settings, setSettings] = useState<CleanupSetting[]>([]);
  const [logs, setLogs] = useState<CleanupLog[]>([]);
  const [archivedOrders, setArchivedOrders] = useState<ArchivedOrder[]>([]);
  const [stats, setStats] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    setLoading(true);
    await Promise.all([loadSettings(), loadLogs(), loadArchived(), loadStats()]);
    setLoading(false);
  };

  const loadSettings = async () => {
    const { data } = await supabase
      .from("cleanup_settings")
      .select("*")
      .order("setting_key");
    if (data) setSettings(data as any);
  };

  const loadLogs = async () => {
    const { data } = await supabase
      .from("cleanup_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);
    if (data) setLogs(data as any);
  };

  const loadArchived = async () => {
    const { data } = await supabase
      .from("archived_orders")
      .select("*")
      .order("archived_at", { ascending: false })
      .limit(100);
    if (data) setArchivedOrders(data as any);
  };

  const loadStats = async () => {
    const [orders, archived, notifs, chatbot, activity] = await Promise.all([
      supabase.from("product_orders").select("id", { count: "exact", head: true }),
      supabase.from("archived_orders").select("id", { count: "exact", head: true }),
      supabase.from("notifications").select("id", { count: "exact", head: true }),
      supabase.from("chatbot_conversations").select("id", { count: "exact", head: true }),
      supabase.from("activity_logs").select("id", { count: "exact", head: true }),
    ]);
    setStats({
      orders: orders.count || 0,
      archived: archived.count || 0,
      notifications: notifs.count || 0,
      chatbot: chatbot.count || 0,
      activity: activity.count || 0,
    });
  };

  const updateSetting = async (id: string, field: string, value: any) => {
    const { error } = await supabase
      .from("cleanup_settings")
      .update({ [field]: value, updated_at: new Date().toISOString() })
      .eq("id", id);
    if (error) toast.error("Failed to update setting");
    else {
      toast.success("Setting updated");
      loadSettings();
    }
  };

  const runCleanupNow = async () => {
    setRunning(true);
    try {
      const { data, error } = await supabase.functions.invoke("database-cleanup");
      if (error) throw error;
      toast.success("Cleanup completed successfully");
      loadAll();
    } catch (err: any) {
      toast.error("Cleanup failed: " + err.message);
    } finally {
      setRunning(false);
    }
  };

  const restoreOrder = async (order: ArchivedOrder) => {
    try {
      // Get full archived order
      const { data: full, error: fetchErr } = await supabase
        .from("archived_orders")
        .select("*")
        .eq("id", order.id)
        .single();
      if (fetchErr || !full) throw fetchErr || new Error("Not found");

      const { archived_at, ...orderData } = full as any;

      // Insert back into product_orders
      const { error: insertErr } = await supabase
        .from("product_orders")
        .insert(orderData);
      if (insertErr) throw insertErr;

      // Delete from archived
      await supabase.from("archived_orders").delete().eq("id", order.id);

      toast.success("Order restored successfully");
      loadAll();
    } catch (err: any) {
      toast.error("Failed to restore: " + err.message);
    }
  };

  const exportArchived = () => {
    const csv = [
      "Order Number,User Email,Product,Package,Price,Status,Created,Archived",
      ...archivedOrders.map(
        (o) =>
          `${o.order_number},${o.user_email},${o.product_name},${o.package_name},${o.price},${o.status},${o.created_at},${o.archived_at}`
      ),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `archived-orders-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredArchived = archivedOrders.filter(
    (o) =>
      o.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.user_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.product_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const settingLabels: Record<string, string> = {
    notification_retention_days: "Notifications",
    chatbot_retention_days: "Chatbot Conversations",
    activity_log_retention_days: "Activity Logs",
    order_archive_days: "Order Archiving",
    offer_retention_days: "Expired Offers",
    chatbot_feedback_retention_days: "Chatbot Feedback",
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-32" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="monitoring">
        <TabsList>
          <TabsTrigger value="monitoring" className="gap-2">
            <Activity className="h-4 w-4" /> Monitoring
          </TabsTrigger>
          <TabsTrigger value="settings" className="gap-2">
            <Settings className="h-4 w-4" /> Settings
          </TabsTrigger>
          <TabsTrigger value="archive" className="gap-2">
            <Archive className="h-4 w-4" /> Archive
          </TabsTrigger>
        </TabsList>

        {/* Monitoring Tab */}
        <TabsContent value="monitoring" className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[
              { label: "Active Orders", value: stats.orders, icon: Database },
              { label: "Archived Orders", value: stats.archived, icon: Archive },
              { label: "Notifications", value: stats.notifications, icon: Activity },
              { label: "Chat Logs", value: stats.chatbot, icon: Activity },
              { label: "Activity Logs", value: stats.activity, icon: Activity },
            ].map((s) => (
              <Card key={s.label}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                    <s.icon className="h-4 w-4" />
                    {s.label}
                  </div>
                  <p className="text-2xl font-bold">{s.value?.toLocaleString()}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Recent Cleanup Logs</CardTitle>
            </CardHeader>
            <CardContent>
              {logs.length === 0 ? (
                <p className="text-muted-foreground text-sm">No cleanup logs yet. Run a cleanup to see results.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Records</TableHead>
                      <TableHead>Details</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell>
                          <Badge variant="outline">{log.cleanup_type}</Badge>
                        </TableCell>
                        <TableCell className="font-medium">{log.records_affected}</TableCell>
                        <TableCell className="text-sm text-muted-foreground max-w-xs truncate">
                          {log.details}
                        </TableCell>
                        <TableCell className="text-sm">
                          {format(new Date(log.created_at), "MMM dd, HH:mm")}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-6">
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">
              Configure retention periods and cleanup rules
            </p>
            <Button onClick={runCleanupNow} disabled={running} className="gap-2">
              <Trash2 className="h-4 w-4" />
              {running ? "Running..." : "Run Cleanup Now"}
            </Button>
          </div>

          <div className="grid gap-4">
            {settings.map((s) => (
              <Card key={s.id}>
                <CardContent className="p-4 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium">
                        {settingLabels[s.setting_key] || s.setting_key}
                      </h3>
                      <Badge variant={s.is_enabled ? "default" : "secondary"}>
                        {s.is_enabled ? "Active" : "Disabled"}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{s.description}</p>
                    {s.last_run_at && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Last run: {format(new Date(s.last_run_at), "MMM dd, yyyy HH:mm")}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        value={s.setting_value}
                        onChange={(e) =>
                          updateSetting(s.id, "setting_value", parseInt(e.target.value) || 1)
                        }
                        className="w-20"
                        min={1}
                      />
                      <span className="text-sm text-muted-foreground whitespace-nowrap">days</span>
                    </div>
                    <Switch
                      checked={s.is_enabled}
                      onCheckedChange={(v) => updateSetting(s.id, "is_enabled", v)}
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Archive Tab */}
        <TabsContent value="archive" className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 justify-between">
            <Input
              placeholder="Search archived orders..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
            <div className="flex gap-2">
              <Button variant="outline" onClick={loadArchived} className="gap-2">
                <RefreshCw className="h-4 w-4" /> Refresh
              </Button>
              <Button variant="outline" onClick={exportArchived} className="gap-2" disabled={archivedOrders.length === 0}>
                <Download className="h-4 w-4" /> Export CSV
              </Button>
            </div>
          </div>

          {filteredArchived.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                <Archive className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No archived orders found</p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Product</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Archived</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredArchived.map((o) => (
                      <TableRow key={o.id}>
                        <TableCell className="font-mono text-sm">{o.order_number}</TableCell>
                        <TableCell className="text-sm">{o.user_email}</TableCell>
                        <TableCell className="text-sm">{o.product_name}</TableCell>
                        <TableCell>Rs.{o.price}</TableCell>
                        <TableCell>
                          <Badge variant={o.status === "completed" ? "default" : "secondary"}>
                            {o.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">
                          {format(new Date(o.archived_at), "MMM dd, yyyy")}
                        </TableCell>
                        <TableCell>
                          <Button size="sm" variant="ghost" onClick={() => restoreOrder(o)} className="gap-1">
                            <RotateCcw className="h-3 w-3" /> Restore
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
