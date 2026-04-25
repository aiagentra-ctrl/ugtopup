import { useEffect, useState } from "react";
import { Trophy } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { fetchEarningsSummary, fetchCreatedTournaments, type EarningsSummary } from "@/lib/tournamentsApi";
import { formatCoins } from "@/lib/tournamentsUtils";
import { Skeleton } from "@/components/ui/skeleton";

export const StatsRow = () => {
  const { user, profile } = useAuth();
  const [s, setS] = useState<EarningsSummary | null>(null);
  const [created, setCreated] = useState<{ total: number; active: number }>({ total: 0, active: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    Promise.all([fetchEarningsSummary(user.id), fetchCreatedTournaments(user.id)])
      .then(([summary, list]) => {
        if (cancelled) return;
        setS(summary);
        setCreated({
          total: list.length,
          active: list.filter((t) => t.status === "upcoming" || t.status === "live").length,
        });
      })
      .catch(() => {})
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-[88px] rounded-lg" />
        ))}
      </div>
    );
  }

  const wins = s?.wins ?? 0;
  const losses = s?.losses ?? 0;
  const total = wins + losses;
  const winPct = total ? (wins / total) * 100 : 0;

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      <div className="rounded-lg border border-border/60 bg-card p-4">
        <div className="text-[11px] uppercase tracking-wide text-muted-foreground">Total earnings</div>
        <div className="mt-1 text-2xl font-semibold text-emerald-400">{formatCoins(s?.totalEarnings ?? 0)}</div>
        <div className="text-[11px] text-muted-foreground">IG Coins</div>
      </div>

      <div className="rounded-lg border border-border/60 bg-card p-4">
        <div className="text-[11px] uppercase tracking-wide text-muted-foreground">Win / Loss</div>
        <div className="mt-1 text-2xl font-semibold text-foreground">
          {wins} <span className="text-muted-foreground">/</span> {losses}
        </div>
        <div className="mt-2 flex h-1.5 overflow-hidden rounded-full bg-muted">
          <div className="bg-emerald-500" style={{ width: `${winPct}%` }} />
          <div className="bg-destructive" style={{ width: `${100 - winPct}%` }} />
        </div>
      </div>

      <div className="rounded-lg border border-border/60 bg-card p-4">
        <div className="text-[11px] uppercase tracking-wide text-muted-foreground">Tournaments created</div>
        <div className="mt-1 text-2xl font-semibold text-foreground">{created.total}</div>
        <div className="text-[11px] text-muted-foreground">{created.active} active</div>
      </div>

      <div className="rounded-lg border border-border/60 bg-card p-4">
        <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wide text-muted-foreground">
          <Trophy className="h-3 w-3" /> Wallet
        </div>
        <div className="mt-1 text-2xl font-semibold text-primary">{formatCoins(profile?.balance ?? 0)}</div>
        <div className="text-[11px] text-muted-foreground">IG Coins available</div>
      </div>
    </div>
  );
};
