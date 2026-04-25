import { supabase } from "@/integrations/supabase/client";

export type TournamentStatus = "upcoming" | "live" | "finished" | "canceled";
export type RoomStatus = "waiting" | "full" | "ongoing" | "finished";
export type ParticipantResult = "pending" | "won" | "lost";
export type ReportStatus = "review" | "resolved" | "rejected";
export type WithdrawalStatus = "pending" | "processed" | "rejected";

export interface DBTournament {
  id: string;
  name: string;
  game: string;
  game_mode: string;
  description: string | null;
  room_id: string;
  password: string;
  prize: number;
  entry_fee: number;
  status: TournamentStatus;
  room_status: RoomStatus;
  max_players: number;
  current_players: number;
  starts_at: string | null;
  finished_at: string | null;
  created_by: string;
  created_at: string;
  // v2 financial fields
  host_fee?: number;
  commission_percent?: number;
  prize_pool?: number;
  commission_amount?: number;
  winner_prize?: number;
  auto_start_at?: string | null;
}

export interface DBParticipant {
  id: string;
  tournament_id: string;
  user_id: string;
  result: ParticipantResult;
  coins_won: number;
  joined_at: string;
}

export interface DBReport {
  id: string;
  tournament_id: string | null;
  user_id: string;
  match_name: string;
  reason: string;
  status: ReportStatus;
  admin_response: string | null;
  created_at: string;
}

export interface DBWithdrawal {
  id: string;
  user_id: string;
  user_email: string;
  amount_coins: number;
  amount_npr: number;
  method: string;
  account_detail: string;
  status: WithdrawalStatus;
  admin_remarks: string | null;
  created_at: string;
  processed_at: string | null;
}

export type JoinedMatch = DBTournament & {
  result: ParticipantResult;
  coins_won: number;
};

export async function fetchJoinedMatches(userId: string): Promise<JoinedMatch[]> {
  const { data, error } = await supabase
    .from("tournament_participants")
    .select("result, coins_won, tournaments(*)")
    .eq("user_id", userId)
    .order("joined_at", { ascending: false });
  if (error) throw error;
  return (data ?? [])
    .filter((row: any) => row.tournaments)
    .map((row: any) => ({
      ...(row.tournaments as DBTournament),
      result: row.result as ParticipantResult,
      coins_won: Number(row.coins_won) || 0,
    }));
}

export async function fetchOpenTournaments(): Promise<DBTournament[]> {
  const { data, error } = await supabase
    .from("tournaments")
    .select("*")
    .in("status", ["upcoming", "live"])
    .order("starts_at", { ascending: true, nullsFirst: false })
    .limit(100);
  if (error) throw error;
  return (data ?? []) as DBTournament[];
}

export async function fetchAllTournaments(): Promise<DBTournament[]> {
  const { data, error } = await supabase
    .from("tournaments")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) throw error;
  return (data ?? []) as DBTournament[];
}

export async function fetchTournamentParticipants(tournamentId: string): Promise<
  Array<DBParticipant & { username: string | null; email: string | null }>
> {
  const { data, error } = await supabase
    .from("tournament_participants")
    .select("*, profiles:profiles(username, email, full_name)")
    .eq("tournament_id", tournamentId)
    .order("joined_at", { ascending: true });
  if (error) throw error;
  return (data ?? []).map((r: any) => ({
    ...r,
    username: r.profiles?.username ?? r.profiles?.full_name ?? null,
    email: r.profiles?.email ?? null,
  }));
}

