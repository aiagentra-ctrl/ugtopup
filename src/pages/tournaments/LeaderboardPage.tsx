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
      if (error || !data) { setRows([]); setLoading(false); return; }
      const map = new Map<string, LeaderRow>();
      data.forEach((r: any) => {
        const id = r.user_id;
        const name = r.profiles?.username || r.profiles?.full_name || r.profiles?.email?.split("@")[0] || "Player";
        const cur = map.get(id) ?? { user_id: id, username: name, wins: 0, losses: 0, matches: 0, coins: 0 };
        cur.coins += Number(r.coins_won) || 0;
        cur.matches += 1;
        if (r.result === "won") cur.wins += 1;
        else if (r.result === "lost") cur.losses += 1;
        cur.username = name;
        map.set(id, cur);
      });
      setRows(Array.from(map.values()));
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  const sorted = [...rows].sort((a, b) => b[sortKey] - a[sortKey]).slice(0, 50);
  const podium = sorted.slice(0, 3);
  const myRank = user?.id ? sorted.findIndex((r) => r.user_id === user.id) + 1 : 0;

  const podiumStyles = [
    { ring: "ring-amber-400/60",   bg: "from-amber-400/20 to-amber-400/5",  text: "text-amber-400",  emoji: "🥇" },
    { ring: "ring-slate-300/60",   bg: "from-slate-300/15 to-slate-300/5",  text: "text-slate-200",  emoji: "🥈" },
    { ring: "ring-orange-400/60",  bg: "from-orange-400/20 to-orange-400/5",text: "text-orange-400", emoji: "🥉" },
  ];

  return (
    <TournamentsLayout title="Hall of Fame" subtitle="Top players ranked across the arena.">
      <Tabs value={sortKey} onValueChange={(v) => setSortKey(v as SortKey)} className="mb-5">
        <TabsList className="bg-muted/30">
          <TabsTrigger value="coins"   className="data-[state=active]:btn-glow data-[state=active]:text-primary"><Crown className="mr-1.5 h-3.5 w-3.5" /> Top earnings</TabsTrigger>
          <TabsTrigger value="wins"    className="data-[state=active]:btn-glow data-[state=active]:text-primary"><Trophy className="mr-1.5 h-3.5 w-3.5" /> Most wins</TabsTrigger>
          <TabsTrigger value="matches" className="data-[state=active]:btn-glow data-[state=active]:text-primary"><Swords className="mr-1.5 h-3.5 w-3.5" /> Most played</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Podium */}
      {!loading && podium.length > 0 && (
        <div className="mb-6 grid grid-cols-3 gap-3">
          {podium.map((p, idx) => {
            const s = podiumStyles[idx];
            const heights = ["sm:translate-y-4", "", "sm:translate-y-6"];
            return (
              <div
                key={p.user_id}
                className={cn(
                  "card-premium sheen relative overflow-hidden bg-gradient-to-b p-4 text-center transition-transform hover:-translate-y-1",
                  s.bg, heights[idx]
                )}
              >
                <div className="font-display text-3xl">{s.emoji}</div>
                <div
                  className={cn("mx-auto mt-2 flex h-14 w-14 items-center justify-center rounded-full text-sm font-bold text-white ring-4", s.ring)}
                  style={{ background: nameToColor(p.username) }}
                >
                  {initials(p.username)}
                </div>
                <div className="mt-2 truncate text-[13px] font-bold text-foreground">{p.username}</div>
                <div className={cn("font-stat mt-1 text-lg font-bold", s.text)}>
                  {sortKey === "coins" && formatCoins(p.coins)}
                  {sortKey === "wins" && `${p.wins}`}
                  {sortKey === "matches" && `${p.matches}`}
                </div>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  {sortKey === "coins" ? "Coins" : sortKey === "wins" ? "Wins" : "Matches"}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-border/60 bg-card">
        <div className="flex items-center gap-3 border-b border-border/60 bg-muted/30 px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          <div className="w-8">Rank</div>
          <div className="flex-1">Player</div>
          <div className="w-16 text-right">Wins</div>
          <div className="w-16 text-right">Played</div>
          <div className="w-24 text-right">Coins</div>
        </div>
        {loading ? (
          <div className="space-y-2 p-4">
            {[0,1,2,3,4].map((i) => <Skeleton key={i} className="h-10 w-full" />)}
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
                  "flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-muted/20",
                  idx < sorted.length - 1 && "border-b border-border/40",
                  isYou && "bg-primary/5 ring-1 ring-inset ring-primary/30"
                )}
              >
                <div className="font-stat w-8 text-center text-[13px] font-bold text-muted-foreground">{rank}</div>
                <div className="flex flex-1 items-center gap-2 min-w-0">
                  <div
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white ring-1 ring-white/10"
                    style={{ background: nameToColor(p.username) }}
                  >
                    {initials(p.username)}
                  </div>
                  <div className={cn("truncate text-[13px] font-semibold", isYou ? "text-primary" : "text-foreground")}>
                    {p.username}
                    {isYou && <span className="ml-1 text-[10px] font-bold uppercase text-primary">(You)</span>}
                  </div>
                </div>
                <div className="font-stat w-16 text-right text-[13px] font-bold text-emerald-400">{p.wins}</div>
                <div className="font-stat w-16 text-right text-[12px] text-muted-foreground">{p.matches}</div>
                <div className="w-24 text-right">
                  <span className="font-stat rounded-full border border-primary/30 bg-primary/15 px-2 py-0.5 text-[11px] font-bold text-primary">
                    {formatCoins(p.coins)}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {myRank > 0 && (
        <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1.5 text-[12px] font-semibold text-primary">
          <Medal className="h-3.5 w-3.5" /> Your rank: #{myRank}
        </div>
      )}

      <div className="mt-4 flex items-center gap-2 text-[11px] text-muted-foreground">
        <Medal className="h-3.5 w-3.5" />
        Rankings update as tournaments finish.
      </div>
    </TournamentsLayout>
  );
};

export default LeaderboardPage;
