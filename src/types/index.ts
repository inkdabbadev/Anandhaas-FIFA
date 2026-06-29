// ─── Core Domain Types ────────────────────────────────────────────────────────

export type UserTier = 'mithai_fan' | 'sweet_striker' | 'golden_boot' | 'fifa_legend'

export type MatchStatus = 'upcoming' | 'live' | 'finished' | 'cancelled'

export type PredictionStatus = 'pending' | 'won' | 'lost' | 'refunded'

export type RewardStatus = 'active' | 'redeemed' | 'expired' | 'cancelled'

export type TokenTxType = 'purchase' | 'prediction_spend' | 'prediction_refund' | 'redemption' | 'bonus' | 'referral' | 'manual_grant' | 'expiry'

export type PointTxType = 'purchase' | 'prediction_win' | 'exact_score' | 'first_scorer' | 'perfect_match' | 'streak_bonus' | 'referral' | 'manual_grant'

export type NotificationChannel = 'whatsapp' | 'push' | 'sms' | 'email' | 'in_app'

// ─── Database Models ──────────────────────────────────────────────────────────

export interface User {
  id: string
  phone: string
  name: string | null
  avatar_url: string | null
  tier: UserTier
  season_points: number
  token_balance: number
  referral_code: string
  referred_by: string | null
  streak_count: number
  streak_last_date: string | null
  created_at: string
  updated_at: string
}

export interface Campaign {
  id: string
  slug: string
  name: string
  tagline: string | null
  sport: string
  season: string
  starts_at: string
  ends_at: string
  is_active: boolean
  branding: CampaignBranding
  rules: CampaignRules
  created_at: string
}

export interface CampaignBranding {
  primary_color: string
  accent_color: string
  logo_url?: string
  hero_image_url?: string
  emoji?: string
}

export interface CampaignRules {
  token_cost_per_prediction: number
  points_winner: number
  points_exact_score: number
  points_first_scorer: number
  points_perfect: number
  streak_bonus_at: number
  streak_bonus_points: number
  tokens_per_100_inr: number
  prediction_close_minutes: number
  token_expiry_days: number
}

export interface Team {
  name: string
  flag: string
  flagFallback?: string | null
  ranking: string | null
}

export interface Match {
  id: string
  campaign_id: string
  home_team: Team
  away_team: Team
  competition: string
  group_name: string | null
  kickoff_at: string
  prediction_closes_at: string
  token_cost: number
  status: MatchStatus
  home_score: number | null
  away_score: number | null
  first_scorer_team: string | null
  venue: string | null
  created_at: string
}

export interface Prediction {
  id: string
  user_id: string
  match_id: string
  campaign_id: string
  winner: string
  home_goals: number
  away_goals: number
  first_scorer_team: string | null
  tokens_spent: number
  status: PredictionStatus
  points_earned: number
  created_at: string
  updated_at: string
  match?: Match
}

export interface Reward {
  id: string
  campaign_id: string | null
  title: string
  description: string
  icon: string
  points_cost: number
  inventory: number | null
  is_active: boolean
  expires_at: string | null
  created_at: string
}

export interface Redemption {
  id: string
  user_id: string
  reward_id: string
  points_spent: number
  status: RewardStatus
  qr_code: string
  qr_expires_at: string
  redeemed_at: string | null
  created_at: string
  reward?: Reward
}

export interface TokenLedger {
  id: string
  user_id: string
  type: TokenTxType
  amount: number
  balance_after: number
  ref_id: string | null
  note: string | null
  expires_at: string | null
  created_at: string
}

export interface PointLedger {
  id: string
  user_id: string
  campaign_id: string
  type: PointTxType
  amount: number
  balance_after: number
  ref_id: string | null
  note: string | null
  created_at: string
}

export interface Purchase {
  id: string
  user_id: string
  source: string
  amount_inr: number
  tokens_granted: number
  points_granted: number
  ref_id: string | null
  purchased_at: string
  created_at: string
}

export interface LeaderboardEntry {
  rank: number
  user_id: string
  name: string | null
  avatar_url: string | null
  tier: UserTier
  points: number
  correct_predictions: number
  exact_scores: number
  is_me?: boolean
}

// ─── UI State Types ────────────────────────────────────────────────────────────

export interface PredictionDraft {
  matchId: string
  winner: string | null
  homeGoals: number
  awayGoals: number
  firstScorerTeam: string | null
}

export interface ToastData {
  id: string
  message: string
  type: 'success' | 'error' | 'info'
}

// ─── API Response ─────────────────────────────────────────────────────────────

export interface ApiResponse<T> {
  data: T | null
  error: string | null
}
