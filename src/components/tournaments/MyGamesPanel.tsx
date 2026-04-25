import { useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  Wallet, Plus, Inbox, Trophy, Flag, Gamepad2, Activity, Crown, History,
} from "lucide-react";
import { MatchRow } from "./MatchRow";
import { WalletTab } from "./WalletTab";
import { EmptyState } from "./EmptyState";
import { SkeletonRow } from "./SkeletonRow";
import { StatusBadge } from "./StatusBadge";
import { WithdrawModal } from "./WithdrawModal";
import { CreateTournamentModal } from "./CreateTournamentModal";
import { WithdrawalsPanel } from "./WithdrawalsPanel";
import { TournamentDetailDrawer } from "./TournamentDetailDrawer";
import type { TournamentMatch } from "@/data/tournamentsMock";
import { formatCoins, relativeTime } from "@/lib/tournamentsUtils";
import { useAuth } from "@/contexts/AuthContext";
import {
  fetchCreatedTournaments, fetchEarningsSummary, fetchJoinedMatches, fetchUserReports,
  subscribeTournaments, type DBReport, type DBTournament, type EarningsSummary, type JoinedMatch,
} from "@/lib/tournamentsApi";

// Map DB tournament + result -> UI shape MatchRow understands
const dbToMatch = (t: DBTournament, result?: "won" | "lost" | "pending", coinsWon = 0): TournamentMatch => {
  const status: TournamentMatch["status"] =
    t.status === "finished"
      ? result === "won" ? "won" : result === "lost" ? "lost" : "pending"
      : t.status === "live" ? "live"
      : t.status === "upcoming" ? "upcoming"
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
    maxPlayers: t.max_players,
    currentPlayers: t.current_players,
    roomStatus: t.room_status,
  };
};

