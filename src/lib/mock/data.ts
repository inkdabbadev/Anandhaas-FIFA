import type {
  User,
  Match,
  Reward,
  LeaderboardEntry,
  TokenLedger,
  Redemption,
  Prediction,
} from '@/types'
import { DEFAULT_CAMPAIGN } from '@/config/campaign'

const CAMPAIGN_ID = DEFAULT_CAMPAIGN.id
const NOW = Date.now()
const h = (n: number) => new Date(NOW + n * 3600_000).toISOString()
const min = (n: number) => new Date(NOW + n * 60_000).toISOString()

/** The signed-in demo user. */
export const MOCK_USER: User = {
  id: 'usr_rajesh',
  phone: '+91 98765 43210',
  name: 'Rajesh Kumar',
  avatar_url: null,
  tier: 'sweet_striker',
  season_points: 480,
  token_balance: 243,
  referral_code: 'RAJESH26',
  referred_by: null,
  streak_count: 4,
  streak_last_date: new Date(NOW - 86_400_000).toISOString(),
  created_at: '2026-06-11T10:00:00Z',
  updated_at: new Date().toISOString(),
}

export const MOCK_MATCHES: Match[] = [
  {
    id: 'mat_1',
    campaign_id: CAMPAIGN_ID,
    home_team: { name: 'Brazil', flag: '🇧🇷', ranking: 'FIFA #1' },
    away_team: { name: 'Germany', flag: '🇩🇪', ranking: 'FIFA #3' },
    competition: 'FIFA WC 2026',
    group_name: 'Group A',
    kickoff_at: h(1),
    prediction_closes_at: min(50),
    token_cost: 2,
    status: 'upcoming',
    home_score: null,
    away_score: null,
    first_scorer_team: null,
    venue: 'MetLife Stadium',
    created_at: h(-48),
  },
  {
    id: 'mat_2',
    campaign_id: CAMPAIGN_ID,
    home_team: { name: 'Argentina', flag: '🇦🇷', ranking: 'FIFA #2' },
    away_team: { name: 'France', flag: '🇫🇷', ranking: 'FIFA #4' },
    competition: 'FIFA WC 2026',
    group_name: 'Group B',
    kickoff_at: h(3),
    prediction_closes_at: min(170),
    token_cost: 2,
    status: 'upcoming',
    home_score: null,
    away_score: null,
    first_scorer_team: null,
    venue: 'SoFi Stadium',
    created_at: h(-48),
  },
  {
    id: 'mat_3',
    campaign_id: CAMPAIGN_ID,
    home_team: { name: 'Spain', flag: '🇪🇸', ranking: 'FIFA #8' },
    away_team: { name: 'Morocco', flag: '🇲🇦', ranking: 'FIFA #14' },
    competition: 'FIFA WC 2026',
    group_name: 'Group C',
    kickoff_at: h(27),
    prediction_closes_at: h(26.8),
    token_cost: 1,
    status: 'upcoming',
    home_score: null,
    away_score: null,
    first_scorer_team: null,
    venue: 'AT&T Stadium',
    created_at: h(-48),
  },
  {
    id: 'mat_4',
    campaign_id: CAMPAIGN_ID,
    home_team: { name: 'England', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', ranking: 'FIFA #5' },
    away_team: { name: 'Portugal', flag: '🇵🇹', ranking: 'FIFA #6' },
    competition: 'FIFA WC 2026',
    group_name: 'Group D',
    kickoff_at: h(30),
    prediction_closes_at: h(29.8),
    token_cost: 2,
    status: 'upcoming',
    home_score: null,
    away_score: null,
    first_scorer_team: null,
    venue: 'Levi’s Stadium',
    created_at: h(-48),
  },
  {
    id: 'mat_5',
    campaign_id: CAMPAIGN_ID,
    home_team: { name: 'Japan', flag: '🇯🇵', ranking: 'FIFA #17' },
    away_team: { name: 'USA', flag: '🇺🇸', ranking: 'FIFA #11' },
    competition: 'FIFA WC 2026',
    group_name: 'Group E',
    kickoff_at: h(51),
    prediction_closes_at: h(50.8),
    token_cost: 1,
    status: 'upcoming',
    home_score: null,
    away_score: null,
    first_scorer_team: null,
    venue: 'Lumen Field',
    created_at: h(-48),
  },
]

export const MOCK_PREDICTIONS: Prediction[] = []

export const MOCK_REWARDS: Reward[] = [
  { id: 'rwd_1', campaign_id: CAMPAIGN_ID, title: '10% off next order', description: 'Valid on orders ₹300+ · 7-day expiry', icon: '🏷️', points_cost: 100, inventory: null, is_active: true, expires_at: null, created_at: h(-72) },
  { id: 'rwd_2', campaign_id: CAMPAIGN_ID, title: 'Free Ghee Mysore Pak 200g', description: 'Claim instore · show QR code at counter', icon: '🍬', points_cost: 200, inventory: 50, is_active: true, expires_at: null, created_at: h(-72) },
  { id: 'rwd_3', campaign_id: CAMPAIGN_ID, title: 'FIFA Mithai Box', description: 'Limited edition FIFA-themed assortment box', icon: '🪄', points_cost: 350, inventory: 25, is_active: true, expires_at: null, created_at: h(-72) },
  { id: 'rwd_4', campaign_id: CAMPAIGN_ID, title: 'Premium gift box', description: '₹499 value · ribbon packaging included', icon: '🎁', points_cost: 400, inventory: 15, is_active: true, expires_at: null, created_at: h(-72) },
  { id: 'rwd_5', campaign_id: CAMPAIGN_ID, title: 'VIP Leaderboard badge', description: 'Gold badge for top-tier season finishers', icon: '🏆', points_cost: 500, inventory: null, is_active: true, expires_at: null, created_at: h(-72) },
]

export const MOCK_LEADERBOARD: LeaderboardEntry[] = [
  { rank: 1, user_id: 'u1', name: 'Priya Sundaram', avatar_url: null, tier: 'golden_boot', points: 720, correct_predictions: 9, exact_scores: 3 },
  { rank: 2, user_id: 'u2', name: 'Vikram Rajan', avatar_url: null, tier: 'golden_boot', points: 650, correct_predictions: 8, exact_scores: 2 },
  { rank: 3, user_id: 'u3', name: 'Meena Iyer', avatar_url: null, tier: 'sweet_striker', points: 580, correct_predictions: 7, exact_scores: 1 },
  { rank: 4, user_id: 'usr_rajesh', name: 'Rajesh Kumar', avatar_url: null, tier: 'sweet_striker', points: 480, correct_predictions: 6, exact_scores: 0, is_me: true },
  { rank: 5, user_id: 'u5', name: 'Suresh Nair', avatar_url: null, tier: 'sweet_striker', points: 430, correct_predictions: 5, exact_scores: 1 },
  { rank: 6, user_id: 'u6', name: 'Deepika Sharma', avatar_url: null, tier: 'mithai_fan', points: 380, correct_predictions: 5, exact_scores: 0 },
]

export const MOCK_TOKEN_LEDGER: TokenLedger[] = [
  { id: 't1', user_id: MOCK_USER.id, type: 'purchase', amount: 3, balance_after: 243, ref_id: 'pur_9', note: '₹350 purchase · Anandhaas T. Nagar', expires_at: h(720), created_at: h(-6) },
  { id: 't3', user_id: MOCK_USER.id, type: 'bonus', amount: 50, balance_after: 290, ref_id: null, note: '7-day streak bonus', expires_at: h(720), created_at: h(-26) },
  { id: 't4', user_id: MOCK_USER.id, type: 'redemption', amount: -100, balance_after: 190, ref_id: 'red_1', note: '10% off next order', expires_at: null, created_at: h(-30) },
  { id: 't5', user_id: MOCK_USER.id, type: 'purchase', amount: 4, balance_after: 194, ref_id: 'pur_4', note: '₹420 purchase · Anandhaas Online', expires_at: h(360), created_at: h(-52) },
]

export const MOCK_REDEMPTIONS: Redemption[] = [
  {
    id: 'red_1',
    user_id: MOCK_USER.id,
    reward_id: 'rwd_1',
    points_spent: 100,
    status: 'active',
    qr_code: 'ANDH-RED-7KQ2-M9XP',
    qr_expires_at: h(168),
    redeemed_at: null,
    created_at: h(-30),
    reward: MOCK_REWARDS[0],
  },
]
