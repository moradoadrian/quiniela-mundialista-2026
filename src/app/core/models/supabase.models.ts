export type PredictionType = 'L' | 'E' | 'V';
export type MatchStatus = 'draft' | 'scheduled' | 'published' | 'closed' | 'finished';
export type UserRole = 'user' | 'admin';

export interface Profile {
  id: string; // UUID
  username: string;
  avatar_url: string;
  role: UserRole;
  created_at: string;
}

export interface DbTeam {
  id: string; // UUID
  name: string;
  code: string;
  flag_url: string;
  group_name: 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H' | 'I' | 'J' | 'K' | 'L';
}

export interface DbMatch {
  id: string; // UUID
  home_team_id: string; // UUID
  away_team_id: string; // UUID
  group_name: string;
  round: 1 | 2 | 3;
  stadium: string;
  match_date: string; // ISO String
  home_score?: number;
  away_score?: number;
  result: PredictionType | null;
  status: MatchStatus;
}

// Joined representation of a match with full team information
export interface MatchWithTeams {
  id: string;
  group_name: string;
  round: 1 | 2 | 3;
  stadium: string;
  match_date: string;
  home_score?: number;
  away_score?: number;
  result: PredictionType | null;
  status: MatchStatus;
  homeTeam: DbTeam;
  awayTeam: DbTeam;
}

export interface DbPrediction {
  id: string; // UUID
  user_id: string; // UUID
  match_id: string; // UUID
  prediction: PredictionType;
  points: number;
  created_at: string;
}

export interface PredictionWithMatchDetails {
  id: string;
  user_id: string;
  match_id: string;
  prediction: PredictionType;
  points: number;
  created_at: string;
  match?: DbMatch;
}

export interface LeaderboardUserEntry {
  userId: string;
  userName: string;
  avatarUrl: string;
  role: UserRole;
  points: number;
  totalPredicted: number;
  rank?: number;
}
