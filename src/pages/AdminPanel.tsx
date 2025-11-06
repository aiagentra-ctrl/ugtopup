import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Header } from '@/components/Header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { CheckCircle2, XCircle, Clock, ExternalLink } from 'lucide-react';

interface PaymentRequest {
  id: string;
  user_id: string;
  amount: number;
  credits: number;
  remarks: string | null;
  screenshot_url: string | null;
  status: 'pending' | 'confirmed' | 'rejected';
  created_at: string;
  user_email: string;
  user_name: string | null;
  admin_remarks: string | null;
}

const AdminPanel = () => {
  const [requests, setRequests] = useState<PaymentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [adminRemarks, setAdminRemarks] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    loadPaymentRequests();
  }, []);

  const loadPaymentRequests = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('payment_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRequests(data || []);
    } catch (error: any) {
      console.error('Error loading payment requests:', error);
      toast.error('Failed to load payment requests');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (requestId: string) => {
    try {
      setActionLoading(requestId);
      const { data, error } = await supabase.rpc('approve_payment_request', {
        request_id: requestId,
        admin_remarks_text: adminRemarks[requestId] || null
      });

      if (error) throw error;

      toast.success('Payment request approved! Credits added to user balance.');
      await loadPaymentRequests();
      setAdminRemarks({ ...adminRemarks, [requestId]: '' });
    } catch (error: any) {
      console.error('Error approving request:', error);
      toast.error(error.message || 'Failed to approve payment request');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (requestId: string) => {
    const remarks = adminRemarks[requestId]?.trim();
    if (!remarks) {
      toast.error('Please provide a reason for rejection');
      return;
    }

    try {
      setActionLoading(requestId);
      const { data, error } = await supabase.rpc('reject_payment_request', {
        request_id: requestId,
        admin_remarks_text: remarks
      });

      if (error) throw error;

      toast.success('Payment request rejected');
      await loadPaymentRequests();
      setAdminRemarks({ ...adminRemarks, [requestId]: '' });
    } catch (error: any) {
      console.error('Error rejecting request:', error);
      toast.error(error.message || 'Failed to reject payment request');
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="gap-1"><Clock className="h-3 w-3" /> Pending</Badge>;
      case 'confirmed':
        return <Badge variant="default" className="gap-1 bg-green-600"><CheckCircle2 className="h-3 w-3" /> Confirmed</Badge>;
      case 'rejected':
        return <Badge variant="destructive" className="gap-1"><XCircle className="h-3 w-3" /> Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const pendingRequests = requests.filter(r => r.status === 'pending');
  const processedRequests = requests.filter(r => r.status !== 'pending');

  if (loading) {
    return (
      <>
        <Header />
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading payment requests...</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gradient-to-b from-background to-muted/20 py-12 px-4">
        <div className="container max-w-7xl mx-auto space-y-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">Admin Panel</h1>
            <p className="text-muted-foreground">Manage payment requests and credit approvals</p>
          </div>

          {/* Pending Requests */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">
              Pending Requests ({pendingRequests.length})
            </h2>
            
            {pendingRequests.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  No pending payment requests
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {pendingRequests.map((request) => (
                  <Card key={request.id} className="border-2 border-orange-500/20">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-xl">
                            ₹{request.amount} → {request.credits} Credits
                          </CardTitle>
                          <CardDescription className="mt-1">
                            From: {request.user_name || request.user_email} • {new Date(request.created_at).toLocaleString()}
                          </CardDescription>
                        </div>
                        {getStatusBadge(request.status)}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {request.remarks && (
                        <div>
                          <Label className="text-sm font-medium">User Remarks</Label>
                          <p className="text-sm text-muted-foreground mt-1">{request.remarks}</p>
                        </div>
                      )}
                      
                      {request.screenshot_url && (
                        <div>
                          <Label className="text-sm font-medium mb-2 block">Payment Screenshot</Label>
                          <a 
                            href={request.screenshot_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
                          >
                            <ExternalLink className="h-4 w-4" />
                            View Screenshot
                          </a>
                        </div>
                      )}

                      <div className="space-y-2">
                        <Label htmlFor={`remarks-${request.id}`}>Admin Remarks (Optional for approval, Required for rejection)</Label>
                        <Textarea
                          id={`remarks-${request.id}`}
                          placeholder="Add remarks here..."
                          value={adminRemarks[request.id] || ''}
                          onChange={(e) => setAdminRemarks({ ...adminRemarks, [request.id]: e.target.value })}
                          rows={3}
                        />
                      </div>

                      <div className="flex gap-3">
                        <Button
                          onClick={() => handleApprove(request.id)}
                          disabled={actionLoading === request.id}
                          className="flex-1 bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle2 className="h-4 w-4 mr-2" />
                          {actionLoading === request.id ? 'Approving...' : 'Approve & Add Credits'}
                        </Button>
                        <Button
                          variant="destructive"
                          onClick={() => handleReject(request.id)}
                          disabled={actionLoading === request.id}
                          className="flex-1"
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          {actionLoading === request.id ? 'Rejecting...' : 'Reject'}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </section>

          {/* Processed Requests */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">
              Processed Requests ({processedRequests.length})
            </h2>
            
            {processedRequests.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  No processed requests yet
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {processedRequests.map((request) => (
                  <Card key={request.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg">
                            ₹{request.amount} → {request.credits} Credits
                          </CardTitle>
                          <CardDescription className="mt-1">
                            From: {request.user_name || request.user_email} • {new Date(request.created_at).toLocaleString()}
                          </CardDescription>
                        </div>
                        {getStatusBadge(request.status)}
                      </div>
                    </CardHeader>
                    {request.admin_remarks && (
                      <CardContent>
                        <Label className="text-sm font-medium">Admin Remarks</Label>
                        <p className="text-sm text-muted-foreground mt-1">{request.admin_remarks}</p>
                      </CardContent>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
    </>
  );
};

export default AdminPanel;
