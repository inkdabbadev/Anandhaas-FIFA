'use client'

import { useCallback, useEffect, useState } from 'react'
import { Segmented } from '@/components/ui/segmented'
import { RowSkeleton } from '@/components/ui/skeleton'
import { EmptyState, ErrorState } from '@/components/ui/empty-state'
import { getLeaderboard } from '@/services/data-service'
import { useAppStore } from '@/store/app-store'
import { initials, cn } from '@/lib/utils'
import { tierForPoints } from '@/constants'
import { Search } from 'lucide-react'
import type { LeaderboardEntry } from '@/types'

type Scope = 'weekly' | 'season'

export function LeaderboardView() {
  const me = useAppStore((s) => (s.currentPhone ? s.users[s.currentPhone] : null))
  const [scope, setScope] = useState<Scope>('weekly')
  const [query, setQuery] = useState('')
  const [entries, setEntries] = useState<LeaderboardEntry[] | null>(null)
  const [error, setError] = useState(false)

  const shapeEntries = useCallback((data: LeaderboardEntry[], currentScope: Scope) => {
    // Drop the seeded "me" placeholder and splice in the real signed-in user.
    const others = data.filter((e) => !e.is_me)
    const merged: LeaderboardEntry[] = me
      ? [
          ...others,
          {
            rank: 0,
            user_id: me.phone,
            name: me.name,
            avatar_url: null,
            tier: tierForPoints(me.points).key,
            points: me.points,
            correct_predictions: me.correctCount,
            exact_scores: 0,
            is_me: true,
          },
        ]
      : others

    const scaled =
      currentScope === 'season'
        ? merged.map((e) => (e.is_me ? e : { ...e, points: Math.round(e.points * 1.6) }))
        : merged

    return scaled
      .sort((a, b) => b.points - a.points)
      .map((e, i) => ({ ...e, rank: i + 1 }))
  }, [me])

  function load() {
    setEntries(null)
    setError(false)
    getLeaderboard()
      .then((data) => setEntries(shapeEntries(data, scope)))
      .catch(() => setError(true))
  }

  useEffect(() => {
    let active = true
    getLeaderboard()
      .then((data) => {
        if (active) setEntries(shapeEntries(data, scope))
      })
      .catch(() => {
        if (active) setError(true)
      })
    return () => {
      active = false
    }
  }, [scope, shapeEntries])

  const filtered = entries?.filter((e) =>
    (e.name ?? '').toLowerCase().includes(query.trim().toLowerCase())
  )

  return (
    <div className="px-4 pt-3">
      <Segmented
        value={scope}
        onChange={(next) => {
          setEntries(null)
          setError(false)
          setScope(next)
        }}
        options={[
          { value: 'weekly', label: 'This week' },
          { value: 'season', label: 'Full season' },
        ]}
      />

      <div className="relative mt-3">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search predictors"
          aria-label="Search predictors"
          className="w-full rounded-xl border border-border bg-card py-2.5 pl-9 pr-3 text-sm text-dark placeholder:text-muted focus:border-gold-border focus:outline-none"
        />
      </div>

      <p className="px-1 pb-1 pt-3 text-xs text-muted">
        {scope === 'weekly'
          ? 'Resets every Sunday · Top 3 win real rewards'
          : 'Season standings carry through 31 July 2026'}
      </p>

      <div className="flex flex-col gap-2 pb-2">
        {error ? (
          <ErrorState description="Couldn’t load rankings." onRetry={load} />
        ) : !entries ? (
          Array.from({ length: 6 }).map((_, i) => <RowSkeleton key={i} />)
        ) : filtered && filtered.length > 0 ? (
          filtered.map((e) => <LeaderboardRow key={e.user_id} entry={e} index={entries.indexOf(e)} />)
        ) : (
          <EmptyState emoji="🔍" title="No predictors found" description="Try a different name." />
        )}
      </div>
    </div>
  )
}

function LeaderboardRow({ entry, index }: { entry: LeaderboardEntry; index: number }) {
  const top3 = index < 3
  return (
    <div
      className={cn(
        'flex items-center gap-3 rounded-2xl border bg-card p-3.5',
        entry.is_me ? 'border-[1.5px] border-gold bg-gold-bg' : 'border-border'
      )}
    >
      <span
        className={cn('min-w-6 text-center text-base font-bold', top3 ? 'text-gold' : 'text-muted')}
      >
        {index + 1}
      </span>
      <span
        className={cn(
          'flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold',
          entry.is_me ? 'bg-gold text-white' : 'bg-dark text-gold-light'
        )}
      >
        {initials(entry.name)}
      </span>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-semibold text-dark">
          {entry.name}
          {entry.is_me && <span className="ml-1.5 text-xs font-medium text-gold">You</span>}
        </div>
        <div className="mt-0.5 text-xs text-muted">
          {entry.correct_predictions} correct · {entry.exact_scores} exact
        </div>
      </div>
      <div className="text-right">
        <div className="tnum font-serif text-lg font-bold text-gold">{entry.points}</div>
        <div className="text-[11px] text-muted">pts</div>
      </div>
    </div>
  )
}
