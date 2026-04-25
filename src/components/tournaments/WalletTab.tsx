import { useEffect, useState } from "react";
import { ArrowDownToLine, ArrowUpFromLine, Coins, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatCoins, relativeTime } from "@/lib/tournamentsUtils";
import { useAuth } from "@/contexts/AuthContext";
import { fetchUserWithdrawals, type DBWithdrawal } from "@/lib/tournamentsApi";
import { supabase } from "@/integrations/supabase/client";

interface Tx {
  id: string;
  type: "deposit" | "withdraw" | "winnings";
  amount: number;
  source: string;
  at: string;
}

export const WalletTab = ({ balance, onWithdraw }: { balance: number; onWithdraw: () => void }) => {
  const { user } = useAuth();
  const [tx, setTx] = useState<Tx[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      const [winsRes, wRes, payRes] = await Promise.all([
        supabase
          .from("tournament_participants")
          .select("id, coins_won, joined_at, tournaments(name)")
          .eq("user_id", user.id)
          .gt("coins_won", 0)
          .order("joined_at", { ascending: false })
          .limit(20),
        fetchUserWithdrawals(user.id),
        supabase
          .from("payment_transactions")
          .select("id, credits, completed_at, payment_gateway, status")
          .eq("user_id", user.id)
          .eq("status", "completed")
          .order("completed_at", { ascending: false })
          .limit(20),
      ]);
      if (cancelled) return;
      const wins: Tx[] = (winsRes.data ?? []).map((r: any) => ({
        id: "w-" + r.id,
        type: "winnings",
        amount: Number(r.coins_won),
        source: r.tournaments?.name ?? "Tournament",
        at: r.joined_at,
      }));
      const withdrawals: Tx[] = (wRes ?? []).map((w: DBWithdrawal) => ({
        id: "wd-" + w.id,
        type: "withdraw",
        amount: Number(w.amount_coins),
        source: `${w.method} (${w.status})`,
        at: w.created_at,
      }));
      const deposits: Tx[] = (payRes.data ?? []).map((p: any) => ({
        id: "d-" + p.id,
        type: "deposit",
        amount: Number(p.credits),
        source: p.payment_gateway || "Top-up",
        at: p.completed_at,
      }));
      const all = [...wins, ...withdrawals, ...deposits].sort(
        (a, b) => new Date(b.at).getTime() - new Date(a.at).getTime()
      );
      setTx(all);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  const icon = (t: Tx["type"]) => {
    if (t === "deposit") return <ArrowDownToLine className="h-3.5 w-3.5 text-emerald-400" />;
    if (t === "withdraw") return <ArrowUpFromLine className="h-3.5 w-3.5 text-destructive" />;
    return <Trophy className="h-3.5 w-3.5 text-amber-400" />;
  };

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 to-transparent p-5">
        <div className="text-[11px] uppercase tracking-wide text-muted-foreground">Current balance</div>
        <div className="mt-1 flex items-baseline gap-2">
          <Coins className="h-6 w-6 text-emerald-400" />
          <span className="text-3xl font-semibold text-emerald-400">{formatCoins(balance)}</span>
          <span className="text-[12px] text-muted-foreground">IG Coins</span>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button size="sm" onClick={onWithdraw}>
            <ArrowUpFromLine className="mr-1.5 h-3.5 w-3.5" /> Withdraw
          </Button>
        </div>
      </div>

      <div>
        <div className="mb-2 text-[12px] font-medium uppercase tracking-wide text-muted-foreground">
          Transaction history
        </div>
        <div className="overflow-hidden rounded-lg border border-border/60">
          {loading ? (
            <div className="px-3 py-4 text-[12px] text-muted-foreground">Loading…</div>
          ) : tx.length === 0 ? (
            <div className="px-3 py-6 text-center text-[12px] text-muted-foreground">
              No transactions yet
            </div>
          ) : (
            tx.map((t, i) => (
              <div
                key={t.id}
                className={`flex items-center gap-3 px-3 py-2.5 ${i < tx.length - 1 ? "border-b border-border/60" : ""}`}
              >
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-muted">{icon(t.type)}</div>
                <div className="min-w-0 flex-1">
                  <div className="text-[13px] capitalize text-foreground">
                    {t.type} · {t.source}
                  </div>
                  <div className="text-[11px] text-muted-foreground">{relativeTime(t.at)}</div>
                </div>
                <div
                  className={`text-[13px] font-medium ${t.type === "withdraw" ? "text-destructive" : "text-emerald-400"}`}
                >
                  {t.type === "withdraw" ? "-" : "+"}
                  {formatCoins(t.amount)}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
