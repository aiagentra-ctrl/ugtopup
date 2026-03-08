import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  RefreshCw, Search, Zap, CheckCircle2, XCircle, Clock, Loader2,
  RotateCcw, ChevronDown, ChevronUp, Eye, Ban, AlertTriangle,
  Coins, Wallet, Code2, Activity,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  fetchLianaOrders, getLianaOrderStats, retryLianaOrder, cancelLianaOrder,
  getApiErrorAlerts, type LianaOrder, type LianaOrderStats,
} from "@/lib/lianaApi";
import { format } from "date-fns";

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: React.ComponentType<{ className?: string }>; color: string }> = {
  pending: { label: "Pending", variant: "secondary", icon: Clock, color: "text-yellow-500" },
  processing: { label: "Processing", variant: "outline", icon: Loader2, color: "text-blue-500" },
  completed: { label: "Completed", variant: "default", icon: CheckCircle2, color: "text-green-500" },
  failed: { label: "Failed", variant: "destructive", icon: XCircle, color: "text-destructive" },
  canceled: { label: "Canceled", variant: "outline", icon: Ban, color: "text-muted-foreground" },
};

export function LianaOrdersDashboard() {
  const [orders, setOrders] = useState<LianaOrder[]>([]);
  const [stats, setStats] = useState<LianaOrderStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [retryingId, setRetryingId] = useState<string | null>(null);
  const [cancelingId, setCancelingId] = useState<string | null>(null);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<LianaOrder | null>(null);
  const [errorAlerts, setErrorAlerts] = useState<Array<{ type: string; message: string; count: number; latest: string }>>([]);
  const [activeTab, setActiveTab] = useState("orders");

  const loadData = async () => {
    setLoading(true);
    try {
      const [ordersData, statsData, alerts] = await Promise.all([
        fetchLianaOrders(statusFilter),
        getLianaOrderStats(),
        getApiErrorAlerts(),
      ]);
      setOrders(ordersData);
      setStats(statsData);
      setErrorAlerts(alerts);
    } catch (error) {
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, [statusFilter]);

  useEffect(() => {
    const channel = supabase
      .channel("liana-orders-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "liana_orders" }, () => loadData())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [statusFilter]);

  const handleRetry = async (orderId: string) => {
    setRetryingId(orderId);
    try {
      await retryLianaOrder(orderId);
      toast.success("Order retry initiated");
      await loadData();
    } catch (error: any) {
      toast.error(error.message || "Failed to retry order");
    } finally {
      setRetryingId(null);
    }
  };

  const handleCancel = async (orderId: string) => {
    setCancelingId(orderId);
    try {
      await cancelLianaOrder(orderId);
      toast.success("Order canceled successfully");
      await loadData();
    } catch (error: any) {
      toast.error(error.message || "Failed to cancel order");
    } finally {
      setCancelingId(null);
    }
  };

  const filteredOrders = orders.filter((order) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      order.order_number?.toLowerCase().includes(q) ||
      order.user_id?.toLowerCase().includes(q) ||
      order.zone_id?.toLowerCase().includes(q) ||
      order.ign?.toLowerCase().includes(q) ||
      order.user_email?.toLowerCase().includes(q) ||
      order.product_name?.toLowerCase().includes(q)
    );
  });

  const recentErrors = errorAlerts.filter((a) => {
    const age = Date.now() - new Date(a.latest).getTime();
    return age < 24 * 60 * 60 * 1000; // last 24h
  });

  return (
    <div className="space-y-6">
      {/* Error Alerts Banner */}
      {recentErrors.length > 0 && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
              <div className="space-y-1 flex-1">
                <p className="text-sm font-semibold text-destructive">API Issues Detected (Last 24h)</p>
                <div className="flex flex-wrap gap-2">
                  {recentErrors.map((alert, i) => (
                    <Badge key={i} variant="destructive" className="text-xs">
                      {alert.type}: {alert.count}x — {alert.message.slice(0, 50)}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <StatCard title="Total Requests" value={stats?.total || 0} icon={Zap} color="bg-blue-500" />
        <StatCard title="Success Rate" value={`${stats?.successRate || 0}%`} icon={CheckCircle2} color="bg-green-500" />
        <StatCard title="Completed" value={stats?.completed || 0} icon={CheckCircle2} color="bg-emerald-500" />
        <StatCard title="Failed" value={stats?.failed || 0} icon={XCircle} color="bg-red-500" />
        <StatCard title="Processing" value={(stats?.pending || 0) + (stats?.processing || 0)} icon={Loader2} color="bg-yellow-500" />
      </div>

      {/* Tabs: Orders / Debug */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="orders" className="gap-1">
            <Activity className="h-4 w-4" /> Orders
          </TabsTrigger>
          <TabsTrigger value="debug" className="gap-1">
            <Code2 className="h-4 w-4" /> Developer Debug
          </TabsTrigger>
        </TabsList>

        <TabsContent value="orders">
          <Card className="bg-card border-border">
            <CardHeader className="pb-4">
              <div className="flex flex-col sm:flex-row gap-4 justify-between">
                <CardTitle className="text-lg text-foreground">API Order History</CardTitle>
                <Button variant="outline" size="sm" onClick={loadData} disabled={loading}>
                  <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
                  Refresh
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4 mb-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by Order #, Game ID, Zone ID, IGN, email, product..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="processing">Processing</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                    <SelectItem value="canceled">Canceled</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Desktop Table */}
              <div className="hidden md:block rounded-lg border border-border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead>Order #</TableHead>
                      <TableHead>Game ID</TableHead>
                      <TableHead>Package</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Coins</TableHead>
                      <TableHead className="text-right">Balance Before</TableHead>
                      <TableHead className="text-right">Balance After</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center py-8">
                          <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                        </TableCell>
                      </TableRow>
                    ) : filteredOrders.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">No orders found</TableCell>
                      </TableRow>
                    ) : (
                      filteredOrders.map((order) => {
                        const config = statusConfig[order.status] || statusConfig.pending;
                        const StatusIcon = config.icon;
                        const wl = order.wallet_log;
                        return (
                          <TableRow key={order.id} className="hover:bg-muted/30">
                            <TableCell className="font-mono text-sm">{order.order_number || "-"}</TableCell>
                            <TableCell className="font-mono text-sm">{order.user_id} ({order.zone_id})</TableCell>
                            <TableCell className="text-sm">{order.package_name}</TableCell>
                            <TableCell>
                              <Badge variant={config.variant} className={`gap-1 ${config.color}`}>
                                <StatusIcon className={`h-3 w-3 ${order.status === "processing" ? "animate-spin" : ""}`} />
                                {config.label}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right font-mono text-sm">
                              {wl?.coins_used ? (
                                <span className="text-destructive font-semibold">-{wl.coins_used}</span>
                              ) : "—"}
                            </TableCell>
                            <TableCell className="text-right font-mono text-xs text-muted-foreground">
                              {wl?.balance_before != null ? wl.balance_before.toLocaleString() : "—"}
                            </TableCell>
                            <TableCell className="text-right font-mono text-xs text-muted-foreground">
                              {wl?.balance_after != null ? wl.balance_after.toLocaleString() : "—"}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {format(new Date(order.created_at), "MMM d, HH:mm")}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex gap-1 justify-end">
                                <Button variant="ghost" size="icon" onClick={() => setSelectedOrder(order)}>
                                  <Eye className="h-4 w-4" />
                                </Button>
                                {order.status === "failed" && (
                                  <Button variant="outline" size="icon" onClick={() => handleRetry(order.id)} disabled={retryingId === order.id} title="Retry">
                                    {retryingId === order.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />}
                                  </Button>
                                )}
                                {["failed", "pending", "processing"].includes(order.status) && (
                                  <Button variant="ghost" size="icon" onClick={() => handleCancel(order.id)} disabled={cancelingId === order.id} title="Cancel">
                                    {cancelingId === order.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4 text-destructive" />}
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile Cards */}
              <div className="md:hidden space-y-3">
                {loading ? (
                  <div className="text-center py-8"><Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" /></div>
                ) : filteredOrders.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">No orders found</div>
                ) : (
                  filteredOrders.map((order) => {
                    const config = statusConfig[order.status] || statusConfig.pending;
                    const StatusIcon = config.icon;
                    const isExpanded = expandedRow === order.id;
                    const wl = order.wallet_log;
                    return (
                      <Card key={order.id} className="bg-card border-border">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <p className="font-mono text-sm font-medium">{order.order_number || "-"}</p>
                              <p className="text-xs text-muted-foreground">{format(new Date(order.created_at), "MMM d, HH:mm")}</p>
                            </div>
                            <Badge variant={config.variant} className={`gap-1 ${config.color}`}>
                              <StatusIcon className={`h-3 w-3 ${order.status === "processing" ? "animate-spin" : ""}`} />
                              {config.label}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-sm mb-2">
                            <div><span className="text-muted-foreground text-xs">Game ID:</span> <span className="font-mono text-xs">{order.user_id}</span></div>
                            <div><span className="text-muted-foreground text-xs">Package:</span> <span className="text-xs">{order.package_name}</span></div>
                          </div>
                          {wl && (
                            <div className="flex items-center gap-3 text-xs bg-muted/50 p-2 rounded mb-2">
                              <Coins className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                              <span className="text-destructive font-semibold">-{wl.coins_used}</span>
                              <span className="text-muted-foreground">{wl.balance_before?.toLocaleString()} → {wl.balance_after?.toLocaleString()}</span>
                            </div>
                          )}
                          {order.error_message && (
                            <div className="text-xs text-destructive bg-destructive/10 p-2 rounded mb-2">{order.error_message}</div>
                          )}
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" className="flex-1" onClick={() => setExpandedRow(isExpanded ? null : order.id)}>
                              {isExpanded ? <><ChevronUp className="h-4 w-4 mr-1" /> Less</> : <><ChevronDown className="h-4 w-4 mr-1" /> More</>}
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => setSelectedOrder(order)}><Eye className="h-4 w-4" /></Button>
                            {order.status === "failed" && (
                              <Button variant="default" size="sm" onClick={() => handleRetry(order.id)} disabled={retryingId === order.id}>
                                {retryingId === order.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />}
                              </Button>
                            )}
                            {["failed", "pending", "processing"].includes(order.status) && (
                              <Button variant="ghost" size="sm" onClick={() => handleCancel(order.id)} disabled={cancelingId === order.id}>
                                {cancelingId === order.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4 text-destructive" />}
                              </Button>
                            )}
                          </div>
                          {isExpanded && (
                            <div className="mt-3 pt-3 border-t border-border text-xs space-y-1">
                              <div><span className="text-muted-foreground">User:</span> {order.user_email}</div>
                              <div><span className="text-muted-foreground">Price:</span> Rs. {order.price}</div>
                              <div><span className="text-muted-foreground">IGN:</span> {order.ign || "—"}</div>
                              <div><span className="text-muted-foreground">Retries:</span> {order.retry_count}</div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Developer Debug Tab */}
        <TabsContent value="debug">
          <DebugPanel orders={filteredOrders} />
        </TabsContent>
      </Tabs>

      {/* Order Detail Modal */}
      <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Order Details</DialogTitle></DialogHeader>
          {selectedOrder && <OrderDetailView order={selectedOrder} onRetry={handleRetry} onCancel={handleCancel} retryingId={retryingId} cancelingId={cancelingId} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function OrderDetailView({ order, onRetry, onCancel, retryingId, cancelingId }: {
  order: LianaOrder;
  onRetry: (id: string) => void;
  onCancel: (id: string) => void;
  retryingId: string | null;
  cancelingId: string | null;
}) {
  const wl = order.wallet_log;
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <DetailItem label="Order Number" value={order.order_number} mono />
        <DetailItem label="Status">
          <Badge variant={statusConfig[order.status]?.variant || "secondary"}>{statusConfig[order.status]?.label || order.status}</Badge>
        </DetailItem>
        <DetailItem label="Game ID" value={order.user_id} mono />
        <DetailItem label="Zone ID" value={order.zone_id} />
        <DetailItem label="IGN" value={order.ign || "Not verified"} />
        <DetailItem label="Package" value={order.package_name} />
        <DetailItem label="Price" value={`Rs. ${order.price}`} />
        <DetailItem label="Retry Count" value={order.retry_count} />
        <DetailItem label="User Email" value={order.user_email} />
        <DetailItem label="Created" value={order.created_at ? format(new Date(order.created_at), "PPpp") : "—"} />
      </div>

      {/* Coin Usage Section */}
      {wl && (
        <div className="border rounded-lg p-4 bg-muted/30">
          <p className="text-sm font-semibold mb-3 flex items-center gap-2"><Coins className="h-4 w-4 text-primary" /> Coin Usage</p>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-xs text-muted-foreground">Coins Deducted</p>
              <p className="text-lg font-bold text-destructive">-{wl.coins_used}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Before</p>
              <p className="text-lg font-bold text-foreground">{wl.balance_before?.toLocaleString() || "—"}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">After</p>
              <p className="text-lg font-bold text-foreground">{wl.balance_after?.toLocaleString() || "—"}</p>
            </div>
          </div>
        </div>
      )}

      {/* API Timeline */}
      <div className="border-t pt-4">
        <p className="text-sm font-medium mb-2">API Timeline</p>
        <div className="grid grid-cols-2 gap-2 text-sm">
          {order.verification_sent_at && <TimelineItem label="Verification Sent" time={order.verification_sent_at} />}
          {order.verification_completed_at && <TimelineItem label="Verification Done" time={order.verification_completed_at} />}
          {order.order_sent_at && <TimelineItem label="Order Sent" time={order.order_sent_at} />}
          {order.completed_at && <TimelineItem label="Completed" time={order.completed_at} />}
        </div>
      </div>

      {order.error_message && (
        <div className="bg-destructive/10 text-destructive p-3 rounded-lg text-sm">
          <p className="font-medium">{order.error_message}</p>
        </div>
      )}

      {/* API Responses */}
      {order.verification_response && (
        <JsonBlock title="Verification Response" data={order.verification_response} />
      )}
      {order.order_response && (
        <JsonBlock title="Order Response" data={order.order_response} />
      )}
      {order.api_response && !order.verification_response && !order.order_response && (
        <JsonBlock title="API Response" data={order.api_response} />
      )}
      {order.product_details && (
        <JsonBlock title="Product Details" data={order.product_details} />
      )}

      {["failed", "pending", "processing"].includes(order.status) && (
        <div className="flex justify-end gap-2">
          {order.status === "failed" && (
            <Button variant="default" onClick={() => onRetry(order.id)} disabled={retryingId === order.id}>
              {retryingId === order.id ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RotateCcw className="h-4 w-4 mr-2" />}
              Retry Order
            </Button>
          )}
          <Button variant="destructive" onClick={() => onCancel(order.id)} disabled={cancelingId === order.id}>
            {cancelingId === order.id ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Ban className="h-4 w-4 mr-2" />}
            Cancel Order
          </Button>
        </div>
      )}
    </div>
  );
}

function DebugPanel({ orders }: { orders: LianaOrder[] }) {
  const [walletLogs, setWalletLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      const { data } = await supabase
        .from("wallet_activity_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);
      setWalletLogs(data || []);
      setLoading(false);
    };
    fetchLogs();
  }, []);

  const failedOrders = orders.filter((o) => o.status === "failed");
  const recentErrors = walletLogs.filter((l: any) => l.error_message);

  return (
    <div className="space-y-6">
      {/* Error Summary */}
      <Card>
        <CardHeader><CardTitle className="text-lg flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-destructive" /> Error Summary</CardTitle></CardHeader>
        <CardContent>
          {recentErrors.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              <CheckCircle2 className="h-10 w-10 mx-auto mb-2 text-green-500" />
              <p>No errors detected — system running smoothly!</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {recentErrors.slice(0, 20).map((log: any) => (
                <div key={log.id} className="flex items-start gap-3 p-2 rounded-lg bg-destructive/5 border border-destructive/10">
                  <XCircle className="h-4 w-4 text-destructive flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 text-xs">
                      <Badge variant="destructive" className="text-[10px]">{log.api_status || "error"}</Badge>
                      <span className="text-muted-foreground">{format(new Date(log.created_at), "MMM d, HH:mm:ss")}</span>
                      {log.order_number && <span className="font-mono text-muted-foreground">{log.order_number}</span>}
                    </div>
                    <p className="text-xs text-destructive mt-1 truncate">{log.error_message}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Full API Logs */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Code2 className="h-5 w-5 text-muted-foreground" /> API Activity Logs ({walletLogs.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-border overflow-auto max-h-[400px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Time</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Order</TableHead>
                  <TableHead>API Status</TableHead>
                  <TableHead className="text-right">Coins</TableHead>
                  <TableHead>Error</TableHead>
                  <TableHead>Response</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-6"><Loader2 className="h-5 w-5 animate-spin mx-auto" /></TableCell></TableRow>
                ) : walletLogs.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-6 text-muted-foreground">No logs yet</TableCell></TableRow>
                ) : (
                  walletLogs.map((log: any) => (
                    <TableRow key={log.id}>
                      <TableCell className="text-xs whitespace-nowrap">{format(new Date(log.created_at), "MMM d, HH:mm:ss")}</TableCell>
                      <TableCell>
                        <Badge variant={log.action === "order_completed" ? "default" : log.action === "order_failed" ? "destructive" : "outline"} className="text-[10px]">
                          {log.action}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-xs">{log.order_number || "—"}</TableCell>
                      <TableCell>
                        {log.api_status && (
                          <Badge variant={log.api_status === "success" ? "default" : "destructive"} className="text-[10px]">
                            {log.api_status}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-mono text-xs">
                        {log.coins_used > 0 ? <span className="text-destructive">-{log.coins_used}</span> : "—"}
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate text-xs text-destructive">{log.error_message || "—"}</TableCell>
                      <TableCell>
                        {log.api_response && (
                          <details className="text-xs">
                            <summary className="cursor-pointer text-muted-foreground hover:text-foreground">View</summary>
                            <pre className="bg-muted p-2 rounded mt-1 text-[10px] max-h-24 overflow-auto whitespace-pre-wrap">
                              {JSON.stringify(log.api_response, null, 2)}
                            </pre>
                          </details>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Failed Orders Debug */}
      {failedOrders.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-lg">Failed Orders ({failedOrders.length})</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {failedOrders.map((order) => (
                <div key={order.id} className="p-3 rounded-lg border border-destructive/20 bg-destructive/5 text-sm">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono font-semibold">{order.order_number}</span>
                    <span className="text-xs text-muted-foreground">{format(new Date(order.created_at), "MMM d, HH:mm")}</span>
                  </div>
                  <p className="text-xs text-destructive">{order.error_message || "Unknown error"}</p>
                  <p className="text-xs text-muted-foreground mt-1">Retries: {order.retry_count} • Player: {order.user_id} ({order.zone_id})</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Utility sub-components
function StatCard({ title, value, icon: Icon, color }: { title: string; value: string | number; icon: React.ComponentType<{ className?: string }>; color: string }) {
  return (
    <Card className="bg-card border-border">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs sm:text-sm text-muted-foreground">{title}</p>
            <p className="text-xl sm:text-2xl font-bold text-foreground tabular-nums">{value}</p>
          </div>
          <div className={`p-2.5 rounded-full ${color}`}>
            <Icon className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function DetailItem({ label, value, mono, children }: { label: string; value?: any; mono?: boolean; children?: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      {children || <p className={`text-sm ${mono ? "font-mono" : ""}`}>{value ?? "—"}</p>}
    </div>
  );
}

function TimelineItem({ label, time }: { label: string; time: string }) {
  return (
    <div>
      <span className="text-muted-foreground text-xs">{label}:</span>
      <span className="ml-1 text-xs">{format(new Date(time), "HH:mm:ss")}</span>
    </div>
  );
}

function JsonBlock({ title, data }: { title: string; data: any }) {
  return (
    <div>
      <p className="text-sm text-muted-foreground mb-1">{title}</p>
      <pre className="bg-muted p-3 rounded-lg text-xs overflow-x-auto max-h-32">{JSON.stringify(data, null, 2)}</pre>
    </div>
  );
}
