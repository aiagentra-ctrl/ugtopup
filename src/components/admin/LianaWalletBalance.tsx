import { useState, useEffect, useCallback } from "react";
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
  RefreshCw,
  Wallet,
  AlertTriangle,
  Clock,
  TrendingDown,
  Activity,
  Coins,
  ShieldAlert,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

interface WalletData {
  balance?: number;
  coins?: number;
  amount?: number;
  currency?: string;
  status?: string;
  message?: string;
  [key: string]: unknown;
}

interface WalletLog {
  id: string;
  order_id: string | null;
  liana_order_id: string | null;
  order_number: string | null;
  action: string;
  coins_used: number;
  balance_before: number | null;
  balance_after: number | null;
  api_status: string | null;
  error_message: string | null;
  created_at: string;
}

interface WalletSummary {
  total_logs: number;
  coins_used_today: number;
  orders_today: number;
  failures_today: number;
}

export function LianaWalletBalance() {
  const [walletData, setWalletData] = useState<WalletData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const [logs, setLogs] = useState<WalletLog[]>([]);
  const [summary, setSummary] = useState<WalletSummary | null>(null);
  const [logsLoading, setLogsLoading] = useState(false);
  const [showLogs, setShowLogs] = useState(false);

  const fetchBalance = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: fnError } = await supabase.functions.invoke("process-ml-order", {
        body: { action: "check-balance" },
      });

      if (fnError) throw new Error(fnError.message || "Edge function error");
      if (data?.error) throw new Error(data.error);

      const resolved = data?.balance ?? data;
      if (resolved?.status === "error") {
        throw new Error(resolved.message || "Could not fetch balance");
      }

      setWalletData(resolved);
      setLastChecked(new Date());
    } catch (err: any) {
      console.error("Error fetching wallet balance:", err);
      setError(err.message || "Failed to fetch wallet balance");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchLogs = useCallback(async () => {
    setLogsLoading(true);
    try {
      const { data, error: fnError } = await supabase.functions.invoke("process-ml-order", {
        body: { action: "wallet-logs" },
      });

      if (fnError) throw new Error(fnError.message);
      if (data?.success) {
        setLogs(data.logs || []);
        setSummary(data.summary || null);
      }
    } catch (err: any) {
      console.error("Error fetching wallet logs:", err);
      toast.error("Failed to fetch wallet logs");
    } finally {
      setLogsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBalance();
  }, [fetchBalance]);

  useEffect(() => {
    if (showLogs) fetchLogs();
  }, [showLogs, fetchLogs]);

  const balance = walletData?.balance ?? walletData?.coins ?? walletData?.amount;
  const balanceNum = typeof balance === "number" ? balance : parseFloat(String(balance || "0"));
  const isLow = !error && walletData && balanceNum < 500;
  const isCritical = !error && walletData && balanceNum < 100;

  const actionConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
    order_completed: { label: "Completed", color: "text-green-500", icon: <CheckCircle className="h-3 w-3" /> },
    order_failed: { label: "Failed", color: "text-destructive", icon: <XCircle className="h-3 w-3" /> },
    balance_check: { label: "Balance Check", color: "text-muted-foreground", icon: <Wallet className="h-3 w-3" /> },
  };

  return (
    <div className="space-y-4">
      {/* Main Balance Card */}
      <Card className="border-border">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Wallet className="h-4 w-4 text-primary" />
            Liana API Wallet
          </CardTitle>
          <Button variant="ghost" size="icon" onClick={fetchBalance} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </CardHeader>
        <CardContent>
          {loading && !walletData && !error ? (
            <div className="animate-pulse space-y-2">
              <div className="h-8 bg-muted rounded w-1/2" />
              <div className="h-4 bg-muted rounded w-3/4" />
            </div>
          ) : error ? (
            <div className="space-y-3">
              <p className="text-sm text-destructive">⚠️ {error}</p>
              <Button variant="outline" size="sm" onClick={fetchBalance} disabled={loading}>
                <RefreshCw className={`h-3 w-3 mr-2 ${loading ? "animate-spin" : ""}`} />
                Retry
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-foreground">
                  {loading ? "..." : balanceNum.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                </span>
                <span className="text-sm text-muted-foreground">coins</span>
                {isCritical ? (
                  <Badge variant="destructive" className="gap-1 ml-2">
                    <ShieldAlert className="h-3 w-3" />
                    Critical
                  </Badge>
                ) : isLow ? (
                  <Badge variant="destructive" className="gap-1 ml-2">
                    <AlertTriangle className="h-3 w-3" />
                    Low
                  </Badge>
                ) : null}
              </div>

              {isCritical && (
                <p className="text-xs text-destructive font-medium">
                  🚨 CRITICAL: Wallet balance is extremely low! Orders will fail. Top up immediately.
                </p>
              )}
              {isLow && !isCritical && (
                <p className="text-xs text-destructive">
                  ⚠️ Wallet balance is low. Top up to prevent order failures.
                </p>
              )}

              {lastChecked && (
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Last checked: {lastChecked.toLocaleTimeString()}
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summary Stats */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <MiniStat icon={<Coins className="h-4 w-4 text-primary" />} label="Coins Used Today" value={summary.coins_used_today.toLocaleString()} />
          <MiniStat icon={<CheckCircle className="h-4 w-4 text-green-500" />} label="Orders Today" value={summary.orders_today} />
          <MiniStat icon={<XCircle className="h-4 w-4 text-destructive" />} label="Failures Today" value={summary.failures_today} />
          <MiniStat icon={<Activity className="h-4 w-4 text-muted-foreground" />} label="Total Logs" value={summary.total_logs} />
        </div>
      )}

      {/* Toggle Logs */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => setShowLogs(!showLogs)}
        className="w-full"
      >
        <TrendingDown className="h-4 w-4 mr-2" />
        {showLogs ? "Hide" : "Show"} Wallet Activity Logs
      </Button>

      {/* Activity Logs Table */}
      {showLogs && (
        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Wallet Activity Logs</CardTitle>
            <Button variant="ghost" size="icon" onClick={fetchLogs} disabled={logsLoading}>
              <RefreshCw className={`h-4 w-4 ${logsLoading ? "animate-spin" : ""}`} />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border border-border overflow-auto max-h-[400px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Time</TableHead>
                    <TableHead>Order</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead className="text-right">Coins Used</TableHead>
                    <TableHead className="text-right">Before</TableHead>
                    <TableHead className="text-right">After</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logsLoading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-6 text-muted-foreground">
                        Loading...
                      </TableCell>
                    </TableRow>
                  ) : logs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-6 text-muted-foreground">
                        No wallet activity yet
                      </TableCell>
                    </TableRow>
                  ) : (
                    logs.map((log) => {
                      const config = actionConfig[log.action] || actionConfig.balance_check;
                      return (
                        <TableRow key={log.id}>
                          <TableCell className="text-xs whitespace-nowrap">
                            {format(new Date(log.created_at), "MMM d, HH:mm:ss")}
                          </TableCell>
                          <TableCell className="font-mono text-xs">
                            {log.order_number || "—"}
                          </TableCell>
                          <TableCell>
                            <span className={`flex items-center gap-1 text-xs ${config.color}`}>
                              {config.icon} {config.label}
                            </span>
                          </TableCell>
                          <TableCell className="text-right font-mono text-xs">
                            {log.coins_used > 0 ? `-${log.coins_used.toLocaleString()}` : "—"}
                          </TableCell>
                          <TableCell className="text-right text-xs text-muted-foreground">
                            {log.balance_before != null ? log.balance_before.toLocaleString() : "—"}
                          </TableCell>
                          <TableCell className="text-right text-xs text-muted-foreground">
                            {log.balance_after != null ? log.balance_after.toLocaleString() : "—"}
                          </TableCell>
                          <TableCell>
                            {log.error_message ? (
                              <span className="text-xs text-destructive truncate max-w-[150px] block" title={log.error_message}>
                                {log.error_message.slice(0, 40)}...
                              </span>
                            ) : (
                              <span className="text-xs text-green-500">OK</span>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function MiniStat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-border bg-card p-3 flex items-center gap-2">
      {icon}
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-bold text-foreground">{value}</p>
      </div>
    </div>
  );
}
