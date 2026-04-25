import { useEffect, useMemo, useState } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trophy, Plus, LayoutDashboard, Search, Activity, Users, Crown, Flame } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import {
  fetchOpenTournaments, joinTournament, subscribeTournaments, type DBTournament,
  fetchJoinedMatches,
} from "@/lib/tournamentsApi";
import { CreateTournamentModal } from "@/components/tournaments/CreateTournamentModal";
import { TournamentCard } from "@/components/tournaments/TournamentCard";
import { TournamentDetailDrawer } from "@/components/tournaments/TournamentDetailDrawer";
import { EmptyState } from "@/components/tournaments/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

type StatusFilter = "all" | "live" | "upcoming" | "full";
const games = ["All", "Free Fire", "PUBG", "Mobile Legends", "Custom"] as const;

const Tournaments = () => {
  const { user } = useAuth();
  const [list, setList] = useState<DBTournament[]>([]);
  const [joinedIds, setJoinedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [selected, setSelected] = useState<DBTournament | null>(null);
  const [joiningId, setJoiningId] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [gameFilter, setGameFilter] = useState<(typeof games)[number]>("All");

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

  const filtered = useMemo(() => {
    return list.filter((t) => {
      if (gameFilter !== "All" && t.game !== gameFilter) return false;
      if (statusFilter === "live" && t.status !== "live") return false;
      if (statusFilter === "upcoming" && t.status !== "upcoming") return false;
      if (statusFilter === "full" && t.room_status !== "full") return false;
      if (search && !t.name.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [list, gameFilter, statusFilter, search]);

  const stats = useMemo(() => {
    const live = list.filter((t) => t.status === "live").length;
    const players = list.reduce((s, t) => s + (t.current_players || 0), 0);
    const prize = list.reduce((s, t) => s + Number(t.prize), 0);
    return { live, players, prize };
  }, [list]);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto max-w-6xl px-3 py-6 sm:px-4 sm:py-8">
        {/* Hero */}
        <div className="mb-6 overflow-hidden rounded-xl border border-primary/20 bg-gradient-to-br from-primary/10 via-card to-card p-5 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="mb-1 inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-0.5 text-[11px] font-medium text-primary">
                <Flame className="h-3 w-3" /> IG Arena
              </div>
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                Tournaments — play, win, withdraw.
              </h1>
              <p className="mt-1 max-w-xl text-sm text-muted-foreground">
                Browse live and upcoming match rooms. Join with IG Coins, play your match, and the winner takes the prize pool — all on-chain in real time.
              </p>
            </div>
            <div className="flex shrink-0 gap-2">
              <Button asChild variant="outline" size="sm">
                <Link to="/dashboard"><LayoutDashboard className="mr-1.5 h-4 w-4" /> My Games</Link>
              </Button>
              <Button size="sm" onClick={() => setCreateOpen(true)}>
                <Plus className="mr-1.5 h-4 w-4" /> Create matchroom
              </Button>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-3 gap-3">
            <HeroStat icon={Activity} tint="emerald" label="Live now" value={String(stats.live)} />
            <HeroStat icon={Users} tint="primary" label="Players in matches" value={String(stats.players)} />
            <HeroStat icon={Crown} tint="amber" label="Total prize pool" value={stats.prize.toLocaleString()} />
          </div>
        </div>

        {/* Filters */}
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search tournaments…"
              className="pl-8"
            />
          </div>
          <div className="-mx-1 overflow-x-auto scrollbar-hide">
            <div className="flex w-max gap-1 px-1">
              {(["all", "live", "upcoming", "full"] as const).map((s) => (
                <Pill key={s} active={statusFilter === s} onClick={() => setStatusFilter(s)}>
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </Pill>
              ))}
              <span className="mx-1 my-auto h-5 w-px bg-border" />
              {games.map((g) => (
                <Pill key={g} active={gameFilter === g} onClick={() => setGameFilter(g)}>{g}</Pill>
              ))}
            </div>
          </div>
        </div>

        {/* Grid */}
        <div className="mb-2 flex items-center gap-2 text-[13px] font-medium text-foreground">
          <Trophy className="h-4 w-4 text-primary" />
          Open tournaments
          <span className="text-muted-foreground">({filtered.length})</span>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-[260px] rounded-xl" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-xl border border-border/60 bg-card">
            <EmptyState
              title="No tournaments match your filters"
              description="Try clearing filters or be the first to create one."
              ctaLabel="Create matchroom"
              onCta={() => setCreateOpen(true)}
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((t) => (
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
      </main>
      <Footer />

      <CreateTournamentModal open={createOpen} onOpenChange={setCreateOpen} onCreated={load} />
      <TournamentDetailDrawer
        tournament={selected}
        open={!!selected}
        onOpenChange={(v) => !v && setSelected(null)}
        onChanged={() => {
          load();
          setSelected(null);
        }}
      />
    </div>
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
      <div className={cn("mb-1.5 inline-flex h-7 w-7 items-center justify-center rounded-md border", colors)}>
        <Icon className="h-3.5 w-3.5" />
      </div>
      <div className="text-lg font-semibold text-foreground sm:text-xl">{value}</div>
      <div className="text-[11px] text-muted-foreground">{label}</div>
    </div>
  );
};

const Pill = ({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) => (
  <button
    onClick={onClick}
    className={cn(
      "rounded-full border px-3 py-1 text-[12px] font-medium transition-colors whitespace-nowrap",
      active
        ? "border-primary/40 bg-primary/10 text-primary"
        : "border-border bg-muted/40 text-muted-foreground hover:text-foreground"
    )}
  >
    {children}
  </button>
);

export default Tournaments;
