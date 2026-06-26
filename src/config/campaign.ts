import type { Campaign } from '@/types'

/**
 * Campaign Engine configuration.
 *
 * The app is NOT hardcoded to FIFA. A "campaign" bundles branding, scoring rules,
 * matches, rewards and leaderboard into a reusable seasonal experience. To run an
 * IPL / Diwali / Pongal campaign, only the database `campaigns` row changes — no
 * application code. This file holds the *fallback default* used during Phase 1 and
 * whenever the database has no active campaign.
 */
export const DEFAULT_CAMPAIGN: Campaign = {
  id: '00000000-0000-0000-0000-000000000001',
  slug: 'fifa-world-cup-2026',
  name: 'FIFA World Cup 2026',
  tagline: 'Predict. Win. Taste victory.',
  sport: 'football',
  season: '2026',
  starts_at: '2026-06-11T00:00:00Z',
  ends_at: '2026-07-19T23:59:59Z',
  is_active: true,
  branding: {
    primary_color: '#1a140d',
    accent_color: '#93c5fd',
    emoji: '⚽',
  },
  rules: {
    token_cost_per_prediction: 2,
    points_winner: 50,
    points_exact_score: 150,
    points_first_scorer: 30,
    points_perfect: 280,
    streak_bonus_at: 7,
    streak_bonus_points: 50,
    tokens_per_100_inr: 1,
    prediction_close_minutes: 10,
    token_expiry_days: 30,
  },
  created_at: '2026-06-01T00:00:00Z',
}

/** Resolve the active campaign. In Phase 1 this returns the default; in Phase 2 it
 *  reads from Supabase `campaigns where is_active = true`. */
export function getActiveCampaign(): Campaign {
  return DEFAULT_CAMPAIGN
}
