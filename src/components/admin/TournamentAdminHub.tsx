import { useEffect, useMemo, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import {
  Trophy, Wallet, Coins, AlertTriangle, Gauge, Settings as SettingsIcon,
  TrendingUp, Users, ListChecks, Loader2, CheckCircle2, XCircle, Search,
} from "lucide-react";
import {
  fetchTournamentDashboardStats, fetchTournamentSettings, updateTournamentSettings,
  fetchAllWithdrawals, processWithdrawal, fetchPlatformRevenue, fetchRevenueTotals,
  fetchTopWalletUsers, fetchTournamentsAdmin, cancelTournamentAdmin, fetchLedger,
  type TournamentSettings,
} from "@/lib/tournamentAdminApi";
import { formatCoins } from "@/lib/tournamentsUtils";
import { format } from "date-fns";

const fmt = (n: number) => formatCoins(Math.round(Number(n) || 0));

function StatTile({ icon: Icon, label, value, tint = "primary" }: any) {
  const tintMap: Record<string, string> = {
    primary: "from-primary/10 text-primary",
    emerald: "from-emerald-500/10 text-emerald-500",
    amber: "from-amber-500/10 text-amber-500",
    rose: "from-rose-500/10 text-rose-500",
  };
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4">
        <div className={`mb-2 inline-flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br ${tintMap[tint]}`}>
          <Icon className="h-4 w-4" />
        </div>
        <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</div>
        <div className="mt-0.5 text-2xl font-bold tabular-nums">{value}</div>
      </CardContent>
    </Card>
  );
}

// ─────────────── Dashboard tab ───────────────
function DashboardTab() {
  const [stats, setStats] = useState<any>(null);
  const [revenue, setRevenue] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([fetchTournamentDashboardStats(), fetchRevenueTotals()])
      .then(([s, r]) => { setStats(s); setRevenue(r); })
      .catch((e) => toast.error(e?.message || "Failed to load stats"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex h-40 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
        <StatTile icon={Trophy} label="Tournaments" value={stats?.totalTournaments ?? 0} tint="primary" />
        <StatTile icon={Gauge} label="Active now" value={stats?.activeNow ?? 0} tint="emerald" />
        <StatTile icon={Wallet} label="Held coins" value={fmt(stats?.totalHeldCoins ?? 0)} tint="amber" />
        <StatTile icon={Coins} label="User winnings" value={fmt(stats?.totalWinnings ?? 0)} tint="emerald" />
        <StatTile icon={AlertTriangle} label="Pending withdrawals" value={stats?.pendingWithdrawals ?? 0} tint="rose" />
        <StatTile icon={ListChecks} label="Open disputes" value={stats?.pendingReports ?? 0} tint="rose" />
      </div>
      <div className="grid gap-3 lg:grid-cols-4">
        <StatTile icon={TrendingUp} label="Total revenue" value={`Rs.${fmt(revenue?.total ?? 0)}`} tint="emerald" />
        <StatTile icon={TrendingUp} label="Last 30 days" value={`Rs.${fmt(revenue?.last30 ?? 0)}`} tint="emerald" />
        <StatTile icon={Coins} label="Commissions" value={`Rs.${fmt(revenue?.commission ?? 0)}`} tint="amber" />
        <StatTile icon={Coins} label="Host fees" value={`Rs.${fmt(revenue?.hostFee ?? 0)}`} tint="amber" />
      </div>
    </div>
  );
}

// ─────────────── Tournaments list ───────────────
function TournamentsTab() {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const reload = () => fetchTournamentsAdmin().then(setRows).catch((e) => toast.error(e?.message)).finally(() => setLoading(false));
  useEffect(() => { reload(); }, []);

  const filtered = useMemo(
    () => rows.filter((r) => !q || r.name?.toLowerCase().includes(q.toLowerCase()) || r.game?.toLowerCase().includes(q.toLowerCase())),
    [rows, q]
  );

  const onCancel = async (id: string) => {
    const reason = prompt("Cancellation reason (refund will be issued to all participants):");
    if (!reason) return;
    try {
      await cancelTournamentAdmin(id, reason);
      toast.success("Tournament cancelled, coins refunded");
      reload();
    } catch (e: any) { toast.error(e?.message || "Failed"); }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <CardTitle>All tournaments</CardTitle>
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search…" className="h-9 w-56 pl-8" />
        </div>
      </CardHeader>
      <CardContent className="overflow-x-auto p-0">
        {loading ? (
          <div className="flex h-40 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin" /></div>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-2">Name</th>
                <th className="px-4 py-2">Game</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2 text-right">Entry</th>
                <th className="px-4 py-2 text-right">Pool</th>
                <th className="px-4 py-2 text-right">Players</th>
                <th className="px-4 py-2 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((t) => (
                <tr key={t.id} className="border-b hover:bg-muted/30">
                  <td className="px-4 py-2 font-medium">{t.name}</td>
                  <td className="px-4 py-2 text-muted-foreground">{t.game}</td>
                  <td className="px-4 py-2"><Badge variant={t.status === "live" ? "default" : t.status === "finished" ? "secondary" : t.status === "canceled" ? "destructive" : "outline"}>{t.status}</Badge></td>
                  <td className="px-4 py-2 text-right tabular-nums">{fmt(t.entry_fee)}</td>
                  <td className="px-4 py-2 text-right tabular-nums font-bold text-amber-500">{fmt(t.prize_pool || 0)}</td>
                  <td className="px-4 py-2 text-right tabular-nums">{t.current_players}/{t.max_players}</td>
                  <td className="px-4 py-2 text-right">
                    {!["finished", "canceled"].includes(t.status) && (
                      <Button size="sm" variant="destructive" onClick={() => onCancel(t.id)}>Cancel + refund</Button>
                    )}
                  </td>
                </tr>
              ))}
              {!filtered.length && <tr><td colSpan={7} className="py-8 text-center text-muted-foreground">No tournaments</td></tr>}
            </tbody>
          </table>
        )}
      </CardContent>
    </Card>
  );
}

