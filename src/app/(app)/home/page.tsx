import { Suspense } from 'react'
import { Hero } from '@/features/home/hero'
import { CampaignBanner } from '@/features/home/campaign-banner'
import { MatchList } from '@/features/matches/match-list'
import { SectionHeader } from '@/components/ui/section-header'
import { LiveDot } from '@/components/ui/badge'
import { MatchCardSkeleton } from '@/components/ui/skeleton'

export default function HomePage() {
  return (
    <div className="animate-fade-in-up">
      <Hero />

      <div className="relative z-10 -mt-5 rounded-t-[28px] bg-bg pb-3 pt-1 shadow-[0_-12px_30px_rgba(8,26,22,0.14)]">
        <CampaignBanner />

        <SectionHeader
          title={
            <>
              <LiveDot /> Matches
            </>
          }
          linkLabel="Rankings"
          linkHref="/leaderboard"
        />

        <Suspense fallback={<MatchFeedSkeleton />}>
          <MatchList />
        </Suspense>
      </div>
    </div>
  )
}

function MatchFeedSkeleton() {
  return (
    <div className="flex flex-col gap-3 px-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <MatchCardSkeleton key={i} />
      ))}
    </div>
  )
}
