import { useState } from "react";
import { Button } from "@/components/ui/button";
import { GlassCard } from "../ui/GlassCard";
import { CountUp } from "../ui/CountUp";
import { StatusPill } from "../ui/StatusPill";
import { EmptyState } from "../ui/EmptyState";
import { TrendingUp, TrendingDown, RefreshCw, Check, X, AlertTriangle, Package, Users } from "lucide-react";
import { LineChart, Line, BarChart, Bar, PieChart as RPieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type PanelPayload = { kind: string; data: any };

const COLORS = ["hsl(var(--primary))", "hsl(var(--secondary))", "#10b981", "#f59e0b", "#ef4444", "#6366f1"];

export function LiveResultPanel({ payload, onRefresh }: { payload: PanelPayload; onRefresh?: () => void }) {
  switch (payload.kind) {
    case "sales_summary":
      return <SalesSummary data={payload.data} />;
    case "pending_orders":
      return <PendingOrders items={payload.data.items} />;
    case "credit_requests_list":
      return <CreditRequests items={payload.data.items} />;
    case "top_products":
      return <TopProducts data={payload.data} />;
    case "low_stock":
      return <LowStock data={payload.data} />;
    case "monthly_report":
      return <MonthlyReport data={payload.data} />;
    case "support_tickets":
      return <SupportTickets items={payload.data.items} />;
    case "user_activity":
      return <UserActivity data={payload.data} />;
    case "write_preview":
      return <WritePreview data={payload.data} />;
    default:
      return <pre className="text-xs whitespace-pre-wrap p-3 bg-muted/30 rounded-lg">{JSON.stringify(payload.data, null, 2)}</pre>;
  }
}

function SalesSummary({ data }: { data: any }) {
  const up = (data.comparison_pct ?? 0) >= 0;
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <GlassCard className="p-4">
          <p className="text-xs text-muted-foreground">Revenue</p>
          <p className="text-2xl font-bold mt-1"><CountUp value={data.revenue} prefix="Rs." /></p>
          {data.comparison_pct !== null && (
            <p className={`text-xs mt-1 flex items-center gap-1 ${up ? "text-emerald-400" : "text-red-400"}`}>
              {up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              {Math.abs(data.comparison_pct).toFixed(1)}% vs yesterday
            </p>
          )}
        </GlassCard>
        <GlassCard className="p-4">
          <p className="text-xs text-muted-foreground">Orders</p>
          <p className="text-2xl font-bold mt-1"><CountUp value={data.orders} /></p>
        </GlassCard>
        <GlassCard className="p-4">
          <p className="text-xs text-muted-foreground">Avg Order</p>
          <p className="text-2xl font-bold mt-1"><CountUp value={data.avg} prefix="Rs." decimals={0} /></p>
        </GlassCard>
      </div>
      <GlassCard className="p-4">
        <p className="text-xs text-muted-foreground mb-3">Hourly revenue</p>
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={data.hourly}>
            <XAxis dataKey="hour" stroke="hsl(var(--muted-foreground))" fontSize={11} />
            <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
            <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
            <Line type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} animationDuration={800} />
          </LineChart>
        </ResponsiveContainer>
      </GlassCard>
      {data.top?.length > 0 && (
        <GlassCard className="p-4">
          <p className="text-xs text-muted-foreground mb-3">Top products today</p>
          <div className="space-y-2">
            {data.top.map((p: any, i: number) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <span className="font-medium">#{i + 1} {p.name}</span>
                <span className="text-muted-foreground">{p.units} units · Rs.{p.revenue}</span>
              </div>
            ))}
          </div>
        </GlassCard>
      )}
    </div>
  );
}

function PendingOrders({ items }: { items: any[] }) {
  if (!items.length) return <EmptyState title="No pending orders" description="All caught up." icon={Check} />;
  return (
    <div className="space-y-2">
      {items.map((o: any) => (
        <GlassCard key={o.id} className="p-3 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="font-medium text-sm truncate">{o.order_number} · {o.product_name}</p>
            <p className="text-xs text-muted-foreground truncate">{o.user_email} · Rs.{o.price}</p>
          </div>
          <StatusPill status={o.status} />
        </GlassCard>
      ))}
    </div>
  );
}

