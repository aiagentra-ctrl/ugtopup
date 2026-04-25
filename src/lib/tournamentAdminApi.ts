import { supabase } from "@/integrations/supabase/client";

export interface TournamentSettings {
  id: string;
  default_commission_percent: number;
  min_entry_fee: number;
  max_entry_fee: number;
  host_fee_flat: number;
  host_fee_percent: number;
  withdrawal_fee_percent: number;
  min_withdrawal_npr: number;
  coin_to_npr_rate: number;
  premium_boost_price: number;
  allow_user_creation: boolean;
  updated_at: string;
}

export interface RevenueRow {
  id: string;
  source: "commission" | "host_fee" | "withdrawal_fee" | "boost";
  tournament_id: string | null;
  user_id: string | null;
  amount: number;
  created_at: string;
}

export interface LedgerRow {
  id: string;
  user_id: string;
  tournament_id: string | null;
  type: string;
  balance_kind: "balance" | "held" | "winnings";
  amount: number;
  balance_before: number | null;
  balance_after: number | null;
  metadata: any;
  created_at: string;
}

export async function fetchTournamentSettings(): Promise<TournamentSettings | null> {
  const { data, error } = await supabase
    .from("tournament_settings" as any)
    .select("*")
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return (data as any) ?? null;
}

export async function updateTournamentSettings(
  id: string,
  patch: Partial<TournamentSettings>
): Promise<void> {
  const { error } = await supabase
    .from("tournament_settings" as any)
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}

export async function fetchPlatformRevenue(limit = 200): Promise<RevenueRow[]> {
  const { data, error } = await supabase
    .from("platform_revenue" as any)
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data as any) ?? [];
}

export async function fetchRevenueTotals(): Promise<{
  total: number;
  commission: number;
  hostFee: number;
  withdrawalFee: number;
  boost: number;
  last30: number;
}> {
  const { data, error } = await supabase
    .from("platform_revenue" as any)
    .select("source, amount, created_at");
  if (error) throw error;
  const rows = (data as any[]) ?? [];
  const cutoff = Date.now() - 30 * 86400_000;
  const out = { total: 0, commission: 0, hostFee: 0, withdrawalFee: 0, boost: 0, last30: 0 };
  rows.forEach((r) => {
    const a = Number(r.amount) || 0;
    out.total += a;
    if (r.source === "commission") out.commission += a;
    else if (r.source === "host_fee") out.hostFee += a;
    else if (r.source === "withdrawal_fee") out.withdrawalFee += a;
    else if (r.source === "boost") out.boost += a;
    if (new Date(r.created_at).getTime() >= cutoff) out.last30 += a;
  });
  return out;
}

export async function fetchAllWithdrawals(): Promise<any[]> {
  const { data, error } = await supabase
    .from("tournament_withdrawals")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) throw error;
  return data ?? [];
}

export async function processWithdrawal(
  id: string,
  action: "processed" | "rejected",
  remarks?: string
): Promise<any> {
  const { data, error } = await supabase.rpc("process_withdrawal_admin" as any, {
    p_withdrawal_id: id,
    p_action: action,
    p_remarks: remarks ?? null,
  });
  if (error) throw error;
  return data;
}

export async function cancelTournamentAdmin(id: string, reason: string): Promise<any> {
  const { data, error } = await supabase.rpc("cancel_tournament_admin" as any, {
    p_tournament_id: id,
    p_reason: reason,
  });
  if (error) throw error;
  return data;
}

export async function fetchLedger(filters: { userEmail?: string; type?: string } = {}): Promise<LedgerRow[]> {
  let q = supabase
    .from("tournament_ledger" as any)
    .select("*")
    .order("created_at", { ascending: false })
    .limit(300);
  if (filters.type) q = q.eq("type", filters.type);
  const { data, error } = await q;
  if (error) throw error;
  return (data as any) ?? [];
}

export async function fetchTopWalletUsers(limit = 50): Promise<any[]> {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, email, username, balance, held_balance, winnings_balance")
    .order("winnings_balance", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data ?? [];
}

export async function fetchTournamentsAdmin(): Promise<any[]> {
  const { data, error } = await supabase
    .from("tournaments")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) throw error;
  return data ?? [];
}

export async function fetchTournamentDashboardStats(): Promise<{
  totalTournaments: number;
  activeNow: number;
  pendingWithdrawals: number;
  totalHeldCoins: number;
  totalWinnings: number;
  pendingReports: number;
}> {
  const [tAll, tLive, wPending, profilesAgg, rPending] = await Promise.all([
    supabase.from("tournaments").select("id", { count: "exact", head: true }),
    supabase.from("tournaments").select("id", { count: "exact", head: true }).in("status", ["upcoming", "live"]),
    supabase.from("tournament_withdrawals").select("id", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("profiles").select("held_balance, winnings_balance"),
    supabase.from("tournament_reports").select("id", { count: "exact", head: true }).eq("status", "review"),
  ]);
  const profiles = (profilesAgg.data as any[]) ?? [];
  const totalHeld = profiles.reduce((s, p) => s + Number(p.held_balance || 0), 0);
  const totalWin = profiles.reduce((s, p) => s + Number(p.winnings_balance || 0), 0);
  return {
    totalTournaments: tAll.count ?? 0,
    activeNow: tLive.count ?? 0,
    pendingWithdrawals: wPending.count ?? 0,
    totalHeldCoins: totalHeld,
    totalWinnings: totalWin,
    pendingReports: rPending.count ?? 0,
  };
}
