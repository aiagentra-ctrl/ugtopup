import { useEffect, useState } from "react";
import { Crown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatCoins, initials, nameToColor } from "@/lib/tournamentsUtils";
import { Skeleton } from "@/components/ui/skeleton";

interface Row { user_id: string; username: string; coins: number; wins: number; }

export const LeaderboardPreview = () => {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("tournament_participants")
        .select("user_id, coins_won, result, profiles:profiles(username, full_name, email)")
        .limit(500);
      if (cancelled) return;
      const map = new Map<string, Row>();
      (data ?? []).forEach((r: any) => {
        const id = r.user_id;
        const name = r.profiles?.username || r.profiles?.full_name || r.profiles?.email?.split("@")[0] || "Player";
        const cur = map.get(id) ?? { user_id: id, username: name, coins: 0, wins: 0 };
        cur.coins += Number(r.coins_won) || 0;
        if (r.result === "won") cur.wins += 1;
        cur.username = name;
        map.set(id, cur);
      });
      setRows([...map.values()].sort((a, b) => b.coins - a.coins).slice(0, 5));
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="overflow-hidden rounded-xl border border-border/60 bg-card">
      <div className="flex items-center gap-2 border-b border-border/60 bg-muted/20 px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
        <Crown className="h-3.5 w-3.5 text-amber-400" /> Top 5 earners
      </div>
      {loading ? (
        <div className="space-y-1 p-3">
          {[0,1,2,3,4].map(i => <Skeleton key={i} className="h-10 w-full" />)}
        </div>
      ) : rows.length === 0 ? (
        <div className="p-6 text-center text-[12px] text-muted-foreground">No rankings yet — be the first.</div>
      ) : rows.map((r, i) => (
        <div key={r.user_id} className={`flex items-center gap-3 px-4 py-2.5 ${i < rows.length - 1 ? "border-b border-border/40" : ""}`}>
          <div className={`font-stat w-6 text-center text-[14px] font-bold ${i === 0 ? "text-amber-400" : i === 1 ? "text-slate-300" : i === 2 ? "text-orange-400" : "text-muted-foreground"}`}>
            {i + 1}
          </div>
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold text-white" style={{ background: nameToColor(r.username) }}>
            {initials(r.username)}
          </div>
          <div className="min-w-0 flex-1 truncate text-[13px] font-medium text-foreground">{r.username}</div>
          <div className="text-right">
            <div className="font-stat text-[13px] font-bold text-primary">{formatCoins(r.coins)}</div>
            <div className="text-[10px] text-muted-foreground">{r.wins} wins</div>
          </div>
        </div>
      ))}
    </div>
  );
};
