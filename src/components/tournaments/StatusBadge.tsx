import { cn } from "@/lib/utils";
import type { MatchStatus } from "@/data/tournamentsMock";

const styles: Record<MatchStatus, string> = {
  live: "bg-destructive/15 text-destructive border-destructive/30",
  upcoming: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  won: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  lost: "bg-destructive/15 text-destructive border-destructive/30",
  joined: "bg-primary/15 text-primary border-primary/30",
  pending: "bg-muted text-muted-foreground border-border",
};

const labels: Record<MatchStatus, string> = {
  live: "Live now",
  upcoming: "Upcoming",
  won: "Won",
  lost: "Lost",
  joined: "Joined",
  pending: "Pending",
};

export const StatusBadge = ({ status, label }: { status: MatchStatus; label?: string }) => (
  <span
    className={cn(
      "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-medium",
      styles[status],
    )}
  >
    {status === "live" && (
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-destructive opacity-75" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-destructive" />
      </span>
    )}
    {label ?? labels[status]}
  </span>
);
