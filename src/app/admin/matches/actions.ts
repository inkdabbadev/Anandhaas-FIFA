'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/server'

export type CreateMatchState = {
  status: 'idle' | 'success' | 'error'
  message: string
}

const initialState: CreateMatchState = {
  status: 'idle',
  message: '',
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

  revalidatePath('/admin/matches')

  return { status: 'success', message: 'Match was added.' }
}

function parseDateTime(value: string): Date | null {
  if (!value) return null

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return date
}
