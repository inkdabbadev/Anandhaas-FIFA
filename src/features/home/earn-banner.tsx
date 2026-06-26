'use client'

import { useAppStore } from '@/store/app-store'
import { Button } from '@/components/ui/button'

/** "Shop to earn" prompt — the core loyalty loop nudge. */
export function EarnBanner() {
  const pushToast = useAppStore((s) => s.pushToast)

  return (
    <div className="mx-4 mt-3 flex items-center justify-between gap-3 rounded-2xl bg-dark p-4">
      <p className="flex-1 text-[13px] leading-snug text-[var(--on-dark-dim)]">
        Spend <strong className="font-semibold text-gold-light">₹300+ today</strong> and unlock 3
        prediction tokens instantly
      </p>
      <Button size="sm" onClick={() => pushToast('Opening Anandhaas store…', 'info')}>
        Shop now
      </Button>
    </div>
  )
}
