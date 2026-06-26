import { getMatches } from '@/services/data-service'
import { MatchCard } from './match-card'
import { EmptyState } from '@/components/ui/empty-state'

/** Async server component — streams the live + upcoming match feed. */
export async function MatchList() {
  const matches = await getMatches()
  const visible = matches.filter((m) => m.status === 'live' || m.status === 'upcoming')

  if (visible.length === 0) {
    return (
      <EmptyState
        emoji="🗓️"
        title="No matches yet"
        description="New fixtures drop here as soon as they’re scheduled. Check back soon."
      />
    )
  }

  // Live first, then by kickoff.
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
