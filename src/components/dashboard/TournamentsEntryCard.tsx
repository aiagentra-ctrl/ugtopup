import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Trophy, Swords, Crown, ArrowRight, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { fetchEarningsSummary, fetchJoinedMatches } from "@/lib/tournamentsApi";
import { formatCoins } from "@/lib/tournamentsUtils";

export const TournamentsEntryCard = () => {
  const { user } = useAuth();
  const [earnings, setEarnings] = useState(0);
  const [activeCount, setActiveCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    if (!user?.id) {
      setLoading(false);
      return;
    }
    (async () => {
      try {
        const [s, j] = await Promise.all([
          fetchEarningsSummary(user.id),
          fetchJoinedMatches(user.id),
        ]);
        if (cancelled) return;
        setEarnings(s.totalEarnings);
        setActiveCount(j.filter((m) => m.status !== "finished" && m.status !== "canceled").length);
      } catch {
        // ignore
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  return (
    <div className="overflow-hidden rounded-xl border border-primary/20 bg-gradient-to-br from-primary/10 via-card to-card">
      <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-primary/30 bg-primary/10">
            <Trophy className="h-6 w-6 text-primary" />
          </div>
          <div>
            <div className="mb-0.5 inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-primary">
              IG Arena
            </div>
            <h3 className="text-lg font-semibold text-foreground">Tournaments</h3>
            <p className="text-xs text-muted-foreground">
              Compete in live match rooms and win IG Coins.
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:items-end">
          <div className="flex items-center gap-4 text-[12px]">
            <div className="flex items-center gap-1.5">
              <Crown className="h-3.5 w-3.5 text-amber-400" />
              <span className="text-muted-foreground">Won:</span>
              <span className="font-semibold text-foreground">
                {loading ? "—" : `${formatCoins(earnings)} coins`}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <Activity className="h-3.5 w-3.5 text-emerald-400" />
              <span className="text-muted-foreground">Active:</span>
              <span className="font-semibold text-foreground">{loading ? "—" : activeCount}</span>
            </div>
          </div>
          <Button asChild size="sm" className="gap-2">
            <Link to="/tournaments">
              <Swords className="h-4 w-4" /> Open Tournaments <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
};
