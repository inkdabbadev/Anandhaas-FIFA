'use server'

import { createAdminClient } from '@/lib/supabase/server'
import { DEFAULT_CAMPAIGN } from '@/config/campaign'
import type { Match, MatchStatus } from '@/types'

type UiPick = 'home' | 'draw' | 'away'

type TeamRow = {
  id: string
  name: string
  code: string
  flag_url: string | null
  flag_api: string | null
}

type MatchRow = {
  id: string
  stage: string | null
  group_name: string | null
  starts_at: string
  prediction_closes_at: string
  status: 'scheduled' | 'live' | 'completed' | 'cancelled'
  team1_score: number | null
  team2_score: number | null
  is_active: boolean
  created_at: string
  team1: TeamRow | TeamRow[] | null
  team2: TeamRow | TeamRow[] | null
}

type PredictionRow = {
  match_id: string
  pick: 'team1' | 'draw' | 'team2'
  is_correct: boolean | null
  total_points_awarded: number
  created_at: string
}

type UserStats = {
  points: number
  predictionsCount: number
  correctCount: number
}

export type MatchFeedResult = {
  ok: boolean
  message: string
  matches: Match[]
  predictions: Record<
    string,
    {
      matchId: string
      pick: UiPick
      label: string
      status: 'pending' | 'won' | 'lost'
      pointsEarned: number
      createdAt: string
    }
  >
}

export type SavePredictionResult = {
  ok: boolean
  message: string
  pointsAwarded?: number
  stats?: UserStats
}

export async function loadMatchFeed(userId?: string): Promise<MatchFeedResult> {
  try {
    const admin = createAdminClient()
    const { data, error } = await admin
      .from('matches')
      .select(
        'id,stage,group_name,starts_at,prediction_closes_at,status,team1_score,team2_score,is_active,created_at,team1:teams!matches_team1_id_fkey(id,name,code,flag_url,flag_api),team2:teams!matches_team2_id_fkey(id,name,code,flag_url,flag_api)'
      )
      .eq('is_active', true)
      .order('display_order', { ascending: true })
      .order('starts_at', { ascending: true })

    if (error) {
      return emptyFeed(error.message)
    }

    const matches = ((data ?? []) as MatchRow[]).map(toUiMatch).filter(Boolean) as Match[]
    const predictions = userId ? await loadUserPredictions(userId, matches) : {}

    return { ok: true, message: 'Matches loaded.', matches, predictions }
  } catch (error) {
    return emptyFeed(error instanceof Error ? error.message : 'Could not load matches.')
  }
}

export async function savePrediction(input: {
  userId?: string
  matchId: string
  pick: UiPick
}): Promise<SavePredictionResult> {
  const userId = input.userId?.trim()
  const matchId = input.matchId.trim()
  const dbPick = toDbPick(input.pick)

  if (!userId) return { ok: false, message: 'Please login again before predicting.' }
  if (!matchId || !dbPick) return { ok: false, message: 'Choose a valid prediction.' }

  try {
    const admin = createAdminClient()
    const { data: match, error: matchError } = await admin
      .from('matches')
      .select('id,status,prediction_closes_at,is_active')
      .eq('id', matchId)
      .maybeSingle()

    if (matchError) return { ok: false, message: matchError.message }
    if (!match || !match.is_active) return { ok: false, message: 'This match is not available.' }
    if (match.status !== 'scheduled') return { ok: false, message: 'Predictions are closed for this match.' }
    if (new Date(match.prediction_closes_at).getTime() <= Date.now()) {
      return { ok: false, message: 'Predictions are closed for this match.' }
    }

    const { error: insertError } = await admin.from('predictions').insert({
      user_id: userId,
      match_id: matchId,
      pick: dbPick,
      participation_points: 0,
      correct_points: 0,
      total_points_awarded: 0,
      points_awarded: false,
    })

    if (insertError) {
      if (insertError.code === '23505') {
        return { ok: false, message: 'You have already predicted this match.' }
      }
      return { ok: false, message: insertError.message }
    }

    const stats = await incrementPredictionCount(userId)
    return {
      ok: true,
      message: 'Prediction locked.',
      pointsAwarded: 0,
      stats,
    }
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : 'Could not save prediction.',
    }
  }
}

