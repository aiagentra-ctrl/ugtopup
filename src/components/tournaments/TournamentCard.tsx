import { Crown, Gamepad2, Users, Coins, Swords, Clock } from "lucide-react";
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
        "sheen group relative flex h-full flex-col overflow-hidden rounded-xl border bg-card transition-all duration-300",
        "hover:-translate-y-1 hover:shadow-[0_18px_40px_-12px_hsl(var(--primary)/0.35)]",
        isLive ? "border-emerald-500/40" : "border-border/60 hover:border-primary/40"
      )}
    >
      {/* Top accent line */}
      <span className={cn(
        "pointer-events-none absolute inset-x-0 top-0 h-[2px]",
        isLive
          ? "animate-pulse bg-gradient-to-r from-emerald-500/0 via-emerald-500 to-emerald-500/0"
          : "bg-gradient-to-r from-transparent via-primary/40 to-transparent opacity-0 transition-opacity group-hover:opacity-100"
      )} />

      {isLive && (
        <div className="absolute right-3 top-3 z-10 inline-flex items-center gap-1 rounded-full border border-emerald-500/40 bg-emerald-500/15 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-emerald-300 backdrop-blur">
          <span className="live-dot scale-75" /> Live
        </div>
      )}

      <button onClick={onOpen} className="flex flex-1 flex-col items-stretch gap-3 p-4 text-left">
        <div className="flex items-start gap-3">
          <div
            className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-white shadow-lg transition-transform group-hover:scale-105"
            style={{ background: nameToColor(t.game) }}
          >
            <Gamepad2 className="h-5 w-5" />
            <span className="absolute inset-0 rounded-xl ring-1 ring-inset ring-white/20" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="truncate pr-12 text-[14px] font-bold text-foreground">{t.name}</h3>
            <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground">
              <span className="font-medium">{t.game}</span>
              <span className="opacity-50">·</span>
              <span className="inline-flex items-center gap-1"><Swords className="h-3 w-3" /> {t.game_mode}</span>
              {isCreator && (
                <span className="rounded-full border border-primary/40 bg-primary/15 px-1.5 py-0.5 text-[9px] font-bold uppercase text-primary">Yours</span>
              )}
              {!isLive && <RoomStatusBadge status={t.room_status} />}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-lg border border-amber-500/20 bg-gradient-to-br from-amber-500/10 to-transparent p-2.5">
            <div className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-amber-400/80">
              <Crown className="h-3 w-3" /> Prize
            </div>
            <div className="font-stat mt-0.5 text-lg font-bold text-amber-400">{formatCoins(Number(t.prize))}</div>
          </div>
          <div className="rounded-lg border border-border/60 bg-muted/30 p-2.5">
            <div className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
              <Coins className="h-3 w-3" /> Entry
            </div>
            <div className="font-stat mt-0.5 text-lg font-bold text-foreground">{formatCoins(Number(t.entry_fee))}</div>
          </div>
        </div>

        <div>
          <div className="mb-1 flex items-center justify-between text-[11px]">
            <span className="inline-flex items-center gap-1 text-muted-foreground">
              <Users className="h-3 w-3" /> Players
            </span>
            <span className="font-stat font-bold text-foreground">
              {t.current_players}<span className="text-muted-foreground">/{t.max_players}</span>
            </span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-muted">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-500",
                pct >= 100 ? "bg-emerald-500" : "bg-gradient-to-r from-primary to-secondary"
              )}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        {t.starts_at && !isLive && (
          <div className="flex items-center gap-1.5 rounded-md border border-border/40 bg-muted/20 px-2 py-1.5 text-[11px]">
            <Clock className="h-3 w-3 text-primary" />
            <CountdownTimer target={t.starts_at} className="font-stat font-bold" />
          </div>
        )}
      </button>

      <div className="border-t border-border/60 bg-muted/10 p-3">
        {joined ? (
          <Button variant="outline" size="sm" className="w-full border-primary/40 text-primary hover:bg-primary/10" onClick={onOpen}>
            View room
          </Button>
        ) : isFull ? (
          <Button size="sm" className="w-full" disabled>Room full</Button>
        ) : isLive ? (
          <Button size="sm" variant="secondary" className="w-full" onClick={onOpen}>Watch live</Button>
        ) : (
          <Button size="sm" className="btn-glow w-full font-semibold" onClick={onJoin} disabled={joining}>
            {joining ? "Joining…" : `Join · ${formatCoins(Number(t.entry_fee))} IG`}
          </Button>
        )}
      </div>
    </div>
  );
};
