import { USE_MOCK_DATA } from '@/config/env'
import {
  MOCK_USER,
  MOCK_MATCHES,
  MOCK_REWARDS,
  MOCK_LEADERBOARD,
  MOCK_TOKEN_LEDGER,
  MOCK_REDEMPTIONS,
  MOCK_PREDICTIONS,
} from '@/lib/mock/data'
import { sleep } from '@/lib/utils'
import type {
  User,
  Match,
  Reward,
  LeaderboardEntry,
  TokenLedger,
  Redemption,
  Prediction,
} from '@/types'

/**
 * Data service — the single seam between the UI and the backend.
 *
 * Phase 1 returns seeded mock data (with a tiny latency to exercise loading
 * states). Phase 2 swaps the bodies for real Supabase queries via the
 * repositories in `src/repositories`, keeping the same signatures so screens
 * never change.
 */

const LATENCY = 350

export async function getCurrentUser(): Promise<User> {
  if (USE_MOCK_DATA) {
    await sleep(LATENCY)
    return MOCK_USER
  }
  // Phase 2: const { userRepo } = await import('@/repositories/user-repo'); return userRepo.getCurrent()
  throw new Error('Live data layer not yet wired. Set NEXT_PUBLIC_USE_MOCK_DATA=true.')
}

export async function getMatches(): Promise<Match[]> {
  if (USE_MOCK_DATA) {
    await sleep(LATENCY)
    return MOCK_MATCHES
  }
  throw new Error('Live data layer not yet wired.')
}

export async function getPredictions(): Promise<Prediction[]> {
  if (USE_MOCK_DATA) {
    await sleep(LATENCY)
    return MOCK_PREDICTIONS
  }
  throw new Error('Live data layer not yet wired.')
}

export async function getRewards(): Promise<Reward[]> {
  if (USE_MOCK_DATA) {
    await sleep(LATENCY)
    return MOCK_REWARDS
  }
  throw new Error('Live data layer not yet wired.')
}

export async function getLeaderboard(): Promise<LeaderboardEntry[]> {
  if (USE_MOCK_DATA) {
    await sleep(LATENCY)
    return MOCK_LEADERBOARD
  }
  throw new Error('Live data layer not yet wired.')
}

export async function getTokenLedger(): Promise<TokenLedger[]> {
  if (USE_MOCK_DATA) {
    await sleep(LATENCY)
    return MOCK_TOKEN_LEDGER
  }
  throw new Error('Live data layer not yet wired.')
}

export async function getRedemptions(): Promise<Redemption[]> {
  if (USE_MOCK_DATA) {
    await sleep(LATENCY)
    return MOCK_REDEMPTIONS
  }
  throw new Error('Live data layer not yet wired.')
}