// ─────────────── Withdrawals queue ───────────────
function WithdrawalsTab() {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const reload = () => fetchAllWithdrawals().then(setRows).catch((e) => toast.error(e?.message)).finally(() => setLoading(false));
  useEffect(() => { reload(); }, []);

  const act = async (id: string, action: "processed" | "rejected") => {
    const remarks = prompt(action === "processed" ? "Optional remarks (e.g. transfer reference):" : "Reason for rejection:") ?? "";
    if (action === "rejected" && !remarks.trim()) return;
    setBusy(id);
    try {
      await processWithdrawal(id, action, remarks);
      toast.success(`Withdrawal ${action}`);
      reload();
    } catch (e: any) { toast.error(e?.message || "Failed"); }
    finally { setBusy(null); }
  };

  return (
    <Card>
      <CardHeader><CardTitle>Withdrawal requests</CardTitle></CardHeader>
      <CardContent className="overflow-x-auto p-0">
        {loading ? <div className="flex h-40 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin" /></div> : (
          <table className="w-full text-sm">
            <thead className="border-b text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-2">User</th>
                <th className="px-4 py-2">Method</th>
                <th className="px-4 py-2">Account</th>
                <th className="px-4 py-2 text-right">Coins</th>
                <th className="px-4 py-2 text-right">NPR</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2">Date</th>
                <th className="px-4 py-2 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((w) => (
                <tr key={w.id} className="border-b hover:bg-muted/30">
                  <td className="px-4 py-2">{w.user_email}</td>
                  <td className="px-4 py-2 capitalize">{w.method}</td>
                  <td className="px-4 py-2 font-mono text-xs">{w.account_detail}</td>
                  <td className="px-4 py-2 text-right tabular-nums">{fmt(w.amount_coins)}</td>
                  <td className="px-4 py-2 text-right tabular-nums font-bold">Rs.{fmt(w.amount_npr)}</td>
                  <td className="px-4 py-2"><Badge variant={w.status === "pending" ? "outline" : w.status === "processed" ? "default" : "destructive"}>{w.status}</Badge></td>
                  <td className="px-4 py-2 text-xs text-muted-foreground">{format(new Date(w.created_at), "MMM d, HH:mm")}</td>
                  <td className="px-4 py-2 text-right">
                    {w.status === "pending" && (
                      <div className="flex justify-end gap-1">
                        <Button size="sm" variant="default" disabled={busy === w.id} onClick={() => act(w.id, "processed")}>
                          {busy === w.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle2 className="h-3 w-3" />}
                        </Button>
                        <Button size="sm" variant="destructive" disabled={busy === w.id} onClick={() => act(w.id, "rejected")}><XCircle className="h-3 w-3" /></Button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {!rows.length && <tr><td colSpan={8} className="py-8 text-center text-muted-foreground">No withdrawal requests</td></tr>}
            </tbody>
          </table>
        )}
      </CardContent>
    </Card>
  );
}

// ─────────────── Wallets overview ───────────────
function WalletsTab() {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { fetchTopWalletUsers(100).then(setRows).catch((e) => toast.error(e?.message)).finally(() => setLoading(false)); }, []);
  return (
    <Card>
      <CardHeader><CardTitle>User wallets (top 100 by winnings)</CardTitle></CardHeader>
      <CardContent className="overflow-x-auto p-0">
        {loading ? <div className="flex h-40 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin" /></div> : (
          <table className="w-full text-sm">
            <thead className="border-b text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-2">User</th>
                <th className="px-4 py-2 text-right">Spendable</th>
                <th className="px-4 py-2 text-right">Held (escrow)</th>
                <th className="px-4 py-2 text-right">Winnings</th>
                <th className="px-4 py-2 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((p) => {
                const total = Number(p.balance) + Number(p.held_balance) + Number(p.winnings_balance);
                return (
                  <tr key={p.id} className="border-b hover:bg-muted/30">
                    <td className="px-4 py-2">{p.username || p.email}</td>
                    <td className="px-4 py-2 text-right tabular-nums">{fmt(p.balance)}</td>
                    <td className="px-4 py-2 text-right tabular-nums text-amber-500">{fmt(p.held_balance)}</td>
                    <td className="px-4 py-2 text-right tabular-nums font-bold text-emerald-500">{fmt(p.winnings_balance)}</td>
                    <td className="px-4 py-2 text-right tabular-nums">{fmt(total)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </CardContent>
    </Card>
  );
}

// ─────────────── Ledger ───────────────
function LedgerTab() {
  const [rows, setRows] = useState<any[]>([]);
  const [type, setType] = useState<string>("");
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    setLoading(true);
    fetchLedger({ type: type || undefined }).then(setRows).catch((e) => toast.error(e?.message)).finally(() => setLoading(false));
  }, [type]);
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between"><CardTitle>Coin ledger (last 300)</CardTitle>
        <select value={type} onChange={(e) => setType(e.target.value)} className="h-9 rounded-md border bg-background px-2 text-sm">
          <option value="">All types</option>
          <option value="escrow_lock">escrow_lock</option>
          <option value="escrow_release">escrow_release</option>
          <option value="prize_credit">prize_credit</option>
          <option value="commission">commission</option>
          <option value="host_fee">host_fee</option>
          <option value="refund">refund</option>
          <option value="withdrawal">withdrawal</option>
        </select>
      </CardHeader>
      <CardContent className="overflow-x-auto p-0">
        {loading ? <div className="flex h-40 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin" /></div> : (
          <table className="w-full text-sm">
            <thead className="border-b text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-2">When</th>
                <th className="px-4 py-2">Type</th>
                <th className="px-4 py-2">User</th>
                <th className="px-4 py-2">Bucket</th>
                <th className="px-4 py-2 text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((l) => (
                <tr key={l.id} className="border-b hover:bg-muted/30">
                  <td className="px-4 py-2 text-xs text-muted-foreground">{format(new Date(l.created_at), "MMM d HH:mm")}</td>
                  <td className="px-4 py-2"><Badge variant="outline">{l.type}</Badge></td>
                  <td className="px-4 py-2 font-mono text-xs">{String(l.user_id).slice(0, 8)}</td>
                  <td className="px-4 py-2 text-xs">{l.balance_kind}</td>
                  <td className="px-4 py-2 text-right tabular-nums">{fmt(l.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </CardContent>
    </Card>
  );
}

// ─────────────── Revenue ───────────────
function RevenueTab() {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { fetchPlatformRevenue(200).then(setRows).catch((e) => toast.error(e?.message)).finally(() => setLoading(false)); }, []);
  return (
    <Card>
      <CardHeader><CardTitle>Platform revenue (last 200)</CardTitle></CardHeader>
      <CardContent className="overflow-x-auto p-0">
        {loading ? <div className="flex h-40 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin" /></div> : (
          <table className="w-full text-sm">
            <thead className="border-b text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-2">When</th>
                <th className="px-4 py-2">Source</th>
                <th className="px-4 py-2 text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b hover:bg-muted/30">
                  <td className="px-4 py-2 text-xs text-muted-foreground">{format(new Date(r.created_at), "MMM d HH:mm")}</td>
                  <td className="px-4 py-2"><Badge variant="outline">{r.source}</Badge></td>
                  <td className="px-4 py-2 text-right tabular-nums font-bold text-emerald-500">+{fmt(r.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </CardContent>
    </Card>
  );
}

// ─────────────── Settings ───────────────
function SettingsTab() {
  const [s, setS] = useState<TournamentSettings | null>(null);
  const [saving, setSaving] = useState(false);
  useEffect(() => { fetchTournamentSettings().then(setS).catch((e) => toast.error(e?.message)); }, []);
  if (!s) return <div className="flex h-40 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin" /></div>;

  const set = (k: keyof TournamentSettings, v: any) => setS({ ...s, [k]: v });
  const save = async () => {
    setSaving(true);
    try {
      await updateTournamentSettings(s.id, s);
      toast.success("Settings saved");
    } catch (e: any) { toast.error(e?.message); }
    finally { setSaving(false); }
  };

  const num = (k: keyof TournamentSettings, label: string, suffix?: string) => (
    <div>
      <Label className="text-xs uppercase tracking-wider text-muted-foreground">{label}{suffix && <span className="ml-1 normal-case opacity-60">({suffix})</span>}</Label>
      <Input type="number" value={String(s[k])} onChange={(e) => set(k, Number(e.target.value))} className="mt-1" />
    </div>
  );

  return (
    <Card>
      <CardHeader><CardTitle>Tournament settings</CardTitle></CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {num("default_commission_percent", "Commission", "%")}
          {num("min_entry_fee", "Min entry fee", "coins")}
          {num("max_entry_fee", "Max entry fee", "coins")}
          {num("host_fee_flat", "Host fee flat", "coins")}
          {num("host_fee_percent", "Host fee % of entry", "%")}
          {num("withdrawal_fee_percent", "Withdrawal fee", "%")}
          {num("min_withdrawal_npr", "Min withdrawal", "NPR")}
          {num("coin_to_npr_rate", "Coin → NPR rate", "x")}
          {num("premium_boost_price", "Boost price", "coins")}
        </div>
        <div className="flex items-center justify-between rounded-lg border p-3">
          <div>
            <div className="font-medium">Allow user-created matches</div>
            <div className="text-xs text-muted-foreground">When off, only admins can host tournaments.</div>
          </div>
          <Switch checked={s.allow_user_creation} onCheckedChange={(v) => set("allow_user_creation", v)} />
        </div>
        <Button onClick={save} disabled={saving}>{saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}Save settings</Button>
      </CardContent>
    </Card>
  );
}

// ─────────────── Root ───────────────
export function TournamentAdminHub() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold"><Trophy className="h-6 w-6 text-primary" /> Tournaments — Command Center</h1>
        <p className="text-sm text-muted-foreground">Wallet escrow, prize pools, withdrawals, revenue and platform settings.</p>
      </div>
      <Tabs defaultValue="dashboard">
        <TabsList className="flex w-full flex-wrap justify-start gap-1">
          <TabsTrigger value="dashboard"><Gauge className="mr-1.5 h-4 w-4" />Dashboard</TabsTrigger>
          <TabsTrigger value="tournaments"><Trophy className="mr-1.5 h-4 w-4" />Tournaments</TabsTrigger>
          <TabsTrigger value="withdrawals"><Wallet className="mr-1.5 h-4 w-4" />Withdrawals</TabsTrigger>
          <TabsTrigger value="wallets"><Users className="mr-1.5 h-4 w-4" />Wallets</TabsTrigger>
          <TabsTrigger value="ledger"><ListChecks className="mr-1.5 h-4 w-4" />Ledger</TabsTrigger>
          <TabsTrigger value="revenue"><TrendingUp className="mr-1.5 h-4 w-4" />Revenue</TabsTrigger>
          <TabsTrigger value="settings"><SettingsIcon className="mr-1.5 h-4 w-4" />Settings</TabsTrigger>
        </TabsList>
        <TabsContent value="dashboard" className="mt-4"><DashboardTab /></TabsContent>
        <TabsContent value="tournaments" className="mt-4"><TournamentsTab /></TabsContent>
        <TabsContent value="withdrawals" className="mt-4"><WithdrawalsTab /></TabsContent>
        <TabsContent value="wallets" className="mt-4"><WalletsTab /></TabsContent>
        <TabsContent value="ledger" className="mt-4"><LedgerTab /></TabsContent>
        <TabsContent value="revenue" className="mt-4"><RevenueTab /></TabsContent>
        <TabsContent value="settings" className="mt-4"><SettingsTab /></TabsContent>
      </Tabs>
    </div>
  );
}

export default TournamentAdminHub;