function CreditRequests({ items }: { items: any[] }) {
  const [busy, setBusy] = useState<string | null>(null);
  if (!items.length) return <EmptyState title="No pending credit requests" icon={Check} />;
  async function approve(id: string) {
    setBusy(id);
    const { error } = await supabase.rpc("approve_payment_request", { request_id: id });
    if (error) toast.error(error.message); else toast.success("Approved");
    setBusy(null);
  }
  async function reject(id: string) {
    const remarks = prompt("Reason for rejection?"); if (!remarks) return;
    setBusy(id);
    const { error } = await supabase.rpc("reject_payment_request", { request_id: id, admin_remarks_text: remarks });
    if (error) toast.error(error.message); else toast.success("Rejected");
    setBusy(null);
  }
  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground">{items.length} pending</p>
      {items.map((r) => (
        <GlassCard key={r.id} className="p-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-medium text-sm">{r.user_name || r.user_email}</p>
              <p className="text-xs text-muted-foreground">Rs.{r.amount} → {r.credits} credits · {r.payment_method}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">{new Date(r.created_at).toLocaleString()}</p>
            </div>
            <div className="flex gap-1">
              <Button size="sm" variant="outline" disabled={busy === r.id} onClick={() => approve(r.id)} className="gap-1"><Check className="h-3.5 w-3.5" />Approve</Button>
              <Button size="sm" variant="outline" disabled={busy === r.id} onClick={() => reject(r.id)} className="gap-1"><X className="h-3.5 w-3.5" />Reject</Button>
            </div>
          </div>
        </GlassCard>
      ))}
    </div>
  );
}

function TopProducts({ data }: { data: any }) {
  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground capitalize">Top products this {data.period}</p>
      {data.items.map((p: any, i: number) => (
        <GlassCard key={p.name} className="p-3 flex items-center gap-3">
          <span className="text-lg font-bold text-primary w-8">#{i + 1}</span>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm truncate">{p.name}</p>
            <p className="text-xs text-muted-foreground">{p.units} units · Rs.{p.revenue.toLocaleString()}</p>
          </div>
        </GlassCard>
      ))}
    </div>
  );
}

function LowStock({ data }: { data: any }) {
  if (!data.items.length) return <EmptyState title="No low-stock items" description={`Threshold: ${data.threshold}`} icon={Package} />;
  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground">{data.items.length} items below {data.threshold}</p>
      {data.items.map((p: any) => (
        <GlassCard key={p.id} className="p-3 flex items-center justify-between">
          <div>
            <p className="font-medium text-sm">{p.label} <span className="text-muted-foreground">· {p.game}</span></p>
            <p className="text-xs text-muted-foreground">Rs.{p.price}</p>
          </div>
          <StatusPill status={`Stock: ${p.stock}`} tone="error" />
        </GlassCard>
      ))}
    </div>
  );
}

function MonthlyReport({ data }: { data: any }) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-3">
        <GlassCard className="p-3"><p className="text-xs text-muted-foreground">Revenue</p><p className="text-xl font-bold"><CountUp value={data.revenue} prefix="Rs." /></p></GlassCard>
        <GlassCard className="p-3"><p className="text-xs text-muted-foreground">Orders</p><p className="text-xl font-bold"><CountUp value={data.orders} /></p></GlassCard>
        <GlassCard className="p-3"><p className="text-xs text-muted-foreground">New users</p><p className="text-xl font-bold"><CountUp value={data.new_users} /></p></GlassCard>
      </div>
      <GlassCard className="p-3">
        <p className="text-xs text-muted-foreground mb-2">Daily revenue</p>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={data.daily}>
            <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={10} />
            <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} />
            <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
            <Bar dataKey="value" fill="hsl(var(--primary))" animationDuration={800} />
          </BarChart>
        </ResponsiveContainer>
      </GlassCard>
      {data.categories?.length > 0 && (
        <GlassCard className="p-3">
          <p className="text-xs text-muted-foreground mb-2">Revenue by category</p>
          <ResponsiveContainer width="100%" height={200}>
            <RPieChart>
              <Pie data={data.categories} dataKey="value" nameKey="name" outerRadius={70} label animationDuration={800}>
                {data.categories.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
            </RPieChart>
          </ResponsiveContainer>
        </GlassCard>
      )}
    </div>
  );
}

function SupportTickets({ items }: { items: any[] }) {
  if (!items.length) return <EmptyState title="No open tickets" icon={Check} />;
  return (
    <div className="space-y-2">
      {items.map((t: any) => (
        <GlassCard key={t.id} className="p-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-medium text-sm">{t.subject}</p>
              <p className="text-xs text-muted-foreground">{t.user_email}</p>
            </div>
            <div className="flex gap-1">
              <StatusPill status={t.priority} tone={t.priority === "high" ? "error" : t.priority === "medium" ? "warning" : "info"} />
              <StatusPill status={t.status} />
            </div>
          </div>
        </GlassCard>
      ))}
    </div>
  );
}

