'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useAppStore } from '@/store/app-store'
import { LiveDot } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { matchTimeLabel, isPredictionOpen, cn } from '@/lib/utils'
import { Check, Flag, Lock } from 'lucide-react'
import type { Match } from '@/types'

export function MatchCard({ match, liveMinute }: { match: Match; liveMinute?: number }) {
  const prediction = useAppStore((s) => s.predictions[match.id])
  const openSheet = useAppStore((s) => s.openSheet)
  const pushToast = useAppStore((s) => s.pushToast)

  const open = isPredictionOpen(match)
  const predicted = !!prediction

  function handleOpen() {
    if (predicted) {
      pushToast('You have already predicted this match', 'info')
      return
    }
    if (!open) {
      pushToast('Predictions are closed for this match', 'error')
      return
    }
    openSheet(match.id)
  }

  const statusColor =
    prediction?.status === 'won'
      ? 'text-green'
      : prediction?.status === 'lost'
        ? 'text-red'
        : 'text-gold'

  return (
    <motion.article
      initial={{ y: 16, opacity: 0 }}
      whileInView={{ y: 0, opacity: 1 }}
      viewport={{ once: true, margin: '0px 0px -48px 0px' }}
      transition={{ duration: 0.28, ease: 'easeOut' }}
      whileTap={{ scale: 0.988 }}
      className={cn(
        'overflow-hidden rounded-[20px] border bg-card will-change-transform',
        predicted ? 'border-[1.5px] border-gold-border shadow-float' : 'border-border shadow-card'
      )}
    >
      <div className="flex items-center justify-between bg-dark px-4 py-2.5">
        <span className="flex min-w-0 items-center gap-1.5 text-xs font-medium">
          {match.status === 'live' ? <LiveDot /> : null}
          <span className="truncate text-fifa-light">{match.competition}</span>
          <span className="shrink-0 text-[var(--on-dark-dim)]">·</span>
          <span className="truncate text-[var(--on-dark-dim)]">{match.group_name}</span>
        </span>
        <span className="ml-2 shrink-0 text-xs font-medium text-[var(--on-dark-dim)]">
          {matchTimeLabel(match.kickoff_at, match.status, liveMinute)}
        </span>
      </div>

      <div className="p-4">
        <div className="mb-3 flex items-start gap-1.5">
          <TeamSide
            key={`${match.home_team.flag}-${match.home_team.flagFallback ?? ''}`}
            name={match.home_team.name}
            flag={match.home_team.flag}
            fallback={match.home_team.flagFallback}
            ranking={match.home_team.ranking}
          />
          <span className="mt-8 min-w-6 text-center text-xs font-bold text-muted">VS</span>
          <TeamSide
            key={`${match.away_team.flag}-${match.away_team.flagFallback ?? ''}`}
            name={match.away_team.name}
            flag={match.away_team.flag}
            fallback={match.away_team.flagFallback}
            ranking={match.away_team.ranking}
          />
        </div>

        {predicted ? (
          <div className="flex min-h-12 items-center justify-between gap-3 rounded-xl bg-gold-bg px-3.5 py-3">
            <span className="flex shrink-0 items-center gap-2 text-sm font-semibold text-mid">
              <Lock className="h-4 w-4 text-gold" /> Your pick
            </span>
            <span className={cn('flex min-w-0 items-center gap-1.5 text-right text-sm font-bold', statusColor)}>
              {prediction.status === 'won' && <Check className="h-4 w-4 shrink-0" />}
              <span className="truncate">{prediction.label}</span>
            </span>
          </div>
        ) : open ? (
          <Button size="md" block onClick={handleOpen}>
            Predict
          </Button>
        ) : (
          <div className="flex min-h-12 items-center justify-center gap-1.5 rounded-xl bg-bg px-3 py-3 text-sm font-semibold text-muted">
            <Lock className="h-4 w-4" /> Predictions closed
          </div>
        )}
      </div>
    </motion.article>
  )
}

function TeamSide({
  name,
  flag,
  fallback,
  ranking,
}: {
  name: string
  flag: string
  fallback?: string | null
  ranking: string | null
}) {
  const [failedPrimary, setFailedPrimary] = useState(false)
  const src = failedPrimary && fallback ? fallback : flag

  return (
    <div className="min-w-0 flex-1 text-center">
      <span className="mx-auto mb-1 grid h-9 w-12 place-items-center overflow-hidden rounded-md border border-border bg-bg">
        {isImageFlag(src) ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={src}
            alt={`${name} flag`}
            className="h-full w-full object-contain p-0.5"
            onError={() => {
              if (fallback && src !== fallback) setFailedPrimary(true)
            }}
          />
        ) : src ? (
          <span className="text-[28px] leading-none">{src}</span>
        ) : (
          <Flag className="h-4 w-4 text-muted" />
        )}
      </span>
      <div className="line-clamp-2 min-h-[34px] text-sm font-semibold leading-tight text-dark">{name}</div>
      {ranking && <div className="mt-0.5 truncate text-[11px] text-muted">{ranking}</div>}
    </div>
  )
}

function isImageFlag(value: string): boolean {
  return value.startsWith('/') || value.startsWith('http://') || value.startsWith('https://')
}
