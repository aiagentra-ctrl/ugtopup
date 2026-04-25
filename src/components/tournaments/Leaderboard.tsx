import { Trophy } from "lucide-react";
import { mockLeaders } from "@/data/tournamentsMock";
import { formatCoins, initials, nameToColor } from "@/lib/tournamentsUtils";
import { cn } from "@/lib/utils";

const medal = (rank: number) => {
  if (rank === 1) return "🥇";
  if (rank === 2) return "🥈";
  if (rank === 3) return "🥉";
  return null;
};

export const Leaderboard = () => (
  <div className="rounded-lg border border-border/60 bg-card p-4">
    <div className="mb-1 flex items-center justify-between">
      <h3 className="flex items-center gap-2 text-[14px] font-medium text-foreground">
        <Trophy className="h-4 w-4 text-primary" />
        Top players leaderboard
      </h3>
      <button className="text-[12px] text-primary hover:underline">All rankings</button>
    </div>
    <div className="mb-3 text-[11px] text-muted-foreground">Top players of the month</div>
    <div className="overflow-hidden rounded-md">
      {mockLeaders.map((p, idx) => {
        const rank = idx + 1;
        return (
          <div
            key={p.id}
            className={cn(
              "flex items-center gap-3 px-2 py-2.5",
              idx < mockLeaders.length - 1 && "border-b border-border/40",
              p.isYou && "bg-primary/5",
            )}
          >
            <div className="w-6 text-center text-[12px] text-muted-foreground">
              {medal(rank) ?? rank}
            </div>
            <div
              className="flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-medium text-white"
              style={{ background: nameToColor(p.name) }}
            >
              {initials(p.name)}
            </div>
            <div className={cn("flex-1 text-[13px] font-medium", p.isYou ? "text-primary" : "text-foreground")}>
              {p.name}{p.isYou && <span className="ml-1 text-[11px] text-muted-foreground">(You)</span>}
            </div>
            <div className="text-[12px] text-muted-foreground">{p.wins} W</div>
            <div className="rounded-full bg-primary/15 px-2 py-0.5 text-[11px] font-medium text-primary">
              {formatCoins(p.coins)} coins
            </div>
          </div>
        );
      })}
    </div>
  </div>
);
