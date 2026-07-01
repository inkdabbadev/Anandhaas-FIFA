'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/server'
import { sendMatchResultWhatsAppMessages } from '@/services/whatsapp-service'

export type CreateMatchState = {
  status: 'idle' | 'success' | 'error'
  message: string
}

export type PublishResultState = CreateMatchState
export type RevokeResultState = CreateMatchState
export type CancelMatchState = CreateMatchState

const initialState: CreateMatchState = {
  status: 'idle',
  message: '',
}

const CORRECT_PREDICTION_POINTS = 50

type ResultPick = 'team1' | 'draw' | 'team2'

type TeamLabelRow = {
  id: string
  name: string
}

type ResultMatchRow = {
  id: string
  status: string
  points_processed: boolean
  team1: TeamLabelRow | TeamLabelRow[] | null
  team2: TeamLabelRow | TeamLabelRow[] | null
}

type PredictionRow = {
  id: string
  user_id: string
  pick: ResultPick
  points_awarded: boolean | null
}

type RevokePredictionRow = {
  id: string
  user_id: string
  is_correct: boolean | null
  total_points_awarded: number | null
}

type UserProfileRow = {
  id: string
  phone: string | null
  name: string | null
}

type UserPointsRow = {
  points_balance: number | null
  correct_predictions_count: number | null
}

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

  revalidatePath('/dev/matches')

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
  const selectedWinningPick = String(formData.get('winning_pick') ?? '').trim()

  if (!matchId) return { status: 'error', message: 'Match id is missing.' }
  if (!Number.isInteger(team1Score) || team1Score < 0) {
    return { status: 'error', message: 'Enter a valid Team 1 score.' }
  }
  if (!Number.isInteger(team2Score) || team2Score < 0) {
    return { status: 'error', message: 'Enter a valid Team 2 score.' }
  }

  const winningPick = resolveWinningPick(team1Score, team2Score, selectedWinningPick)
  if (!winningPick) {
    return { status: 'error', message: 'Choose the winning team when both teams have the same goals.' }
  }

  const admin = createAdminClient()

  const { data: match, error: matchError } = await admin
    .from('matches')
    .select(
      'id,status,points_processed,team1:teams!matches_team1_id_fkey(id,name),team2:teams!matches_team2_id_fkey(id,name)'
    )
    .eq('id', matchId)
    .maybeSingle()

  if (matchError) return { status: 'error', message: matchError.message }
  if (!match) return { status: 'error', message: 'Match was not found.' }
  if (match.status === 'cancelled') {
    return { status: 'error', message: 'Cancelled matches cannot publish results.' }
  }
  if (match.points_processed) {
    return { status: 'error', message: 'Points were already processed for this match.' }
  }

  const { data: predictions, error: predictionError } = await admin
    .from('predictions')
    .select('id,user_id,pick,points_awarded')
    .eq('match_id', matchId)

  if (predictionError) return { status: 'error', message: predictionError.message }

  const now = new Date().toISOString()
  const predictionRows = (predictions ?? []) as PredictionRow[]
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

  const whatsappSummary = await sendResultNotifications({
    admin,
    match: match as ResultMatchRow,
    predictions: predictionRows,
    winningPick,
  })

  revalidateResultPaths()

  return {
    status: 'success',
    message: `Result published. Correct predictions earned ${CORRECT_PREDICTION_POINTS} points. ${whatsappSummary.message}`,
  }
}

export async function revokeMatchResultAction(
  previousState: RevokeResultState = initialState,
  formData: FormData
): Promise<RevokeResultState> {
  void previousState

  const matchId = String(formData.get('match_id') ?? '').trim()
  if (!matchId) return { status: 'error', message: 'Match id is missing.' }

  const admin = createAdminClient()
  const { data: match, error: matchError } = await admin
    .from('matches')
    .select('id,status,points_processed')
    .eq('id', matchId)
    .maybeSingle()

  if (matchError) return { status: 'error', message: matchError.message }
  if (!match) return { status: 'error', message: 'Match was not found.' }
  if (!match.points_processed) {
    return { status: 'error', message: 'This match does not have processed points.' }
  }
  if (match.status === 'cancelled') {
    return { status: 'error', message: 'Cancelled matches do not have a result to revoke.' }
  }

  const { data: predictions, error: predictionError } = await admin
    .from('predictions')
    .select('id,user_id,is_correct,total_points_awarded')
    .eq('match_id', matchId)

  if (predictionError) return { status: 'error', message: predictionError.message }

  const predictionRows = (predictions ?? []) as RevokePredictionRow[]
  const rollbackByUser = buildRollbackByUser(predictionRows)
  const now = new Date().toISOString()

  for (const [userId, rollback] of rollbackByUser) {
    const { data: profile, error: profileError } = await admin
      .from('user_profiles')
      .select('points_balance,correct_predictions_count')
      .eq('id', userId)
      .maybeSingle()

    if (profileError) return { status: 'error', message: profileError.message }
    if (!profile) continue

    const userProfile = profile as UserPointsRow
    const { error: updateProfileError } = await admin
      .from('user_profiles')
      .update({
        points_balance: (userProfile.points_balance ?? 0) - rollback.points,
        correct_predictions_count: Math.max(
          0,
          (userProfile.correct_predictions_count ?? 0) - rollback.correctCount
        ),
        updated_at: now,
      })
      .eq('id', userId)

    if (updateProfileError) return { status: 'error', message: updateProfileError.message }
  }

  const { error: resetPredictionsError } = await admin
    .from('predictions')
    .update({
      is_correct: null,
      correct_points: 0,
      total_points_awarded: 0,
      points_awarded: false,
      updated_at: now,
    })
    .eq('match_id', matchId)

  if (resetPredictionsError) return { status: 'error', message: resetPredictionsError.message }

  const { error: resetMatchError } = await admin
    .from('matches')
    .update({
      team1_score: null,
      team2_score: null,
      winning_pick: null,
      status: 'scheduled',
      result_published: false,
      points_processed: false,
      updated_at: now,
    })
    .eq('id', matchId)

  if (resetMatchError) return { status: 'error', message: resetMatchError.message }

  revalidateResultPaths()

  return {
    status: 'success',
    message: `Result revoked. Recovered ${sumRollbackPoints(rollbackByUser)} issued points from ${rollbackByUser.size} winner(s).`,
  }
}

