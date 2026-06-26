import type { Metadata } from 'next'
import { PageHero } from '@/components/ui/page-hero'
import { TiersView } from '@/features/tiers/tiers-view'

export const metadata: Metadata = { title: 'Tiers' }

export default function TiersPage() {
  return (
    <div className="animate-fade-in-up">
      <PageHero
        eyebrow="⭐ Loyalty tiers"
        title={
          <>
            Earn more.
            <br />
            <em className="not-italic text-gold-light">Get more.</em>
          </>
        }
        subtitle="Better token rates as you climb the tiers"
      />
      <div className="relative z-10 -mt-5 rounded-t-[28px] bg-bg pt-3 shadow-[0_-12px_30px_rgba(8,26,22,0.14)]">
        <TiersView />
      </div>
    </div>
  )
}
