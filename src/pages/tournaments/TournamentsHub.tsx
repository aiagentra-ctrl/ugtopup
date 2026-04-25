import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Activity, Crown, Plus, Swords, Users, Wallet, Trophy, ArrowRight, Megaphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { TournamentsLayout } from "@/components/tournaments/TournamentsLayout";
import { TournamentCard } from "@/components/tournaments/TournamentCard";
import { TournamentDetailDrawer } from "@/components/tournaments/TournamentDetailDrawer";
import { HowItWorks } from "@/components/tournaments/HowItWorks";
import { NotificationsPanel } from "@/components/tournaments/NotificationsPanel";
import { useAuth } from "@/contexts/AuthContext";
import { useLiveBalance } from "@/hooks/useLiveBalance";
import {
  fetchOpenTournaments, fetchJoinedMatches, fetchEarningsSummary, joinTournament,
  subscribeTournaments, type DBTournament,
} from "@/lib/tournamentsApi";
import { formatCoins } from "@/lib/tournamentsUtils";
import { toast } from "sonner";

const TournamentsHub = () => {
  const { user } = useAuth();
  const { balance } = useLiveBalance();
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
    () => [...list].sort((a, b) => Number(b.prize) - Number(a.prize)).slice(0, 3),
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
      {/* Hero */}
      <div className="mb-6 overflow-hidden rounded-xl border border-primary/20 bg-gradient-to-br from-primary/10 via-card to-card p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-1 inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-0.5 text-[11px] font-medium text-primary">
              <Trophy className="h-3 w-3" /> IG Arena
            </div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Welcome to the Arena
            </h1>
            <p className="mt-1 max-w-xl text-sm text-muted-foreground">
              Live competitive match rooms. Quick-join, create your own, win IG Coins, withdraw to NPR.
            </p>
          </div>
          <div className="flex shrink-0 gap-2">
            <Button asChild variant="outline" size="sm">
              <Link to="/tournaments/my-games">My Games</Link>
            </Button>
            <Button asChild size="sm">
              <Link to="/tournaments/create"><Plus className="mr-1.5 h-4 w-4" /> Create</Link>
            </Button>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <HeroStat icon={Activity} tint="emerald" label="Live now" value={String(stats.live)} />
          <HeroStat icon={Users} tint="primary" label="Players in matches" value={String(stats.players)} />
          <HeroStat icon={Crown} tint="amber" label="Total prize pool" value={formatCoins(stats.prize)} />
          <HeroStat icon={Trophy} tint="primary" label="Open rooms" value={String(stats.total)} />
        </div>
      </div>

      {/* Quick actions */}
      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <QuickAction to="/tournaments/join" icon={Swords} label="Quick Join" desc="Browse open rooms" />
        <QuickAction to="/tournaments/create" icon={Plus} label="Create Match" desc="Host your own room" />
        <QuickAction to="/tournaments/my-games" icon={Users} label="My Games" desc="Joined & created" />
        <QuickAction to="/tournaments/leaderboard" icon={Crown} label="Leaderboard" desc="Top players" />
      </div>

      {/* Wallet & Earnings */}
      <div className="mb-6 grid gap-3 sm:grid-cols-2">
        <Link to="/tournaments/wallet" className="group rounded-xl border border-border/60 bg-card p-4 transition-colors hover:border-primary/40">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-[12px] text-muted-foreground">
              <Wallet className="h-4 w-4 text-primary" /> Wallet balance
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
          </div>
          <div className="mt-2 text-2xl font-bold text-foreground">{formatCoins(balance)} <span className="text-sm font-normal text-muted-foreground">IG Coins</span></div>
          <div className="text-[11px] text-muted-foreground">Tap to withdraw</div>
        </Link>

        <Link to="/tournaments/history" className="group rounded-xl border border-border/60 bg-card p-4 transition-colors hover:border-primary/40">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-[12px] text-muted-foreground">
              <Crown className="h-4 w-4 text-amber-400" /> Total winnings
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
          </div>
          <div className="mt-2 text-2xl font-bold text-foreground">{formatCoins(earnings.totalEarnings)} <span className="text-sm font-normal text-muted-foreground">coins</span></div>
          <div className="text-[11px] text-muted-foreground">{earnings.wins}W · {earnings.losses}L</div>
        </Link>
      </div>

      {/* Featured / Live */}
      <section className="mb-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-[15px] font-semibold text-foreground">
            <Activity className="h-4 w-4 text-emerald-400" /> Featured tournaments
          </h2>
          <Link to="/tournaments/join" className="text-[12px] text-primary hover:underline">
            View all →
          </Link>
        </div>
        {loading ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2].map((i) => <Skeleton key={i} className="h-[260px] rounded-xl" />)}
          </div>
        ) : featured.length === 0 ? (
          <div className="rounded-xl border border-border/60 bg-card p-8 text-center text-sm text-muted-foreground">
            No live tournaments right now. <Link to="/tournaments/create" className="text-primary hover:underline">Create the first one →</Link>
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

      {/* How it works */}
      <section className="mb-6">
        <h2 className="mb-3 text-[15px] font-semibold text-foreground">How tournaments work</h2>
        <HowItWorks />
      </section>

      {/* Announcements */}
      <section className="mb-6">
        <h2 className="mb-3 flex items-center gap-2 text-[15px] font-semibold text-foreground">
          <Megaphone className="h-4 w-4 text-primary" /> Announcements & updates
        </h2>
        <NotificationsPanel />
      </section>

      {/* CTA strip */}
      <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 text-center">
        <p className="text-sm text-foreground">Climb the ranks and earn your spot at the top.</p>
        <Button asChild size="sm" className="mt-2 gap-2">
          <Link to="/tournaments/leaderboard"><Crown className="h-4 w-4" /> View Leaderboard</Link>
        </Button>
      </div>

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

const HeroStat = ({
  icon: Icon, label, value, tint,
}: { icon: any; label: string; value: string; tint: "emerald" | "primary" | "amber" }) => {
  const colors = {
    emerald: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    primary: "text-primary bg-primary/10 border-primary/20",
    amber: "text-amber-400 bg-amber-500/10 border-amber-500/20",
  }[tint];
  return (
    <div className="rounded-lg border border-border/60 bg-card p-3">
      <div className={`mb-1.5 inline-flex h-7 w-7 items-center justify-center rounded-md border ${colors}`}>
        <Icon className="h-3.5 w-3.5" />
      </div>
      <div className="text-lg font-semibold text-foreground sm:text-xl">{value}</div>
      <div className="text-[11px] text-muted-foreground">{label}</div>
    </div>
  );
};

const QuickAction = ({
  to, icon: Icon, label, desc,
}: { to: string; icon: any; label: string; desc: string }) => (
  <Link
    to={to}
    className="group rounded-xl border border-border/60 bg-card p-4 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
  >
    <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg border border-primary/30 bg-primary/10 text-primary transition-transform group-hover:scale-110">
      <Icon className="h-5 w-5" />
    </div>
    <div className="text-[14px] font-semibold text-foreground">{label}</div>
    <div className="text-[11px] text-muted-foreground">{desc}</div>
  </Link>
);

export default TournamentsHub;
