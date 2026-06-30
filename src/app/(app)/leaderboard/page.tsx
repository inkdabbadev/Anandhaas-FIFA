import type { Metadata } from 'next'
import { connection } from 'next/server'
import { PageHero } from '@/components/ui/page-hero'
import { loadLeaderboardEntries } from '@/features/leaderboard/actions'
import { LeaderboardView } from '@/features/leaderboard/leaderboard-view'

export const metadata: Metadata = { title: 'Rankings' }

export default async function LeaderboardPage() {
  await connection()
  const initialResult = await loadLeaderboardEntries()

  return (
    <div className="animate-fade-in-up">
      <PageHero
        eyebrow="Top rankings"
        title={
          <>
            Top <em className="not-italic text-gold-light">predictors</em>
          </>
        }
        subtitle="All users ranked by total points from correct predictions"
      />
      <div className="relative z-10 -mt-5 rounded-t-[28px] bg-bg pt-2 shadow-[0_-12px_30px_rgba(8,26,22,0.14)]">
        <LeaderboardView initialResult={initialResult} />
      </div>
    </div>
  )
}
