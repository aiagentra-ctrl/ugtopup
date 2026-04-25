import { useEffect, useState } from "react";
import { History, Trophy, X } from "lucide-react";
import { TournamentsLayout } from "@/components/tournaments/TournamentsLayout";
import { EmptyState } from "@/components/tournaments/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { fetchJoinedMatches, type JoinedMatch } from "@/lib/tournamentsApi";
import { formatCoins, relativeTime } from "@/lib/tournamentsUtils";
import { cn } from "@/lib/utils";

const MatchHistoryPage = () => {
  const { user } = useAuth();
  const [list, setList] = useState<JoinedMatch[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) {
      setLoading(false);
      return;
    }
    (async () => {
      try {
        const data = await fetchJoinedMatches(user.id);
        setList(data.filter((m) => m.status === "finished" || m.status === "canceled"));
      } finally {
        setLoading(false);
      }
    })();
  }, [user?.id]);

  const wins = list.filter((m) => m.result === "won").length;
  const losses = list.filter((m) => m.result === "lost").length;
  const totalEarned = list.reduce((s, m) => s + (Number(m.coins_won) || 0), 0);

  return (
    <TournamentsLayout title="Match History" subtitle="All your finished tournaments.">
      <div className="mb-4 grid grid-cols-3 gap-3">
        <Stat label="Total played" value={String(list.length)} icon={History} tint="primary" />
        <Stat label="Wins" value={String(wins)} icon={Trophy} tint="emerald" />
        <Stat label="Coins won" value={formatCoins(totalEarned)} icon={Trophy} tint="amber" />
      </div>

      <div className="overflow-hidden rounded-xl border border-border/60 bg-card">
        {loading ? (
          <div className="space-y-2 p-4">
            {[0, 1, 2].map((i) => <Skeleton key={i} className="h-14 w-full" />)}
          </div>
        ) : list.length === 0 ? (
          <EmptyState title="No completed matches yet" description="Join a tournament to start your record." />
        ) : (
          list.map((m, i) => {
            const isWin = m.result === "won";
            const isLoss = m.result === "lost";
            return (
              <div
                key={m.id}
                className={cn(
                  "flex items-center gap-3 px-4 py-3",
                  i < list.length - 1 && "border-b border-border/60"
                )}
              >
                <div
                  className={cn(
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border",
                    isWin && "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
                    isLoss && "border-destructive/30 bg-destructive/10 text-destructive",
                    !isWin && !isLoss && "border-border bg-muted/40 text-muted-foreground"
                  )}
                >
                  {isWin ? <Trophy className="h-4 w-4" /> : isLoss ? <X className="h-4 w-4" /> : <History className="h-4 w-4" />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[13px] font-medium text-foreground">{m.name}</div>
                  <div className="text-[11px] text-muted-foreground">
                    {m.game} · {m.finished_at ? relativeTime(m.finished_at) : "—"}
                  </div>
                </div>
                <div className="text-right">
                  <div
                    className={cn(
                      "text-[13px] font-semibold",
                      isWin && "text-emerald-400",
                      isLoss && "text-destructive",
                      wbWa()
                    )}
                  >
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

const wbWa = () => "";

const tints = {
  primary: "border-primary/20 bg-primary/5 text-primary",
  emerald: "border-emerald-500/20 bg-emerald-500/5 text-emerald-400",
  amber: "border-amber-500/20 bg-amber-500/5 text-amber-400",
} as const;

const Stat = ({
  label, value, icon: Icon, tint,
}: { label: string; value: string; icon: any; tint: keyof typeof tints }) => (
  <div className={`rounded-lg border p-3 ${tints[tint]}`}>
    <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wide opacity-80">
      <Icon className="h-3 w-3" /> {label}
    </div>
    <div className="mt-0.5 text-xl font-semibold">{value}</div>
  </div>
);

export default MatchHistoryPage;
