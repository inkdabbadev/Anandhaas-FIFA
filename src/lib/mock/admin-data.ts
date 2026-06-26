import { MOCK_MATCHES, MOCK_REWARDS, MOCK_LEADERBOARD } from './data'

/** Aggregate metrics for the admin dashboard (Phase 1 mock). */
export const ADMIN_STATS = {
  totalUsers: 1284,
  activeThisWeek: 612,
  predictionsToday: 348,
  tokensIssued: 18420,
  tokensRedeemed: 7310,
  revenueInr: 264500,
  pendingResults: MOCK_MATCHES.filter((m) => m.status === 'live' || m.status === 'upcoming').length,
}

export const ADMIN_USERS = MOCK_LEADERBOARD.map((u, i) => ({
  id: u.user_id,
  name: u.name ?? 'Unknown',
  phone: `+91 9${(800000000 + i * 111111).toString().slice(0, 9)}`,
  tier: u.tier,
  seasonPoints: u.points,
  tokenBalance: 120 + i * 35,
  predictions: u.correct_predictions + 3,
  joined: `2026-06-${(11 + i).toString().padStart(2, '0')}`,
}))

export const ADMIN_PURCHASES = [
  { id: 'pur_9', user: 'Rajesh Kumar', source: 'POS', amount: 350, tokens: 3, at: '2026-06-26 14:20' },
  { id: 'pur_8', user: 'Priya Sundaram', source: 'Online', amount: 880, tokens: 8, at: '2026-06-26 12:05' },
  { id: 'pur_7', user: 'Vikram Rajan', source: 'POS', amount: 220, tokens: 2, at: '2026-06-26 11:40' },
  { id: 'pur_6', user: 'Meena Iyer', source: 'CSV Import', amount: 1500, tokens: 15, at: '2026-06-25 18:30' },
  { id: 'pur_5', user: 'Suresh Nair', source: 'POS', amount: 410, tokens: 4, at: '2026-06-25 16:10' },
]

export const ADMIN_REDEMPTIONS = [
  { id: 'red_3', user: 'Priya Sundaram', reward: 'FIFA Mithai Box', qr: 'ANDH-RED-J3K9-PP21', status: 'active', at: '2026-06-26 10:00' },
  { id: 'red_2', user: 'Meena Iyer', reward: 'Free Ghee Mysore Pak 200g', qr: 'ANDH-RED-9XLM-2QW8', status: 'redeemed', at: '2026-06-24 19:22' },
  { id: 'red_1', user: 'Rajesh Kumar', reward: '10% off next order', qr: 'ANDH-RED-7KQ2-M9XP', status: 'active', at: '2026-06-23 15:40' },
]

export { MOCK_MATCHES as ADMIN_MATCHES, MOCK_REWARDS as ADMIN_REWARDS }