export async function fetchCreatedTournaments(userId: string): Promise<DBTournament[]> {
  const { data, error } = await supabase
    .from("tournaments")
    .select("*")
    .eq("created_by", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as DBTournament[];
}

export async function fetchUserReports(userId: string): Promise<DBReport[]> {
  const { data, error } = await supabase
    .from("tournament_reports")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as DBReport[];
}

export async function fetchUserWithdrawals(userId: string): Promise<DBWithdrawal[]> {
  const { data, error } = await supabase
    .from("tournament_withdrawals")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as DBWithdrawal[];
}

export interface EarningsSummary {
  totalEarnings: number;
  wins: number;
  losses: number;
  pending: number;
  totalMatches: number;
}

export async function fetchEarningsSummary(userId: string): Promise<EarningsSummary> {
  const { data, error } = await supabase
    .from("tournament_participants")
    .select("result, coins_won")
    .eq("user_id", userId);
  if (error) throw error;
  const rows = data ?? [];
  let totalEarnings = 0,
    wins = 0,
    losses = 0,
    pending = 0;
  rows.forEach((r: any) => {
    totalEarnings += Number(r.coins_won) || 0;
    if (r.result === "won") wins++;
    else if (r.result === "lost") losses++;
    else pending++;
  });
  return { totalEarnings, wins, losses, pending, totalMatches: rows.length };
}

export async function createTournament(input: {
  name: string;
  game: string;
  game_mode?: string;
  description?: string | null;
  room_id: string;
  password: string;
  prize: number; // ignored — kept for API compat
  entry_fee: number;
  max_players?: number;
  starts_at?: string | null;
  auto_start?: boolean;
}): Promise<DBTournament> {
  const { data, error } = await supabase.rpc("create_tournament_v2" as any, {
    p_name: input.name,
    p_game: input.game,
    p_game_mode: input.game_mode ?? "1v1",
    p_description: input.description ?? null,
    p_room_id: input.room_id,
    p_password: input.password,
    p_entry_fee: input.entry_fee,
    p_max_players: input.max_players ?? 4,
    p_starts_at: input.starts_at ?? null,
    p_auto_start: !!input.auto_start,
  });
  if (error) throw error;
  return data as DBTournament;
}

export async function joinTournament(tournamentId: string) {
  const { data, error } = await supabase.rpc("join_tournament", { p_tournament_id: tournamentId });
  if (error) throw error;
  return data;
}

export async function leaveTournament(tournamentId: string) {
  const { data, error } = await supabase.rpc("leave_tournament", { p_tournament_id: tournamentId });
  if (error) throw error;
  return data;
}

export async function startTournament(tournamentId: string) {
  const { data, error } = await supabase.rpc("start_tournament", { p_tournament_id: tournamentId });
  if (error) throw error;
  return data;
}

export async function finishTournament(tournamentId: string, winnerUserId: string) {
  const { data, error } = await supabase.rpc("finish_tournament", {
    p_tournament_id: tournamentId,
    p_winner_user_id: winnerUserId,
  });
  if (error) throw error;
  return data;
}

export async function reportMatch(input: { tournament_id: string; match_name: string; reason: string }) {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) throw new Error("Not authenticated");
  const { data, error } = await supabase
    .from("tournament_reports")
    .insert({
      tournament_id: input.tournament_id,
      user_id: auth.user.id,
      match_name: input.match_name,
      reason: input.reason,
      status: "review",
    })
    .select()
    .single();
  if (error) throw error;
  return data as DBReport;
}

export async function requestWithdrawal(input: {
  amount_coins: number;
  amount_npr: number;
  method: string;
  account_detail: string;
}): Promise<DBWithdrawal> {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) throw new Error("Not authenticated");
  const { data, error } = await supabase
    .from("tournament_withdrawals")
    .insert({
      ...input,
      user_id: auth.user.id,
      user_email: auth.user.email ?? "",
    })
    .select()
    .single();
  if (error) throw error;
  return data as DBWithdrawal;
}

export function subscribeTournaments(onChange: () => void) {
  const channel = supabase
    .channel("tournaments-realtime")
    .on("postgres_changes", { event: "*", schema: "public", table: "tournaments" }, onChange)
    .on("postgres_changes", { event: "*", schema: "public", table: "tournament_participants" }, onChange)
    .subscribe();
  return () => {
    supabase.removeChannel(channel);
  };
}