function UserActivity({ data }: { data: any }) {
  return (
    <div className="space-y-3">
      <GlassCard className="p-4 flex items-center gap-3">
        <Users className="h-5 w-5 text-primary" />
        <div>
          <p className="text-xs text-muted-foreground">New signups today</p>
          <p className="text-2xl font-bold"><CountUp value={data.signups} /></p>
        </div>
      </GlassCard>
      <GlassCard className="p-4">
        <p className="text-xs text-muted-foreground mb-2">Activity feed</p>
        <div className="space-y-1.5 max-h-72 overflow-y-auto">
          {data.feed.map((a: any, i: number) => (
            <div key={i} className="text-xs border-l-2 border-primary/40 pl-2">
              <p><span className="font-medium">{a.actor_email}</span> · {a.action}</p>
              <p className="text-muted-foreground">{a.description}</p>
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  );
}

function WritePreview({ data }: { data: any }) {
  const [busy, setBusy] = useState(false);
  const [applied, setApplied] = useState(false);
  const [serverPreview, setServerPreview] = useState<any>(null);
  const [loadingPreview, setLoadingPreview] = useState(true);

  // Fetch impact preview from server when mounted / data changes
  useState(() => {
    (async () => {
      const { data: res, error } = await supabase.rpc("preview_ai_write", {
        p_action: {
          table: data.table,
          record_id: data.record_id,
          new_value: data.new_value,
          action_type: data.action_type ?? data.action ?? "update",
        } as any,
      });
      if (!error) setServerPreview(res);
      setLoadingPreview(false);
    })();
  });

  const oldVal = serverPreview?.old_value ?? data.old_value ?? {};
  const newVal = data.new_value ?? {};
  const changedKeys = Object.keys(newVal).filter((k) => JSON.stringify((oldVal as any)?.[k]) !== JSON.stringify(newVal[k]));
  const warnings: any[] = serverPreview?.warnings ?? [];

  async function confirm() {
    setBusy(true);
    const { data: res, error } = await supabase.rpc("apply_ai_write", {
      p_action: {
        table: data.table,
        record_id: data.record_id,
        new_value: data.new_value,
        action_type: data.action_type ?? data.action ?? "update",
      } as any,
    });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    setApplied(true);
    const changeId = (res as any)?.changelog_id;
    toast.success("✨ Change applied to live store", {
      duration: 60000,
      action: changeId ? {
        label: "Undo",
        onClick: async () => {
          const { error: e2 } = await supabase.rpc("rollback_ai_change", { p_change_id: changeId });
          if (e2) toast.error(e2.message); else toast.success("Reverted");
        },
      } : undefined,
    });
  }

  const toneClass = (lvl: string) =>
    lvl === "critical" ? "border-red-500/50 bg-red-500/10 text-red-300"
    : lvl === "warning" ? "border-amber-500/40 bg-amber-500/10 text-amber-300"
    : "border-primary/30 bg-primary/5 text-primary-foreground/80";

  return (
    <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <GlassCard className="p-4 border-amber-500/30 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-amber-500/5 via-transparent to-amber-500/5 animate-pulse pointer-events-none" />
        <div className="flex items-center gap-2 text-amber-400 text-sm font-semibold mb-2 relative">
          <AlertTriangle className="h-4 w-4" /> Confirm change
        </div>
        <p className="text-sm relative">{data.confirmation_message}</p>
        <p className="text-xs text-muted-foreground mt-1 relative">
          {(data.action_type ?? data.action ?? "update")} · {data.table}{data.record_id ? ` #${String(data.record_id).slice(0, 8)}` : ""}
        </p>
      </GlassCard>

      {/* Impact warnings */}
      {loadingPreview ? (
        <GlassCard className="p-3 text-xs text-muted-foreground">Analyzing impact…</GlassCard>
      ) : warnings.length > 0 && (
        <div className="space-y-2">
          {warnings.map((w, i) => (
            <div key={i} className={`text-xs px-3 py-2 rounded-lg border ${toneClass(w.level)} animate-in fade-in slide-in-from-left-2`} style={{ animationDelay: `${i * 80}ms` }}>
              <span className="font-medium uppercase mr-2 opacity-70">{w.level}</span>{w.message}
            </div>
          ))}
        </div>
      )}

      {/* Field-by-field diff */}
      <GlassCard className="p-3">
        <p className="text-xs text-muted-foreground mb-2">Live preview of changes</p>
        {changedKeys.length === 0 ? (
          <p className="text-xs text-muted-foreground">No field changes detected.</p>
        ) : (
          <div className="space-y-2">
            {changedKeys.map((k, i) => (
              <div key={k} className="grid grid-cols-[100px_1fr_auto_1fr] items-center gap-2 text-xs animate-in fade-in slide-in-from-right-2" style={{ animationDelay: `${i * 80}ms` }}>
                <span className="font-medium text-muted-foreground truncate">{k}</span>
                <span className="px-2 py-1 rounded bg-red-500/10 text-red-300 line-through truncate">{String((oldVal as any)?.[k] ?? "—")}</span>
                <span className="text-primary">→</span>
                <span className="px-2 py-1 rounded bg-emerald-500/15 text-emerald-300 truncate font-medium">{String(newVal[k] ?? "—")}</span>
              </div>
            ))}
          </div>
        )}
      </GlassCard>

      <Button
        onClick={confirm}
        disabled={busy || applied}
        className="w-full relative overflow-hidden group"
      >
        <span className="relative z-10 flex items-center gap-2">
          {applied ? (<><Check className="h-4 w-4" /> Applied — undo available for 60s</>) : busy ? "Applying…" : "Confirm & apply to live store"}
        </span>
        {!applied && !busy && (
          <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
        )}
      </Button>
    </div>
  );
}
