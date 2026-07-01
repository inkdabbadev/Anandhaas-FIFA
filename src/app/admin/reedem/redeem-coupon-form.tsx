'use client'

import { useActionState } from 'react'
import { BadgeCheck, Phone, TicketCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatNumber } from '@/lib/utils'
import { redeemCouponAction, type RedeemCouponState } from './actions'

const initialState: RedeemCouponState = {
  status: 'idle',
  message: '',
}

export function RedeemCouponForm() {
  const [state, formAction, pending] = useActionState(redeemCouponAction, initialState)

  return (
    <form action={formAction} className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block space-y-2">
          <span className="text-sm font-bold text-dark">Customer phone number</span>
          <span className="flex min-h-12 items-center gap-3 rounded-2xl border border-border bg-white px-4 shadow-sm focus-within:border-gold-border focus-within:ring-2 focus-within:ring-gold/15">
            <Phone className="h-5 w-5 shrink-0 text-gold" aria-hidden="true" />
            <input
              name="phone"
              type="tel"
              inputMode="numeric"
              autoComplete="tel"
              className="min-w-0 flex-1 bg-transparent text-base font-semibold text-dark outline-none placeholder:text-muted"
              placeholder="9876543210"
              required
            />
          </span>
        </label>

        <label className="block space-y-2">
          <span className="text-sm font-bold text-dark">Coupon code</span>
          <span className="flex min-h-12 items-center gap-3 rounded-2xl border border-border bg-white px-4 shadow-sm focus-within:border-gold-border focus-within:ring-2 focus-within:ring-gold/15">
            <TicketCheck className="h-5 w-5 shrink-0 text-gold" aria-hidden="true" />
            <input
              name="code"
              type="text"
              autoComplete="off"
              className="min-w-0 flex-1 bg-transparent text-base font-semibold uppercase text-dark outline-none placeholder:text-muted"
              placeholder="ABCD1234"
              required
            />
          </span>
        </label>
      </div>

      {state.status === 'error' && (
        <p className="rounded-2xl border border-red/20 bg-red-bg px-4 py-3 text-sm font-semibold text-red">
          {state.message}
        </p>
      )}

      {state.status === 'success' && state.claim && (
        <div className="rounded-3xl border border-green-border bg-green-bg p-5 text-green">
          <div className="flex items-start gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-green shadow-card">
              <BadgeCheck className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <p className="text-lg font-black">{state.message}</p>
              <p className="mt-1 text-sm font-semibold text-dark">{state.claim.offerTitle}</p>
              <p className="mt-2 text-xs font-semibold text-mid">
                {state.claim.customerName} - {state.claim.phone} - {formatNumber(state.claim.pointsCost)} points
              </p>
              <p className="mt-1 text-xs font-black uppercase text-green">Code {state.claim.code}</p>
            </div>
          </div>
        </div>
      )}

      <Button type="submit" size="lg" block disabled={pending}>
        {pending ? 'Checking coupon...' : 'Redeem coupon'}
      </Button>
    </form>
  )
}
