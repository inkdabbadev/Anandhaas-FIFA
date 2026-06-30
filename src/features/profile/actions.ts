'use server'

import { createAdminClient } from '@/lib/supabase/server'

export type ProfileStatsResult = {
  ok: boolean
  message: string
  stats?: {
    points: number
    predictionsCount: number
    correctCount: number
  }
}

export async function loadProfileStats(userId?: string): Promise<ProfileStatsResult> {
  const id = userId?.trim()
  if (!id) return { ok: false, message: 'Missing user id.' }

  try {
    const admin = createAdminClient()
    const { data, error } = await admin
      .from('user_profiles')
      .select('points_balance,predictions_count,correct_predictions_count')
      .eq('id', id)
      .maybeSingle()

    if (error) return { ok: false, message: error.message }
    if (!data) return { ok: false, message: 'Profile was not found.' }

    return {
      ok: true,
      message: 'Profile stats loaded.',
      stats: {
        points: data.points_balance ?? 0,
        predictionsCount: data.predictions_count ?? 0,
        correctCount: data.correct_predictions_count ?? 0,
      },
    }
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : 'Could not load profile stats.',
    }
  }
}
