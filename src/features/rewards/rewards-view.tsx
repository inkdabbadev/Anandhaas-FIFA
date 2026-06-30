'use client'

import { useEffect, useState, useTransition } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { EmptyState, ErrorState } from '@/components/ui/empty-state'
import { SectionHeader } from '@/components/ui/section-header'
import { Segmented } from '@/components/ui/segmented'
import { Sheet } from '@/components/ui/sheet'
import {
  claimRewardAction,
  loadRewardsData,
  type RewardClaim,
  type RewardsDataResult,
} from '@/features/rewards/actions'
import { cn, formatNumber } from '@/lib/utils'
import { useAppStore } from '@/store/app-store'
import { Gift, Goal, Store, Tag, Target, Trophy } from 'lucide-react'
import type { Reward } from '@/types'

type Tab = 'offers' | 'mine'

export function RewardsView() {
  const user = useAppStore((s) => (s.currentPhone ? s.users[s.currentPhone] : null))
  const updateCurrentUserStats = useAppStore((s) => s.updateCurrentUserStats)
  const [tab, setTab] = useState<Tab>('offers')
  const [data, setData] = useState<RewardsDataResult>({
    ok: true,
    message: '',
    offers: [],
    claims: [],
  })
  const [isPending, startTransition] = useTransition()

  const points = user?.points ?? 0

  function applyResult(result: RewardsDataResult) {
    setData(result)
    if (result.userStats) updateCurrentUserStats(result.userStats)
  }

  function refresh() {
    startTransition(async () => {
      applyResult(await loadRewardsData(user?.id))
    })
  }

  useEffect(() => {
    refresh()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id])

  return (
    <div className="animate-fade-in-up">
      <section className="bg-brand px-5 pb-7 pt-6">
        <p className="text-[13px] font-medium text-white/70">Your balance</p>
        <p className="tnum mt-2 font-serif text-[46px] font-extrabold leading-none text-gold-light">
          {formatNumber(points)}
        </p>
        <p className="mt-2.5 text-[13px] text-[var(--on-dark-dim)]">Claim rewards, redeem in store</p>
      </section>

      <div className="relative z-10 -mt-5 rounded-t-[28px] bg-bg pt-1 shadow-[0_-12px_30px_rgba(8,26,22,0.14)]">
        <SectionHeader title="How it works" />
        <div className="mx-4 overflow-hidden rounded-2xl border border-border bg-card">
          <HowRow icon={Goal} label="Predict any match" amount="Free" />
          <HowRow icon={Target} label="Correct prediction" amount="+50 pts" />
          <HowRow icon={Store} label="Redeem at any Anandhaas store" amount="Spend points" last />
        </div>

        <div className="px-4 pt-5">
          <Segmented
            value={tab}
            onChange={setTab}
            options={[
              { value: 'offers', label: 'Offers' },
              { value: 'mine', label: 'My rewards' },
            ]}
          />
        </div>

        <div className="px-4 pb-2 pt-3">
          {!data.ok ? (
            <ErrorState description={data.message} onRetry={refresh} />
          ) : tab === 'offers' ? (
            <OffersTab
              points={points}
              offers={data.offers}
              claims={data.claims}
              userId={user?.id}
              loading={isPending}
              onResult={applyResult}
            />
          ) : (
            <MyRewardsTab claims={data.claims} loading={isPending} />
          )}
        </div>
      </div>
    </div>
  )
}

function HowRow({
  icon: Icon,
  label,
  amount,
  last,
}: {
  icon: typeof Gift
  label: string
  amount: string
  last?: boolean
}) {
  return (
    <div className={cn('flex items-center gap-3 px-4 py-3.5', !last && 'border-b border-border')}>
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gold-bg">
        <Icon className="h-4.5 w-4.5 text-gold" />
      </span>
      <span className="min-w-0 flex-1 text-sm font-medium leading-snug text-dark">{label}</span>
      <span className="shrink-0 text-right text-sm font-semibold leading-snug text-gold">{amount}</span>
    </div>
  )
}

