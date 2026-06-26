import type { UserTier } from '@/types'

/** App-level metadata. */
export const APP = {
  name: 'Anandhaas Predict',
  brand: 'Anandhaas',
  domain: 'predict.anandhaassweets.com',
  description: 'Predict matches, earn tokens, redeem sweet rewards.',
} as const

/** Default scoring rules (mirrors the active campaign config; campaign rules win when present). */
export const POINTS = {
  WINNER: 50,
  EXACT_SCORE: 150,
  FIRST_SCORER: 30,
  PERFECT_MATCH: 280,
  STREAK_BONUS: 50,
} as const

export const TOKENS = {
  PER_100_INR: 1,
  EXPIRY_DAYS: 30,
  PREDICTION_CLOSE_MINUTES: 10,
} as const

export const STREAK_TARGET = 7

/** Tier metadata: thresholds, display, perks. Order matters (ascending). */
export interface TierMeta {
  key: UserTier
  num: string
  name: string
  minPoints: number
  maxPoints: number | null
  range: string
  perk: string
  swatch: { bg: string; color: string }
}

export const TIERS: TierMeta[] = [
  {
    key: 'mithai_fan',
    num: '1',
    name: 'Mithai Fan',
    minPoints: 0,
    maxPoints: 499,
    range: '0 – 499 pts',
    perk: '1 token per ₹100 · Base access',
    swatch: { bg: '#f1efe8', color: '#5c4a32' },
  },
  {
    key: 'sweet_striker',
    num: '2',
    name: 'Sweet Striker',
    minPoints: 500,
    maxPoints: 1499,
    range: '500 – 1,499 pts',
    perk: '1 token per ₹100 · +1 free token on unlock',
    swatch: { bg: '#e6f1fb', color: '#185fa5' },
  },
  {
    key: 'golden_boot',
    num: '3',
    name: 'Golden Boot',
    minPoints: 1500,
    maxPoints: 2999,
    range: '1,500 – 2,999 pts',
    perk: '1 token per ₹80 · Wildcard predictions · Priority rewards',
    swatch: { bg: '#eff6ff', color: '#2563eb' },
  },
  {
    key: 'fifa_legend',
    num: '4',
    name: 'FIFA Legend',
    minPoints: 3000,
    maxPoints: null,
    range: '3,000+ pts',
    perk: '1 token per ₹60 · VIP badge · Grand finale invite',
    swatch: { bg: '#eeedfe', color: '#534ab7' },
  },
]

export function tierForPoints(points: number): TierMeta {
  return [...TIERS].reverse().find((t) => points >= t.minPoints) ?? TIERS[0]
}

export function tierByKey(key: UserTier): TierMeta {
  return TIERS.find((t) => t.key === key) ?? TIERS[0]
}

/** Bottom navigation items. */
export const NAV_ITEMS = [
  { key: 'home', label: 'Home', href: '/home' },
  { key: 'leaderboard', label: 'Rankings', href: '/leaderboard' },
  { key: 'tokens', label: 'Tokens', href: '/tokens' },
  { key: 'tiers', label: 'Tiers', href: '/tiers' },
  { key: 'profile', label: 'Profile', href: '/profile' },
] as const
