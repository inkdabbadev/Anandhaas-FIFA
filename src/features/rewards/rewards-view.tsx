'use client'

import { useMemo, useState } from 'react'
import { useAppStore } from '@/store/app-store'
import { SectionHeader } from '@/components/ui/section-header'
import { Segmented } from '@/components/ui/segmented'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Sheet } from '@/components/ui/sheet'
import { EmptyState } from '@/components/ui/empty-state'
import { formatNumber, cn } from '@/lib/utils'
import { Store, Sparkles } from 'lucide-react'
import type { Reward } from '@/types'

type Tab = 'offers' | 'mine'

export function RewardsView() {
  const [tab, setTab] = useState<Tab>('offers')
  const points = useAppStore((s) => (s.currentPhone ? s.users[s.currentPhone]?.points ?? 0 : 0))

  return (
    <div className="animate-fade-in-up">
      <section className="bg-brand px-5 pb-7 pt-6">
        <p className="text-[13px] font-medium text-white/70">Your points</p>
        <p className="tnum mt-2 font-serif text-[46px] font-extrabold leading-none text-gold-light">
          {formatNumber(points)}
        </p>
        <p className="mt-2.5 text-[13px] text-[var(--on-dark-dim)]">Claim rewards, redeem in store</p>
      </section>

      <div className="relative z-10 -mt-5 rounded-t-[28px] bg-bg pt-1 shadow-[0_-12px_30px_rgba(8,26,22,0.14)]">
        <SectionHeader title="How it works" />
        <div className="mx-4 overflow-hidden rounded-2xl border border-border bg-card">
          <HowRow icon="⚽" label="Predict any match" amount="Free" />
          <HowRow icon="🎯" label="Correct prediction" amount="+50 pts" />
          <HowRow icon="🏬" label="Redeem at any Anandhaas store" amount="Spend points" last />
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
          {tab === 'offers' ? <OffersTab points={points} /> : <MyRewardsTab />}
        </div>
      </div>
    </div>
  )
}

function HowRow({ icon, label, amount, last }: { icon: string; label: string; amount: string; last?: boolean }) {
  return (
    <div className={cn('flex items-center gap-3 px-4 py-3.5', !last && 'border-b border-border')}>
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gold-bg text-lg">{icon}</span>
      <span className="min-w-0 flex-1 text-sm font-medium leading-snug text-dark">{label}</span>
      <span className="shrink-0 text-right text-sm font-semibold leading-snug text-gold">{amount}</span>
    </div>
  )
}

function OffersTab({ points }: { points: number }) {
  const claimOffer = useAppStore((s) => s.claimOffer)
  const pushToast = useAppStore((s) => s.pushToast)
  const offers = useAppStore((s) => s.offers)
  const activeOffers = useMemo(() => offers.filter((o) => o.is_active), [offers])
  const [claimed, setClaimed] = useState<Reward | null>(null)

  function onClaim(offer: Reward) {
    if (offer.inventory !== null && offer.inventory <= 0) {
      pushToast('This reward is out of stock', 'error')
      return
    }
    if (points < offer.points_cost) {
      pushToast('Not enough points yet — predict more matches', 'error')
      return
    }
    const ok = claimOffer(offer)
    if (ok) setClaimed(offer)
    else pushToast('You’ve already claimed this offer', 'info')
  }

  if (activeOffers.length === 0)
    return (
      <EmptyState icon={Sparkles} title="No offers yet" description="Check back soon for sweet rewards." />
    )

  return (
    <>
      <div className="flex flex-col gap-2.5">
        {activeOffers.map((o) => {
          const soldOut = o.inventory !== null && o.inventory <= 0
          const can = !soldOut && points >= o.points_cost
          return (
            <div key={o.id} className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3.5">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gold-bg text-2xl">
                {o.icon}
              </span>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold text-dark">{o.title}</div>
                <div className="mt-0.5 text-xs leading-snug text-muted">{o.description}</div>
                <div className="mt-1.5 flex items-center gap-2 text-xs font-bold text-gold">
                  {o.points_cost} points
                  {o.inventory !== null && (
                    <span className="font-medium text-muted">· {o.inventory} left</span>
                  )}
                </div>
              </div>
              <Button
                size="sm"
                variant={can ? 'primary' : 'outline'}
                disabled={soldOut}
                onClick={() => onClaim(o)}
                className="shrink-0 px-3"
              >
                {soldOut ? 'Sold out' : can ? 'Claim' : 'Locked'}
              </Button>
            </div>
          )
        })}
      </div>
      <ClaimModal offer={claimed} onClose={() => setClaimed(null)} />
    </>
  )
}

function ClaimModal({ offer, onClose }: { offer: Reward | null; onClose: () => void }) {
  return (
    <Sheet open={!!offer} onClose={onClose} labelledBy="claim-title">
      {offer && (
        <div className="flex flex-col items-center pb-2 text-center">
          <span className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gold-bg text-3xl">
            {offer.icon}
          </span>
          <h2 id="claim-title" className="font-serif text-xl font-bold text-dark">
            {offer.title} reserved!
          </h2>
          <div className="mt-4 flex items-start gap-3 rounded-2xl bg-bg p-4 text-left">
            <Store className="mt-0.5 h-5 w-5 shrink-0 text-gold" />
            <p className="text-sm leading-relaxed text-mid">
              Your points have been used for this reward. Visit your nearest <strong className="text-dark">Anandhaas</strong> store and share your phone number so our staff can verify and apply it.
            </p>
          </div>
          <p className="mt-3 text-xs text-muted">Find it under “My rewards” anytime.</p>
          <Button block size="lg" className="mt-5" onClick={onClose}>
            Got it
          </Button>
        </div>
      )}
    </Sheet>
  )
}

function MyRewardsTab() {
  const allClaims = useAppStore((s) => s.claims)
  const currentPhone = useAppStore((s) => s.currentPhone)
  const claims = useMemo(
    () => allClaims.filter((c) => c.phone === currentPhone),
    [allClaims, currentPhone]
  )

  if (claims.length === 0)
    return (
      <EmptyState
        icon={Sparkles}
        title="No rewards yet"
        description="Claim an offer and it’ll appear here to show in store."
      />
    )

  return (
    <div className="flex flex-col gap-2.5">
      {claims.map((c) => (
        <div key={c.id} className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3.5">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gold-bg text-xl">
            🎁
          </span>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-semibold text-dark">{c.offerTitle}</div>
            <div className="mt-0.5 text-xs leading-snug text-muted">
              {c.status === 'pending' ? 'Show your phone number in store' : 'Redeemed'} · {c.pointsCost} pts
            </div>
          </div>
          <Badge variant={c.status === 'pending' ? 'gold' : 'green'} size="md" className="shrink-0">
            {c.status === 'pending' ? 'Ready' : 'Redeemed'}
          </Badge>
        </div>
      ))}
    </div>
  )
}
