'use client'

import { useAppStore } from '@/store/app-store'
import { formatNumber } from '@/lib/utils'

/** Editorial hero with co-brand line + live stat tiles. */
export function Hero() {
  const tokenBalance = useAppStore((s) => s.tokenBalance)
  const streak = useAppStore((s) => s.streak)
  const predictions = useAppStore((s) => s.predictions)

  const correctThisWeek = Object.values(predictions).filter((p) => p.status === 'won').length

  return (
    <section className="bg-brand px-5 pb-8 pt-5">
      <div className="text-[13px] font-semibold text-white/80">
        FIFA World Cup 2026
      </div>

      <h1 className="mt-4 font-serif text-[32px] font-extrabold leading-[1.05] text-bg">
        Predict the match.
        <br />
        <span className="text-gold-light">Win sweet rewards.</span>
      </h1>

      <div className="mt-6 grid grid-cols-3 gap-2.5">
        <Stat value={formatNumber(tokenBalance)} label="Tokens" />
        <Stat value={correctThisWeek} label="Correct" />
        <Stat value={streak} label="Streak" flame />
      </div>
    </section>
  )
}

function Stat({ value, label, flame }: { value: string | number; label: string; flame?: boolean }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.07] px-2.5 py-3.5 text-center backdrop-blur-sm">
      <span className="tnum block text-xl font-extrabold leading-none text-bg">
        {flame && <span className="mr-0.5 text-lg">🔥</span>}
        {value}
      </span>
      <span className="mt-1.5 block text-[11px] font-medium text-[var(--on-dark-dim)]">{label}</span>
    </div>
  )
}
