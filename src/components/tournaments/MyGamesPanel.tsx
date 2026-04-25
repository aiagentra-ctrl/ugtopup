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
import {
  initialBalance,
  mockCreated,
  mockFinished,
  mockJoined,
  mockReports,
  type TournamentMatch,
} from "@/data/tournamentsMock";
import { formatCoins, relativeTime } from "@/lib/tournamentsUtils";

export const MyGamesPanel = () => {
  const [loading, setLoading] = useState(true);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [created, setCreated] = useState<TournamentMatch[]>(mockCreated);
  const [tab, setTab] = useState("joined");

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 600);
    return () => clearTimeout(t);
  }, []);

  const liveAndUpcoming = mockJoined.filter((m) => m.status === "live" || m.status === "upcoming" || m.status === "joined");

  return (
    <div className="rounded-lg border border-border/60 bg-card p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-[16px] font-medium text-foreground">My Games</h2>
        <Button size="sm" onClick={() => setWithdrawOpen(true)} className="rounded-full">
          Withdraw winnings
        </Button>
      </div>

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
              <button className="text-[12px] text-primary hover:underline">View all</button>
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
              <button className="text-[12px] text-primary hover:underline" onClick={() => setTab("finished")}>View all</button>
            </div>
            <div className="overflow-hidden rounded-lg border border-border/60">
              {mockFinished.slice(0, 3).map((m, i, a) => (
                <MatchRow key={m.id} match={m} last={i === a.length - 1} />
              ))}
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
            {mockReports.length ? (
              mockReports.map((r, i, a) => (
                <div
                  key={r.id}
                  className={`flex items-center gap-3 px-3 py-3 ${i < a.length - 1 ? "border-b border-border/60" : ""}`}
                >
                  <Flag className="h-4 w-4 text-muted-foreground" />
                  <div className="min-w-0 flex-1">
                    <div className="text-[13px] font-medium text-foreground">{r.matchName}</div>
                    <div className="text-[11px] text-muted-foreground">{r.reason} · {relativeTime(r.filedAt)}</div>
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
            {mockFinished.length ? (
              mockFinished.map((m, i, a) => <MatchRow key={m.id} match={m} last={i === a.length - 1} />)
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

      <WithdrawModal open={withdrawOpen} onOpenChange={setWithdrawOpen} balance={initialBalance} />
      <CreateTournamentModal
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={(m) => setCreated((c) => [m, ...c])}
      />
    </div>
  );
};
