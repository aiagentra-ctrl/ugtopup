import { useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Wallet, Plus, Inbox, Trophy, Flag, Gamepad2 } from "lucide-react";
import { MatchRow } from "./MatchRow";
import { WalletTab } from "./WalletTab";
import { EmptyState } from "./EmptyState";
import { SkeletonRow } from "./SkeletonRow";
import { StatusBadge } from "./StatusBadge";
import { WithdrawModal } from "./WithdrawModal";
import { CreateTournamentModal } from "./CreateTournamentModal";
import { WithdrawalsPanel } from "./WithdrawalsPanel";
import {
  initialBalance,
  mockFinished,
  mockJoined,
  type TournamentMatch,
} from "@/data/tournamentsMock";
import { formatCoins, relativeTime } from "@/lib/tournamentsUtils";
import { useAuth } from "@/contexts/AuthContext";
import {
  fetchCreatedTournaments,
  fetchJoinedMatches,
  fetchUserReports,
  type DBReport,
  type DBTournament,
  type JoinedMatch,
} from "@/lib/tournamentsApi";

// Map a DB tournament + (optional) participant info into the UI shape MatchRow understands.
const dbToMatch = (t: DBTournament, result?: "won" | "lost" | "pending", coinsWon = 0): TournamentMatch => {
  const status: TournamentMatch["status"] =
    t.status === "finished"
      ? result === "won"
        ? "won"
        : result === "lost"
          ? "lost"
          : "pending"
      : t.status === "live"
        ? "live"
        : t.status === "upcoming"
          ? "upcoming"
          : "joined";
  return {
    id: t.id,
    name: t.name,
    game: t.game,
    roomId: t.room_id,
    password: t.password,
    prize: Number(t.prize),
    entryFee: Number(t.entry_fee),
    status,
    startsAt: t.starts_at ?? undefined,
    finishedAt: t.finished_at ?? undefined,
    resultCoins: coinsWon,
  };
};

