import { Crown, Gamepad2, Users, Coins, Swords } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { RoomStatusBadge } from "./RoomStatusBadge";
import { CountdownTimer } from "./CountdownTimer";
import { formatCoins, nameToColor } from "@/lib/tournamentsUtils";
import type { DBTournament } from "@/lib/tournamentsApi";
import { cn } from "@/lib/utils";

export const TournamentCard = ({
  t,
  joined,
  isCreator,
  onOpen,
  onJoin,
  joining,
}: {
  t: DBTournament;
  joined?: boolean;
  isCreator?: boolean;
  onOpen: () => void;
  onJoin: () => void;
  joining?: boolean;
}) => {
  const pct = t.max_players > 0 ? Math.min(100, (t.current_players / t.max_players) * 100) : 0;
  const isFull = t.room_status === "full";
  const isLive = t.status === "live" || t.room_status === "ongoing";

  return (
    <div
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-xl border bg-card transition-all",
        "hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5",
        isLive ? "border-emerald-500/30" : "border-border/60"
      )}
    >
      {isLive && (
        <span className="pointer-events-none absolute inset-x-0 top-0 h-0.5 animate-pulse bg-gradient-to-r from-emerald-500/0 via-emerald-500 to-emerald-500/0" />
      )}

      <button onClick={onOpen} className="flex flex-1 flex-col items-stretch gap-3 p-4 text-left">
        <div className="flex items-start gap-3">
          <div
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-white shadow-sm"
            style={{ background: nameToColor(t.game) }}
          >
            <Gamepad2 className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <h3 className="truncate text-[14px] font-semibold text-foreground">{t.name}</h3>
              <RoomStatusBadge status={t.room_status} />
            </div>
            <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground">
              <span>{t.game}</span>
              <span className="opacity-50">·</span>
              <span className="inline-flex items-center gap-1">
                <Swords className="h-3 w-3" /> {t.game_mode}
              </span>
              {isCreator && (
                <span className="rounded-full border border-primary/30 bg-primary/10 px-1.5 py-0.5 text-[10px] text-primary">
                  Yours
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-lg border border-border/60 bg-muted/30 p-2.5">
            <div className="flex items-center gap-1 text-[10px] uppercase tracking-wide text-muted-foreground">
              <Crown className="h-3 w-3" /> Prize pool
            </div>
            <div className="mt-0.5 text-[16px] font-bold text-primary">{formatCoins(Number(t.prize))}</div>
          </div>
          <div className="rounded-lg border border-border/60 bg-muted/30 p-2.5">
            <div className="flex items-center gap-1 text-[10px] uppercase tracking-wide text-muted-foreground">
              <Coins className="h-3 w-3" /> Entry fee
            </div>
            <div className="mt-0.5 text-[16px] font-bold text-foreground">{formatCoins(Number(t.entry_fee))}</div>
          </div>
        </div>

        <div>
          <div className="mb-1 flex items-center justify-between text-[11px]">
            <span className="inline-flex items-center gap-1 text-muted-foreground">
              <Users className="h-3 w-3" /> Players
            </span>
            <span className="font-mono font-medium text-foreground">
              {t.current_players}/{t.max_players}
            </span>
          </div>
          <Progress value={pct} className="h-1.5" />
        </div>

        {t.starts_at && !isLive && (
          <CountdownTimer target={t.starts_at} className="text-[12px]" />
        )}
      </button>

      <div className="border-t border-border/60 bg-muted/20 p-3">
        {joined ? (
          <Button variant="outline" size="sm" className="w-full" onClick={onOpen}>
            View room
          </Button>
        ) : isFull ? (
          <Button size="sm" className="w-full" disabled>
            Room full
          </Button>
        ) : isLive ? (
          <Button size="sm" variant="secondary" className="w-full" onClick={onOpen}>
            View live
          </Button>
        ) : (
          <Button size="sm" className="w-full" onClick={onJoin} disabled={joining}>
            {joining ? "Joining…" : `Join · ${formatCoins(Number(t.entry_fee))} coins`}
          </Button>
        )}
      </div>
    </div>
  );
};
