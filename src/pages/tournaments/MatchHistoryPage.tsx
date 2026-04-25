import { useEffect, useMemo, useState } from "react";
import { History, Trophy, X, CheckCircle2 } from "lucide-react";
import { TournamentsLayout } from "@/components/tournaments/TournamentsLayout";
import { EmptyState } from "@/components/tournaments/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { StatChip } from "@/components/tournaments/StatChip";
import { useAuth } from "@/contexts/AuthContext";
import { fetchJoinedMatches, type JoinedMatch } from "@/lib/tournamentsApi";
import { formatCoins, relativeTime } from "@/lib/tournamentsUtils";
import { cn } from "@/lib/utils";

type Filter = "all" | "won" | "lost" | "canceled";

const MatchHistoryPage = () => {
  const { user } = useAuth();
  const [list, setList] = useState<JoinedMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("all");

  useEffect(() => {
    if (!user?.id) { setLoading(false); return; }
    (async () => {
      try {
        const data = await fetchJoinedMatches(user.id);
        setList(data.filter((m) => m.status === "finished" || m.status === "canceled"));
      } finally { setLoading(false); }
    })();
  }, [user?.id]);

  const wins   = list.filter((m) => m.result === "won").length;
  const losses = list.filter((m) => m.result === "lost").length;
  const totalEarned = list.reduce((s, m) => s + (Number(m.coins_won) || 0), 0);
  const winRate = wins + losses > 0 ? Math.round((wins / (wins + losses)) * 100) : 0;

  const filtered = useMemo(() => {
    if (filter === "all") return list;
    if (filter === "canceled") return list.filter((m) => m.status === "canceled");
    return list.filter((m) => m.result === filter);
  }, [list, filter]);

  return (
    <TournamentsLayout title="Match History" subtitle="All your finished tournaments at a glance.">
      {/* Stats */}
      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatChip icon={History} label="Total played" value={list.length} tint="primary" />
        <StatChip icon={Trophy}  label="Wins"         value={wins}         tint="emerald" />
        <StatChip icon={Trophy}  label="Coins won"    value={totalEarned}  tint="amber" suffix="IG" />
        {/* Win-rate ring */}
        <div className="rounded-xl border border-border/60 bg-card/70 p-3">
          <div className="flex items-center gap-3">
            <div
              className="relative grid h-14 w-14 place-items-center rounded-full"
              style={{
                background: `conic-gradient(hsl(var(--primary)) ${winRate * 3.6}deg, hsl(var(--muted)) 0)`,
              }}
            >
              <div className="grid h-11 w-11 place-items-center rounded-full bg-card">
                <span className="font-stat text-sm font-bold text-foreground">{winRate}%</span>
              </div>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Win rate</div>
              <div className="text-[11px] text-foreground">{wins}W · {losses}L</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-3 flex gap-1 overflow-x-auto scrollbar-hide">
        {(["all","won","lost","canceled"] as Filter[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              "rounded-full border px-3 py-1 text-[12px] font-semibold capitalize transition-colors whitespace-nowrap",
              filter === f
                ? "border-primary/50 bg-primary/15 text-primary"
                : "border-border bg-muted/30 text-muted-foreground hover:text-foreground"
            )}
          >
            {f === "all" ? "All" : f}
          </button>
        ))}
      </div>

      <div className="overflow-hidden rounded-xl border border-border/60 bg-card">
        {loading ? (
          <div className="space-y-2 p-4">
            {[0, 1, 2].map((i) => <Skeleton key={i} className="h-14 w-full" />)}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState title="No matches in this view" description="Try a different filter or join a tournament." />
        ) : (
          filtered.map((m, i) => {
            const isWin = m.result === "won";
            const isLoss = m.result === "lost";
            return (
              <div
                key={m.id}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/20",
                  i < filtered.length - 1 && "border-b border-border/60",
                  isWin && "border-l-2 border-l-emerald-500",
                  isLoss && "border-l-2 border-l-destructive"
                )}
              >
                <div
                  className={cn(
                    "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border",
                    isWin && "border-emerald-500/40 bg-emerald-500/15 text-emerald-400 animate-glow-pulse",
                    isLoss && "border-destructive/40 bg-destructive/15 text-destructive",
                    !isWin && !isLoss && "border-border bg-muted/40 text-muted-foreground"
                  )}
                >
                  {isWin ? <Trophy className="h-4 w-4" /> : isLoss ? <X className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[13px] font-semibold text-foreground">{m.name}</div>
                  <div className="text-[11px] text-muted-foreground">
                    {m.game} · {m.finished_at ? relativeTime(m.finished_at) : "—"}
                  </div>
                </div>
                <div className="text-right">
                  <div className={cn(
                    "font-stat text-[15px] font-bold",
                    isWin && "text-emerald-400",
                    isLoss && "text-destructive"
                  )}>
                    {m.coins_won > 0 ? `+${formatCoins(m.coins_won)}` : isLoss ? "—" : "Pending"}
                  </div>
                  <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
                    {isWin ? "Won" : isLoss ? "Lost" : m.result}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </TournamentsLayout>
  );
};

export default MatchHistoryPage;
