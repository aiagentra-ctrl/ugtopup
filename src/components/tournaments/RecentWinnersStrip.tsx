import { useEffect, useState } from "react";
import { Trophy } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatCoins, initials, nameToColor, relativeTime } from "@/lib/tournamentsUtils";
import { Skeleton } from "@/components/ui/skeleton";

interface Winner {
  id: string;
  username: string;
  coins_won: number;
  match_name: string;
  game: string;
  finished_at: string;
}

export const RecentWinnersStrip = () => {
  const [list, setList] = useState<Winner[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("tournament_participants")
        .select("id, coins_won, profiles:profiles(username, full_name, email), tournaments:tournaments(name, game, finished_at)")
        .eq("result", "won")
        .order("joined_at", { ascending: false })
        .limit(10);
      if (cancelled) return;
      const rows: Winner[] = (data ?? [])
        .filter((r: any) => r.tournaments)
        .map((r: any) => ({
          id: r.id,
          username: r.profiles?.username || r.profiles?.full_name || r.profiles?.email?.split("@")[0] || "Player",
          coins_won: Number(r.coins_won) || 0,
          match_name: r.tournaments.name,
          game: r.tournaments.game,
          finished_at: r.tournaments.finished_at || new Date().toISOString(),
        }));
      setList(rows);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  if (!loading && list.length === 0) return null;

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {loading
        ? [0,1,2].map(i => <Skeleton key={i} className="h-[88px] rounded-xl" />)
        : list.slice(0, 6).map((w) => (
            <div key={w.id} className="sheen flex items-center gap-3 rounded-xl border border-amber-500/20 bg-gradient-to-br from-amber-500/[0.08] via-card to-card p-3 transition-colors hover:border-amber-500/40">
              <div className="relative">
                <div
                  className="flex h-11 w-11 items-center justify-center rounded-full text-[12px] font-bold text-white"
                  style={{ background: nameToColor(w.username) }}
                >
                  {initials(w.username)}
                </div>
                <Trophy className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-amber-500 p-0.5 text-background" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-[13px] font-semibold text-foreground">{w.username}</div>
                <div className="truncate text-[11px] text-muted-foreground">won <span className="text-foreground/80">{w.match_name}</span> · {relativeTime(w.finished_at)}</div>
              </div>
              <div className="text-right">
                <div className="font-stat text-[15px] font-bold text-amber-400">+{formatCoins(w.coins_won)}</div>
                <div className="text-[10px] uppercase tracking-wide text-muted-foreground">IG Coins</div>
              </div>
            </div>
          ))}
    </div>
  );
};
