import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { confirmOrder, cancelOrder } from "@/lib/adminApi";
import { toast } from "sonner";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Bot, RefreshCw, Search, CheckCircle, XCircle, Eye } from "lucide-react";

interface ChatbotOrder {
  id: string;
  order_number: string;
  product_name: string;
  package_name: string;
  user_name: string | null;
  user_email: string;
  status: string;
  price: number;
  created_at: string;
  metadata: Record<string, any> | null;
  product_details: Record<string, any>;
  credits_deducted: number | null;
  admin_remarks: string | null;
  confirmed_at: string | null;
  completed_at: string | null;
  canceled_at: string | null;
  cancellation_reason: string | null;
}

const statusColors: Record<string, string> = {
  pending: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  confirmed: "bg-green-500/20 text-green-400 border-green-500/30",
  completed: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  canceled: "bg-red-500/20 text-red-400 border-red-500/30",
  processing: "bg-purple-500/20 text-purple-400 border-purple-500/30",
};

export function ChatbotOrders() {
  const [orders, setOrders] = useState<ChatbotOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [selectedOrder, setSelectedOrder] = useState<ChatbotOrder | null>(null);
  const [actionDialog, setActionDialog] = useState<{ type: "confirm" | "cancel"; order: ChatbotOrder } | null>(null);
  const [remarks, setRemarks] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      // Fetch orders where metadata has a source field (chatbot orders)
      const { data, error } = await supabase
        .from("product_orders")
        .select("*")
        .not("metadata->source", "is", null)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setOrders((data as ChatbotOrder[]) || []);
    } catch (err: any) {
      toast.error("Failed to load chatbot orders: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();

    // Real-time subscription
    const channel = supabase
      .channel("chatbot-orders-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "product_orders" }, (payload) => {
        const record = payload.new as ChatbotOrder;
        if (record?.metadata && (record.metadata as any)?.source) {
          fetchOrders();
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const filteredOrders = orders.filter((o) => {
    if (statusFilter !== "all" && o.status !== statusFilter) return false;
    if (sourceFilter !== "all" && (o.metadata?.source || "") !== sourceFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!o.order_number.toLowerCase().includes(q) && !o.user_email.toLowerCase().includes(q) && !(o.user_name || "").toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const sources = [...new Set(orders.map((o) => o.metadata?.source).filter(Boolean))];

  const handleAction = async () => {
    if (!actionDialog) return;
    setActionLoading(true);
    try {
      if (actionDialog.type === "confirm") {
        await confirmOrder(actionDialog.order.id, remarks || undefined);
        toast.success("Order confirmed");
      } else {
        if (!remarks.trim()) { toast.error("Cancellation reason required"); setActionLoading(false); return; }
        await cancelOrder(actionDialog.order.id, remarks);
        toast.success("Order cancelled & credits refunded");
      }
      setActionDialog(null);
      setRemarks("");
      fetchOrders();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Bot className="h-5 w-5 text-primary" /> Chatbot Orders
            </CardTitle>
            <Button variant="outline" size="sm" onClick={fetchOrders} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-1 ${loading ? "animate-spin" : ""}`} /> Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Filters */}
          <div className="flex flex-wrap gap-2">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search by order #, email, name..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px]"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="canceled">Canceled</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sourceFilter} onValueChange={setSourceFilter}>
              <SelectTrigger className="w-[160px]"><SelectValue placeholder="Source" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sources</SelectItem>
                {sources.map((s) => (
                  <SelectItem key={s} value={s!}>{String(s)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order #</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
                ) : filteredOrders.length === 0 ? (
                  <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">No chatbot orders found</TableCell></TableRow>
                ) : (
                  filteredOrders.map((o) => (
                    <TableRow key={o.id}>
                      <TableCell className="font-mono text-xs">{o.order_number}</TableCell>
                      <TableCell>{o.product_name}</TableCell>
                      <TableCell>
                        <div className="text-sm">{o.user_name || "-"}</div>
                        <div className="text-xs text-muted-foreground">{o.user_email}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs capitalize">{o.metadata?.source || "unknown"}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={statusColors[o.status] || ""} variant="outline">{o.status}</Badge>
                      </TableCell>
                      <TableCell>NPR {o.price}</TableCell>
                      <TableCell className="text-xs">{format(new Date(o.created_at), "MMM dd, HH:mm")}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-1 justify-end">
                          <Button variant="ghost" size="icon" onClick={() => setSelectedOrder(o)} title="View details">
                            <Eye className="h-4 w-4" />
                          </Button>
                          {o.status === "pending" && (
                            <>
                              <Button variant="ghost" size="icon" className="text-green-500" onClick={() => { setActionDialog({ type: "confirm", order: o }); setRemarks(""); }}>
                                <CheckCircle className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" className="text-red-500" onClick={() => { setActionDialog({ type: "cancel", order: o }); setRemarks(""); }}>
                                <XCircle className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          <p className="text-xs text-muted-foreground">{filteredOrders.length} order(s)</p>
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Order Details</DialogTitle></DialogHeader>
          {selectedOrder && (
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-2">
                <div><span className="text-muted-foreground">Order #:</span> <span className="font-mono">{selectedOrder.order_number}</span></div>
                <div><span className="text-muted-foreground">Status:</span> <Badge className={statusColors[selectedOrder.status]} variant="outline">{selectedOrder.status}</Badge></div>
                <div><span className="text-muted-foreground">Product:</span> {selectedOrder.product_name}</div>
                <div><span className="text-muted-foreground">Package:</span> {selectedOrder.package_name}</div>
                <div><span className="text-muted-foreground">Price:</span> NPR {selectedOrder.price}</div>
                <div><span className="text-muted-foreground">Source:</span> {selectedOrder.metadata?.source || "N/A"}</div>
                <div><span className="text-muted-foreground">User:</span> {selectedOrder.user_name || "-"}</div>
                <div><span className="text-muted-foreground">Email:</span> {selectedOrder.user_email}</div>
              </div>
              {selectedOrder.product_details && Object.keys(selectedOrder.product_details).length > 0 && (
                <div>
                  <p className="text-muted-foreground mb-1">Player Details:</p>
                  <pre className="bg-muted p-2 rounded text-xs overflow-auto">{JSON.stringify(selectedOrder.product_details, null, 2)}</pre>
                </div>
              )}
              {selectedOrder.metadata?.session_id && (
                <div><span className="text-muted-foreground">Session ID:</span> <span className="font-mono text-xs">{selectedOrder.metadata.session_id}</span></div>
              )}
              {selectedOrder.admin_remarks && <div><span className="text-muted-foreground">Admin Remarks:</span> {selectedOrder.admin_remarks}</div>}
              {selectedOrder.cancellation_reason && <div><span className="text-muted-foreground">Cancel Reason:</span> {selectedOrder.cancellation_reason}</div>}
              <div className="text-xs text-muted-foreground">Created: {format(new Date(selectedOrder.created_at), "PPpp")}</div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Action Dialog */}
      <Dialog open={!!actionDialog} onOpenChange={() => setActionDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{actionDialog?.type === "confirm" ? "Confirm Order" : "Cancel Order"}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            {actionDialog?.type === "confirm"
              ? `Confirm order ${actionDialog?.order.order_number}?`
              : `Cancel order ${actionDialog?.order.order_number}? Credits will be refunded.`}
          </p>
          <Textarea
            placeholder={actionDialog?.type === "confirm" ? "Admin remarks (optional)" : "Cancellation reason (required)"}
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setActionDialog(null)}>Close</Button>
            <Button
              variant={actionDialog?.type === "confirm" ? "default" : "destructive"}
              onClick={handleAction}
              disabled={actionLoading}
            >
              {actionLoading ? "Processing..." : actionDialog?.type === "confirm" ? "Confirm" : "Cancel Order"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
