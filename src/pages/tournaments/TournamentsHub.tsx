import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Flame, Plus, Swords, Trophy, Wallet, Gamepad2, Users, Crown, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { TournamentsLayout } from "@/components/tournaments/TournamentsLayout";
import { TournamentBannerStrip } from "@/components/tournaments/TournamentBannerStrip";
import { TournamentDetailDrawer } from "@/components/tournaments/TournamentDetailDrawer";
import { TournamentCard } from "@/components/tournaments/TournamentCard";
import { EmptyState } from "@/components/tournaments/EmptyState";
import { useAuth } from "@/contexts/AuthContext";
import { useWinningsBalance } from "@/hooks/useWinningsBalance";
import {
  fetchOpenTournaments, fetchJoinedMatches, joinTournament,
  subscribeTournaments, type DBTournament,
} from "@/lib/tournamentsApi";
import { formatCoins } from "@/lib/tournamentsUtils";
import { toast } from "sonner";

const TournamentsHub = () => {
  const { user } = useAuth();
  const { winnings } = useWinningsBalance();
  const [list, setList] = useState<DBTournament[]>([]);
  const [joinedIds, setJoinedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<DBTournament | null>(null);
  const [joiningId, setJoiningId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const data = await fetchOpenTournaments();
      setList(data);
      if (user?.id) {
        const j = await fetchJoinedMatches(user.id);
        setJoinedIds(new Set(j.map((m) => m.id)));
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

  // Free Fire first; show others below if any.
  const freeFireRooms = useMemo(
    () => list.filter((t) => t.game.toLowerCase().includes("free fire")).slice(0, 9),
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
      <TournamentBannerStrip />

      {/* Simple Free Fire hero */}
      <section className="mb-6 overflow-hidden rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/15 via-card to-card p-6 sm:p-8">
        <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/40 bg-primary/15 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em] text-primary">
          <Flame className="h-3 w-3" /> Free Fire Tournaments
        </div>
        <h1 className="font-display mt-3 text-3xl font-extrabold leading-tight sm:text-4xl">
          Play. Win. <span className="text-gradient-primary">Cash out.</span>
        </h1>
        <p className="mt-2 max-w-xl text-sm text-muted-foreground">
          Join Free Fire match rooms with your IG Coins. Winners take the prize pool — withdraw straight to NPR.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Button asChild size="lg" className="btn-glow gap-2 font-semibold">
            <a href="#rooms"><Swords className="h-4 w-4" /> Join a Match</a>
          </Button>
          <Button asChild size="lg" variant="outline" className="gap-2 border-primary/40 hover:bg-primary/10">
            <Link to="/tournaments/create"><Plus className="h-4 w-4" /> Create Match</Link>
          </Button>
        </div>
      </section>

      {/* Quick links */}
      <section className="mb-8 grid grid-cols-3 gap-3">
        <QuickLink to="/tournaments/my-games" icon={Gamepad2} label="My Games" />
        <QuickLink to="/tournaments/wallet"   icon={Wallet}   label="Wallet" />
        <QuickLink to="/tournaments/create"   icon={Plus}     label="Create" />
      </section>

      {/* Wallet snapshot for logged-in users */}
      {user && (
        <Link
          to="/tournaments/wallet"
          className="mb-8 flex items-center justify-between rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4 transition-colors hover:bg-emerald-500/10"
        >
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">Withdrawable winnings</div>
            <div className="font-stat mt-1 text-2xl font-bold text-emerald-400">
              {formatCoins(winnings)} <span className="text-xs font-semibold text-muted-foreground">IG Coins</span>
            </div>
          </div>
          <ArrowRight className="h-5 w-5 text-muted-foreground" />
        </Link>
      )}

      {/* Available Free Fire rooms */}
      <section id="rooms" className="mb-10">
        <div className="mb-4 flex items-end justify-between">
          <div>
            <h2 className="font-display flex items-center gap-2 text-xl font-bold sm:text-2xl">
              <Trophy className="h-5 w-5 text-primary" /> Available Free Fire Rooms
            </h2>
            <p className="text-[12px] text-muted-foreground">Tap a room to view details and join.</p>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2].map((i) => <Skeleton key={i} className="h-[260px] rounded-xl" />)}
          </div>
        ) : freeFireRooms.length === 0 ? (
          <div className="rounded-xl border border-border/60 bg-card">
            <EmptyState
              title="No Free Fire rooms right now"
              description="Be the first to host one — it only takes a minute."
              ctaLabel="Create a match"
            />
            <div className="border-t border-border/60 p-4 text-center">
              <Button asChild size="sm" className="btn-glow gap-1.5">
                <Link to="/tournaments/create"><Plus className="h-3.5 w-3.5" /> Create Free Fire match</Link>
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {freeFireRooms.map((t) => (
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

      {/* Simple how to play */}
      <section className="mb-10">
        <h2 className="font-display mb-4 text-xl font-bold sm:text-2xl">How it works</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          <Step n={1} icon={Wallet}  title="Add IG Coins"  desc="Top up your wallet to enter rooms." />
          <Step n={2} icon={Swords}  title="Join a match"  desc="Pick a Free Fire room and pay the entry." />
          <Step n={3} icon={Crown}   title="Win & cash out" desc="Winners get the pool — withdraw to NPR." />
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

const QuickLink = ({ to, icon: Icon, label }: { to: string; icon: any; label: string }) => (
  <Link
    to={to}
    className="group flex flex-col items-center justify-center gap-2 rounded-xl border border-border/60 bg-card p-4 transition-all hover:border-primary/40 hover:bg-primary/5"
  >
    <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-primary/30 bg-primary/10 text-primary">
      <Icon className="h-5 w-5" />
    </div>
    <span className="text-[12px] font-semibold text-foreground">{label}</span>
  </Link>
);

const Step = ({ n, icon: Icon, title, desc }: { n: number; icon: any; title: string; desc: string }) => (
  <div className="rounded-xl border border-border/60 bg-card p-4">
    <div className="flex items-center gap-2">
      <div className="font-stat flex h-8 w-8 items-center justify-center rounded-lg border border-primary/40 bg-primary/15 text-[14px] font-bold text-primary">{n}</div>
      <Icon className="h-4 w-4 text-primary" />
    </div>
    <div className="mt-3 font-display text-[14px] font-bold text-foreground">{title}</div>
    <div className="mt-1 text-[12px] text-muted-foreground">{desc}</div>
  </div>
);

export default TournamentsHub;
