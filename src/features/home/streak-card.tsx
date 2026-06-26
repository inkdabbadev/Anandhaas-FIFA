'use client'

import { useAppStore } from '@/store/app-store'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ProgressDots } from '@/components/ui/progress-dots'
import { STREAK_TARGET, POINTS } from '@/constants'
import { Flame } from 'lucide-react'

export function StreakCard() {
  const streak = useAppStore((s) => s.streak)
  const remaining = Math.max(0, STREAK_TARGET - streak)

  return (
    <Card className="mx-4 mt-4 p-4">
      <div className="mb-3 flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-sm font-semibold text-dark">
          <Flame className="h-4 w-4 text-gold" /> Match-day streak
        </span>
        <Badge variant="gold" size="md">
          {streak} of {STREAK_TARGET}
        </Badge>
      </div>
      <ProgressDots total={STREAK_TARGET} filled={streak} />
      <p className="mt-2.5 text-xs text-muted">
        {remaining > 0
          ? `${remaining} more prediction${remaining > 1 ? 's' : ''} this week for +${POINTS.STREAK_BONUS} bonus tokens`
          : 'Streak complete — bonus credited.'}
      </p>
    </Card>
  )
}
