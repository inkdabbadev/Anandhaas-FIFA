export const APP = {
  name: 'Anandhaas Predict',
  brand: 'Anandhaas',
  domain: 'predict.anandhaassweets.com',
  description: 'Predict matches, earn points, redeem sweet rewards.',
} as const

export const POINTS = {
  CORRECT: 50,
} as const

export const STREAK_TARGET = 7

export const NAV_ITEMS = [
  { key: 'home', label: 'Home', href: '/home' },
  { key: 'leaderboard', label: 'Rankings', href: '/leaderboard' },
  { key: 'rewards', label: 'Rewards', href: '/rewards' },
  { key: 'profile', label: 'Profile', href: '/profile' },
] as const
