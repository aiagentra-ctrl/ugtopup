import { useEffect, useState } from "react";
import { Crown, Trophy, Swords, Medal } from "lucide-react";
import { TournamentsLayout } from "@/components/tournaments/TournamentsLayout";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { formatCoins, initials, nameToColor } from "@/lib/tournamentsUtils";
import { cn } from "@/lib/utils";

interface LeaderRow {
  user_id: string;
  username: string;
  wins: number;
  losses: number;
  matches: number;
  coins: number;
}

type SortKey = "coins" | "wins" | "matches";

const medal = (rank: number) => (rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : null);

const LeaderboardPage = () => {
  const { user } = useAuth();
  const [rows, setRows] = useState<LeaderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortKey, setSortKey] = useState<SortKey>("coins");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("tournament_participants")
        .select("user_id, coins_won, result, profiles:profiles(username, full_name, email)")
        .limit(1000);
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
        const cur = map.get(id) ?? { user_id: id, username: name, wins: 0, losses: 0, matches: 0, coins: 0 };
        cur.coins += coins;
        cur.matches += 1;
        if (r.result === "won") cur.wins += 1;
        else if (r.result === "lost") cur.losses += 1;
        cur.username = name;
        map.set(id, cur);
      });
      setRows(Array.from(map.values()));
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const sorted = [...rows].sort((a, b) => b[sortKey] - a[sortKey]).slice(0, 50);
  const podium = sorted.slice(0, 3);

  return (
    <TournamentsLayout title="Leaderboard" subtitle="Top players ranked across the arena.">
      <Tabs value={sortKey} onValueChange={(v) => setSortKey(v as SortKey)} className="mb-4">
        <TabsList>
          <TabsTrigger value="coins"><Crown className="mr-1.5 h-3.5 w-3.5" /> Top earnings</TabsTrigger>
          <TabsTrigger value="wins"><Trophy className="mr-1.5 h-3.5 w-3.5" /> Most wins</TabsTrigger>
          <TabsTrigger value="matches"><Swords className="mr-1.5 h-3.5 w-3.5" /> Most played</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Podium */}
      {!loading && podium.length > 0 && (
        <div className="mb-6 grid grid-cols-3 gap-3">
          {podium.map((p, idx) => {
            const rank = idx + 1;
            const heights = ["sm:pt-2", "sm:pt-6", "sm:pt-10"];
            const colors = [
              "border-amber-400/40 bg-amber-400/10",
              "border-slate-400/40 bg-slate-400/10",
              "border-orange-400/40 bg-orange-400/10",
            ];
            return (
              <div key={p.user_id} className={cn("rounded-xl border p-4 text-center", colors[idx], heights[idx])}>
                <div className="mb-2 text-2xl">{medal(rank)}</div>
                <div
                  className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full text-sm font-semibold text-white"
                  style={{ background: nameToColor(p.username) }}
                >
                  {initials(p.username)}
                </div>
                <div className="truncate text-[13px] font-semibold text-foreground">{p.username}</div>
                <div className="mt-1 text-[11px] text-muted-foreground">
                  {sortKey === "coins" && `${formatCoins(p.coins)} coins`}
                  {sortKey === "wins" && `${p.wins} wins`}
                  {sortKey === "matches" && `${p.matches} matches`}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-border/60 bg-card">
        <div className="flex items-center gap-3 border-b border-border/60 bg-muted/30 px-4 py-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          <div className="w-8">Rank</div>
          <div className="flex-1">Player</div>
          <div className="w-16 text-right">Wins</div>
          <div className="w-16 text-right">Played</div>
          <div className="w-24 text-right">Coins</div>
        </div>
        {loading ? (
          <div className="space-y-2 p-4">
            {[0, 1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-10 w-full" />)}
          </div>
        ) : sorted.length === 0 ? (
          <div className="px-4 py-10 text-center text-[13px] text-muted-foreground">
            No players ranked yet. Be the first to win a tournament!
          </div>
        ) : (
          sorted.map((p, idx) => {
            const rank = idx + 1;
            const isYou = user?.id === p.user_id;
            return (
              <div
                key={p.user_id}
                className={cn(
                  "flex items-center gap-3 px-4 py-2.5",
                  idx < sorted.length - 1 && "border-b border-border/40",
                  isYou && "bg-primary/5"
                )}
              >
                <div className="w-8 text-center text-[12px] font-medium text-muted-foreground">
                  {medal(rank) ?? rank}
                </div>
                <div className="flex flex-1 items-center gap-2 min-w-0">
                  <div
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold text-white"
                    style={{ background: nameToColor(p.username) }}
                  >
                    {initials(p.username)}
                  </div>
                  <div className={cn("truncate text-[13px] font-medium", isYou ? "text-primary" : "text-foreground")}>
                    {p.username}
                    {isYou && <span className="ml-1 text-[11px] text-muted-foreground">(You)</span>}
                  </div>
                </div>
                <div className="w-16 text-right text-[12px] text-muted-foreground">{p.wins}</div>
                <div className="w-16 text-right text-[12px] text-muted-foreground">{p.matches}</div>
                <div className="w-24 text-right">
                  <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[11px] font-medium text-primary">
                    {formatCoins(p.coins)}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="mt-4 flex items-center gap-2 text-[11px] text-muted-foreground">
        <Medal className="h-3.5 w-3.5" />
        Rankings update as tournaments finish.
      </div>
    </TournamentsLayout>
  );
};

export default LeaderboardPage;
