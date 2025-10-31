import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, CheckCircle2, XCircle } from "lucide-react";
import { format } from "date-fns";
import { type CreditRequest } from "@/lib/creditApi";

interface CreditRequestHistoryProps {
  requests: CreditRequest[];
  loading: boolean;
}

export const CreditRequestHistory = ({ requests, loading }: CreditRequestHistoryProps) => {

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4" />;
      case 'approved':
        return <CheckCircle2 className="w-4 h-4" />;
      case 'rejected':
        return <XCircle className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'pending':
        return 'status-badge status-pending';
      case 'approved':
        return 'status-badge status-approved';
      case 'rejected':
        return 'status-badge status-rejected';
      default:
        return 'status-badge';
    }
  };

  if (loading) {
    return (
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-lg">Credit Request History</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Loading...</p>
        </CardContent>
      </Card>
    );
  }

  if (requests.length === 0) {
    return (
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-lg">Credit Request History</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No credit requests yet. Click "+ Top-Up" to make your first request.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="text-lg">Credit Request History</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {requests.map((request) => (
          <div
            key={request.request_id}
            className="flex items-center justify-between p-4 bg-background/50 rounded-lg border border-border hover:bg-background/70 transition-colors"
          >
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-1">
                <p className="font-semibold text-foreground">
                  {request.credits} Cr.
                </p>
                <span className={getStatusClass(request.status)}>
                  {getStatusIcon(request.status)}
                  {request.status}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                {format(new Date(request.created_at), 'MMM dd, yyyy - hh:mm a')}
              </p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};