export async function cancelMatchAction(
  previousState: CancelMatchState = initialState,
  formData: FormData
): Promise<CancelMatchState> {
  void previousState

  const matchId = String(formData.get('match_id') ?? '').trim()
  if (!matchId) return { status: 'error', message: 'Match id is missing.' }

  const admin = createAdminClient()
  const { data: match, error: matchError } = await admin
    .from('matches')
    .select('id,status,points_processed')
    .eq('id', matchId)
    .maybeSingle()

  if (matchError) return { status: 'error', message: matchError.message }
  if (!match) return { status: 'error', message: 'Match was not found.' }
  if (match.status === 'cancelled') return { status: 'success', message: 'Match is already cancelled.' }
  if (match.status === 'completed' || match.points_processed) {
    return { status: 'error', message: 'This match already has processed points.' }
  }

  const { error: updateError } = await admin
    .from('matches')
    .update({
      status: 'cancelled',
      team1_score: null,
      team2_score: null,
      winning_pick: null,
      result_published: false,
      points_processed: true,
      updated_at: new Date().toISOString(),
    })
    .eq('id', matchId)

  if (updateError) return { status: 'error', message: updateError.message }

  revalidatePath('/dev/matches')
  revalidatePath('/home')

  return { status: 'success', message: 'Match cancelled.' }
}

function resolveWinningPick(
  team1Score: number,
  team2Score: number,
  selectedWinningPick: string
): 'team1' | 'team2' | null {
  if (team1Score > team2Score) return 'team1'
  if (team2Score > team1Score) return 'team2'
  if (selectedWinningPick === 'team1' || selectedWinningPick === 'team2') {
    return selectedWinningPick
  }
  return null
}

function buildRollbackByUser(predictions: RevokePredictionRow[]) {
  const rollbackByUser = new Map<string, { points: number; correctCount: number }>()

  for (const prediction of predictions) {
    const awardedPoints = prediction.total_points_awarded ?? 0
    if (prediction.is_correct !== true || awardedPoints <= 0) continue

    const current = rollbackByUser.get(prediction.user_id) ?? { points: 0, correctCount: 0 }
    current.points += awardedPoints
    current.correctCount += 1
    rollbackByUser.set(prediction.user_id, current)
  }

  return rollbackByUser
}

function sumRollbackPoints(rollbackByUser: Map<string, { points: number; correctCount: number }>) {
  let total = 0
  for (const rollback of rollbackByUser.values()) {
    total += rollback.points
  }
  return total
}

function revalidateResultPaths() {
  revalidatePath('/admin')
  revalidatePath('/dev/matches')
  revalidatePath('/home')
  revalidatePath('/leaderboard')
  revalidatePath('/profile')
}

async function sendResultNotifications(input: {
  admin: ReturnType<typeof createAdminClient>
  match: ResultMatchRow
  predictions: PredictionRow[]
  winningPick: 'team1' | 'team2'
}) {
  if (input.predictions.length === 0) {
    return {
      ok: true,
      sent: 0,
      failed: 0,
      skipped: 0,
      message: 'No participants to notify.',
    }
  }

  const team1 = firstTeam(input.match.team1)
  const team2 = firstTeam(input.match.team2)
  const winnerName = input.winningPick === 'team1' ? (team1?.name ?? 'Team 1') : (team2?.name ?? 'Team 2')
  const userIds = Array.from(new Set(input.predictions.map((prediction) => prediction.user_id)))

  const { data: profiles, error } = await input.admin
    .from('user_profiles')
    .select('id,phone,name')
    .in('id', userIds)

  if (error) {
    console.error('[WHATSAPP_PROFILE_LOOKUP_FAILED]', error)
    return {
      ok: false,
      sent: 0,
      failed: 0,
      skipped: input.predictions.length,
      message: 'WhatsApp skipped because participant phone numbers could not be loaded.',
    }
  }

  const profileById = new Map(
    ((profiles ?? []) as UserProfileRow[]).map((profile) => [profile.id, profile])
  )

  return sendMatchResultWhatsAppMessages({
    winnerName,
    points: CORRECT_PREDICTION_POINTS,
    recipients: input.predictions.map((prediction) => {
      const profile = profileById.get(prediction.user_id)
      return {
        phone: profile?.phone ?? '',
        name: profile?.name ?? 'Predictor',
        pickName:
          prediction.pick === 'team1'
            ? (team1?.name ?? 'Team 1')
            : prediction.pick === 'team2'
              ? (team2?.name ?? 'Team 2')
              : 'Draw',
        didWin: prediction.pick === input.winningPick,
      }
    }),
  })
}

function firstTeam(team: TeamLabelRow | TeamLabelRow[] | null): TeamLabelRow | null {
  if (Array.isArray(team)) return team[0] ?? null
  return team
}

function parseDateTime(value: string): Date | null {
  if (!value) return null

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return date
}
