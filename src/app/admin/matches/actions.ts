'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/server'

export type CreateMatchState = {
  status: 'idle' | 'success' | 'error'
  message: string
}

export type PublishResultState = CreateMatchState

const initialState: CreateMatchState = {
  status: 'idle',
  message: '',
}

const CORRECT_PREDICTION_POINTS = 50

const stages = [
  'Round of 32',
  'Round of 16',
  'Quater-finals',
  'Semi-finals',
  'Third place play-off',
  'Final',
]

export async function createMatchAction(
  previousState: CreateMatchState = initialState,
  formData: FormData
): Promise<CreateMatchState> {
  void previousState

  const team1Id = String(formData.get('team1_id') ?? '').trim()
  const team2Id = String(formData.get('team2_id') ?? '').trim()
  const stage = String(formData.get('stage') ?? '').trim()
  const groupName = String(formData.get('group_name') ?? '').trim()
  const startsAtInput = String(formData.get('starts_at') ?? '').trim()
  const isActive = formData.get('is_active') === 'on'
  const isFeatured = formData.get('is_featured') === 'on'

  if (!team1Id || !team2Id) {
    return { status: 'error', message: 'Choose both teams.' }
  }

  if (team1Id === team2Id) {
    return { status: 'error', message: 'Team 1 and Team 2 must be different.' }
  }

  if (!stages.includes(stage)) {
    return { status: 'error', message: 'Choose a valid stage.' }
  }

  const startsAt = parseDateTime(startsAtInput)

  if (!startsAt) {
    return { status: 'error', message: 'Enter a valid match start time.' }
  }

  const predictionClosesAt = new Date(startsAt.getTime() - 24 * 60 * 60 * 1000)

  const admin = createAdminClient()
  const { error } = await admin.from('matches').insert({
    team1_id: team1Id,
    team2_id: team2Id,
    stage,
    group_name: groupName || null,
    starts_at: startsAt.toISOString(),
    prediction_closes_at: predictionClosesAt.toISOString(),
    status: 'scheduled',
    is_active: isActive,
    is_featured: isFeatured,
  })

  if (error) {
    return { status: 'error', message: error.message }
  }

  revalidatePath('/admin/matches')

  return { status: 'success', message: 'Match was added.' }
}

export async function publishMatchResultAction(
  previousState: PublishResultState = initialState,
  formData: FormData
): Promise<PublishResultState> {
  void previousState

  const matchId = String(formData.get('match_id') ?? '').trim()
  const team1Score = Number(String(formData.get('team1_score') ?? '').trim())
  const team2Score = Number(String(formData.get('team2_score') ?? '').trim())

  if (!matchId) return { status: 'error', message: 'Match id is missing.' }
  if (!Number.isInteger(team1Score) || team1Score < 0) {
    return { status: 'error', message: 'Enter a valid Team 1 score.' }
  }
  if (!Number.isInteger(team2Score) || team2Score < 0) {
    return { status: 'error', message: 'Enter a valid Team 2 score.' }
  }

  const winningPick = team1Score > team2Score ? 'team1' : team2Score > team1Score ? 'team2' : 'draw'
  const admin = createAdminClient()

  const { data: match, error: matchError } = await admin
    .from('matches')
    .select('id,points_processed')
    .eq('id', matchId)
    .maybeSingle()

  if (matchError) return { status: 'error', message: matchError.message }
  if (!match) return { status: 'error', message: 'Match was not found.' }
  if (match.points_processed) {
    return { status: 'error', message: 'Points were already processed for this match.' }
  }

  const { data: predictions, error: predictionError } = await admin
    .from('predictions')
    .select('id,user_id,pick,points_awarded')
    .eq('match_id', matchId)

  if (predictionError) return { status: 'error', message: predictionError.message }

  const now = new Date().toISOString()
  const predictionRows = predictions ?? []
  const correctRows = predictionRows.filter((prediction) => prediction.pick === winningPick)
  const wrongRows = predictionRows.filter((prediction) => prediction.pick !== winningPick)

  if (correctRows.length > 0) {
    const { error } = await admin
      .from('predictions')
      .update({
        is_correct: true,
        correct_points: CORRECT_PREDICTION_POINTS,
        total_points_awarded: CORRECT_PREDICTION_POINTS,
        points_awarded: true,
        updated_at: now,
      })
      .in(
        'id',
        correctRows.map((prediction) => prediction.id)
      )

    if (error) return { status: 'error', message: error.message }
  }

  if (wrongRows.length > 0) {
    const { error } = await admin
      .from('predictions')
      .update({
        is_correct: false,
        correct_points: 0,
        total_points_awarded: 0,
        points_awarded: true,
        updated_at: now,
      })
      .in(
        'id',
        wrongRows.map((prediction) => prediction.id)
      )

    if (error) return { status: 'error', message: error.message }
  }

  for (const prediction of correctRows.filter((row) => !row.points_awarded)) {
    const { data: profile, error: profileError } = await admin
      .from('user_profiles')
      .select('points_balance,correct_predictions_count')
      .eq('id', prediction.user_id)
      .maybeSingle()

    if (profileError) return { status: 'error', message: profileError.message }
    if (!profile) continue

    const { error: updateProfileError } = await admin
      .from('user_profiles')
      .update({
        points_balance: (profile.points_balance ?? 0) + CORRECT_PREDICTION_POINTS,
        correct_predictions_count: (profile.correct_predictions_count ?? 0) + 1,
        updated_at: now,
      })
      .eq('id', prediction.user_id)

    if (updateProfileError) return { status: 'error', message: updateProfileError.message }
  }

  const { error: updateMatchError } = await admin
    .from('matches')
    .update({
      team1_score: team1Score,
      team2_score: team2Score,
      winning_pick: winningPick,
      status: 'completed',
      result_published: true,
      points_processed: true,
      updated_at: now,
    })
    .eq('id', matchId)

  if (updateMatchError) return { status: 'error', message: updateMatchError.message }

  revalidatePath('/admin/matches')
  revalidatePath('/home')
  revalidatePath('/leaderboard')
  revalidatePath('/profile')

  return {
    status: 'success',
    message: `Result published. Correct predictions earned ${CORRECT_PREDICTION_POINTS} points.`,
  }
}

function parseDateTime(value: string): Date | null {
  if (!value) return null

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return date
}
