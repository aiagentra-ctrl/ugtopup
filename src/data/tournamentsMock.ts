// Type-only module — all real data now flows through src/lib/tournamentsApi.ts.
// Kept for backwards-compatibility of UI types referenced by components/pages.

export type MatchStatus = "live" | "upcoming" | "won" | "lost" | "joined" | "pending";

export interface TournamentMatch {
  id: string;
  name: string;
  game: string;
  roomId: string;
  password: string;
  prize: number;
  entryFee: number;
  status: MatchStatus;
  startsAt?: string;
  finishedAt?: string;
  resultCoins?: number;
  maxPlayers?: number;
  currentPlayers?: number;
  roomStatus?: "waiting" | "full" | "ongoing" | "finished";
}
