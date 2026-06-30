'use client'

import { useEffect, useState } from 'react'
import { EmptyState } from '@/components/ui/empty-state'
import { MatchCardSkeleton } from '@/components/ui/skeleton'
import { useAppStore } from '@/store/app-store'
import { CalendarDays } from 'lucide-react'
import { MatchCard } from './match-card'
import { loadMatchFeed } from './actions'

export function MatchList() {
  const matches = useAppStore((s) => s.matches)
  const user = useAppStore((s) => (s.currentPhone ? s.users[s.currentPhone] : null))
  const hydrateMatchFeed = useAppStore((s) => s.hydrateMatchFeed)
  const updateCurrentUserStats = useAppStore((s) => s.updateCurrentUserStats)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      const result = await loadMatchFeed(user?.id)
      if (cancelled) return

      if (!result.ok) {
        setError(result.message)
      } else {
        setError('')
      }
      hydrateMatchFeed(result.matches, result.predictions)
      if (result.userStats) updateCurrentUserStats(result.userStats)
      setLoading(false)
    }

    load()

    return () => {
      cancelled = true
    }
  }, [hydrateMatchFeed, updateCurrentUserStats, user?.id])

  useEffect(() => {
    const interval = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(interval)
  }, [])

  const visible = matches.filter((m) =>
    m.status === 'live' || m.status === 'upcoming' || m.status === 'finished' || m.status === 'cancelled'
  )

  if (loading) {
    return (
      <div className="flex flex-col gap-3 px-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <MatchCardSkeleton key={i} />
        ))}
      </div>
    )
  }

  if (visible.length === 0) {
    return (
      <EmptyState
        icon={CalendarDays}
        title="No matches yet"
        description={error || 'New fixtures drop here as soon as they are scheduled. Check back soon.'}
      />
    )
  }

  const ordered = [...visible].sort((a, b) => {
    if (a.status === 'live' && b.status !== 'live') return -1
    if (b.status === 'live' && a.status !== 'live') return 1
    if (a.status === 'cancelled' && b.status !== 'cancelled') return 1
    if (b.status === 'cancelled' && a.status !== 'cancelled') return -1
    if (a.status === 'upcoming' && b.status === 'finished') return -1
    if (b.status === 'upcoming' && a.status === 'finished') return 1
    if (a.status === 'finished' && b.status === 'finished') {
      return new Date(b.kickoff_at).getTime() - new Date(a.kickoff_at).getTime()
    }
    return new Date(a.kickoff_at).getTime() - new Date(b.kickoff_at).getTime()
  })
  const nextClosingMatchId = ordered
    .filter((match) => match.status === 'upcoming' && new Date(match.prediction_closes_at).getTime() > now)
    .sort(
      (a, b) =>
        new Date(a.prediction_closes_at).getTime() - new Date(b.prediction_closes_at).getTime()
    )[0]?.id

  return (
    <div className="flex flex-col gap-3 px-4">
      {ordered.map((m) => (
        <MatchCard
          key={m.id}
          match={m}
          liveMinute={m.status === 'live' ? 67 : undefined}
          showPredictionCloseTimer={m.id === nextClosingMatchId}
        />
      ))}
    </div>
  )
}
