import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Activity, Swords } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { TournamentsLayout } from "@/components/tournaments/TournamentsLayout";
import { TournamentCard } from "@/components/tournaments/TournamentCard";
import { TournamentDetailDrawer } from "@/components/tournaments/TournamentDetailDrawer";
import { EmptyState } from "@/components/tournaments/EmptyState";
import { useAuth } from "@/contexts/AuthContext";
import {
  fetchOpenTournaments, fetchJoinedMatches, joinTournament, subscribeTournaments,
  type DBTournament,
} from "@/lib/tournamentsApi";
import { toast } from "sonner";

const LiveMatchesPage = () => {
  const { user } = useAuth();
  const [list, setList] = useState<DBTournament[]>([]);
  const [joinedIds, setJoinedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<DBTournament | null>(null);
  const [joiningId, setJoiningId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const data = await fetchOpenTournaments();
      setList(data.filter((t) => t.status === "live" || t.room_status === "ongoing"));
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
    if (!user) return toast.error("Please sign in to join tournaments");
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
    <TournamentsLayout
      title="Live Matches"
      subtitle="Tournaments that are currently ongoing."
      actions={
        <Button asChild variant="outline" size="sm">
          <Link to="/tournaments/join"><Swords className="mr-1.5 h-4 w-4" /> Browse all</Link>
        </Button>
      }
    >
      <div className="mb-3 flex items-center gap-2 text-[13px] font-medium text-foreground">
        <span className="relative flex h-2.5 w-2.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
        </span>
        <Activity className="h-4 w-4 text-emerald-400" />
        Currently live
        <span className="text-muted-foreground">({list.length})</span>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => <Skeleton key={i} className="h-[260px] rounded-xl" />)}
        </div>
      ) : list.length === 0 ? (
        <div className="rounded-xl border border-border/60 bg-card">
          <EmptyState title="No live matches right now" description="Check the upcoming tournaments and join one." />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((t) => (
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

export default LiveMatchesPage;
