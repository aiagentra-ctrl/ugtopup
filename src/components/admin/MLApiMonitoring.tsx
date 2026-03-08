import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RefreshCw, AlertTriangle, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface LianaOrder {
  id: string;
  order_id: string;
  liana_product_id: number;
  user_id: string;
  zone_id: string;
  ign: string | null;
  status: string;
  error_message: string | null;
  verification_response: any;
  order_response: any;
  retry_count: number;
  created_at: string;
  updated_at: string;
}

interface WalletLog {
  id: string;
  action: string;
  order_number: string | null;
  api_status: string | null;
  error_message: string | null;
  coins_used: number | null;
  api_response: any;
  created_at: string;
}

export const MLApiMonitoring = () => {
  const [failedOrders, setFailedOrders] = useState<LianaOrder[]>([]);
  const [walletLogs, setWalletLogs] = useState<WalletLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [retryingId, setRetryingId] = useState<string | null>(null);
  const [stats, setStats] = useState({ total: 0, completed: 0, failed: 0, processing: 0 });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [ordersRes, logsRes, statsRes] = await Promise.all([
        supabase
          .from("liana_orders")
          .select("*")
          .in("status", ["failed", "pending"])
          .order("created_at", { ascending: false })
          .limit(50),
        supabase
          .from("wallet_activity_logs")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(100),
        supabase
          .from("liana_orders")
          .select("status"),
      ]);

      if (ordersRes.data) setFailedOrders(ordersRes.data as LianaOrder[]);
      if (logsRes.data) setWalletLogs(logsRes.data as WalletLog[]);

      if (statsRes.data) {
        const all = statsRes.data;
        setStats({
          total: all.length,
          completed: all.filter((o: any) => o.status === "completed").length,
          failed: all.filter((o: any) => o.status === "failed").length,
          processing: all.filter((o: any) => o.status === "processing").length,
        });
      }
    } catch (err) {
      console.error("Failed to fetch monitoring data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleRetry = async (orderId: string) => {
    setRetryingId(orderId);
    try {
      const { data, error } = await supabase.functions.invoke("process-ml-order", {
        body: { order_id: orderId },
      });
      if (error) throw error;
      if (data?.success) {
        toast.success("Order reprocessed successfully");
      } else {
        toast.error(data?.error || "Retry failed");
      }
      await fetchData();
    } catch (err: any) {
      toast.error(err.message || "Retry failed");
    } finally {
      setRetryingId(null);
    }
  };

  const successRate = stats.total > 0
    ? ((stats.completed / stats.total) * 100).toFixed(1)
    : "0";

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed": return <Badge className="bg-green-600">Completed</Badge>;
      case "failed": return <Badge variant="destructive">Failed</Badge>;
      case "processing": return <Badge className="bg-blue-600">Processing</Badge>;
      case "pending": return <Badge className="bg-yellow-600">Pending</Badge>;
      default: return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getApiStatusBadge = (status: string | null) => {
    if (!status) return null;
    const colors: Record<string, string> = {
      success: "bg-green-600",
      verification_failed: "bg-red-600",
      api_error: "bg-red-600",
      insufficient_funds: "bg-yellow-600",
      connection_error: "bg-orange-600",
      error: "bg-red-600",
    };
    return <Badge className={colors[status] || "bg-muted"}>{status}</Badge>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold text-foreground">{stats.total}</p>
            <p className="text-xs text-muted-foreground">Total API Orders</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold text-green-500">{stats.completed}</p>
            <p className="text-xs text-muted-foreground">Completed</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold text-destructive">{stats.failed}</p>
            <p className="text-xs text-muted-foreground">Failed</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold text-primary">{successRate}%</p>
            <p className="text-xs text-muted-foreground">Success Rate</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={fetchData}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <Tabs defaultValue="failed">
        <TabsList>
          <TabsTrigger value="failed">
            <AlertTriangle className="h-4 w-4 mr-1" />
            Failed Orders ({failedOrders.length})
          </TabsTrigger>
          <TabsTrigger value="logs">
            API Logs ({walletLogs.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="failed">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Failed & Pending API Orders</CardTitle>
            </CardHeader>
            <CardContent>
              {failedOrders.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle2 className="h-12 w-12 mx-auto mb-2 text-green-500" />
                  <p>No failed orders — everything is running smoothly!</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order</TableHead>
                      <TableHead>Player</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Error</TableHead>
                      <TableHead>Retries</TableHead>
                      <TableHead>Time</TableHead>
                      <TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {failedOrders.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell className="font-mono text-xs">
                          {order.order_id.slice(0, 8)}...
                        </TableCell>
                        <TableCell>
                          <div className="text-xs">
                            <div>{order.user_id} ({order.zone_id})</div>
                            {order.ign && (
                              <div className="text-muted-foreground">IGN: {order.ign}</div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(order.status || "unknown")}</TableCell>
                        <TableCell className="max-w-[200px] truncate text-xs text-destructive">
                          {order.error_message || "—"}
                        </TableCell>
                        <TableCell>{order.retry_count || 0}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {new Date(order.created_at).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={retryingId === order.order_id}
                            onClick={() => handleRetry(order.order_id)}
                          >
                            {retryingId === order.order_id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <RefreshCw className="h-3 w-3" />
                            )}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logs">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">API Activity Logs</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Action</TableHead>
                    <TableHead>Order</TableHead>
                    <TableHead>API Status</TableHead>
                    <TableHead>Coins</TableHead>
                    <TableHead>Error</TableHead>
                    <TableHead>Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {walletLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {log.action}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {log.order_number || "—"}
                      </TableCell>
                      <TableCell>
                        {getApiStatusBadge(log.api_status)}
                      </TableCell>
                      <TableCell>
                        {log.coins_used ? `${log.coins_used}` : "—"}
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate text-xs text-destructive">
                        {log.error_message || "—"}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(log.created_at).toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
