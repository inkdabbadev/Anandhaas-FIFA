import type { Metadata } from 'next'
import { PageHero } from '@/components/ui/page-hero'
import { LeaderboardView } from '@/features/leaderboard/leaderboard-view'

export const metadata: Metadata = { title: 'Rankings' }

export default function LeaderboardPage() {
  return (
    <div className="animate-fade-in-up">
      <PageHero
        eyebrow="🏆 Weekly rankings"
        title={
          <>
            Top <em className="not-italic text-gold-light">predictors</em>
          </>
        }
        subtitle="Climb the board · Top 3 win real rewards"
      />
      <div className="relative z-10 -mt-5 rounded-t-[28px] bg-bg pt-2 shadow-[0_-12px_30px_rgba(8,26,22,0.14)]">
        <LeaderboardView />
      </div>
    </div>
  )
}
