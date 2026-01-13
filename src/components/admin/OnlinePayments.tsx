import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { CreditCard, TrendingUp, Clock, CheckCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";

interface PaymentTransaction {
  id: string;
  identifier: string;
  user_id: string;
  user_email: string;
  amount: number;
  credits: number;
  status: string;
  payment_gateway: string | null;
  api_transaction_id: string | null;
  created_at: string;
  completed_at: string | null;
  profiles?: {
    username: string | null;
    full_name: string | null;
  };
}

export function OnlinePayments() {
  const [transactions, setTransactions] = useState<PaymentTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalSuccessful: 0,
    totalAmount: 0,
    todayAmount: 0,
    todayCount: 0,
  });

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("payment_transactions")
        .select(`
          *,
          profiles:user_id (username, full_name)
        `)
        .eq("status", "completed")
        .order("completed_at", { ascending: false })
        .limit(100);

      if (error) throw error;

      const txns = (data || []) as PaymentTransaction[];
      setTransactions(txns);

      // Calculate stats
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const todayTxns = txns.filter(t => 
        t.completed_at && new Date(t.completed_at) >= today
      );

      setStats({
        totalSuccessful: txns.length,
        totalAmount: txns.reduce((sum, t) => sum + t.amount, 0),
        todayAmount: todayTxns.reduce((sum, t) => sum + t.amount, 0),
        todayCount: todayTxns.length,
      });
    } catch (error) {
      console.error("Error fetching transactions:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();

    // Real-time subscription for new completed payments
    const channel = supabase
      .channel("online-payments-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "payment_transactions",
        },
        (payload) => {
          console.log("Payment transaction update:", payload);
          fetchTransactions();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Completed</Badge>;
      case "pending":
        return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Pending</Badge>;
      case "failed":
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Failed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardContent className="pt-6">
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Successful</p>
                <p className="text-2xl font-bold text-green-400">{stats.totalSuccessful}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500/50" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-bold text-blue-400">Rs. {stats.totalAmount.toLocaleString()}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-blue-500/50" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500/10 to-purple-500/5 border-purple-500/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Today's Revenue</p>
                <p className="text-2xl font-bold text-purple-400">Rs. {stats.todayAmount.toLocaleString()}</p>
              </div>
              <Clock className="h-8 w-8 text-purple-500/50" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-500/10 to-orange-500/5 border-orange-500/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Today's Payments</p>
                <p className="text-2xl font-bold text-orange-400">{stats.todayCount}</p>
              </div>
              <CreditCard className="h-8 w-8 text-orange-500/50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Transactions Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Online Instant Payments
            </CardTitle>
            <CardDescription>
              All successful payments via API Nepal gateway
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={fetchTransactions}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No successful online payments yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Transaction ID</TableHead>
                    <TableHead>Username</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Credits</TableHead>
                    <TableHead>Gateway</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Completed At</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((txn) => (
                    <TableRow key={txn.id}>
                      <TableCell className="font-mono text-xs">
                        <div>
                          <p className="font-medium">{txn.identifier}</p>
                          {txn.api_transaction_id && (
                            <p className="text-muted-foreground text-[10px]">
                              {txn.api_transaction_id}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        {txn.profiles?.username || txn.profiles?.full_name || "N/A"}
                      </TableCell>
                      <TableCell>
                        <div className="max-w-[180px] truncate text-muted-foreground">
                          {txn.user_email}
                        </div>
                      </TableCell>
                      <TableCell className="font-semibold text-green-400">
                        Rs. {txn.amount.toLocaleString()}
                      </TableCell>
                      <TableCell>{txn.credits}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {txn.payment_gateway || "N/A"}
                        </Badge>
                      </TableCell>
                      <TableCell>{getStatusBadge(txn.status)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {txn.completed_at
                          ? format(new Date(txn.completed_at), "MMM dd, yyyy HH:mm")
                          : "-"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
