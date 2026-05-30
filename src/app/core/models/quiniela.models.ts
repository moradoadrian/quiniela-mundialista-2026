export type PredictionType = 'L' | 'E' | 'V';

export interface Team {
  id: string;
  name: string;
  code: string;
  flagUrl: string; // URL to flag image or emoji
}

export interface Match {
  id: string;
  homeTeam: Team;
  awayTeam: Team;
  date: string; // ISO String
  group: 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H' | 'I' | 'J' | 'K' | 'L'; // 12 groups of 4 teams = 48 teams, 72 matches in group stage
  matchday: 1 | 2 | 3;
  realResult: PredictionType | null; // Null if the match hasn't been played
  homeGoals?: number;
  awayGoals?: number;
  stadium?: string;
  city?: string;
}

export interface Prediction {
  matchId: string;
  prediction: PredictionType | null;
  updatedAt: string; // ISO String
}

export interface UserPredictions {
  userId: string;
  userName: string;
  predictions: Record<string, PredictionType>; // matchId -> prediction value ('L' | 'E' | 'V')
}

export interface LeaderboardEntry {
  userId: string;
  userName: string;
  avatarUrl?: string;
  points: number; // calculated in real time: 1 point per match where predictions[matchId] === realResult
  totalPredicted: number; // total matches predicted
  rank?: number;
}