async function loadUserPredictions(userId: string, matches: MatchFeedResult['matches']) {
  if (matches.length === 0) return {}

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('predictions')
    .select('match_id,pick,is_correct,total_points_awarded,created_at')
    .eq('user_id', userId)
    .in(
      'match_id',
      matches.map((match) => match.id)
    )

  if (error) return {}

  const matchById = new Map(matches.map((match) => [match.id, match]))
  return ((data ?? []) as PredictionRow[]).reduce<MatchFeedResult['predictions']>((acc, row) => {
    const match = matchById.get(row.match_id)
    if (!match) return acc

    const pick = toUiPick(row.pick)
    acc[row.match_id] = {
      matchId: row.match_id,
      pick,
      label: pick === 'home' ? match.home_team.name : pick === 'away' ? match.away_team.name : 'Draw',
      status: row.is_correct == null ? 'pending' : row.is_correct ? 'won' : 'lost',
      pointsEarned: row.total_points_awarded ?? 0,
      createdAt: row.created_at,
    }
    return acc
  }, {})
}

async function incrementPredictionCount(userId: string): Promise<UserStats | undefined> {
  const admin = createAdminClient()
  const { data: profile, error: readError } = await admin
    .from('user_profiles')
    .select('points_balance,predictions_count,correct_predictions_count')
    .eq('id', userId)
    .maybeSingle()

  if (readError || !profile) return undefined

  const nextStats = {
    points_balance: profile.points_balance ?? 0,
    predictions_count: (profile.predictions_count ?? 0) + 1,
    correct_predictions_count: profile.correct_predictions_count ?? 0,
    updated_at: new Date().toISOString(),
  }

  const { data: updated, error: updateError } = await admin
    .from('user_profiles')
    .update(nextStats)
    .eq('id', userId)
    .select('points_balance,predictions_count,correct_predictions_count')
    .single()

  if (updateError || !updated) return undefined

  return {
    points: updated.points_balance ?? 0,
    predictionsCount: updated.predictions_count ?? 0,
    correctCount: updated.correct_predictions_count ?? 0,
  }
}

function toUiMatch(row: MatchRow): Match | null {
  const team1 = firstTeam(row.team1)
  const team2 = firstTeam(row.team2)
  if (!team1 || !team2) return null

  return {
    id: row.id,
    campaign_id: DEFAULT_CAMPAIGN.id,
    home_team: {
      name: team1.name,
      flag: team1.flag_api || team1.flag_url || '',
      flagFallback: team1.flag_api ? team1.flag_url : null,
      ranking: team1.code,
    },
    away_team: {
      name: team2.name,
      flag: team2.flag_api || team2.flag_url || '',
      flagFallback: team2.flag_api ? team2.flag_url : null,
      ranking: team2.code,
    },
    competition: DEFAULT_CAMPAIGN.name,
    group_name: row.group_name || row.stage,
    kickoff_at: row.starts_at,
    prediction_closes_at: row.prediction_closes_at,
    token_cost: 0,
    status: toUiStatus(row.status),
    home_score: row.team1_score,
    away_score: row.team2_score,
    first_scorer_team: null,
    venue: null,
    created_at: row.created_at,
  }
}

function firstTeam(team: TeamRow | TeamRow[] | null): TeamRow | null {
  if (Array.isArray(team)) return team[0] ?? null
  return team
}

function toUiStatus(status: MatchRow['status']): MatchStatus {
  if (status === 'live') return 'live'
  if (status === 'completed') return 'finished'
  if (status === 'cancelled') return 'cancelled'
  return 'upcoming'
}

function toDbPick(pick: UiPick): PredictionRow['pick'] | null {
  if (pick === 'home') return 'team1'
  if (pick === 'away') return 'team2'
  if (pick === 'draw') return 'draw'
  return null
}

function toUiPick(pick: PredictionRow['pick']): UiPick {
  if (pick === 'team1') return 'home'
  if (pick === 'team2') return 'away'
  return 'draw'
}

function emptyFeed(message: string): MatchFeedResult {
  return {
    ok: false,
    message,
    matches: [],
    predictions: {},
  }
}
