import { useEffect, useState } from "react";
import { Trophy } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { formatCoins, initials, nameToColor } from "@/lib/tournamentsUtils";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

interface LeaderRow {
  user_id: string;
  username: string;
  wins: number;
  coins: number;
}

const medal = (rank: number) => (rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : null);

export const Leaderboard = () => {
  const { user } = useAuth();
  const [rows, setRows] = useState<LeaderRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      // Aggregate winnings per user from tournament_participants
      const { data, error } = await supabase
        .from("tournament_participants")
        .select("user_id, coins_won, result, profiles:profiles(username, full_name, email)")
        .gt("coins_won", 0)
        .limit(500);
      if (cancelled) return;
      if (error || !data) {
        setRows([]);
        setLoading(false);
        return;
      }
      const map = new Map<string, LeaderRow>();
      data.forEach((r: any) => {
        const id = r.user_id;
        const name =
          r.profiles?.username || r.profiles?.full_name || r.profiles?.email?.split("@")[0] || "Player";
        const coins = Number(r.coins_won) || 0;
        const cur = map.get(id) ?? { user_id: id, username: name, wins: 0, coins: 0 };
        cur.coins += coins;
        if (r.result === "won") cur.wins += 1;
        cur.username = name;
        map.set(id, cur);
      });
      const sorted = Array.from(map.values()).sort((a, b) => b.coins - a.coins).slice(0, 5);
      setRows(sorted);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="rounded-lg border border-border/60 bg-card p-4">
      <div className="mb-1 flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-[14px] font-medium text-foreground">
          <Trophy className="h-4 w-4 text-primary" />
          Top players leaderboard
        </h3>
      </div>
      <div className="mb-3 text-[11px] text-muted-foreground">Ranked by total IG Coins won</div>
      <div className="overflow-hidden rounded-md">
        {loading ? (
          <div className="space-y-2">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <div className="px-2 py-6 text-center text-[12px] text-muted-foreground">
            No winners yet. Be the first to win a tournament!
          </div>
        ) : (
          rows.map((p, idx) => {
            const rank = idx + 1;
            const isYou = user?.id === p.user_id;
            return (
              <div
                key={p.user_id}
                className={cn(
                  "flex items-center gap-3 px-2 py-2.5",
                  idx < rows.length - 1 && "border-b border-border/40",
                  isYou && "bg-primary/5"
                )}
              >
                <div className="w-6 text-center text-[12px] text-muted-foreground">
                  {medal(rank) ?? rank}
                </div>
                <div
                  className="flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-medium text-white"
                  style={{ background: nameToColor(p.username) }}
                >
                  {initials(p.username)}
                </div>
                <div className={cn("flex-1 text-[13px] font-medium", isYou ? "text-primary" : "text-foreground")}>
                  {p.username}
                  {isYou && <span className="ml-1 text-[11px] text-muted-foreground">(You)</span>}
                </div>
                <div className="text-[12px] text-muted-foreground">{p.wins} W</div>
                <div className="rounded-full bg-primary/15 px-2 py-0.5 text-[11px] font-medium text-primary">
                  {formatCoins(p.coins)} coins
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
