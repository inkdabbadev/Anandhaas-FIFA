'use client'

import { useAppStore } from '@/store/app-store'
import { TIERS, tierForPoints } from '@/constants'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

export function TiersView() {
  const user = useAppStore((s) => s.user)
  const points = user?.season_points ?? 0
  const current = tierForPoints(points)
  const currentIndex = TIERS.findIndex((t) => t.key === current.key)
  const next = TIERS[currentIndex + 1] ?? null
  const toNext = next ? next.minPoints - points : 0

  return (
    <div className="px-4 pt-3">
      {next && (
        <div className="mb-3 rounded-2xl border border-gold-border bg-gold-bg p-3.5">
          <div className="flex items-center justify-between text-[11px]">
            <span className="font-semibold text-mid">
              {toNext} pts to <strong className="text-gold">{next.name}</strong>
            </span>
            <span className="text-muted">
              {points} / {next.minPoints}
            </span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-white">
            <div
              className="h-full rounded-full bg-gold transition-all"
              style={{ width: `${Math.min(100, (points / next.minPoints) * 100)}%` }}
            />
          </div>
        </div>
      )}

      <div className="flex flex-col gap-2">
        {TIERS.map((t) => {
          const active = t.key === current.key
          return (
            <div
              key={t.key}
              className={cn(
                'flex items-center gap-3 rounded-2xl border bg-card p-3.5',
                active ? 'border-[1.5px] border-gold bg-gold-bg' : 'border-border'
              )}
            >
              <span
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] font-serif text-lg font-black"
                style={{ background: t.swatch.bg, color: t.swatch.color }}
              >
                {t.num}
              </span>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-[13px] font-bold text-dark">{t.name}</span>
                  {active && <Badge variant="gold">You are here</Badge>}
                </div>
                <div className="mt-0.5 text-[10px] text-muted">{t.range}</div>
                <div className="mt-1.5 text-[10px] leading-snug text-mid">{t.perk}</div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="py-3.5">
        <div className="rounded-2xl border border-border bg-card p-3.5">
          <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-gold">Season rules</p>
          <p className="text-[11px] leading-relaxed text-mid">
            Tiers are calculated on your total season points across all purchases and predictions.
            Tier status holds for the full season and is shown on your profile and the leaderboard.
            Tiers reset on 31 July 2026.
          </p>
        </div>
      </div>
    </div>
  )
}
