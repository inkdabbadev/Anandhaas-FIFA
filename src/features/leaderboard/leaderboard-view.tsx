'use client'

import { useState, useTransition } from 'react'
import { Search } from 'lucide-react'
import { EmptyState, ErrorState } from '@/components/ui/empty-state'
import { RowSkeleton } from '@/components/ui/skeleton'
import { loadLeaderboardEntries, type LeaderboardResult } from '@/features/leaderboard/actions'
import { cn, initials } from '@/lib/utils'
import { useAppStore } from '@/store/app-store'
import type { LeaderboardEntry } from '@/types'

export function LeaderboardView({ initialResult }: { initialResult: LeaderboardResult }) {
  const me = useAppStore((s) => (s.currentPhone ? s.users[s.currentPhone] : null))
  const [query, setQuery] = useState('')
  const [entries, setEntries] = useState<LeaderboardEntry[]>(initialResult.entries)
  const [error, setError] = useState(initialResult.ok ? '' : initialResult.message)
  const [isPending, startTransition] = useTransition()

  const filtered = entries
    .map((entry) => ({
      ...entry,
      is_me: Boolean(me?.id && entry.user_id === me.id),
    }))
    .filter((entry) => (entry.name ?? '').toLowerCase().includes(query.trim().toLowerCase()))

  function load() {
    setError('')
    startTransition(async () => {
      const result = await loadLeaderboardEntries()
      setEntries(result.entries)
      setError(result.ok ? '' : result.message)
    })
  }

  return (
    <div className="px-4 pt-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search predictors"
          aria-label="Search predictors"
          className="w-full rounded-xl border border-border bg-card py-2.5 pl-9 pr-3 text-sm text-dark placeholder:text-muted focus:border-gold-border focus:outline-none"
        />
      </div>

      <p className="px-1 pb-1 pt-3 text-xs text-muted">
        Ranked by total points won from correct predictions.
      </p>

      <div className="flex flex-col gap-2 pb-2">
        {error ? (
          <ErrorState description={error || 'Could not load rankings.'} onRetry={load} />
        ) : isPending ? (
          Array.from({ length: 6 }).map((_, index) => <RowSkeleton key={index} />)
        ) : filtered.length > 0 ? (
          filtered.map((entry) => <LeaderboardRow key={entry.user_id} entry={entry} />)
        ) : (
          <EmptyState title="No predictors found" description="Try a different name." />
        )}
      </div>
    </div>
  )
}

function LeaderboardRow({ entry }: { entry: LeaderboardEntry }) {
  const top3 = entry.rank <= 3

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
        {entry.rank}
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
        <div className="mt-0.5 truncate text-xs text-muted">
          {entry.correct_predictions} correct · {entry.exact_scores} predictions
        </div>
      </div>
      <div className="min-w-[70px] shrink-0 text-right">
        <div className="tnum truncate font-serif text-lg font-bold text-gold">{entry.points}</div>
        <div className="text-[11px] text-muted">total pts</div>
      </div>
    </div>
  )
}
