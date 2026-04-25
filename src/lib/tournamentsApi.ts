import { supabase } from "@/integrations/supabase/client";

export type TournamentStatus = "upcoming" | "live" | "finished" | "canceled";
export type ParticipantResult = "pending" | "won" | "lost";
export type ReportStatus = "review" | "resolved" | "rejected";
export type WithdrawalStatus = "pending" | "processed" | "rejected";

export interface DBTournament {
  id: string;
  name: string;
  game: string;
  room_id: string;
  password: string;
  prize: number;
  entry_fee: number;
  status: TournamentStatus;
  starts_at: string | null;
  finished_at: string | null;
  created_by: string;
  created_at: string;
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

export async function createTournament(input: {
  name: string;
  game: string;
  room_id: string;
  password: string;
  prize: number;
  entry_fee: number;
  starts_at?: string | null;
}): Promise<DBTournament> {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) throw new Error("Not authenticated");
  const { data, error } = await supabase
    .from("tournaments")
    .insert({ ...input, created_by: auth.user.id })
    .select()
    .single();
  if (error) throw error;
  return data as DBTournament;
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