export const MyGamesPanel = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [tab, setTab] = useState("joined");
  const [withdrawRefreshKey, setWithdrawRefreshKey] = useState(0);

  const [joined, setJoined] = useState<TournamentMatch[]>([]);
  const [created, setCreated] = useState<TournamentMatch[]>([]);
  const [finished, setFinished] = useState<TournamentMatch[]>([]);
  const [reports, setReports] = useState<DBReport[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadAll = async () => {
    if (!user?.id) {
      setJoined(mockJoined);
      setFinished(mockFinished);
      setLoading(false);
      return;
    }
    setLoading(true);
    setLoadError(null);
    try {
      const [j, c, r] = await Promise.all([
        fetchJoinedMatches(user.id),
        fetchCreatedTournaments(user.id),
        fetchUserReports(user.id),
      ]);

      const liveJoined: TournamentMatch[] = [];
      const finishedJoined: TournamentMatch[] = [];
      j.forEach((row: JoinedMatch) => {
        if (row.status === "finished") {
          finishedJoined.push(dbToMatch(row, row.result === "pending" ? "pending" : row.result, Number(row.coins_won)));
        } else {
          liveJoined.push(dbToMatch(row));
        }
      });

      setJoined(liveJoined.length ? liveJoined : []);
      setFinished(finishedJoined);
      setCreated(c.map((t) => dbToMatch(t)));
      setReports(r);
    } catch (e: any) {
      setLoadError(e?.message || "Couldn't load matches");
      // Fall back to empty state, not mocks, so UI shows the real status.
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const liveAndUpcoming = joined.filter(
    (m) => m.status === "live" || m.status === "upcoming" || m.status === "joined"
  );

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-border/60 bg-card p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-[16px] font-medium text-foreground">My Games</h2>
          <Button size="sm" onClick={() => setWithdrawOpen(true)} className="rounded-full">
            Withdraw winnings
          </Button>
        </div>

        {loadError && (
          <div className="mb-3 flex items-center justify-between rounded-md border border-destructive/30 bg-destructive/10 p-2 text-[12px] text-destructive">
            <span>{loadError}</span>
            <button onClick={loadAll} className="underline">Retry</button>
          </div>
        )}

        <Tabs value={tab} onValueChange={setTab}>
          <div className="-mx-1 overflow-x-auto scrollbar-hide">
            <TabsList className="flex w-max gap-1 bg-transparent p-0">
              <TabsTrigger
                value="wallet"
                className="rounded-full border border-border bg-muted/40 px-3 data-[state=active]:border-emerald-500/40 data-[state=active]:bg-emerald-500/10 data-[state=active]:text-emerald-400 data-[state=active]:shadow-none"
              >
                <Wallet className="mr-1.5 h-3.5 w-3.5" />
                Wallet — {formatCoins(initialBalance)}
              </TabsTrigger>
              {[
                { v: "joined", label: "Joined", icon: Gamepad2 },
                { v: "created", label: "Created", icon: Plus },
                { v: "reported", label: "Reported", icon: Flag },
                { v: "finished", label: "Finished", icon: Trophy },
              ].map(({ v, label, icon: Icon }) => (
                <TabsTrigger
                  key={v}
                  value={v}
                  className="rounded-full border border-border bg-muted/40 px-3 data-[state=active]:border-primary/40 data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none"
                >
                  <Icon className="mr-1.5 h-3.5 w-3.5" />
                  {label}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          <TabsContent value="wallet" className="mt-4">
            <WalletTab balance={initialBalance} onWithdraw={() => setWithdrawOpen(true)} />
          </TabsContent>

          <TabsContent value="joined" className="mt-4 space-y-5">
            <section>
              <div className="mb-2 flex items-center justify-between">
                <h3 className="flex items-center gap-2 text-[13px] font-medium text-foreground">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-destructive opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-destructive" />
                  </span>
                  Live & upcoming
                </h3>
              </div>
              <div className="overflow-hidden rounded-lg border border-border/60">
                {loading ? (
                  <>
                    <SkeletonRow />
                    <SkeletonRow />
                  </>
                ) : liveAndUpcoming.length ? (
                  liveAndUpcoming.map((m, i) => (
                    <MatchRow key={m.id} match={m} last={i === liveAndUpcoming.length - 1} />
                  ))
                ) : (
                  <EmptyState
                    title="No tournaments joined yet"
                    description="Browse open tournaments and join with your IG Coins."
                    ctaLabel="Browse tournaments"
                  />
                )}
              </div>
            </section>

            <section>
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-[13px] font-medium text-foreground">Recently finished</h3>
                <button className="text-[12px] text-primary hover:underline" onClick={() => setTab("finished")}>
                  View all
                </button>
              </div>
              <div className="overflow-hidden rounded-lg border border-border/60">
                {finished.length ? (
                  finished.slice(0, 3).map((m, i, a) => (
                    <MatchRow key={m.id} match={m} last={i === a.length - 1} />
                  ))
                ) : (
                  <EmptyState
                    title="No finished matches yet"
                    description="Your past results will show up here."
                  />
                )}
              </div>
            </section>
          </TabsContent>

          <TabsContent value="created" className="mt-4">
            <div className="mb-3 flex justify-end">
              <Button size="sm" variant="outline" onClick={() => setCreateOpen(true)}>
                <Plus className="mr-1 h-3.5 w-3.5" /> Create tournament
              </Button>
            </div>
            <div className="overflow-hidden rounded-lg border border-border/60">
              {loading ? (
                <SkeletonRow />
              ) : created.length ? (
                created.map((m, i) => <MatchRow key={m.id} match={m} last={i === created.length - 1} />)
              ) : (
                <EmptyState
                  title="You haven't created a tournament"
                  description="Set up your own match room and invite players."
                  ctaLabel="Create tournament"
                  onCta={() => setCreateOpen(true)}
                />
              )}
            </div>
          </TabsContent>

          <TabsContent value="reported" className="mt-4">
            <div className="overflow-hidden rounded-lg border border-border/60">
              {loading ? (
                <SkeletonRow />
              ) : reports.length ? (
                reports.map((r, i, a) => (
                  <div
                    key={r.id}
                    className={`flex items-center gap-3 px-3 py-3 ${i < a.length - 1 ? "border-b border-border/60" : ""}`}
                  >
                    <Flag className="h-4 w-4 text-muted-foreground" />
                    <div className="min-w-0 flex-1">
                      <div className="text-[13px] font-medium text-foreground">{r.match_name}</div>
                      <div className="text-[11px] text-muted-foreground">
                        {r.reason} · {relativeTime(r.created_at)}
                      </div>
                    </div>
                    <StatusBadge
                      status={r.status === "review" ? "upcoming" : r.status === "resolved" ? "won" : "lost"}
                      label={r.status === "review" ? "Under review" : r.status === "resolved" ? "Resolved" : "Rejected"}
                    />
                  </div>
                ))
              ) : (
                <EmptyState
                  icon={Inbox}
                  title="No reports filed"
                  description="Anything you report or that affects you will appear here."
                />
              )}
            </div>
          </TabsContent>

          <TabsContent value="finished" className="mt-4">
            <div className="overflow-hidden rounded-lg border border-border/60">
              {loading ? (
                <SkeletonRow />
              ) : finished.length ? (
                finished.map((m, i, a) => <MatchRow key={m.id} match={m} last={i === a.length - 1} />)
              ) : (
                <EmptyState
                  title="No completed matches yet"
                  description="Join a tournament to start your record."
                  ctaLabel="Join now"
                />
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <WithdrawalsPanel refreshKey={withdrawRefreshKey} onWithdrawClick={() => setWithdrawOpen(true)} />

      <WithdrawModal
        open={withdrawOpen}
        onOpenChange={setWithdrawOpen}
        balance={initialBalance}
        onSuccess={() => setWithdrawRefreshKey((k) => k + 1)}
      />
      <CreateTournamentModal
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={() => loadAll()}
      />
    </div>
  );
};
