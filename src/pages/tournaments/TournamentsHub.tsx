import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Crown, Plus, Swords, Users, Wallet, Trophy, ArrowRight, Flame, Zap, ShieldCheck,
  Gamepad2, Activity, MessageCircle, HelpCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { TournamentsLayout } from "@/components/tournaments/TournamentsLayout";
import { TournamentBannerStrip } from "@/components/tournaments/TournamentBannerStrip";
import { TournamentDetailDrawer } from "@/components/tournaments/TournamentDetailDrawer";
import { ArenaHero } from "@/components/tournaments/ArenaHero";
import { LiveTicker } from "@/components/tournaments/LiveTicker";
import { FeaturedCarousel } from "@/components/tournaments/FeaturedCarousel";
import { LeaderboardPreview } from "@/components/tournaments/LeaderboardPreview";
import { RecentWinnersStrip } from "@/components/tournaments/RecentWinnersStrip";
import { FAQSection } from "@/components/tournaments/FAQSection";
import { TestimonialsSection } from "@/components/tournaments/TestimonialsSection";
import { AppCTASection } from "@/components/tournaments/AppCTASection";
import { SectionHeader } from "@/components/tournaments/SectionHeader";
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
    () => [...list].sort((a, b) => Number(b.prize) - Number(a.prize)).slice(0, 8),
    [list]
  );
  const liveItems = useMemo(
    () => list.filter((t) => t.status === "live" || t.room_status === "ongoing").slice(0, 12),
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
      <ArenaHero
        liveCount={stats.live}
        playerCount={stats.players}
        prizePool={stats.prize}
        openRooms={stats.total}
      />

      {/* Quick actions */}
      <section className="mb-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <ActionCard to="/tournaments/join"        icon={Swords}    label="Browse Rooms" desc="Find matches to join" />
        <ActionCard to="/tournaments/create"      icon={Plus}      label="Host a Match" desc="Set up your own room" />
        <ActionCard to="/tournaments/my-games"    icon={Gamepad2}  label="My Games"     desc="Joined & created" />
        <ActionCard to="/tournaments/leaderboard" icon={Crown}     label="Leaderboard"  desc="Top earners & wins" />
      </section>

      {/* Live ticker */}
      <LiveTicker items={liveItems} />

      {/* Featured */}
      <section className="mb-10">
        <SectionHeader
          eyebrow="Featured"
          icon={Flame}
          title="Trending tournaments"
          description="Highest prize pools — joining now"
          viewAllTo="/tournaments/join"
        />
        {loading ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2].map((i) => <Skeleton key={i} className="h-[280px] rounded-xl" />)}
          </div>
        ) : featured.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border/60 bg-card/50 p-10 text-center">
            <Trophy className="mx-auto mb-3 h-12 w-12 text-muted-foreground/40" />
            <div className="font-display text-lg font-bold text-foreground">No live tournaments yet</div>
            <p className="mt-1 text-[13px] text-muted-foreground">Be the first to host a match.</p>
            <Button asChild size="sm" className="btn-glow mt-4 gap-1.5">
              <Link to="/tournaments/create"><Plus className="h-3.5 w-3.5" /> Create the first one</Link>
            </Button>
          </div>
        ) : (
          <FeaturedCarousel
            items={featured}
            joinedIds={joinedIds}
            currentUserId={user?.id}
            onOpen={setSelected}
            onJoin={handleJoin}
            joiningId={joiningId}
          />
        )}
      </section>

      {/* Wallet snapshot */}
      <section className="mb-10 grid gap-3 sm:grid-cols-3">
        <Link to="/tournaments/wallet" className="group sheen relative overflow-hidden sm:col-span-2 rounded-xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/15 via-card to-card p-6 transition-all hover:border-emerald-500/50 hover:shadow-[0_0_24px_-6px_hsl(142_76%_50%/0.5)]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-emerald-400">
              <Wallet className="h-4 w-4" /> Withdrawable winnings
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-stat text-5xl font-bold text-emerald-400 sm:text-6xl">{formatCoins(winnings)}</span>
            <span className="text-sm font-semibold text-muted-foreground">IG Coins</span>
          </div>
          <div className="mt-1 text-[11px] text-muted-foreground">
            Tournament prizes only — deposited credits cannot be withdrawn.
          </div>
        </Link>

        <Link to="/tournaments/history" className="group sheen overflow-hidden rounded-xl border border-amber-500/20 bg-gradient-to-br from-amber-500/10 via-card to-card p-6 transition-all hover:border-amber-500/40">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-amber-400">
              <Crown className="h-4 w-4" /> Total earned
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
          </div>
          <div className="mt-3 font-stat text-4xl font-bold text-foreground">{formatCoins(earnings.totalEarnings)}</div>
          <div className="mt-1 text-[11px] text-muted-foreground">{earnings.wins}W · {earnings.losses}L all-time</div>
        </Link>
      </section>

      {/* How it works */}
      <section className="mb-10">
        <SectionHeader eyebrow="Get started" icon={Zap} title="How it works" />
        <div className="grid gap-3 sm:grid-cols-4">
          <Step n={1} icon={Users}      title="Register"    desc="Create your account and grab your player ID." />
          <Step n={2} icon={Wallet}     title="Add coins"   desc="Top up via eSewa, Khalti, Bank, or API Nepal." />
          <Step n={3} icon={Swords}     title="Join match"  desc="Browse open rooms and enter with IG Coins." />
          <Step n={4} icon={ShieldCheck} title="Win & cash" desc="Winners earn coins instantly — withdraw to NPR." />
        </div>
      </section>

      {/* Leaderboard preview + Recent winners */}
      <section className="mb-10 grid gap-4 lg:grid-cols-2">
        <div>
          <SectionHeader eyebrow="Hall of fame" icon={Crown} title="Top players" viewAllTo="/tournaments/leaderboard" />
          <LeaderboardPreview />
        </div>
        <div>
          <SectionHeader eyebrow="Just won" icon={Trophy} title="Recent winners" />
          <RecentWinnersStrip />
        </div>
      </section>

      {/* Testimonials */}
      <section className="mb-10">
        <SectionHeader eyebrow="Player voices" icon={MessageCircle} title="What players say" />
        <TestimonialsSection />
      </section>

      {/* App CTA */}
      <section className="mb-10">
        <AppCTASection />
      </section>

      {/* FAQ */}
      <section className="mb-10">
        <SectionHeader eyebrow="Help" icon={HelpCircle} title="Frequently asked questions" />
        <FAQSection />
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

