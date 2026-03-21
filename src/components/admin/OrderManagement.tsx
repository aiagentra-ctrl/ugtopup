import { useEffect, useState, useMemo, useCallback } from "react";
import { fetchAllOrders, confirmOrder, cancelOrder, OrderFilters } from "@/lib/adminApi";
import { Order } from "@/lib/orderApi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CheckCircle, XCircle, Eye, RefreshCw, Filter, RotateCcw, Zap, Search, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const OrderManagement = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [adminRemarks, setAdminRemarks] = useState("");
  const [cancellationReason, setCancellationReason] = useState("");
  const [processing, setProcessing] = useState(false);
  
  // Filters
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  // Search
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const filters: OrderFilters = {};
      if (statusFilter !== "all") {
        filters.status = statusFilter as any;
      }
      if (categoryFilter !== "all") {
        filters.category = categoryFilter as any;
      }
      
      const data = await fetchAllOrders(filters);
      setOrders(data);
    } catch (error) {
      console.error("Error loading orders:", error);
      toast.error("Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  // Client-side filtered orders based on search
  const filteredOrders = useMemo(() => {
    if (!debouncedSearch.trim()) return orders;
    const q = debouncedSearch.toLowerCase().trim();
    return orders.filter((order) => {
      const orderNumber = (order.order_number || "").toLowerCase();
      const productName = (order.product_name || "").toLowerCase();
      const packageName = (order.package_name || "").toLowerCase();
      const userName = (order.user_name || "").toLowerCase();
      const userEmail = (order.user_email || "").toLowerCase();
      const price = String(order.price || "");
      const status = (order.status || "").toLowerCase();
      const date = new Date(order.created_at).toLocaleDateString().toLowerCase();
      const category = (order.product_category || "").toLowerCase();

      return (
        orderNumber.includes(q) ||
        productName.includes(q) ||
        packageName.includes(q) ||
        userName.includes(q) ||
        userEmail.includes(q) ||
        price.includes(q) ||
        status.includes(q) ||
        date.includes(q) ||
        category.includes(q)
      );
    });
  }, [orders, debouncedSearch]);

  useEffect(() => {
    loadOrders();

    const channel = supabase
      .channel("admin-orders")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "product_orders",
        },
        () => {
          loadOrders();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [statusFilter, categoryFilter]);

  const handleConfirmOrder = async () => {
    if (!selectedOrder) return;
    
    setProcessing(true);
    try {
      await confirmOrder(selectedOrder.id, adminRemarks || undefined);
      toast.success("Order confirmed successfully");
      setShowConfirmModal(false);
      setAdminRemarks("");
      loadOrders();
    } catch (error: any) {
      console.error("Error confirming order:", error);
      toast.error(error.message || "Failed to confirm order");
    } finally {
      setProcessing(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!selectedOrder || !cancellationReason.trim()) {
      toast.error("Cancellation reason is required");
      return;
    }
    
    setProcessing(true);
    try {
      await cancelOrder(selectedOrder.id, cancellationReason);
      toast.success("Order canceled successfully");
      setShowCancelModal(false);
      setCancellationReason("");
      loadOrders();
    } catch (error: any) {
      console.error("Error canceling order:", error);
      toast.error(error.message || "Failed to cancel order");
    } finally {
      setProcessing(false);
    }
  };

  const handleRetryMLOrder = async (order: Order) => {
    setProcessing(true);
    try {
      toast.info("Retrying ML order processing...");
      
      const { data, error } = await supabase.functions.invoke('process-ml-order', {
        body: { order_id: order.id }
      });
      
      if (error) {
        throw new Error(error.message);
      }
      
      if (data?.success) {
        toast.success("Order processed successfully!");
        loadOrders();
      } else {
        toast.error(data?.error || "Failed to process order");
      }
    } catch (error: any) {
      console.error("Error retrying ML order:", error);
      toast.error(error.message || "Failed to retry order");
    } finally {
      setProcessing(false);
    }
  };

  const isAutoProcessedCategory = (category: string) => {
    return category === 'mobile_legends';
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: "default" | "secondary" | "destructive" | "outline", className: string }> = {
      pending: { variant: "outline", className: "border-yellow-500 text-yellow-600" },
      confirmed: { variant: "default", className: "bg-green-500" },
      canceled: { variant: "destructive", className: "" },
      processing: { variant: "secondary", className: "bg-blue-500 text-white" },
      completed: { variant: "default", className: "bg-green-600" },
    };
    
    const config = variants[status] || variants.pending;
    return (
      <Badge variant={config.variant} className={config.className}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Order Management</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Manage all product orders from users
              </p>
            </div>
            <Button onClick={loadOrders} disabled={loading} variant="outline" size="sm">
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Search Bar */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by order ID, product, user, email, price, status, date..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-10"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-4 mb-4">
            <div className="flex-1 min-w-[150px]">
              <Label className="text-xs">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="canceled">Canceled</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1 min-w-[150px]">
              <Label className="text-xs">Category</Label>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Products</SelectItem>
                  <SelectItem value="freefire">Free Fire</SelectItem>
                  <SelectItem value="tiktok">TikTok</SelectItem>
                  <SelectItem value="netflix">Netflix</SelectItem>
                  <SelectItem value="garena">Garena</SelectItem>
                  <SelectItem value="youtube">YouTube</SelectItem>
                  <SelectItem value="smilecoin">Smile Coin</SelectItem>
                  <SelectItem value="chatgpt">ChatGPT</SelectItem>
                  <SelectItem value="unipin">Unipin</SelectItem>
                  <SelectItem value="mobile_legends">Mobile Legends</SelectItem>
                  <SelectItem value="roblox">Roblox</SelectItem>
                  <SelectItem value="pubg">PUBG</SelectItem>
                  <SelectItem value="design">Design Services</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Result count */}
          {debouncedSearch && (
            <p className="text-xs text-muted-foreground mb-2">
              Showing {filteredOrders.length} of {orders.length} orders
            </p>
          )}

          {/* Orders Table */}
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <RefreshCw className="animate-spin h-6 w-6 mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">Loading orders...</p>
                    </TableCell>
                  </TableRow>
                ) : filteredOrders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      {debouncedSearch ? `No orders matching "${debouncedSearch}"` : "No orders found"}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredOrders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-mono text-sm">{order.order_number}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{order.product_name}</p>
                          <p className="text-xs text-muted-foreground">{order.package_name}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="text-sm">{order.user_name || "Unknown"}</p>
                          <p className="text-xs text-muted-foreground">{order.user_email}</p>
                        </div>
                      </TableCell>
                      <TableCell className="font-semibold">₹{order.price}</TableCell>
                      <TableCell>{getStatusBadge(order.status)}</TableCell>
                      <TableCell className="text-sm">
                        {new Date(order.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2 flex-wrap">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setSelectedOrder(order);
                              setShowDetailsModal(true);
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {/* Show Retry button for failed/canceled ML orders */}
                          {isAutoProcessedCategory(order.product_category) && 
                           (order.status === "canceled" || order.status === "pending") && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-blue-500 text-blue-600 hover:bg-blue-50"
                              onClick={() => handleRetryMLOrder(order)}
                              disabled={processing}
                            >
                              <RotateCcw className="h-4 w-4 mr-1" />
                              Retry API
                            </Button>
                          )}
                          
                          {/* Show auto-process indicator for ML orders */}
                          {isAutoProcessedCategory(order.product_category) && order.status === "processing" && (
                            <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                              <Zap className="h-3 w-3 mr-1" />
                              Auto-Processing
                            </Badge>
                          )}
                          
                          {/* Only show confirm/cancel for non-auto-processed orders */}
                          {order.status === "pending" && !isAutoProcessedCategory(order.product_category) && (
                            <>
                              <Button
                                size="sm"
                                variant="default"
                                className="bg-green-600 hover:bg-green-700"
                                onClick={() => {
                                  setSelectedOrder(order);
                                  setShowConfirmModal(true);
                                }}
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Confirm
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => {
                                  setSelectedOrder(order);
                                  setShowCancelModal(true);
                                }}
                              >
                                <XCircle className="h-4 w-4 mr-1" />
                                Cancel
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
        </CardContent>
      </Card>

      {/* Order Details Modal */}
      <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Order Details</DialogTitle>
            <DialogDescription>View complete order information</DialogDescription>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground">Order Number</Label>
                  <p className="font-mono">{selectedOrder.order_number}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Status</Label>
                  <div className="mt-1">{getStatusBadge(selectedOrder.status)}</div>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Product</Label>
                  <p>{selectedOrder.product_name}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Package</Label>
                  <p>{selectedOrder.package_name}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Total Items</Label>
                  <p>{selectedOrder.quantity?.toLocaleString()}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Total Price</Label>
                  <p className="font-semibold">₹{selectedOrder.price?.toLocaleString()}</p>
                </div>
                {(selectedOrder.product_details as any)?.purchase_quantity > 1 && (
                  <>
                    <div>
                      <Label className="text-xs text-muted-foreground">Purchase Qty</Label>
                      <p className="text-primary font-semibold">{(selectedOrder.product_details as any)?.purchase_quantity}×</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Unit Price</Label>
                      <p>₹{(selectedOrder.product_details as any)?.unit_price?.toLocaleString()}</p>
                    </div>
                  </>
                )}
                <div>
                  <Label className="text-xs text-muted-foreground">User Name</Label>
                  <p>{selectedOrder.user_name || "N/A"}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">User Email</Label>
                  <p>{selectedOrder.user_email}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Created At</Label>
                  <p>{new Date(selectedOrder.created_at).toLocaleString()}</p>
                </div>
                {selectedOrder.confirmed_at && (
                  <div>
                    <Label className="text-xs text-muted-foreground">Confirmed At</Label>
                    <p>{new Date(selectedOrder.confirmed_at).toLocaleString()}</p>
                  </div>
                )}
              </div>
              
              <div>
                <Label className="text-xs text-muted-foreground">Product Details</Label>
                <pre className="mt-1 p-3 bg-muted rounded text-xs overflow-auto">
                  {JSON.stringify(selectedOrder.product_details, null, 2)}
                </pre>
              </div>

              {selectedOrder.admin_remarks && (
                <div>
                  <Label className="text-xs text-muted-foreground">Admin Remarks</Label>
                  <p className="mt-1 p-3 bg-muted rounded text-sm">{selectedOrder.admin_remarks}</p>
                </div>
              )}

              {selectedOrder.cancellation_reason && (
                <div>
                  <Label className="text-xs text-muted-foreground">Cancellation Reason</Label>
                  <p className="mt-1 p-3 bg-destructive/10 rounded text-sm">{selectedOrder.cancellation_reason}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Confirm Order Modal */}
      <Dialog open={showConfirmModal} onOpenChange={setShowConfirmModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Order</DialogTitle>
            <DialogDescription>
              This will deduct ₹{selectedOrder?.price} from the user's balance
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="remarks">Admin Remarks (Optional)</Label>
              <Textarea
                id="remarks"
                value={adminRemarks}
                onChange={(e) => setAdminRemarks(e.target.value)}
                placeholder="Add any remarks about this order..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleConfirmOrder} disabled={processing}>
              {processing ? "Processing..." : "Confirm Order"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Order Modal */}
      <Dialog open={showCancelModal} onOpenChange={setShowCancelModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Order</DialogTitle>
            <DialogDescription>
              Please provide a reason for canceling this order
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="reason">Cancellation Reason *</Label>
              <Textarea
                id="reason"
                value={cancellationReason}
                onChange={(e) => setCancellationReason(e.target.value)}
                placeholder="Explain why this order is being canceled..."
                rows={3}
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCancelModal(false)}>
              Back
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancelOrder}
              disabled={processing || !cancellationReason.trim()}
            >
              {processing ? "Processing..." : "Cancel Order"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
