'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useAppStore } from '@/store/app-store'
import { LiveDot } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { matchTimeLabel, isPredictionOpen, cn } from '@/lib/utils'
import { Ban, Check, Flag, Lock } from 'lucide-react'
import type { Match } from '@/types'

export function MatchCard({
  match,
  liveMinute,
  showPredictionCloseTimer = false,
}: {
  match: Match
  liveMinute?: number
  showPredictionCloseTimer?: boolean
}) {
  const prediction = useAppStore((s) => s.predictions[match.id])
  const openSheet = useAppStore((s) => s.openSheet)
  const pushToast = useAppStore((s) => s.pushToast)
  const closeCountdown = usePredictionCloseCountdown(
    showPredictionCloseTimer ? match.prediction_closes_at : null
  )

  const open = isPredictionOpen(match)
  const predicted = !!prediction
  const finished = match.status === 'finished'
  const cancelled = match.status === 'cancelled'

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
        cancelled
          ? 'border-red/20 bg-red-bg/40 shadow-card'
          : predicted
            ? 'border-[1.5px] border-gold-border shadow-float'
            : 'border-border shadow-card'
      )}
    >
      <div className={cn('flex items-center justify-between px-4 py-2.5', cancelled ? 'bg-red' : 'bg-dark')}>
        <span className="flex min-w-0 items-center gap-1.5 text-xs font-medium">
          {match.status === 'live' ? <LiveDot /> : null}
          <span className="truncate text-fifa-light">{match.competition}</span>
          <span className="shrink-0 text-[var(--on-dark-dim)]">·</span>
          <span className="truncate text-[var(--on-dark-dim)]">{match.group_name}</span>
        </span>
        <span className="ml-2 shrink-0 text-xs font-medium text-[var(--on-dark-dim)]">
          {closeCountdown ?? matchTimeLabel(match.kickoff_at, match.status, liveMinute)}
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
          <ResultCenter match={match} cancelled={cancelled} />
          <TeamSide
            key={`${match.away_team.flag}-${match.away_team.flagFallback ?? ''}`}
            name={match.away_team.name}
            flag={match.away_team.flag}
            fallback={match.away_team.flagFallback}
            ranking={match.away_team.ranking}
          />
        </div>

        {cancelled ? (
          <div className="flex min-h-12 items-center justify-center gap-2 rounded-xl border border-red/20 bg-white px-3 py-3 text-sm font-bold text-red">
            <Ban className="h-4 w-4" /> Match cancelled
          </div>
        ) : predicted ? (
          <div className="flex min-h-12 items-center justify-between gap-3 rounded-xl bg-gold-bg px-3.5 py-3">
            <span className="flex shrink-0 items-center gap-2 text-sm font-semibold text-mid">
              <Lock className="h-4 w-4 text-gold" /> Your pick
            </span>
            <span className="flex min-w-0 flex-col items-end gap-0.5 text-right">
              <span className={cn('flex min-w-0 items-center gap-1.5 text-sm font-bold', statusColor)}>
                {prediction.status === 'won' && <Check className="h-4 w-4 shrink-0" />}
                <span className="truncate">{prediction.label}</span>
              </span>
              {finished && (
                <span className={cn('text-[11px] font-bold', prediction.pointsEarned > 0 ? 'text-green' : 'text-muted')}>
                  {prediction.pointsEarned > 0
                    ? `+${prediction.pointsEarned} pts`
                    : `+0 pts`}
                </span>
              )}
            </span>
          </div>
        ) : open ? (
          <Button size="md" block onClick={handleOpen}>
            Predict
          </Button>
        ) : (
          <div className="flex min-h-12 items-center justify-center gap-1.5 rounded-xl bg-bg px-3 py-3 text-sm font-semibold text-muted">
            <Lock className="h-4 w-4" /> {finished ? 'Match finished' : 'Predictions closed'}
          </div>
        )}
      </div>
    </motion.article>
  )
}

function ResultCenter({ match, cancelled }: { match: Match; cancelled: boolean }) {
  const finished = match.status === 'finished'
  const hasScore = match.home_score != null && match.away_score != null

  if (cancelled) {
    return (
      <span className="mt-7 flex min-w-16 flex-col items-center text-center">
        <span className="rounded-lg bg-red px-2.5 py-1 text-[11px] font-extrabold uppercase leading-none text-white">
          Cancelled
        </span>
      </span>
    )
  }

  if (!finished || !hasScore) {
    return <span className="mt-8 min-w-6 text-center text-xs font-bold text-muted">VS</span>
  }

  return (
    <span className="mt-7 flex min-w-12 flex-col items-center text-center">
      <span className="tnum rounded-lg bg-dark px-2.5 py-1 text-sm font-extrabold leading-none text-bg">
        {match.home_score} - {match.away_score}
      </span>
      <span className="mt-1 max-w-[82px] text-[10px] font-bold leading-tight text-gold">
        {resultLabel(match)}
      </span>
    </span>
  )
}

function resultLabel(match: Match): string {
  const pick =
    match.winning_pick ??
    (match.home_score != null && match.away_score != null
      ? match.home_score > match.away_score
        ? 'home'
        : match.away_score > match.home_score
          ? 'away'
          : 'draw'
      : null)

  if (pick === 'home') return `${match.home_team.name} won`
  if (pick === 'away') return `${match.away_team.name} won`
  return 'Match draw'
}

function usePredictionCloseCountdown(closesAt: string | null): string | null {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    if (!closesAt) return

    const interval = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(interval)
  }, [closesAt])

  if (!closesAt) return null

  const remainingMs = new Date(closesAt).getTime() - now
  if (remainingMs <= 0) return 'Closing now'

  return `Closes ${formatRemainingTime(remainingMs)}`
}

function formatRemainingTime(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000))
  const days = Math.floor(totalSeconds / 86_400)
  const hours = Math.floor((totalSeconds % 86_400) / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  if (days > 0) return `${days}d ${hours}h`
  if (hours > 0) return `${hours}h ${minutes}m`
  return `${minutes}m ${seconds.toString().padStart(2, '0')}s`
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
