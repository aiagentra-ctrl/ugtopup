import { Activity } from "lucide-react";
import type { DBTournament } from "@/lib/tournamentsApi";
import { formatCoins } from "@/lib/tournamentsUtils";

export const LiveTicker = ({ items }: { items: DBTournament[] }) => {
  if (items.length === 0) return null;
  const loop = [...items, ...items];
  return (
    <div className="mb-8 overflow-hidden rounded-xl border border-emerald-500/20 bg-emerald-500/5">
      <div className="flex items-center gap-3 px-4 py-2">
        <div className="flex shrink-0 items-center gap-1.5 rounded-full border border-emerald-500/40 bg-emerald-500/15 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-300">
          <span className="live-dot" /> Live now
        </div>
        <div className="flex-1 overflow-hidden">
          <div className="marquee-track gap-8">
            {loop.map((t, i) => (
              <div key={`${t.id}-${i}`} className="flex shrink-0 items-center gap-2 text-[12px]">
                <Activity className="h-3 w-3 text-emerald-400" />
                <span className="font-medium text-foreground">{t.name}</span>
                <span className="text-muted-foreground">·</span>
                <span className="text-muted-foreground">{t.game}</span>
                <span className="text-muted-foreground">·</span>
                <span className="font-stat font-bold text-amber-400">{formatCoins(Number(t.prize))} IG</span>
                <span className="ml-2 text-muted-foreground">{t.current_players}/{t.max_players}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
