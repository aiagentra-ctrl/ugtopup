import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Trophy, Gamepad2, Plus, LayoutDashboard } from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { fetchOpenTournaments, type DBTournament } from "@/lib/tournamentsApi";
import { StatusBadge } from "@/components/tournaments/StatusBadge";
import { formatCoins } from "@/lib/tournamentsUtils";
import { CreateTournamentModal } from "@/components/tournaments/CreateTournamentModal";
import { SkeletonRow } from "@/components/tournaments/SkeletonRow";
import { EmptyState } from "@/components/tournaments/EmptyState";

const Tournaments = () => {
  const [list, setList] = useState<DBTournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await fetchOpenTournaments();
      setList(data);
    } catch {
      setList([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-3 py-6 sm:px-4 sm:py-8 max-w-5xl">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              <span className="text-primary">IG</span> Arena Tournaments
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Browse open tournaments and join with your IG Coins. Manage your matches from the Dashboard.
            </p>
          </div>
          <div className="flex gap-2">
            <Button asChild variant="outline" size="sm">
              <Link to="/dashboard">
                <LayoutDashboard className="mr-1.5 h-4 w-4" /> My Arena
              </Link>
            </Button>
            <Button size="sm" onClick={() => setCreateOpen(true)}>
              <Plus className="mr-1.5 h-4 w-4" /> Create
            </Button>
          </div>
        </div>

        <Card className="overflow-hidden">
          <div className="border-b border-border/60 bg-muted/30 px-4 py-3">
            <h2 className="flex items-center gap-2 text-sm font-medium">
              <Trophy className="h-4 w-4 text-primary" /> Open tournaments
            </h2>
          </div>
          {loading ? (
            <>
              <SkeletonRow />
              <SkeletonRow />
              <SkeletonRow />
            </>
          ) : list.length ? (
            list.map((t, i) => (
              <div
                key={t.id}
                className={`flex items-center gap-3 px-4 py-3 ${i < list.length - 1 ? "border-b border-border/60" : ""}`}
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <Gamepad2 className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[13px] font-medium">{t.name}</div>
                  <div className="text-[11px] text-muted-foreground">
                    {t.game} · Entry {formatCoins(Number(t.entry_fee))} · Prize {formatCoins(Number(t.prize))}
                  </div>
                </div>
                <StatusBadge
                  status={t.status === "live" ? "live" : "upcoming"}
                  label={t.status === "live" ? "Live" : "Upcoming"}
                />
              </div>
            ))
          ) : (
            <EmptyState
              title="No open tournaments"
              description="Be the first to create one and invite players."
              ctaLabel="Create tournament"
              onCta={() => setCreateOpen(true)}
            />
          )}
        </Card>
      </main>
      <Footer />
      <CreateTournamentModal open={createOpen} onOpenChange={setCreateOpen} onCreated={load} />
    </div>
  );
};

export default Tournaments;
