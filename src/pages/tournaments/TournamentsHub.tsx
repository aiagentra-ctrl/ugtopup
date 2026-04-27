import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Swords, Plus, Activity, Wallet, Crown, Trophy, Flame, ArrowRight, Sparkles,
} from "lucide-react";
import { TournamentsLayout } from "@/components/tournaments/TournamentsLayout";
import { TournamentBannerStrip } from "@/components/tournaments/TournamentBannerStrip";
import { useAuth } from "@/contexts/AuthContext";
import { useWinningsBalance } from "@/hooks/useWinningsBalance";
import {
  fetchOpenTournaments, fetchEarningsSummary, subscribeTournaments, type DBTournament,
} from "@/lib/tournamentsApi";
import { formatCoins } from "@/lib/tournamentsUtils";

const TournamentsHub = () => {
  const { user } = useAuth();
  const { winnings } = useWinningsBalance();
  const [list, setList] = useState<DBTournament[]>([]);
  const [earnings, setEarnings] = useState({ totalEarnings: 0, wins: 0, losses: 0 });

  const load = async () => {
    try {
      const data = await fetchOpenTournaments();
      setList(data);
      if (user?.id) {
        const s = await fetchEarningsSummary(user.id);
        setEarnings({ totalEarnings: s.totalEarnings, wins: s.wins, losses: s.losses });
      }
    } catch {
      setList([]);
    }
  };

  useEffect(() => {
    load();
    const unsub = subscribeTournaments(load);
    return unsub;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const stats = useMemo(() => {
    const live = list.filter((t) => t.status === "live").length;
    const players = list.reduce((s, t) => s + (t.current_players || 0), 0);
    return { live, players, total: list.length };
  }, [list]);

  return (
    <TournamentsLayout minimal>
      <TournamentBannerStrip />

      {/* HERO — minimal, focused */}
      <section className="relative mb-8 overflow-hidden rounded-3xl border border-primary/30 bg-arena-mesh animate-bg-pan">
        <span className="orb orb-primary   left-[-60px]  top-[-40px]  h-56 w-56 animate-float" />
        <span className="orb orb-secondary right-[-40px] top-1/3      h-48 w-48 animate-float-slow" />
        <div className="absolute inset-0 bg-grid-fade" aria-hidden />

        <div className="relative px-5 py-12 text-center sm:px-10 sm:py-20">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/40 bg-primary/15 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.22em] text-primary backdrop-blur">
            <span className="live-dot" /> <Flame className="h-3 w-3" /> Free Fire Arena
          </div>

          <h1 className="font-display mx-auto mt-5 max-w-3xl text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-6xl">
            Play. Win. <span className="text-gradient-gold">Cash out.</span>
          </h1>

          <p className="mx-auto mt-4 max-w-md text-sm text-muted-foreground sm:text-base">
            One tap to join a live room or host your own match.
          </p>

          {/* The two main CTAs — full-width on mobile, side-by-side on desktop */}
          <div className="mx-auto mt-8 grid max-w-2xl gap-3 sm:grid-cols-2">
            <Link
              to="/tournaments/join"
              className="group sheen relative overflow-hidden rounded-2xl border border-primary/50 bg-gradient-to-br from-primary/30 via-primary/15 to-card p-6 text-left transition-all hover:border-primary hover:shadow-[0_0_40px_-10px_hsl(var(--primary)/0.8)]"
            >
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-primary/50 bg-primary/20 text-primary shadow-[0_0_24px_-6px_hsl(var(--primary)/0.7)] transition-transform group-hover:scale-110 group-hover:rotate-3">
                <Swords className="h-7 w-7" />
              </div>
              <div className="font-display text-2xl font-extrabold text-foreground">
                Join Tournament
              </div>
              <div className="mt-1 text-[13px] text-muted-foreground">
                Browse live rooms and enter instantly.
              </div>
              <div className="mt-4 inline-flex items-center gap-1 text-[12px] font-semibold uppercase tracking-wider text-primary">
                {stats.total} open <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
              </div>
            </Link>

            <Link
              to="/tournaments/create"
              className="group sheen relative overflow-hidden rounded-2xl border border-amber-500/50 bg-gradient-to-br from-amber-500/25 via-amber-500/10 to-card p-6 text-left transition-all hover:border-amber-400 hover:shadow-[0_0_40px_-10px_hsl(45_95%_55%/0.8)]"
            >
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-amber-500/50 bg-amber-500/20 text-amber-400 shadow-[0_0_24px_-6px_hsl(45_95%_55%/0.7)] transition-transform group-hover:scale-110 group-hover:-rotate-3">
                <Plus className="h-7 w-7" />
              </div>
              <div className="font-display text-2xl font-extrabold text-foreground">
                Create Tournament
              </div>
              <div className="mt-1 text-[13px] text-muted-foreground">
                Host your own room and set the prize.
              </div>
              <div className="mt-4 inline-flex items-center gap-1 text-[12px] font-semibold uppercase tracking-wider text-amber-400">
                Earn as host <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
              </div>
            </Link>
          </div>

          {/* Tiny live pulse */}
          <div className="mt-7 inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-[11px] font-semibold text-emerald-400">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            {stats.live} live now · {stats.players} players online
          </div>
        </div>
      </section>

      {/* 3 focused tiles — Earnings · Wallet · Live */}
      <section className="grid gap-3 sm:grid-cols-3">
        <FeatureTile
          to="/tournaments/history"
          icon={Crown}
          tint="amber"
          label="Earnings"
          value={formatCoins(earnings.totalEarnings)}
          suffix="IG"
          sub={`${earnings.wins}W · ${earnings.losses}L all-time`}
        />
        <FeatureTile
          to="/tournaments/wallet"
          icon={Wallet}
          tint="emerald"
          label="Wallet"
          value={formatCoins(winnings)}
          suffix="IG"
          sub="Withdrawable winnings"
        />
        <FeatureTile
          to="/tournaments/live"
          icon={Activity}
          tint="primary"
          label="Live Matches"
          value={String(stats.live)}
          sub="Tap to watch & join results"
          live
        />
      </section>

      {/* Subtle helper row */}
      <div className="mt-6 flex items-center justify-center gap-2 text-[11px] text-muted-foreground">
        <Sparkles className="h-3 w-3" />
        Tap the menu icon (top-right) for leaderboard, history & reports.
      </div>
    </TournamentsLayout>
  );
};

const tintMap = {
  amber:   "border-amber-500/30 from-amber-500/10  hover:border-amber-500/50  text-amber-400",
  emerald: "border-emerald-500/30 from-emerald-500/10 hover:border-emerald-500/50 text-emerald-400",
  primary: "border-primary/30 from-primary/10 hover:border-primary/50 text-primary",
} as const;

const FeatureTile = ({
  to, icon: Icon, label, value, suffix, sub, tint, live,
}: {
  to: string;
  icon: any;
  label: string;
  value: string;
  suffix?: string;
  sub: string;
  tint: keyof typeof tintMap;
  live?: boolean;
}) => (
  <Link
    to={to}
    className={`group sheen relative overflow-hidden rounded-2xl border bg-gradient-to-br via-card to-card p-5 transition-all ${tintMap[tint]}`}
  >
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className={`flex h-9 w-9 items-center justify-center rounded-xl bg-current/10 ring-1 ring-current/30`}>
          <Icon className="h-4 w-4" />
        </div>
        <div className="text-[11px] font-bold uppercase tracking-[0.18em]">{label}</div>
      </div>
      {live && <span className="live-dot" />}
    </div>
    <div className="mt-4 flex items-baseline gap-1.5">
      <span className="font-stat text-3xl font-bold text-foreground">{value}</span>
      {suffix && <span className="text-xs font-semibold text-muted-foreground">{suffix}</span>}
    </div>
    <div className="mt-1 text-[11px] text-muted-foreground">{sub}</div>
    <ArrowRight className="absolute right-3 top-3 h-4 w-4 text-muted-foreground/50 transition-all group-hover:right-2 group-hover:text-foreground" />
  </Link>
);

export default TournamentsHub;
