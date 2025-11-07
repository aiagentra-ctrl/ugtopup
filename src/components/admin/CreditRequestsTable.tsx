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
import { CheckCircle, XCircle, Eye, RefreshCw, Search, ExternalLink, Copy } from "lucide-react";
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

      if (error) throw error;
      setRequests(data || []);
    } catch (error) {
      console.error("Error loading requests:", error);
      toast.error("Failed to load credit requests");
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
      const { error } = await supabase.rpc(rpcFunction, {
        request_id: selectedRequest.id,
        admin_remarks_text: adminRemarks || null,
      });

      if (error) throw error;

      toast.success(
        actionType === "approve"
          ? "Credit request approved! Credits added to user balance."
          : "Credit request rejected"
      );
      setShowActionModal(false);
      setAdminRemarks("");
      loadRequests();
    } catch (error: any) {
      console.error("Error processing request:", error);
      toast.error(error.message || "Failed to process request");
    } finally {
      setProcessing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { variant: any; className: string }> = {
      pending: { variant: "outline", className: "border-orange-500 text-orange-600 bg-orange-50" },
      confirmed: { variant: "default", className: "bg-green-500 hover:bg-green-600" },
      rejected: { variant: "destructive", className: "" },
    };

    const c = config[status] || config.pending;
    return (
      <Badge variant={c.variant} className={c.className}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  return (
    <div className="space-y-6">
      <Card className="shadow-md">
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-2xl">Credit Requests Management</CardTitle>
              <p className="text-sm text-slate-500 mt-1">Review and process user credit top-up requests</p>
            </div>
            <Button onClick={loadRequests} disabled={loading} variant="outline" size="sm">
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search by email or name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          <div className="border rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-slate-50">
                  <TableRow>
                    <TableHead className="font-semibold">User</TableHead>
                    <TableHead className="font-semibold">Amount / Credits</TableHead>
                    <TableHead className="font-semibold">Timestamp</TableHead>
                    <TableHead className="font-semibold">Remarks</TableHead>
                    <TableHead className="font-semibold">Screenshot</TableHead>
                    <TableHead className="font-semibold">Status</TableHead>
                    <TableHead className="font-semibold text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-12">
                        <RefreshCw className="animate-spin h-8 w-8 mx-auto text-blue-500 mb-2" />
                        <p className="text-sm text-slate-500">Loading requests...</p>
                      </TableCell>
                    </TableRow>
                  ) : filteredRequests.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-12 text-slate-500">
                        No credit requests found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredRequests.map((request) => (
                      <TableRow key={request.id} className="hover:bg-slate-50">
                        <TableCell>
                          <div>
                            <p className="font-medium text-slate-900">{request.user_name || "N/A"}</p>
                            <p className="text-xs text-slate-500">{request.user_email}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-semibold text-green-600">₹{request.amount}</p>
                            <p className="text-xs text-slate-500">{request.credits} credits</p>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-slate-600">
                          {new Date(request.created_at).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <p className="text-sm text-slate-600 max-w-[200px] truncate" title={request.remarks || ""}>
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
                            <span className="text-xs text-slate-400">No screenshot</span>
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
                          {request.status !== "pending" && request.admin_remarks && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setSelectedRequest(request);
                                setShowActionModal(true);
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Modal */}
      <Dialog open={showActionModal} onOpenChange={setShowActionModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {selectedRequest?.status === "pending"
                ? actionType === "approve"
                  ? "Approve Credit Request"
                  : "Reject Credit Request"
                : "Request Details"}
            </DialogTitle>
            <DialogDescription>
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
                <Label htmlFor="admin-remarks">
                  Admin Remarks {actionType === "reject" && <span className="text-red-500">*</span>}
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
                />
              </div>
            )}

            {selectedRequest?.status !== "pending" && selectedRequest?.admin_remarks && (
              <div>
                <Label>Admin Remarks</Label>
                <p className="mt-2 p-3 bg-slate-50 rounded text-sm">{selectedRequest.admin_remarks}</p>
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
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Payment Screenshot</DialogTitle>
          </DialogHeader>
          {selectedRequest?.screenshot_url && (
            <div className="space-y-4">
              <img
                src={selectedRequest.screenshot_url}
                alt="Payment screenshot"
                className="w-full rounded-lg border"
              />
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
    </div>
  );
}