const ActionCard = ({
  to, icon: Icon, label, desc,
}: { to: string; icon: any; label: string; desc: string }) => (
  <Link
    to={to}
    className="card-premium sheen group relative overflow-hidden p-4 transition-all"
  >
    <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl border border-primary/40 bg-primary/15 text-primary shadow-[0_0_18px_-4px_hsl(var(--primary)/0.6)] transition-transform group-hover:scale-110 group-hover:rotate-3">
      <Icon className="h-5 w-5" />
    </div>
    <div className="font-display text-[14px] font-bold text-foreground">{label}</div>
    <div className="mt-0.5 text-[11px] text-muted-foreground">{desc}</div>
    <ArrowRight className="absolute right-3 top-3 h-4 w-4 text-muted-foreground/50 transition-all group-hover:right-2 group-hover:text-primary" />
  </Link>
);

const Step = ({ n, icon: Icon, title, desc }: { n: number; icon: any; title: string; desc: string }) => (
  <div className="card-premium sheen p-4">
    <div className="flex items-center gap-2">
      <div className="font-stat flex h-8 w-8 items-center justify-center rounded-lg border border-primary/40 bg-primary/15 text-[14px] font-bold text-primary shadow-[0_0_14px_-4px_hsl(var(--primary)/0.6)]">{n}</div>
      <Icon className="h-4 w-4 text-primary" />
    </div>
    <div className="mt-3 font-display text-[14px] font-bold text-foreground">{title}</div>
    <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">{desc}</p>
  </div>
);

export default TournamentsHub;
