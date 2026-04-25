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
}

export interface LeaderPlayer {
  id: string;
  name: string;
  wins: number;
  coins: number;
  isYou?: boolean;
}

export interface ArenaNotification {
  id: string;
  kind: "live" | "win" | "info" | "deposit";
  text: string;
  at: string;
  read?: boolean;
}

export interface ArenaTransaction {
  id: string;
  type: "deposit" | "withdraw" | "winnings";
  amount: number;
  source: string;
  at: string;
}

export interface ReportItem {
  id: string;
  matchName: string;
  reason: string;
  filedAt: string;
  status: "review" | "resolved" | "rejected";
}

export const mockJoined: TournamentMatch[] = [
  {
    id: "1",
    name: "Free Fire Solo Cup #42",
    game: "Free Fire",
    roomId: "RM-4492",
    password: "FF42WIN",
    prize: 2500,
    entryFee: 50,
    status: "live",
  },
  {
    id: "2",
    name: "PUBG Squad Showdown",
    game: "PUBG",
    roomId: "RM-4501",
    password: "PUBG2025",
    prize: 5000,
    entryFee: 100,
    status: "upcoming",
    startsAt: new Date(Date.now() + 25 * 60_000).toISOString(),
  },
  {
    id: "3",
    name: "ML Lonewolf 1v1",
    game: "Mobile Legends",
    roomId: "RM-4520",
    password: "ML1V1NEP",
    prize: 800,
    entryFee: 20,
    status: "joined",
    startsAt: new Date(Date.now() + 3 * 3600_000).toISOString(),
  },
];

export const mockCreated: TournamentMatch[] = [
  {
    id: "c1",
    name: "Bibek's Pro Lobby",
    game: "Free Fire",
    roomId: "RM-4710",
    password: "BIBEKPRO",
    prize: 1500,
    entryFee: 30,
    status: "upcoming",
    startsAt: new Date(Date.now() + 60 * 60_000).toISOString(),
  },
];

export const mockFinished: TournamentMatch[] = [
  {
    id: "f1",
    name: "Free Fire Daily #88",
    game: "Free Fire",
    roomId: "RM-4301",
    password: "DONE",
    prize: 1200,
    entryFee: 30,
    status: "won",
    finishedAt: new Date(Date.now() - 3 * 3600_000).toISOString(),
    resultCoins: 1200,
  },
  {
    id: "f2",
    name: "PUBG Night Cup",
    game: "PUBG",
    roomId: "RM-4290",
    password: "DONE",
    prize: 0,
    entryFee: 50,
    status: "lost",
    finishedAt: new Date(Date.now() - 26 * 3600_000).toISOString(),
    resultCoins: 0,
  },
  {
    id: "f3",
    name: "ML Weekly Brawl",
    game: "Mobile Legends",
    roomId: "RM-4275",
    password: "DONE",
    prize: 600,
    entryFee: 20,
    status: "won",
    finishedAt: new Date(Date.now() - 50 * 3600_000).toISOString(),
    resultCoins: 600,
  },
];

export const mockReports: ReportItem[] = [
  {
    id: "r1",
    matchName: "Free Fire Daily #88",
    reason: "Result dispute",
    filedAt: new Date(Date.now() - 2 * 86400_000).toISOString(),
    status: "review",
  },
];

export const mockLeaders: LeaderPlayer[] = [
  { id: "p1", name: "Sandesh K", wins: 58, coins: 12400 },
  { id: "p2", name: "Aayush R", wins: 49, coins: 10800 },
  { id: "p3", name: "Bibek J", wins: 43, coins: 9400, isYou: true },
  { id: "p4", name: "Sujal M", wins: 38, coins: 7600 },
  { id: "p5", name: "Niraj T", wins: 31, coins: 6200 },
];

export const mockNotifications: ArenaNotification[] = [
  { id: "n1", kind: "live", text: "Free Fire Solo Cup #42 is live now", at: new Date(Date.now() - 5 * 60_000).toISOString() },
  { id: "n2", kind: "win", text: "You won 1,200 IG Coins in Daily #88", at: new Date(Date.now() - 3 * 3600_000).toISOString() },
  { id: "n3", kind: "info", text: "New PUBG tournament available", at: new Date(Date.now() - 26 * 3600_000).toISOString(), read: true },
];

export const mockTransactions: ArenaTransaction[] = [
  { id: "t1", type: "winnings", amount: 1200, source: "Free Fire Daily #88", at: new Date(Date.now() - 3 * 3600_000).toISOString() },
  { id: "t2", type: "deposit", amount: 1000, source: "eSewa", at: new Date(Date.now() - 26 * 3600_000).toISOString() },
  { id: "t3", type: "withdraw", amount: 500, source: "Khalti", at: new Date(Date.now() - 5 * 86400_000).toISOString() },
];

export const initialBalance = 1250;
export const initialStats = {
  totalEarnings: 9400,
  wins: 43,
  losses: 11,
  tournamentsCreated: 7,
  activeCreated: 3,
  globalRank: 14,
  topPercent: 5,
};

export const platformStats = {
  liveTournaments: 38,
  playersToday: 412,
  capacityPct: 72,
};
