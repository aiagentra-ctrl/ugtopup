import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Activity, Crown, Plus, Swords, Users, Wallet, Trophy, ArrowRight, Flame, Zap, ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { TournamentsLayout } from "@/components/tournaments/TournamentsLayout";
import { TournamentCard } from "@/components/tournaments/TournamentCard";
import { TournamentDetailDrawer } from "@/components/tournaments/TournamentDetailDrawer";
import { useAuth } from "@/contexts/AuthContext";
import { useWinningsBalance } from "@/hooks/useWinningsBalance";
import {
  fetchOpenTournaments, fetchJoinedMatches, fetchEarningsSummary, joinTournament,
  subscribeTournaments, type DBTournament,
} from "@/lib/tournamentsApi";
import { formatCoins } from "@/lib/tournamentsUtils";
import { toast } from "sonner";

const TournamentsHub = () => {
  const { user } = useAuth();
  const { winnings } = useWinningsBalance();
  const [list, setList] = useState<DBTournament[]>([]);
  const [joinedIds, setJoinedIds] = useState<Set<string>>(new Set());
  const [earnings, setEarnings] = useState({ totalEarnings: 0, wins: 0, losses: 0 });
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<DBTournament | null>(null);
  const [joiningId, setJoiningId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const data = await fetchOpenTournaments();
      setList(data);
      if (user?.id) {
        const [j, s] = await Promise.all([
          fetchJoinedMatches(user.id),
          fetchEarningsSummary(user.id),
        ]);
        setJoinedIds(new Set(j.map((m) => m.id)));
        setEarnings({ totalEarnings: s.totalEarnings, wins: s.wins, losses: s.losses });
      }
    } catch {
      setList([]);
    } finally {
      setLoading(false);
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
    const prize = list.reduce((s, t) => s + Number(t.prize), 0);
    return { live, players, prize, total: list.length };
  }, [list]);

  const featured = useMemo(
    () => [...list].sort((a, b) => Number(b.prize) - Number(a.prize)).slice(0, 6),
    [list]
  );

  const handleJoin = async (t: DBTournament) => {
    if (!user) {
      toast.error("Please sign in to join tournaments");
      return;
    }
    setJoiningId(t.id);
    try {
      await joinTournament(t.id);
      toast.success(`Joined! ${t.entry_fee} IG Coins deducted.`);
      load();
    } catch (e: any) {
      toast.error(e?.message || "Couldn't join tournament");
    } finally {
      setJoiningId(null);
    }
  };

  return (
    <TournamentsLayout>
      {/* Premium hero */}
      <section className="relative mb-8 overflow-hidden rounded-2xl border border-primary/20 bg-[radial-gradient(ellipse_at_top_left,hsl(var(--primary)/0.18),transparent_55%),radial-gradient(ellipse_at_bottom_right,hsl(var(--primary)/0.12),transparent_60%)]">
        <div className="absolute inset-0 bg-grid-pattern opacity-[0.03]" aria-hidden />
        <div className="relative px-5 py-8 sm:px-8 sm:py-12">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-primary">
            <Flame className="h-3 w-3" /> Live esports arena
          </div>
          <h1 className="mt-3 text-3xl font-bold leading-tight tracking-tight sm:text-5xl">
            Compete. Win. <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">Cash out.</span>
          </h1>
          <p className="mt-3 max-w-xl text-sm text-muted-foreground sm:text-base">
            Join custom match rooms, prove your skill, and convert IG Coin winnings to real NPR.
            Hosted by players, powered by community.
          </p>

          <div className="mt-5 flex flex-wrap gap-2">
            <Button asChild size="lg" className="gap-2">
              <Link to="/tournaments/join"><Swords className="h-4 w-4" /> Quick Join</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="gap-2">
              <Link to="/tournaments/create"><Plus className="h-4 w-4" /> Create Match</Link>
            </Button>
          </div>

          {/* Compact live ticker */}
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat icon={Activity} tint="emerald" label="Live now" value={String(stats.live)} pulse />
            <Stat icon={Users} tint="primary" label="Players" value={String(stats.players)} />
            <Stat icon={Crown} tint="amber" label="Prize pool" value={formatCoins(stats.prize)} />
            <Stat icon={Trophy} tint="primary" label="Open rooms" value={String(stats.total)} />
          </div>
        </div>
      </section>

      {/* Quick actions */}
      <section className="mb-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <ActionCard to="/tournaments/join" icon={Swords} label="Browse Rooms" desc="Find matches to join" />
        <ActionCard to="/tournaments/create" icon={Plus} label="Host a Match" desc="Set up your own room" />
        <ActionCard to="/tournaments/my-games" icon={Users} label="My Games" desc="Joined & created" />
        <ActionCard to="/tournaments/leaderboard" icon={Crown} label="Leaderboard" desc="Top earners & wins" />
      </section>

      {/* Wallet snapshot — winnings only */}
      <section className="mb-8 grid gap-3 sm:grid-cols-3">
        <Link to="/tournaments/wallet" className="group sm:col-span-2 rounded-xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 via-card to-card p-5 transition-colors hover:border-emerald-500/40">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-[12px] font-medium uppercase tracking-wider text-emerald-400">
              <Wallet className="h-4 w-4" /> Withdrawable winnings
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-emerald-400 sm:text-4xl">{formatCoins(winnings)}</span>
            <span className="text-sm text-muted-foreground">IG Coins</span>
          </div>
          <div className="mt-1 text-[11px] text-muted-foreground">
            Tournament prizes only — deposited credits cannot be withdrawn.
          </div>
        </Link>

        <Link to="/tournaments/history" className="group rounded-xl border border-border/60 bg-card p-5 transition-colors hover:border-primary/40">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-[12px] font-medium uppercase tracking-wider text-muted-foreground">
              <Crown className="h-4 w-4 text-amber-400" /> Total earned
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
          </div>
          <div className="mt-2 text-3xl font-bold text-foreground">{formatCoins(earnings.totalEarnings)}</div>
          <div className="text-[11px] text-muted-foreground">{earnings.wins}W · {earnings.losses}L</div>
        </Link>
      </section>

      {/* Featured tournaments */}
      <section className="mb-10">
        <div className="mb-4 flex items-end justify-between">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-bold tracking-tight text-foreground">
              <Flame className="h-5 w-5 text-amber-400" /> Featured tournaments
            </h2>
            <p className="text-[12px] text-muted-foreground">Highest prize pools, joining now</p>
          </div>
          <Link to="/tournaments/join" className="text-[13px] font-medium text-primary hover:underline">
            View all →
          </Link>
        </div>
        {loading ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2].map((i) => <Skeleton key={i} className="h-[260px] rounded-xl" />)}
          </div>
        ) : featured.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border/60 bg-card/50 p-10 text-center">
            <Trophy className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" />
            <div className="text-sm font-medium text-foreground">No live tournaments right now</div>
            <p className="mt-1 text-[12px] text-muted-foreground">Be the first to host a match.</p>
            <Button asChild size="sm" className="mt-3 gap-1.5">
              <Link to="/tournaments/create"><Plus className="h-3.5 w-3.5" /> Create the first one</Link>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((t) => (
              <TournamentCard
                key={t.id}
                t={t}
                joined={joinedIds.has(t.id)}
                isCreator={user?.id === t.created_by}
                onOpen={() => setSelected(t)}
                onJoin={() => handleJoin(t)}
                joining={joiningId === t.id}
              />
            ))}
          </div>
        )}
      </section>

      {/* How it works — minimal 3-step */}
      <section className="mb-10">
        <h2 className="mb-4 text-lg font-bold tracking-tight text-foreground">How it works</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          <Step n={1} icon={Swords} title="Join or host" desc="Pick an open room or create your own with custom entry fee & prize." />
          <Step n={2} icon={Zap} title="Play the match" desc="Use the room ID & password shown in your dashboard. Compete fairly." />
          <Step n={3} icon={ShieldCheck} title="Win & withdraw" desc="Winners earn IG Coins instantly — withdraw to NPR via eSewa, Khalti or Bank." />
        </div>
      </section>

      <TournamentDetailDrawer
        tournament={selected}
        open={!!selected}
        onOpenChange={(v) => !v && setSelected(null)}
        onChanged={() => {
          load();
          setSelected(null);
        }}
      />
    </TournamentsLayout>
  );
};

