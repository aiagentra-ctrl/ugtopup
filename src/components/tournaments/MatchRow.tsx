import { useEffect, useState } from "react";
import { Eye, EyeOff, Gamepad2 } from "lucide-react";
import { StatusBadge } from "./StatusBadge";
import { formatCoins, maskPassword, nameToColor } from "@/lib/tournamentsUtils";
import type { TournamentMatch } from "@/data/tournamentsMock";
import { cn } from "@/lib/utils";

export const MatchRow = ({ match, last }: { match: TournamentMatch; last?: boolean }) => {
  const [revealed, setRevealed] = useState(false);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (!revealed) return;
    const t = setTimeout(() => setRevealed(false), 5000);
    return () => clearTimeout(t);
  }, [revealed]);

  return (
    <div className={cn(!last && "border-b border-border/60")}>
      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        className="flex w-full items-center gap-3 px-3 py-3 text-left transition-colors hover:bg-muted/50"
      >
        <div
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-white"
          style={{ background: nameToColor(match.game) }}
        >
          <Gamepad2 className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-[13px] font-medium text-foreground">{match.name}</div>
          <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground">
            <span className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono">
              {match.roomId}
            </span>
            <span className="inline-flex items-center gap-1 rounded border border-border bg-muted px-1.5 py-0.5 font-mono">
              {revealed ? match.password : maskPassword(match.password)}
              <span
                role="button"
                tabIndex={0}
                onClick={(e) => {
                  e.stopPropagation();
                  setRevealed((r) => !r);
                }}
                className="ml-1 inline-flex cursor-pointer text-muted-foreground hover:text-foreground"
                aria-label={revealed ? "Hide password" : "Reveal password"}
              >
                {revealed ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
              </span>
            </span>
          </div>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <StatusBadge status={match.status} />
          <span className="text-[11px] text-muted-foreground">
            {match.status === "won"
              ? <span className="text-emerald-400">+{formatCoins(match.resultCoins ?? 0)}</span>
              : match.status === "lost"
                ? <span className="text-muted-foreground">—</span>
                : `${formatCoins(match.prize)} coins`}
          </span>
        </div>
      </button>
      {expanded && (
        <div className="space-y-1 border-t border-border/60 bg-muted/30 px-3 py-3 text-[12px] text-muted-foreground">
          <div>Game: <span className="text-foreground">{match.game}</span></div>
          <div>Entry fee: <span className="text-foreground">{formatCoins(match.entryFee)} coins</span></div>
          <div>Prize pool: <span className="text-foreground">{formatCoins(match.prize)} coins</span></div>
          {match.startsAt && <div>Starts: <span className="text-foreground">{new Date(match.startsAt).toLocaleString()}</span></div>}
          {match.finishedAt && <div>Finished: <span className="text-foreground">{new Date(match.finishedAt).toLocaleString()}</span></div>}
        </div>
      )}
    </div>
  );
};
