import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Search, Trophy, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { TournamentsLayout } from "@/components/tournaments/TournamentsLayout";
import { TournamentCard } from "@/components/tournaments/TournamentCard";
import { TournamentDetailDrawer } from "@/components/tournaments/TournamentDetailDrawer";
import { EmptyState } from "@/components/tournaments/EmptyState";
import { useAuth } from "@/contexts/AuthContext";
import {
  fetchOpenTournaments, fetchJoinedMatches, joinTournament, subscribeTournaments,
  type DBTournament,
} from "@/lib/tournamentsApi";
import { cn } from "@/lib/utils";

type StatusFilter = "all" | "live" | "upcoming" | "full";
const games = ["All", "Free Fire", "PUBG", "Mobile Legends", "Custom"] as const;

const JoinTournamentPage = () => {
  const { user } = useAuth();
  const [list, setList] = useState<DBTournament[]>([]);
  const [joinedIds, setJoinedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
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

  return (
    <TournamentsLayout
      title="Join a Tournament"
      subtitle="Browse open match rooms and join with IG Coins."
      actions={
        <Button asChild size="sm">
          <Link to="/tournaments/create"><Plus className="mr-1.5 h-4 w-4" /> Create</Link>
        </Button>
      }
    >
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

export default JoinTournamentPage;
