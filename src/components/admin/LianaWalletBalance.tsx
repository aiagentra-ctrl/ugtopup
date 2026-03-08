import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, Wallet, AlertTriangle, Clock } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface WalletData {
  balance?: number;
  coins?: number;
  amount?: number;
  currency?: string;
  status?: string;
  message?: string;
  [key: string]: unknown;
}

export function LianaWalletBalance() {
  const [walletData, setWalletData] = useState<WalletData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

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
      toast.error("Failed to fetch wallet balance");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBalance();
  }, [fetchBalance]);

  const balance = walletData?.balance ?? walletData?.coins ?? walletData?.amount;
  const balanceNum = typeof balance === "number" ? balance : parseFloat(String(balance || "0"));
  const isLow = !error && walletData && balanceNum < 500;

  return (
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
                {loading ? "..." : balanceNum.toLocaleString()}
              </span>
              <span className="text-sm text-muted-foreground">coins</span>
              {isLow && (
                <Badge variant="destructive" className="gap-1 ml-2">
                  <AlertTriangle className="h-3 w-3" />
                  Low
                </Badge>
              )}
            </div>

            {isLow && (
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
  );
}
