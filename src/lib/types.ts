export type SportType = "mma" | "boxing" | "kickboxing" | "bare_knuckle";
export type ContestStatus = "draft" | "upcoming" | "live" | "completed" | "cancelled" | "under_review";
export type ContestType = "free" | "token" | "shadow" | "affiliate" | "sponsored";

export type Contest = {
  _id: string;
  title: string;
  slug: string;
  sport: SportType;
  type: ContestType;
  status: ContestStatus;
  eventName?: string;
  venue?: string;
  startsAt: string;
  lockAt: string;
  entryFee: number;
  prizePool: number;
  guaranteedPrizePool?: number;
  entries?: number;
  matchup?: Record<string, any>;
  scoringRules?: Record<string, number>;
  leaderboard?: LeaderboardEntry[];
};

export type LeaderboardEntry = {
  _id?: string;
  rank: number;
  displayName: string;
  score: number;
  payout?: number;
  breakdown?: Record<string, unknown>;
};

export type WalletSummary = {
  tokenBalance: number;
  withdrawableBalance: number;
  promoCreditBalance: number;
  lifetimeWinnings: number;
  transactions: Array<Record<string, any>>;
  payouts: Array<Record<string, any>>;
};

export type ApiSession = {
  accessToken: string;
  user: {
    _id: string;
    email: string;
    displayName: string;
    role: "user" | "affiliate" | "sponsor" | "admin" | "super_admin";
    tokenBalance: number;
    withdrawableBalance: number;
    promoCreditBalance: number;
  };
};