const tintMap = {
  emerald: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  primary: "text-primary bg-primary/10 border-primary/20",
  amber: "text-amber-400 bg-amber-500/10 border-amber-500/20",
} as const;

const Stat = ({
  icon: Icon, label, value, tint, pulse,
}: { icon: any; label: string; value: string; tint: keyof typeof tintMap; pulse?: boolean }) => (
  <div className="rounded-lg border border-border/60 bg-background/40 p-3 backdrop-blur">
    <div className={`mb-1.5 inline-flex h-7 w-7 items-center justify-center rounded-md border ${tintMap[tint]} ${pulse ? "animate-pulse" : ""}`}>
      <Icon className="h-3.5 w-3.5" />
    </div>
    <div className="text-xl font-bold text-foreground">{value}</div>
    <div className="text-[11px] text-muted-foreground">{label}</div>
  </div>
);

const ActionCard = ({
  to, icon: Icon, label, desc,
}: { to: string; icon: any; label: string; desc: string }) => (
  <Link
    to={to}
    className="group relative overflow-hidden rounded-xl border border-border/60 bg-card p-4 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5"
  >
    <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-lg border border-primary/30 bg-primary/10 text-primary transition-transform group-hover:scale-110">
      <Icon className="h-5 w-5" />
    </div>
    <div className="text-[14px] font-semibold text-foreground">{label}</div>
    <div className="text-[11px] text-muted-foreground">{desc}</div>
    <ArrowRight className="absolute right-3 top-3 h-3.5 w-3.5 text-muted-foreground/50 transition-all group-hover:right-2 group-hover:text-primary" />
  </Link>
);

const Step = ({ n, icon: Icon, title, desc }: { n: number; icon: any; title: string; desc: string }) => (
  <div className="rounded-xl border border-border/60 bg-card p-4">
    <div className="flex items-center gap-2">
      <div className="flex h-7 w-7 items-center justify-center rounded-md border border-primary/30 bg-primary/10 text-[12px] font-bold text-primary">{n}</div>
      <Icon className="h-4 w-4 text-primary" />
      <div className="text-[14px] font-semibold text-foreground">{title}</div>
    </div>
    <p className="mt-2 text-[12px] leading-relaxed text-muted-foreground">{desc}</p>
  </div>
);

export default TournamentsHub;