export const MyGamesPanel = () => {
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [tab, setTab] = useState("overview");
  const [withdrawRefreshKey, setWithdrawRefreshKey] = useState(0);

  const [joined, setJoined] = useState<DBTournament[]>([]);
  const [created, setCreated] = useState<DBTournament[]>([]);
  const [finished, setFinished] = useState<JoinedMatch[]>([]);
  const [ongoing, setOngoing] = useState<DBTournament[]>([]);
  const [reports, setReports] = useState<DBReport[]>([]);
  const [summary, setSummary] = useState<EarningsSummary | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [selected, setSelected] = useState<DBTournament | null>(null);

  const balance = profile?.balance ?? 0;

  const loadAll = async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setLoadError(null);
    try {
      const [j, c, r, s] = await Promise.all([
        fetchJoinedMatches(user.id),
        fetchCreatedTournaments(user.id),
        fetchUserReports(user.id),
        fetchEarningsSummary(user.id),
      ]);

      const joinedActive: DBTournament[] = [];
      const ongoingList: DBTournament[] = [];
      const finishedList: JoinedMatch[] = [];
      j.forEach((row) => {
        if (row.status === "finished") finishedList.push(row);
        else if (row.status === "live") ongoingList.push(row);
        else joinedActive.push(row);
      });

      setJoined(joinedActive);
      setOngoing(ongoingList);
      setFinished(finishedList);
      setCreated(c);
      setReports(r);
      setSummary(s);
    } catch (e: any) {
      setLoadError(e?.message || "Couldn't load matches");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
    const unsub = subscribeTournaments(loadAll);
    return unsub;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const winRate =
    summary && summary.wins + summary.losses > 0
      ? Math.round((summary.wins / (summary.wins + summary.losses)) * 100)
      : 0;

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-border/60 bg-card p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-[16px] font-medium text-foreground">
            <Gamepad2 className="h-4 w-4 text-primary" />
            My Games
          </h2>
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
              {[
                { v: "overview", label: "Overview", icon: Activity },
                { v: "wallet", label: `Wallet · ${formatCoins(balance)}`, icon: Wallet },
                { v: "joined", label: "Joined", icon: Gamepad2 },
                { v: "created", label: "Created", icon: Plus },
                { v: "ongoing", label: "Ongoing", icon: Activity },
                { v: "finished", label: "Finished", icon: Trophy },
                { v: "reported", label: "Reported", icon: Flag },
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

          {/* OVERVIEW */}
          <TabsContent value="overview" className="mt-4">
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <StatCard label="Total earnings" value={formatCoins(summary?.totalEarnings ?? 0)} sub="IG Coins won" tint="emerald" icon={Crown} />
              <StatCard label="Win rate" value={`${winRate}%`} sub={`${summary?.wins ?? 0}W / ${summary?.losses ?? 0}L`} tint="primary" icon={Trophy} />
              <StatCard label="Active matches" value={String(joined.length + ongoing.length)} sub={`${ongoing.length} live`} tint="amber" icon={Activity} />
              <StatCard label="Wallet" value={formatCoins(balance)} sub="IG Coins available" tint="primary" icon={Wallet} />
            </div>

            <div className="mt-4 grid gap-4 lg:grid-cols-2">
              <SectionList
                title="Live & ongoing"
                icon={<Activity className="h-3.5 w-3.5 text-emerald-400" />}
                empty="No live matches right now"
                loading={loading}
                items={ongoing}
                onSelect={setSelected}
              />
              <SectionList
                title="Recently finished"
                icon={<History className="h-3.5 w-3.5 text-muted-foreground" />}
                empty="No finished matches yet"
                loading={loading}
                items={finished.slice(0, 5)}
                onSelect={setSelected}
                showResult
              />
            </div>
          </TabsContent>

          {/* WALLET */}
          <TabsContent value="wallet" className="mt-4">
            <WalletTab balance={balance} onWithdraw={() => setWithdrawOpen(true)} />
          </TabsContent>

          {/* JOINED (upcoming) */}
          <TabsContent value="joined" className="mt-4">
            <div className="overflow-hidden rounded-lg border border-border/60">
              {loading ? <SkeletonRow /> : joined.length ? (
                joined.map((m, i) => (
                  <MatchRow key={m.id} match={dbToMatch(m)} last={i === joined.length - 1} onClick={() => setSelected(m)} />
                ))
              ) : (
                <EmptyState title="No upcoming matches" description="Browse open tournaments to join one." ctaLabel="Browse tournaments" />
              )}
            </div>
          </TabsContent>

          {/* CREATED */}
          <TabsContent value="created" className="mt-4">
            <div className="mb-3 flex justify-end">
              <Button size="sm" variant="outline" onClick={() => setCreateOpen(true)}>
                <Plus className="mr-1 h-3.5 w-3.5" /> Create tournament
              </Button>
            </div>
            <div className="overflow-hidden rounded-lg border border-border/60">
              {loading ? <SkeletonRow /> : created.length ? (
                created.map((m, i) => (
                  <MatchRow key={m.id} match={dbToMatch(m)} last={i === created.length - 1} onClick={() => setSelected(m)} />
                ))
              ) : (
                <EmptyState title="You haven't created a tournament" description="Set up your own match room and invite players." ctaLabel="Create tournament" onCta={() => setCreateOpen(true)} />
              )}
            </div>
          </TabsContent>

          {/* ONGOING */}
          <TabsContent value="ongoing" className="mt-4">
            <div className="overflow-hidden rounded-lg border border-border/60">
              {loading ? <SkeletonRow /> : ongoing.length ? (
                ongoing.map((m, i) => (
                  <MatchRow key={m.id} match={dbToMatch(m)} last={i === ongoing.length - 1} onClick={() => setSelected(m)} />
                ))
              ) : (
                <EmptyState title="No live matches" description="Your live matches will appear here." />
              )}
            </div>
          </TabsContent>

          {/* FINISHED */}
          <TabsContent value="finished" className="mt-4">
            <div className="overflow-hidden rounded-lg border border-border/60">
              {loading ? <SkeletonRow /> : finished.length ? (
                finished.map((m, i) => (
                  <MatchRow
                    key={m.id}
                    match={dbToMatch(m, m.result === "pending" ? "pending" : m.result, Number(m.coins_won))}
                    last={i === finished.length - 1}
                    onClick={() => setSelected(m)}
                  />
                ))
              ) : (
                <EmptyState title="No completed matches yet" description="Join a tournament to start your record." />
              )}
            </div>
          </TabsContent>

          {/* REPORTED */}
          <TabsContent value="reported" className="mt-4">
            <div className="overflow-hidden rounded-lg border border-border/60">
              {loading ? <SkeletonRow /> : reports.length ? (
                reports.map((r, i, a) => (
                  <div key={r.id} className={`flex items-center gap-3 px-3 py-3 ${i < a.length - 1 ? "border-b border-border/60" : ""}`}>
                    <Flag className="h-4 w-4 text-muted-foreground" />
                    <div className="min-w-0 flex-1">
                      <div className="text-[13px] font-medium text-foreground">{r.match_name}</div>
                      <div className="text-[11px] text-muted-foreground">{r.reason} · {relativeTime(r.created_at)}</div>
                    </div>
                    <StatusBadge
                      status={r.status === "review" ? "upcoming" : r.status === "resolved" ? "won" : "lost"}
                      label={r.status === "review" ? "Under review" : r.status === "resolved" ? "Resolved" : "Rejected"}
                    />
                  </div>
                ))
              ) : (
                <EmptyState icon={Inbox} title="No reports filed" description="Anything you report will appear here." />
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <WithdrawalsPanel refreshKey={withdrawRefreshKey} onWithdrawClick={() => setWithdrawOpen(true)} />

      <WithdrawModal open={withdrawOpen} onOpenChange={setWithdrawOpen} balance={balance} onSuccess={() => setWithdrawRefreshKey((k) => k + 1)} />
      <CreateTournamentModal open={createOpen} onOpenChange={setCreateOpen} onCreated={() => loadAll()} />
      <TournamentDetailDrawer
        tournament={selected}
        open={!!selected}
        onOpenChange={(v) => !v && setSelected(null)}
        onChanged={() => {
          loadAll();
          setSelected(null);
        }}
      />
    </div>
  );
};

const tintMap = {
  emerald: "border-emerald-500/20 bg-emerald-500/5 text-emerald-400",
  primary: "border-primary/20 bg-primary/5 text-primary",
  amber: "border-amber-500/20 bg-amber-500/5 text-amber-400",
} as const;

const StatCard = ({
  label, value, sub, tint, icon: Icon,
}: {
  label: string; value: string; sub: string; tint: keyof typeof tintMap; icon: any;
}) => (
  <div className={`rounded-lg border p-3 ${tintMap[tint]}`}>
    <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wide opacity-80">
      <Icon className="h-3 w-3" /> {label}
    </div>
    <div className="mt-0.5 text-xl font-semibold">{value}</div>
    <div className="text-[11px] text-muted-foreground">{sub}</div>
  </div>
);

const SectionList = ({
  title, icon, empty, loading, items, onSelect, showResult,
}: {
  title: string;
  icon: React.ReactNode;
  empty: string;
  loading: boolean;
  items: any[];
  onSelect: (t: DBTournament) => void;
  showResult?: boolean;
}) => (
  <div className="rounded-lg border border-border/60 bg-card">
    <div className="flex items-center justify-between border-b border-border/60 px-3 py-2">
      <h4 className="flex items-center gap-2 text-[12px] font-medium text-foreground">
        {icon} {title}
      </h4>
      <span className="text-[11px] text-muted-foreground">{items.length}</span>
    </div>
    <div>
      {loading ? <SkeletonRow /> : items.length === 0 ? (
        <div className="px-3 py-6 text-center text-[12px] text-muted-foreground">{empty}</div>
      ) : (
        items.map((m: any, i: number) => (
          <MatchRow
            key={m.id}
            match={dbToMatch(m, showResult ? (m.result === "pending" ? "pending" : m.result) : undefined, Number(m.coins_won) || 0)}
            last={i === items.length - 1}
            onClick={() => onSelect(m)}
          />
        ))
      )}
    </div>
  </div>
);
