'use client'

import { useAppStore } from '@/store/app-store'
import { Badge, LiveDot } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { matchTimeLabel, isPredictionOpen, cn } from '@/lib/utils'
import { Check, Lock } from 'lucide-react'
import type { Match } from '@/types'

export function MatchCard({ match, liveMinute }: { match: Match; liveMinute?: number }) {
  const prediction = useAppStore((s) => s.predictions[match.id])
  const openSheet = useAppStore((s) => s.openSheet)
  const pushToast = useAppStore((s) => s.pushToast)

  const open = isPredictionOpen(match)
  const predicted = !!prediction

  function handleClick() {
    if (predicted) {
      pushToast('You’ve already predicted this match', 'info')
      return
    }
    if (!open) {
      pushToast('Predictions are closed for this match', 'error')
      return
    }
    openSheet(match.id)
  }

  return (
    <article
      className={cn(
        'overflow-hidden rounded-[20px] border bg-card transition-all duration-200 active:scale-[0.985]',
        predicted ? 'border-[1.5px] border-gold-border shadow-float' : 'border-border shadow-card'
      )}
    >
      <div className="flex items-center justify-between bg-dark px-3.5 py-2">
        <span className="flex items-center gap-1.5 text-[9px] font-semibold uppercase tracking-wider text-white/90">
          {match.status === 'live' ? (
            <LiveDot />
          ) : null}
          <span className="text-fifa-light">{match.competition}</span>
          <span className="text-[var(--on-dark-dim)]">· {match.group_name}</span>
        </span>
        <span className="text-[9px] font-medium text-[var(--on-dark-dim)]">
          {matchTimeLabel(match.kickoff_at, match.status, liveMinute)}
        </span>
      </div>

      <div className="p-3.5">
        <div className="mb-3 flex items-center gap-1.5">
          <TeamSide name={match.home_team.name} flag={match.home_team.flag} ranking={match.home_team.ranking} />
          <span className="min-w-6 text-center text-xs font-bold text-muted">VS</span>
          <TeamSide name={match.away_team.name} flag={match.away_team.flag} ranking={match.away_team.ranking} />
        </div>

        <div className="flex items-center gap-2">
          {predicted ? (
            <div className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-green-bg px-3 py-2.5 text-xs font-semibold text-green">
              <Check className="h-4 w-4" />
              {prediction.home_goals}–{prediction.away_goals} · {prediction.winner} wins
            </div>
          ) : open ? (
            <Button size="sm" block onClick={handleClick}>
              Predict now
            </Button>
          ) : (
            <div className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-bg px-3 py-2.5 text-xs font-semibold text-muted">
              <Lock className="h-3.5 w-3.5" />
              Predictions closed
            </div>
          )}
          <Badge variant="gold" className="px-2.5 py-1.5">
            {match.token_cost} token{match.token_cost > 1 ? 's' : ''}
          </Badge>
        </div>
      </div>
    </article>
  )
}

function TeamSide({ name, flag, ranking }: { name: string; flag: string; ranking: string | null }) {
  return (
    <div className="flex-1 text-center">
      <span className="mb-1 block text-[28px] leading-none">{flag}</span>
      <div className="text-sm font-semibold text-dark">{name}</div>
      {ranking && <div className="mt-0.5 text-[11px] text-muted">{ranking}</div>}
    </div>
  )
}
