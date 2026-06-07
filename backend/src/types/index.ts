// User types
export interface User {
  id: number;
  nickname: string;
  email: string;
  password_hash: string;
  is_admin: boolean;
  notify_reminders: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface Invite {
  id: number;
  email: string;
  token: string;
  invited_by: number | null;
  status: 'sent' | 'accepted';
  created_at: Date;
  accepted_at: Date | null;
  expires_at: Date;
}

// Match types
export interface Match {
  id: number;
  external_ref: string | null;
  stage: string;
  group: string | null;
  team_home: string;
  team_away: string;
  kickoff_utc: Date;
  venue: string | null;
  status: 'open' | 'locked' | 'finished';
  score_home: number | null;
  score_away: number | null;
  result_imported_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

// Prediction types
export interface Prediction {
  id: number;
  user_id: number;
  match_id: number;
  pred_home: number;
  pred_away: number;
  pred_winner: 'home' | 'away' | null;
  points: number | null;
  created_at: Date;
  updated_at: Date;
}

// Leaderboard types
export interface LeaderboardEntry {
  user_id: number;
  nickname: string;
  total_score: number;
  exact_score_hits: number;
  matches_predicted: number;
  matches_scored: number;
  rank: number;
}

// Request types
export interface RegisterRequest {
  token: string;
  email: string;
  nickname: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface CreatePredictionRequest {
  match_id: number;
  pred_home: number;
  pred_away: number;
  pred_winner?: 'home' | 'away';
}

export interface UpdatePredictionRequest {
  pred_home: number;
  pred_away: number;
  pred_winner?: 'home' | 'away';
}

export interface CreateInviteRequest {
  email: string;
}

// Express session extension
declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}
