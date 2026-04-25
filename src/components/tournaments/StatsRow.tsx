import { initialStats } from "@/data/tournamentsMock";
import { formatCoins } from "@/lib/tournamentsUtils";

export const StatsRow = () => {
  const s = initialStats;
  const total = s.wins + s.losses;
  const winPct = total ? (s.wins / total) * 100 : 0;

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      <div className="rounded-lg bg-muted/40 p-4">
        <div className="text-[11px] uppercase tracking-wide text-muted-foreground">Total earnings</div>
        <div className="mt-1 text-2xl font-medium text-emerald-400">{formatCoins(s.totalEarnings)}</div>
        <div className="text-[11px] text-muted-foreground">IG Coins</div>
      </div>

      <div className="rounded-lg bg-muted/40 p-4">
        <div className="text-[11px] uppercase tracking-wide text-muted-foreground">Win / Loss</div>
        <div className="mt-1 text-2xl font-medium text-foreground">
          {s.wins} <span className="text-muted-foreground">/</span> {s.losses}
        </div>
        <div className="mt-2 flex h-1.5 overflow-hidden rounded-full bg-muted">
          <div className="bg-emerald-500" style={{ width: `${winPct}%` }} />
          <div className="bg-destructive" style={{ width: `${100 - winPct}%` }} />
        </div>
      </div>

      <div className="rounded-lg bg-muted/40 p-4">
        <div className="text-[11px] uppercase tracking-wide text-muted-foreground">Tournaments created</div>
        <div className="mt-1 text-2xl font-medium text-foreground">{s.tournamentsCreated}</div>
        <div className="text-[11px] text-muted-foreground">{s.activeCreated} active</div>
      </div>

      <div className="rounded-lg bg-muted/40 p-4">
        <div className="text-[11px] uppercase tracking-wide text-muted-foreground">Global rank</div>
        <div className="mt-1 text-2xl font-medium text-primary">#{s.globalRank}</div>
        <div className="text-[11px] text-muted-foreground">Top {s.topPercent}%</div>
      </div>
    </div>
  );
};
