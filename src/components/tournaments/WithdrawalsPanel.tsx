import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { fetchUserWithdrawals, type DBWithdrawal } from "@/lib/tournamentsApi";
import { EmptyState } from "./EmptyState";
import { SkeletonRow } from "./SkeletonRow";
import { ArrowDownToLine, RefreshCw } from "lucide-react";
import { formatCoins, relativeTime } from "@/lib/tournamentsUtils";
import { Button } from "@/components/ui/button";

const statusStyle: Record<DBWithdrawal["status"], string> = {
  pending: "bg-amber-500/10 text-amber-400 border-amber-500/30",
  processed: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
  rejected: "bg-destructive/10 text-destructive border-destructive/30",
};

export const WithdrawalsPanel = ({
  refreshKey,
  onWithdrawClick,
}: {
  refreshKey?: number;
  onWithdrawClick?: () => void;
}) => {
  const { user } = useAuth();
  const [items, setItems] = useState<DBWithdrawal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await fetchUserWithdrawals(user.id);
      setItems(data);
    } catch (e: any) {
      setError(e?.message || "Couldn't load withdrawals");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, refreshKey]);

  return (
    <div className="rounded-lg border border-border/60 bg-card p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-[16px] font-medium text-foreground">
          <ArrowDownToLine className="h-4 w-4" /> Withdrawal requests
        </h2>
        <div className="flex items-center gap-2">
          <button
            onClick={load}
            className="text-muted-foreground hover:text-foreground"
            aria-label="Refresh"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
          {onWithdrawClick && (
            <Button size="sm" variant="outline" onClick={onWithdrawClick}>
              New withdrawal
            </Button>
          )}
        </div>
      </div>

      {error && (
        <div className="mb-3 rounded-md border border-destructive/30 bg-destructive/10 p-2 text-[12px] text-destructive">
          {error}
        </div>
      )}

      <div className="overflow-hidden rounded-lg border border-border/60">
        {loading ? (
          <>
            <SkeletonRow />
            <SkeletonRow />
          </>
        ) : items.length === 0 ? (
          <EmptyState
            title="No withdrawal requests yet"
            description="When you request a payout, it will appear here with its status."
            ctaLabel={onWithdrawClick ? "Request withdrawal" : undefined}
            onCta={onWithdrawClick}
          />
        ) : (
          items.map((w, i, a) => (
            <div
              key={w.id}
              className={`flex items-center gap-3 px-3 py-3 ${i < a.length - 1 ? "border-b border-border/60" : ""}`}
            >
              <div className="min-w-0 flex-1">
                <div className="text-[13px] font-medium text-foreground">
                  {formatCoins(Number(w.amount_coins))} IG Coins · NPR {formatCoins(Number(w.amount_npr))}
                </div>
                <div className="mt-0.5 text-[11px] text-muted-foreground">
                  {w.method} · {w.account_detail} · {relativeTime(w.created_at)}
                </div>
                {w.admin_remarks && (
                  <div className="mt-1 text-[11px] text-muted-foreground">
                    Note: <span className="text-foreground">{w.admin_remarks}</span>
                  </div>
                )}
              </div>
              <span
                className={`rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide ${statusStyle[w.status]}`}
              >
                {w.status}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
