'use server'

import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'
import { ADMIN_AUTH_COOKIE, ADMIN_AUTH_VALUE } from '@/lib/admin-auth'
import { createAdminClient } from '@/lib/supabase/server'

export type RedeemCouponState = {
  status: 'idle' | 'success' | 'error'
  message: string
  claim?: {
    code: string
    offerTitle: string
    customerName: string
    phone: string
    pointsCost: number
    redeemedAt: string
  }
}

const initialState: RedeemCouponState = {
  status: 'idle',
  message: '',
}

type ProfileRow = {
  id: string
  phone: string
  name: string | null
}

type RewardClaimRow = {
  id: string
  user_id: string
  offer_id: string
  offer_title: string
  points_cost: number
  status: 'pending' | 'redeemed' | 'cancelled' | 'expired'
  code: string
  redeemed_at: string | null
}

type RewardOfferRow = {
  inventory: number | null
}

export async function redeemCouponAction(
  previousState: RedeemCouponState = initialState,
  formData: FormData
): Promise<RedeemCouponState> {
  void previousState

  const cookieStore = await cookies()
  const authenticated = cookieStore.get(ADMIN_AUTH_COOKIE)?.value === ADMIN_AUTH_VALUE
  if (!authenticated) {
    return { status: 'error', message: 'Admin login required.' }
  }

  const phone = normalizePhone(String(formData.get('phone') ?? ''))
  const code = normalizeCode(String(formData.get('code') ?? ''))

  if (!phone) {
    return { status: 'error', message: 'Enter a valid 10-digit customer phone number.' }
  }
  if (!code) {
    return { status: 'error', message: 'Enter a valid coupon code.' }
  }

  try {
    const admin = createAdminClient()
    const { data: profile, error: profileError } = await admin
      .from('user_profiles')
      .select('id,phone,name')
      .eq('phone', phone)
      .maybeSingle()

    if (profileError) return { status: 'error', message: profileError.message }
    if (!profile) return { status: 'error', message: 'No user found for this phone number.' }

    const customer = profile as ProfileRow
    const { data: claim, error: claimError } = await admin
      .from('reward_claims')
      .select('id,user_id,offer_id,offer_title,points_cost,status,code,redeemed_at')
      .eq('user_id', customer.id)
      .eq('code', code)
      .maybeSingle()

    if (claimError) return { status: 'error', message: claimError.message }
    if (!claim) {
      return { status: 'error', message: 'This coupon code is not available for that user.' }
    }

    const rewardClaim = claim as RewardClaimRow
    if (rewardClaim.status === 'redeemed') {
      return {
        status: 'error',
        message: `This coupon was already redeemed${rewardClaim.redeemed_at ? ` on ${formatDateTime(rewardClaim.redeemed_at)}` : ''}.`,
      }
    }
    if (rewardClaim.status !== 'pending') {
      return { status: 'error', message: `This coupon is ${rewardClaim.status} and cannot be redeemed.` }
    }

    const { data: offer, error: offerError } = await admin
      .from('reward_offers')
      .select('inventory')
      .eq('id', rewardClaim.offer_id)
      .maybeSingle()

    if (offerError) return { status: 'error', message: offerError.message }
    if (!offer) return { status: 'error', message: 'Reward offer was not found.' }

    const rewardOffer = offer as RewardOfferRow
    const now = new Date().toISOString()

    if (rewardOffer.inventory !== null) {
      if (rewardOffer.inventory <= 0) {
        return { status: 'error', message: 'This reward is out of stock.' }
      }

      const { error: inventoryError } = await admin
        .from('reward_offers')
        .update({ inventory: rewardOffer.inventory - 1, updated_at: now })
        .eq('id', rewardClaim.offer_id)

      if (inventoryError) return { status: 'error', message: inventoryError.message }
    }

    const { error: redeemError } = await admin
      .from('reward_claims')
      .update({ status: 'redeemed', redeemed_at: now, updated_at: now })
      .eq('id', rewardClaim.id)

    if (redeemError) return { status: 'error', message: redeemError.message }

    revalidatePath('/admin')
    revalidatePath('/admin/reedem')
    revalidatePath('/rewards')
    revalidatePath('/home')
    revalidatePath('/profile')

    return {
      status: 'success',
      message: 'Coupon redeemed successfully.',
      claim: {
        code: rewardClaim.code,
        offerTitle: rewardClaim.offer_title,
        customerName: customer.name ?? 'Customer',
        phone: customer.phone,
        pointsCost: rewardClaim.points_cost,
        redeemedAt: now,
      },
    }
  } catch (error) {
    return {
      status: 'error',
      message: error instanceof Error ? error.message : 'Could not redeem this coupon.',
    }
  }
}

function normalizePhone(value: string): string {
  const digits = value.replace(/\D/g, '')
  const mobile = digits.startsWith('91') && digits.length === 12 ? digits.slice(2) : digits.slice(-10)
  return /^[6-9]\d{9}$/.test(mobile) ? mobile : ''
}

function normalizeCode(value: string): string {
  return value.replace(/[^a-z0-9]/gi, '').toUpperCase()
}

function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}
