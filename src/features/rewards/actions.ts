'use server'

import { randomInt } from 'node:crypto'
import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/server'
import type { Reward } from '@/types'

export type RewardClaim = {
  id: string
  user_id: string
  offer_id: string
  offerTitle: string
  offerIcon: string
  pointsCost: number
  status: 'pending' | 'redeemed' | 'cancelled' | 'expired'
  code: string
  createdAt: string
  redeemedAt: string | null
}

type UserStats = {
  points: number
  predictionsCount: number
  correctCount: number
}

const COUPON_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
const COUPON_CODE_LENGTH = 10
const COUPON_CODE_ATTEMPTS = 5

export type RewardsDataResult = {
  ok: boolean
  message: string
  offers: Reward[]
  claims: RewardClaim[]
  userStats?: UserStats
}

type RewardOfferRow = {
  id: string
  slug: string
  title: string
  description: string | null
  icon: string | null
  points_cost: number
  inventory: number | null
  is_active: boolean
  expires_at: string | null
  created_at: string
}

type RewardClaimRow = {
  id: string
  user_id: string
  offer_id: string
  offer_title: string
  offer_icon: string | null
  points_cost: number
  status: RewardClaim['status']
  code: string
  created_at: string
  redeemed_at: string | null
}

export async function loadRewardsData(userId?: string): Promise<RewardsDataResult> {
  try {
    const admin = createAdminClient()
    const [offersResult, claimsResult, statsResult] = await Promise.all([
      admin
        .from('reward_offers')
        .select('id,slug,title,description,icon,points_cost,inventory,is_active,expires_at,created_at')
        .eq('is_active', true)
        .order('points_cost', { ascending: true })
        .order('created_at', { ascending: false }),
      userId
        ? admin
            .from('reward_claims')
            .select('id,user_id,offer_id,offer_title,offer_icon,points_cost,status,code,created_at,redeemed_at')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
        : Promise.resolve({ data: [], error: null }),
      userId ? loadUserStats(userId) : Promise.resolve(undefined),
    ])

    if (offersResult.error) return emptyRewards(offersResult.error.message)
    if (claimsResult.error) return emptyRewards(claimsResult.error.message)

    return {
      ok: true,
      message: 'Rewards loaded.',
      offers: ((offersResult.data ?? []) as RewardOfferRow[]).map(toReward),
      claims: ((claimsResult.data ?? []) as RewardClaimRow[]).map(toClaim),
      userStats: statsResult,
    }
  } catch (error) {
    return emptyRewards(error instanceof Error ? error.message : 'Could not load rewards.')
  }
}

export async function claimRewardAction(input: {
  userId?: string
  offerId: string
}): Promise<RewardsDataResult> {
  const userId = input.userId?.trim()
  const offerId = input.offerId.trim()

  if (!userId) return emptyRewards('Please login again before claiming.')
  if (!offerId) return emptyRewards('Choose a valid reward.')

  try {
    const admin = createAdminClient()
    const [{ data: offer, error: offerError }, { data: profile, error: profileError }] =
      await Promise.all([
        admin
          .from('reward_offers')
          .select('id,title,icon,points_cost,inventory,is_active,expires_at')
          .eq('id', offerId)
          .maybeSingle(),
        admin
          .from('user_profiles')
          .select('points_balance')
          .eq('id', userId)
          .maybeSingle(),
      ])

    if (offerError) return emptyRewards(offerError.message)
    if (profileError) return emptyRewards(profileError.message)
    if (!offer || !offer.is_active) return emptyRewards('This reward is not available.')
    if (offer.expires_at && new Date(offer.expires_at).getTime() <= Date.now()) {
      return emptyRewards('This reward has expired.')
    }
    if (offer.inventory !== null && offer.inventory <= 0) {
      return emptyRewards('This reward is out of stock.')
    }
    if (!profile) return emptyRewards('Please login again before claiming.')
    if ((profile.points_balance ?? 0) < offer.points_cost) {
      return emptyRewards('Not enough points yet. Predict more matches.')
    }

    const now = new Date().toISOString()
    const nextBalance = (profile.points_balance ?? 0) - offer.points_cost

    const insertResult = await insertRewardClaimWithUniqueCode({
      userId,
      offerId,
      offerTitle: offer.title,
      offerIcon: offer.icon,
      pointsCost: offer.points_cost,
    })

    if (!insertResult.ok) {
      return emptyRewards(insertResult.message)
    }

    const { error: balanceError } = await admin
      .from('user_profiles')
      .update({ points_balance: nextBalance, updated_at: now })
      .eq('id', userId)

    if (balanceError) {
      return emptyRewards(balanceError.message)
    }

    revalidatePath('/rewards')
    revalidatePath('/home')
    revalidatePath('/profile')
    return loadRewardsData(userId)
  } catch (error) {
    return emptyRewards(error instanceof Error ? error.message : 'Could not claim this reward.')
  }
}

