import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
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
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CheckCircle, XCircle, Eye, RefreshCw, Search, ExternalLink, CreditCard } from "lucide-react";
import { toast } from "sonner";

interface PaymentRequest {
  id: string;
  user_email: string;
  user_name: string | null;
  amount: number;
  credits: number;
  remarks: string | null;
  screenshot_url: string | null;
  status: string;
  created_at: string;
  admin_remarks: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
}

export function CreditRequestsTable() {
  const [requests, setRequests] = useState<PaymentRequest[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<PaymentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRequest, setSelectedRequest] = useState<PaymentRequest | null>(null);
  const [showActionModal, setShowActionModal] = useState(false);
  const [actionType, setActionType] = useState<"approve" | "reject">("approve");
  const [adminRemarks, setAdminRemarks] = useState("");
  const [processing, setProcessing] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);

  const loadRequests = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("payment_requests")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error loading requests:", error);
        toast.error("Failed to load credit requests. Please check your admin permissions.");
        setRequests([]);
      } else {
        setRequests(data || []);
      }
    } catch (error) {
      console.error("Error loading requests:", error);
      toast.error("Failed to load credit requests");
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();

    const channel = supabase
      .channel("credit-requests")
      .on("postgres_changes", { event: "*", schema: "public", table: "payment_requests" }, loadRequests)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    let filtered = requests;

    if (statusFilter !== "all") {
      filtered = filtered.filter((r) => r.status === statusFilter);
    }

    if (searchQuery) {
      filtered = filtered.filter(
        (r) =>
          r.user_email.toLowerCase().includes(searchQuery.toLowerCase()) ||
          r.user_name?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredRequests(filtered);
  }, [requests, statusFilter, searchQuery]);

  const handleAction = async () => {
    if (!selectedRequest) return;

    if (actionType === "reject" && !adminRemarks.trim()) {
      toast.error("Please provide a reason for rejection");
      return;
    }

    setProcessing(true);
    try {
      const rpcFunction = actionType === "approve" ? "approve_payment_request" : "reject_payment_request";
      const { data, error } = await supabase.rpc(rpcFunction, {
        request_id: selectedRequest.id,
        admin_remarks_text: adminRemarks || null,
      });

      if (error) throw error;

      // Only show success if the RPC function returned success
      const result = data as { success: boolean; message: string };
      if (result && result.success) {
        toast.success(
          actionType === "approve"
            ? "Credit request approved! Credits added to user balance."
            : "Credit request rejected successfully"
        );
      } else {
        toast.error("Failed to process credit request");
      }

      setShowActionModal(false);
      setAdminRemarks("");
      loadRequests();
    } catch (error: any) {
      console.error("Error processing request:", error);
      toast.error(error.message || "Failed to process credit request");
    } finally {
      setProcessing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { className: string }> = {
      pending: { className: "bg-orange-500/10 text-orange-400 border-orange-500/30" },
      confirmed: { className: "bg-green-500/10 text-green-400 border-green-500/30" },
      rejected: { className: "bg-red-500/10 text-red-400 border-red-500/30" },
    };

    const c = config[status] || config.pending;
    return (
      <Badge variant="outline" className={c.className}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  return (
    <Card className="bg-card/50 backdrop-blur-xl border-border">
      <CardHeader>
        <CardTitle className="text-foreground">Credit Requests Management</CardTitle>
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mt-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by email or name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-muted/50 border-border"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-40 bg-muted/50 border-border">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border">
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="confirmed">Confirmed</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={loadRequests} variant="outline" className="w-full sm:w-auto">
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent className="px-0 sm:px-6">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted/50 flex items-center justify-center">
              <CreditCard className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="font-medium">No credit requests found</p>
            <p className="text-sm mt-1">Try adjusting your filters</p>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden lg:block overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead className="text-muted-foreground">User</TableHead>
                    <TableHead className="text-muted-foreground">Amount / Credits</TableHead>
                    <TableHead className="text-muted-foreground">Timestamp</TableHead>
                    <TableHead className="text-muted-foreground">Remarks</TableHead>
                    <TableHead className="text-muted-foreground">Screenshot</TableHead>
                    <TableHead className="text-muted-foreground">Status</TableHead>
                    <TableHead className="text-muted-foreground text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRequests.map((request) => (
                    <TableRow key={request.id} className="border-border hover:bg-muted/50 transition-colors">
                      <TableCell>
                        <div>
                          <p className="font-medium text-foreground">{request.user_name || "N/A"}</p>
                          <p className="text-xs text-muted-foreground">{request.user_email}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-semibold text-green-400">₹{request.amount}</p>
                          <p className="text-xs text-muted-foreground">{request.credits} credits</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(request.created_at).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <p className="text-sm text-foreground max-w-[200px] truncate" title={request.remarks || ""}>
                          {request.remarks || "-"}
                        </p>
                      </TableCell>
                      <TableCell>
                        {request.screenshot_url ? (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setSelectedRequest(request);
                              setShowImageModal(true);
                            }}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                        ) : (
                          <span className="text-xs text-muted-foreground">No screenshot</span>
                        )}
                      </TableCell>
                      <TableCell>{getStatusBadge(request.status)}</TableCell>
                      <TableCell className="text-right">
                        {request.status === "pending" && (
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              onClick={() => {
                                setSelectedRequest(request);
                                setActionType("approve");
                                setShowActionModal(true);
                              }}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => {
                                setSelectedRequest(request);
                                setActionType("reject");
                                setShowActionModal(true);
                              }}
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Reject
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Mobile Card View */}
            <div className="lg:hidden space-y-4 px-4">
              {filteredRequests.map((request) => (
                <Card key={request.id} className="bg-muted/30 border-border">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium text-foreground">{request.user_name || "N/A"}</p>
                        <p className="text-sm text-muted-foreground">{request.user_email}</p>
                      </div>
                      {getStatusBadge(request.status)}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3 pt-3 border-t border-border">
                      <div>
                        <p className="text-xs text-muted-foreground">Amount</p>
                        <p className="font-semibold text-green-400">₹{request.amount}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Credits</p>
                        <p className="font-medium text-foreground">{request.credits}</p>
                      </div>
                    </div>

                    <div>
                      <p className="text-xs text-muted-foreground">Timestamp</p>
                      <p className="text-sm text-foreground">{new Date(request.created_at).toLocaleString()}</p>
                    </div>

                    {request.remarks && (
                      <div>
                        <p className="text-xs text-muted-foreground">Remarks</p>
                        <p className="text-sm text-foreground">{request.remarks}</p>
                      </div>
                    )}

                    {request.screenshot_url && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedRequest(request);
                          setShowImageModal(true);
                        }}
                        className="w-full"
                      >
                        View Screenshot
                      </Button>
                    )}

                    {request.status === "pending" && (
                      <div className="flex gap-2 pt-2">
                        <Button
                          size="sm"
                          onClick={() => {
                            setSelectedRequest(request);
                            setActionType("approve");
                            setShowActionModal(true);
                          }}
                          className="flex-1 bg-green-600 hover:bg-green-700"
                        >
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => {
                            setSelectedRequest(request);
                            setActionType("reject");
                            setShowActionModal(true);
                          }}
                          className="flex-1"
                        >
                          Reject
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}
      </CardContent>

      {/* Action Modal */}
      <Dialog open={showActionModal} onOpenChange={setShowActionModal}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">
              {selectedRequest?.status === "pending"
                ? actionType === "approve"
                  ? "Approve Credit Request"
                  : "Reject Credit Request"
                : "Request Details"}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              {selectedRequest?.status === "pending"
                ? actionType === "approve"
                  ? `This will add ₹${selectedRequest?.amount} (${selectedRequest?.credits} credits) to the user's balance.`
                  : "Please provide a reason for rejection."
                : "View request details and admin remarks."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {selectedRequest?.status === "pending" && (
              <div>
                <Label htmlFor="admin-remarks" className="text-foreground">
                  Admin Remarks {actionType === "reject" && <span className="text-red-400">*</span>}
                </Label>
                <Textarea
                  id="admin-remarks"
                  value={adminRemarks}
                  onChange={(e) => setAdminRemarks(e.target.value)}
                  placeholder={
                    actionType === "approve"
                      ? "Add any remarks (optional)..."
                      : "Explain why this request is being rejected..."
                  }
                  rows={4}
                  className="mt-2 bg-muted/50 border-border"
                />
              </div>
            )}

            {selectedRequest?.status !== "pending" && selectedRequest?.admin_remarks && (
              <div>
                <Label className="text-foreground">Admin Remarks</Label>
                <p className="mt-2 p-3 bg-muted/50 rounded text-sm text-foreground">{selectedRequest.admin_remarks}</p>
              </div>
            )}
          </div>

          {selectedRequest?.status === "pending" && (
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowActionModal(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleAction}
                disabled={processing}
                className={actionType === "approve" ? "bg-green-600 hover:bg-green-700" : ""}
                variant={actionType === "reject" ? "destructive" : "default"}
              >
                {processing ? "Processing..." : actionType === "approve" ? "Approve" : "Reject"}
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>

      {/* Image Modal */}
      <Dialog open={showImageModal} onOpenChange={setShowImageModal}>
        <DialogContent className="max-w-3xl bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">Payment Screenshot</DialogTitle>
          </DialogHeader>
          {selectedRequest?.screenshot_url && (
            <div className="space-y-4">
              <div className="flex justify-center bg-muted/30 rounded-lg p-4">
                <img
                  src={selectedRequest.screenshot_url}
                  alt="Payment screenshot"
                  className="max-w-full h-auto rounded-lg border border-border shadow-lg"
                />
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(selectedRequest.screenshot_url!, "_blank")}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Open in New Tab
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}
