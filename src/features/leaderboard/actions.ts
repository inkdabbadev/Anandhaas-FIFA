'use server'

import { POINTS } from '@/constants'
import { env, USE_MOCK_DATA } from '@/config/env'
import { MOCK_LEADERBOARD } from '@/lib/mock/data'
import { createAdminClient, createClient } from '@/lib/supabase/server'
import type { LeaderboardEntry } from '@/types'

type UserProfileRankRow = {
  id: string
  name: string | null
  points_balance: number | null
  predictions_count: number | null
  correct_predictions_count: number | null
  is_active: boolean | null
  registered_at: string | null
}

export type LeaderboardResult = {
  ok: boolean
  message: string
  entries: LeaderboardEntry[]
}

export async function loadLeaderboardEntries(): Promise<LeaderboardResult> {
  if (USE_MOCK_DATA) {
    return {
      ok: true,
      message: 'Rankings loaded.',
      entries: rankEntries(
        MOCK_LEADERBOARD.map((entry) => ({
          ...entry,
          points: entry.correct_predictions * POINTS.CORRECT,
          is_me: false,
        }))
      ),
    }
  }

  try {
    const supabase = env.supabaseServiceKey ? createAdminClient() : await createClient()
    const { data, error } = await supabase
      .from('user_profiles')
      .select('id,name,points_balance,predictions_count,correct_predictions_count,is_active,registered_at')
      .eq('is_active', true)
      .order('correct_predictions_count', { ascending: false })
      .order('points_balance', { ascending: false })
      .order('registered_at', { ascending: true })

    if (error) {
      return { ok: false, message: error.message, entries: [] }
    }

    return {
      ok: true,
      message: 'Rankings loaded.',
      entries: rankEntries(((data ?? []) as UserProfileRankRow[]).map(toLeaderboardEntry)),
    }
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : 'Could not load rankings.',
      entries: [],
    }
  }
}

function toLeaderboardEntry(row: UserProfileRankRow): LeaderboardEntry {
  const correctPredictions = row.correct_predictions_count ?? 0

  return {
    rank: 0,
    user_id: row.id,
    name: row.name || 'Predictor',
    avatar_url: null,
    points: correctPredictions * POINTS.CORRECT,
    correct_predictions: correctPredictions,
    exact_scores: row.predictions_count ?? 0,
  }
}

function rankEntries(entries: LeaderboardEntry[]): LeaderboardEntry[] {
  return [...entries]
    .sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points
      if (b.correct_predictions !== a.correct_predictions) {
        return b.correct_predictions - a.correct_predictions
      }
      return (a.name ?? '').localeCompare(b.name ?? '')
    })
    .map((entry, index) => ({ ...entry, rank: index + 1 }))
}
