import { getActiveCampaign } from '@/config/campaign'

/**
 * Purchase Service — single entry point for all revenue sources.
 *
 * POS, Shopify, manual entry, CSV import and webhooks each implement
 * `PurchaseSource` and hand a normalised `PurchaseInput` to `recordPurchase`,
 * which grants tokens & season points atomically. Adding a new source never
 * touches the token/points logic.
 */

export interface PurchaseInput {
  userId: string
  amountInr: number
  source: 'pos' | 'shopify' | 'manual' | 'csv' | 'webhook'
  refId?: string
  purchasedAt?: string
}

export interface PurchaseResult {
  tokensGranted: number
  pointsGranted: number
}

/** Each integration adapter normalises its payload into PurchaseInput[]. */
export interface PurchaseSource<TRaw = unknown> {
  readonly name: PurchaseInput['source']
  parse(raw: TRaw): PurchaseInput[]
}

/** Token grant follows the active campaign's tier-aware rate (default 1 / ₹100). */
export function computeGrants(amountInr: number): PurchaseResult {
  const { tokens_per_100_inr } = getActiveCampaign().rules
  const tokens = Math.floor((amountInr / 100) * tokens_per_100_inr)
  return { tokensGranted: tokens, pointsGranted: tokens } // 1 token also = 1 base point
}

/**
 * Records a purchase and credits the ledgers.
 *
 * Phase 2 implementation (server-only, service role):
 *   1. insert into purchases
 *   2. insert token_ledger (+tokens, expires_at = now + token_expiry_days)
 *   3. insert point_ledger (+points)
 * Wrapped in a single RPC / transaction so balances never drift.
 */
export async function recordPurchase(input: PurchaseInput): Promise<PurchaseResult> {
  const grants = computeGrants(input.amountInr)
  // TODO(phase-2): const supabase = createAdminClient(); await supabase.rpc('record_purchase', {...})
  return grants
}

// ─── Example adapters (interfaces only; wire transport in Phase 4) ───────────

export const manualSource: PurchaseSource<PurchaseInput> = {
  name: 'manual',
  parse: (raw) => [raw],
}

export const csvSource: PurchaseSource<string> = {
  name: 'csv',
  parse: (csv) =>
    csv
      .trim()
      .split('\n')
      .slice(1) // skip header
      .map((line) => {
        const [userId, amount, refId] = line.split(',')
        return { userId, amountInr: Number(amount), source: 'csv' as const, refId }
      }),
}
