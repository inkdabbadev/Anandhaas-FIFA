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

  const visible = matches.filter((m) => m.status === 'live' || m.status === 'upcoming')

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
    return new Date(a.kickoff_at).getTime() - new Date(b.kickoff_at).getTime()
  })

  return (
    <div className="flex flex-col gap-3 px-4">
      {ordered.map((m) => (
        <MatchCard key={m.id} match={m} liveMinute={m.status === 'live' ? 67 : undefined} />
      ))}
    </div>
  )
}
