import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  RefreshCw,
  Search,
  Zap,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  Eye,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  fetchLianaOrders,
  getLianaOrderStats,
  retryLianaOrder,
  retryAllFailedOrders,
  type LianaOrder,
  type LianaOrderStats,
} from "@/lib/lianaApi";
import { format } from "date-fns";

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: React.ComponentType<{ className?: string }> }> = {
  pending: { label: "Pending", variant: "secondary", icon: Clock },
  processing: { label: "Processing", variant: "outline", icon: Loader2 },
  completed: { label: "Completed", variant: "default", icon: CheckCircle2 },
  failed: { label: "Failed", variant: "destructive", icon: XCircle },
};

export function LianaOrdersDashboard() {
  const [orders, setOrders] = useState<LianaOrder[]>([]);
  const [stats, setStats] = useState<LianaOrderStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [retryingId, setRetryingId] = useState<string | null>(null);
  const [retryingAll, setRetryingAll] = useState(false);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<LianaOrder | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [ordersData, statsData] = await Promise.all([
        fetchLianaOrders(statusFilter),
        getLianaOrderStats(),
      ]);
      setOrders(ordersData);
      setStats(statsData);
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [statusFilter]);

  // Real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel("liana-orders-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "liana_orders" },
        () => {
          loadData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [statusFilter]);

  const handleRetry = async (orderId: string) => {
    setRetryingId(orderId);
    try {
      await retryLianaOrder(orderId);
      toast.success("Order retry initiated");
      await loadData();
    } catch (error) {
      console.error("Retry error:", error);
      toast.error("Failed to retry order");
    } finally {
      setRetryingId(null);
    }
  };

  const handleRetryAll = async () => {
    setRetryingAll(true);
    try {
      const count = await retryAllFailedOrders();
      toast.success(`Retried ${count} failed orders`);
      await loadData();
    } catch (error) {
      console.error("Retry all error:", error);
      toast.error("Failed to retry orders");
    } finally {
      setRetryingAll(false);
    }
  };

  const filteredOrders = orders.filter((order) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      order.order_number?.toLowerCase().includes(query) ||
      order.user_id?.toLowerCase().includes(query) ||
      order.zone_id?.toLowerCase().includes(query) ||
      order.ign?.toLowerCase().includes(query) ||
      order.user_email?.toLowerCase().includes(query)
    );
  });

  const StatCard = ({
    title,
    value,
    icon: Icon,
    color,
  }: {
    title: string;
    value: string | number;
    icon: React.ComponentType<{ className?: string }>;
    color: string;
  }) => (
    <Card className="bg-card border-border">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold text-foreground">{value}</p>
          </div>
          <div className={`p-3 rounded-full ${color}`}>
            <Icon className="h-5 w-5 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <StatCard
          title="Total Requests"
          value={stats?.total || 0}
          icon={Zap}
          color="bg-blue-500"
        />
        <StatCard
          title="Success Rate"
          value={`${stats?.successRate || 0}%`}
          icon={CheckCircle2}
          color="bg-green-500"
        />
        <StatCard
          title="Completed"
          value={stats?.completed || 0}
          icon={CheckCircle2}
          color="bg-emerald-500"
        />
        <StatCard
          title="Failed"
          value={stats?.failed || 0}
          icon={XCircle}
          color="bg-red-500"
        />
        <StatCard
          title="Processing"
          value={(stats?.pending || 0) + (stats?.processing || 0)}
          icon={Loader2}
          color="bg-yellow-500"
        />
      </div>

      {/* Filters and Actions */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row gap-4 justify-between">
            <CardTitle className="text-lg text-foreground">API Order History</CardTitle>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={loadData}
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
                Refresh
              </Button>
              {(stats?.failed || 0) > 0 && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleRetryAll}
                  disabled={retryingAll}
                >
                  {retryingAll ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <RotateCcw className="h-4 w-4 mr-2" />
                  )}
                  Retry All Failed ({stats?.failed})
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by Order #, Game ID, Zone ID, IGN..."
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
              </SelectContent>
            </Select>
          </div>

          {/* Desktop Table */}
          <div className="hidden md:block rounded-lg border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="text-foreground">Order #</TableHead>
                  <TableHead className="text-foreground">Game ID</TableHead>
                  <TableHead className="text-foreground">Zone</TableHead>
                  <TableHead className="text-foreground">IGN</TableHead>
                  <TableHead className="text-foreground">Package</TableHead>
                  <TableHead className="text-foreground">Status</TableHead>
                  <TableHead className="text-foreground">Created</TableHead>
                  <TableHead className="text-foreground text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                    </TableCell>
                  </TableRow>
                ) : filteredOrders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      No orders found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredOrders.map((order) => {
                    const config = statusConfig[order.status] || statusConfig.pending;
                    const StatusIcon = config.icon;
                    return (
                      <TableRow key={order.id} className="hover:bg-muted/30">
                        <TableCell className="font-mono text-sm">
                          {order.order_number || "-"}
                        </TableCell>
                        <TableCell className="font-mono">{order.user_id}</TableCell>
                        <TableCell>{order.zone_id}</TableCell>
                        <TableCell>{order.ign || "-"}</TableCell>
                        <TableCell>{order.package_name}</TableCell>
                        <TableCell>
                          <Badge variant={config.variant} className="gap-1">
                            <StatusIcon className={`h-3 w-3 ${order.status === "processing" ? "animate-spin" : ""}`} />
                            {config.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {format(new Date(order.created_at), "MMM d, HH:mm")}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-1 justify-end">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setSelectedOrder(order)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            {order.status === "failed" && (
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => handleRetry(order.id)}
                                disabled={retryingId === order.id}
                              >
                                {retryingId === order.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <RotateCcw className="h-4 w-4" />
                                )}
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
              <div className="text-center py-8">
                <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No orders found
              </div>
            ) : (
              filteredOrders.map((order) => {
                const config = statusConfig[order.status] || statusConfig.pending;
                const StatusIcon = config.icon;
                const isExpanded = expandedRow === order.id;
                
                return (
                  <Card key={order.id} className="bg-card border-border">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="font-mono text-sm font-medium">
                            {order.order_number || "-"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(order.created_at), "MMM d, HH:mm")}
                          </p>
                        </div>
                        <Badge variant={config.variant} className="gap-1">
                          <StatusIcon className={`h-3 w-3 ${order.status === "processing" ? "animate-spin" : ""}`} />
                          {config.label}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                        <div>
                          <span className="text-muted-foreground">Game ID:</span>
                          <span className="ml-1 font-mono">{order.user_id}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Zone:</span>
                          <span className="ml-1">{order.zone_id}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">IGN:</span>
                          <span className="ml-1">{order.ign || "-"}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Package:</span>
                          <span className="ml-1">{order.package_name}</span>
                        </div>
                      </div>

                      {order.error_message && (
                        <div className="text-xs text-destructive bg-destructive/10 p-2 rounded mb-3">
                          {order.error_message}
                        </div>
                      )}

                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => setExpandedRow(isExpanded ? null : order.id)}
                        >
                          {isExpanded ? (
                            <>
                              <ChevronUp className="h-4 w-4 mr-1" /> Less
                            </>
                          ) : (
                            <>
                              <ChevronDown className="h-4 w-4 mr-1" /> More
                            </>
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedOrder(order)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {order.status === "failed" && (
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => handleRetry(order.id)}
                            disabled={retryingId === order.id}
                          >
                            {retryingId === order.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <RotateCcw className="h-4 w-4" />
                            )}
                          </Button>
                        )}
                      </div>

                      {isExpanded && (
                        <div className="mt-3 pt-3 border-t border-border text-xs">
                          <div className="space-y-1">
                            <div>
                              <span className="text-muted-foreground">User:</span>
                              <span className="ml-1">{order.user_email}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Price:</span>
                              <span className="ml-1">Rs. {order.price}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Retries:</span>
                              <span className="ml-1">{order.retry_count}</span>
                            </div>
                          </div>
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

      {/* Order Detail Modal */}
      <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Order Details</DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Order Number</p>
                  <p className="font-mono">{selectedOrder.order_number}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge variant={statusConfig[selectedOrder.status]?.variant || "secondary"}>
                    {statusConfig[selectedOrder.status]?.label || selectedOrder.status}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Game ID</p>
                  <p className="font-mono">{selectedOrder.user_id}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Zone ID</p>
                  <p>{selectedOrder.zone_id}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">IGN (In-Game Name)</p>
                  <p>{selectedOrder.ign || "Not verified yet"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Package</p>
                  <p>{selectedOrder.package_name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Price</p>
                  <p>Rs. {selectedOrder.price}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Retry Count</p>
                  <p>{selectedOrder.retry_count}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">User Email</p>
                  <p>{selectedOrder.user_email}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Created At</p>
                  <p>{format(new Date(selectedOrder.created_at), "PPpp")}</p>
                </div>
              </div>

              {selectedOrder.error_message && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Error Message</p>
                  <div className="bg-destructive/10 text-destructive p-3 rounded-lg text-sm">
                    {selectedOrder.error_message}
                  </div>
                </div>
              )}

              {selectedOrder.api_response && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">API Response</p>
                  <pre className="bg-muted p-3 rounded-lg text-xs overflow-x-auto max-h-48">
                    {JSON.stringify(selectedOrder.api_response, null, 2)}
                  </pre>
                </div>
              )}

              {selectedOrder.product_details && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Product Details</p>
                  <pre className="bg-muted p-3 rounded-lg text-xs overflow-x-auto max-h-48">
                    {JSON.stringify(selectedOrder.product_details, null, 2)}
                  </pre>
                </div>
              )}

              {selectedOrder.status === "failed" && (
                <div className="flex justify-end">
                  <Button
                    onClick={() => {
                      handleRetry(selectedOrder.id);
                      setSelectedOrder(null);
                    }}
                    disabled={retryingId === selectedOrder.id}
                  >
                    {retryingId === selectedOrder.id ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <RotateCcw className="h-4 w-4 mr-2" />
                    )}
                    Retry Order
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