function OffersTab({
  points,
  offers,
  claims,
  userId,
  loading,
  onResult,
}: {
  points: number
  offers: Reward[]
  claims: RewardClaim[]
  userId?: string
  loading: boolean
  onResult: (result: RewardsDataResult) => void
}) {
  const pushToast = useAppStore((s) => s.pushToast)
  const [claimed, setClaimed] = useState<Reward | null>(null)
  const [claimingId, setClaimingId] = useState<string | null>(null)
  const [isClaimPending, startClaimTransition] = useTransition()
  void claims

  function onClaim(offer: Reward) {
    if (!userId) {
      pushToast('Please login again before claiming', 'error')
      return
    }
    if (offer.inventory !== null && offer.inventory <= 0) {
      pushToast('This reward is out of stock', 'error')
      return
    }
    if (points < offer.points_cost) {
      pushToast('Not enough points yet. Predict more matches', 'error')
      return
    }

    setClaimingId(offer.id)
    startClaimTransition(async () => {
      const result = await claimRewardAction({ userId, offerId: offer.id })
      setClaimingId(null)
      onResult(result)
      if (result.ok) setClaimed(offer)
      else pushToast(result.message, 'error')
    })
  }

  if (loading && offers.length === 0) {
    return <EmptyState icon={Gift} title="Loading rewards" description="Fetching the latest offers." />
  }

  if (offers.length === 0) {
    return <EmptyState icon={Gift} title="No offers yet" description="Check back soon for sweet rewards." />
  }

  return (
    <>
      <div className="flex flex-col gap-2.5">
        {offers.map((offer) => {
          const soldOut = offer.inventory !== null && offer.inventory <= 0
          const canClaim = !soldOut && points >= offer.points_cost
          const busy = isClaimPending && claimingId === offer.id

          return (
            <div key={offer.id} className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3.5">
              <RewardIcon icon={offer.icon} />
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold text-dark">{offer.title}</div>
                <div className="mt-0.5 text-xs leading-snug text-muted">{offer.description}</div>
                <div className="mt-1.5 flex items-center gap-2 text-xs font-bold text-gold">
                  {formatNumber(offer.points_cost)} points
                  {offer.inventory !== null && (
                    <span className="font-medium text-muted">- {offer.inventory} left</span>
                  )}
                </div>
              </div>
              <Button
                size="sm"
                variant={canClaim ? 'primary' : 'outline'}
                disabled={soldOut || busy}
                onClick={() => onClaim(offer)}
                className="shrink-0 px-3"
              >
                {busy ? 'Claiming' : soldOut ? 'Sold out' : canClaim ? 'Claim' : 'Locked'}
              </Button>
            </div>
          )
        })}
      </div>
      <ClaimModal offer={claimed} onClose={() => setClaimed(null)} />
    </>
  )
}

function RewardIcon({ icon }: { icon: string }) {
  const clean = icon.trim()
  const isWord = /^[a-z\s-]+$/i.test(clean)

  return (
    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gold-bg text-xl font-bold text-gold">
      {isWord ? <Tag className="h-5 w-5" /> : clean}
    </span>
  )
}

function ClaimModal({ offer, onClose }: { offer: Reward | null; onClose: () => void }) {
  return (
    <Sheet open={!!offer} onClose={onClose} labelledBy="claim-title">
      {offer && (
        <div className="flex flex-col items-center pb-2 text-center">
          <span className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gold-bg text-gold">
            <Trophy className="h-7 w-7" />
          </span>
          <h2 id="claim-title" className="font-serif text-xl font-bold text-dark">
            {offer.title} is ready!
          </h2>
          <div className="mt-4 flex items-start gap-3 rounded-2xl bg-bg p-4 text-left">
            <Store className="mt-0.5 h-5 w-5 shrink-0 text-gold" />
            <p className="text-sm leading-relaxed text-mid">
              Points were reduced from your balance. Visit your nearest <strong className="text-dark">Anandhaas</strong>{' '}
              store and the staff will redeem it from the store side.
            </p>
          </div>
          <p className="mt-3 text-xs text-muted">Find it under My rewards anytime.</p>
          <Button block size="lg" className="mt-5" onClick={onClose}>
            Got it
          </Button>
        </div>
      )}
    </Sheet>
  )
}

function MyRewardsTab({ claims, loading }: { claims: RewardClaim[]; loading: boolean }) {
  if (loading && claims.length === 0) {
    return <EmptyState icon={Gift} title="Loading rewards" description="Fetching your claimed rewards." />
  }

  if (claims.length === 0) {
    return (
      <EmptyState
        icon={Gift}
        title="No rewards yet"
        description="Claim an offer and it will appear here to show in store."
      />
    )
  }

  return (
    <div className="flex flex-col gap-2.5">
      {claims.map((claim) => (
        <div key={claim.id} className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3.5">
          <RewardIcon icon={claim.offerIcon} />
          <div className="min-w-0 flex-1">
            <div className="text-sm font-semibold text-dark">{claim.offerTitle}</div>
            <div className="mt-0.5 text-xs leading-snug text-muted">
              {claim.status === 'pending' ? `Show code ${claim.code} in store` : 'Redeemed'} -{' '}
              {formatNumber(claim.pointsCost)} pts
            </div>
          </div>
          <Badge variant={claim.status === 'pending' ? 'gold' : 'green'} size="md" className="shrink-0">
            {claim.status === 'pending' ? 'Ready' : 'Redeemed'}
          </Badge>
        </div>
      ))}
    </div>
  )
}
