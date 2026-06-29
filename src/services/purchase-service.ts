export interface PurchaseInput {
  userId: string
  amountInr: number
  source: 'pos' | 'shopify' | 'manual' | 'csv' | 'webhook'
  refId?: string
  purchasedAt?: string
}

export interface PurchaseResult {
  pointsGranted: number
}

export interface PurchaseSource<TRaw = unknown> {
  readonly name: PurchaseInput['source']
  parse(raw: TRaw): PurchaseInput[]
}

export function computeGrants(amountInr: number): PurchaseResult {
  return { pointsGranted: Math.floor(amountInr / 100) }
}

export async function recordPurchase(input: PurchaseInput): Promise<PurchaseResult> {
  return computeGrants(input.amountInr)
}

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
      .slice(1)
      .map((line) => {
        const [userId, amount, refId] = line.split(',')
        return { userId, amountInr: Number(amount), source: 'csv' as const, refId }
      }),
}