export async function redeemRewardClaimAction(claimId: string): Promise<RewardsDataResult> {
  const id = claimId.trim()
  if (!id) return emptyRewards('Claim id is missing.')

  try {
    const admin = createAdminClient()
    const { data: claim, error: claimError } = await admin
      .from('reward_claims')
      .select('id,user_id,offer_id,points_cost,status')
      .eq('id', id)
      .maybeSingle()

    if (claimError) return emptyRewards(claimError.message)
    if (!claim) return emptyRewards('Claim was not found.')
    if (claim.status !== 'pending') return emptyRewards('Only ready rewards can be redeemed.')

    const { data: offer, error: offerError } = await admin
      .from('reward_offers')
      .select('inventory')
      .eq('id', claim.offer_id)
      .maybeSingle()

    if (offerError) return emptyRewards(offerError.message)
    if (!offer) return emptyRewards('Reward offer was not found.')
    if (offer.inventory !== null && offer.inventory <= 0) {
      return emptyRewards('This reward is out of stock.')
    }

    const now = new Date().toISOString()

    if (offer.inventory !== null) {
      const { error: inventoryError } = await admin
        .from('reward_offers')
        .update({ inventory: offer.inventory - 1, updated_at: now })
        .eq('id', claim.offer_id)

      if (inventoryError) return emptyRewards(inventoryError.message)
    }

    const { error: redeemError } = await admin
      .from('reward_claims')
      .update({ status: 'redeemed', redeemed_at: now, updated_at: now })
      .eq('id', claim.id)

    if (redeemError) return emptyRewards(redeemError.message)

    revalidatePath('/rewards')
    revalidatePath('/home')
    revalidatePath('/profile')
    return loadRewardsData(claim.user_id)
  } catch (error) {
    return emptyRewards(error instanceof Error ? error.message : 'Could not redeem this reward.')
  }
}

async function loadUserStats(userId: string): Promise<UserStats | undefined> {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('user_profiles')
    .select('points_balance,predictions_count,correct_predictions_count')
    .eq('id', userId)
    .maybeSingle()

  if (error || !data) return undefined

  return {
    points: data.points_balance ?? 0,
    predictionsCount: data.predictions_count ?? 0,
    correctCount: data.correct_predictions_count ?? 0,
  }
}

async function insertRewardClaimWithUniqueCode(input: {
  userId: string
  offerId: string
  offerTitle: string
  offerIcon: string | null
  pointsCost: number
}): Promise<{ ok: true } | { ok: false; message: string }> {
  const admin = createAdminClient()

  for (let attempt = 0; attempt < COUPON_CODE_ATTEMPTS; attempt += 1) {
    const { error } = await admin.from('reward_claims').insert({
      user_id: input.userId,
      offer_id: input.offerId,
      offer_title: input.offerTitle,
      offer_icon: input.offerIcon,
      points_cost: input.pointsCost,
      status: 'pending',
      code: createCouponCode(),
    })

    if (!error) return { ok: true }
    if (error.code !== '23505') return { ok: false, message: error.message }
  }

  return {
    ok: false,
    message: 'Could not create a unique coupon code. Please try again.',
  }
}

function createCouponCode(): string {
  let code = ''
  for (let index = 0; index < COUPON_CODE_LENGTH; index += 1) {
    code += COUPON_CODE_ALPHABET[randomInt(COUPON_CODE_ALPHABET.length)]
  }
  return code
}

function toReward(row: RewardOfferRow): Reward {
  return {
    id: row.id,
    campaign_id: null,
    title: row.title,
    description: row.description ?? '',
    icon: row.icon ?? 'Gift',
    points_cost: row.points_cost,
    inventory: row.inventory,
    is_active: row.is_active,
    expires_at: row.expires_at,
    created_at: row.created_at,
  }
}

function toClaim(row: RewardClaimRow): RewardClaim {
  return {
    id: row.id,
    user_id: row.user_id,
    offer_id: row.offer_id,
    offerTitle: row.offer_title,
    offerIcon: row.offer_icon ?? 'Gift',
    pointsCost: row.points_cost,
    status: row.status,
    code: row.code,
    createdAt: row.created_at,
    redeemedAt: row.redeemed_at,
  }
}

function emptyRewards(message: string): RewardsDataResult {
  return {
    ok: false,
    message,
    offers: [],
    claims: [],
  }
}
