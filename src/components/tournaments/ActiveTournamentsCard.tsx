import { Activity } from "lucide-react";
import { platformStats } from "@/data/tournamentsMock";

export const ActiveTournamentsCard = () => (
  <div className="rounded-lg border border-border/60 bg-card p-4">
    <h3 className="mb-3 flex items-center gap-2 text-[14px] font-medium text-foreground">
      <Activity className="h-4 w-4 text-primary" />
      Active tournaments
    </h3>
    <div className="text-3xl font-medium text-foreground">{platformStats.liveTournaments}</div>
    <div className="text-[12px] text-muted-foreground">running right now</div>
    <div className="mt-3 text-[12px] text-muted-foreground">
      <span className="text-foreground">{platformStats.playersToday}</span> players registered today
    </div>
    <div className="mt-3">
      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
        <div className="h-full bg-primary" style={{ width: `${platformStats.capacityPct}%` }} />
      </div>
      <div className="mt-1 text-[11px] text-muted-foreground">{platformStats.capacityPct}% capacity</div>
    </div>
  </div>
);
