'use client'

import { useEffect, useState } from 'react'
import { useAppStore } from '@/store/app-store'
import { SectionHeader } from '@/components/ui/section-header'
import { Segmented } from '@/components/ui/segmented'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { RowSkeleton } from '@/components/ui/skeleton'
import { EmptyState, ErrorState } from '@/components/ui/empty-state'
import { RewardQR } from './reward-qr'
import { getRewards, getTokenLedger, getRedemptions } from '@/services/data-service'
import { formatNumber, cn, shortCode } from '@/lib/utils'
import { ShoppingCart, CheckCircle2, Target, Flame, Users } from 'lucide-react'
import type { Reward, TokenLedger, Redemption } from '@/types'

const EARN_METHODS = [
  { icon: ShoppingCart, label: 'Purchase in store or online', amount: '1 token / ₹100' },
  { icon: CheckCircle2, label: 'Correct winner', amount: '+50 pts' },
  { icon: Target, label: 'Exact scoreline', amount: '+150 pts' },
  { icon: Flame, label: '7-day streak', amount: '+50 bonus' },
  { icon: Users, label: 'Refer a friend', amount: '3 tokens' },
]

type Tab = 'redeem' | 'history' | 'active'

export function TokensView() {
  const [tab, setTab] = useState<Tab>('redeem')
  const tokenBalance = useAppStore((s) => s.tokenBalance)

  return (
    <div className="animate-fade-in-up">
      <section className="bg-brand px-5 pb-7 pt-6">
        <p className="text-[13px] font-medium text-white/70">Your tokens</p>
        <p className="tnum mt-2 font-serif text-[46px] font-extrabold leading-none text-gold-light">
          {formatNumber(tokenBalance)}
        </p>
        <p className="mt-2.5 text-[13px] text-[var(--on-dark-dim)]">Redeem for sweets, discounts &amp; more</p>
      </section>

      <div className="relative z-10 -mt-5 rounded-t-[28px] bg-bg pt-1 shadow-[0_-12px_30px_rgba(8,26,22,0.14)]">
      <SectionHeader title="How to earn" />
      <div className="mx-4 overflow-hidden rounded-2xl border border-border bg-card">
        {EARN_METHODS.map(({ icon: Icon, label, amount }, i) => (
          <div
            key={label}
            className={cn('flex items-center gap-3 px-4 py-3.5', i < EARN_METHODS.length - 1 && 'border-b border-border')}
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gold-bg text-gold">
              <Icon className="h-[18px] w-[18px]" />
            </span>
            <span className="flex-1 text-sm font-medium text-dark">{label}</span>
            <span className="whitespace-nowrap text-sm font-semibold text-gold">{amount}</span>
          </div>
        ))}
      </div>

      <div className="px-4 pt-5">
        <Segmented
          value={tab}
          onChange={setTab}
          options={[
            { value: 'redeem', label: 'Redeem' },
            { value: 'active', label: 'My rewards' },
            { value: 'history', label: 'History' },
          ]}
        />
      </div>

      <div className="px-4 pb-2 pt-3">
        {tab === 'redeem' && <RedeemTab />}
        {tab === 'active' && <ActiveTab />}
        {tab === 'history' && <HistoryTab />}
      </div>
      </div>
    </div>
  )
}

function RedeemTab() {
  const tokenBalance = useAppStore((s) => s.tokenBalance)
  const spendTokens = useAppStore((s) => s.spendTokens)
  const pushToast = useAppStore((s) => s.pushToast)
  const [rewards, setRewards] = useState<Reward[] | null>(null)
  const [error, setError] = useState(false)

  function load() {
    setRewards(null)
    setError(false)
    getRewards().then(setRewards).catch(() => setError(true))
  }
  useEffect(load, [])

  function redeem(r: Reward) {
    spendTokens(r.points_cost)
    pushToast(`Redeemed: ${r.title} · QR ${shortCode('ANDH', 4)}`)
  }

  if (error) return <ErrorState description="Couldn’t load rewards." onRetry={load} />
  if (!rewards) return <div className="flex flex-col gap-2">{Array.from({ length: 4 }).map((_, i) => <RowSkeleton key={i} />)}</div>

  return (
    <div className="flex flex-col gap-2.5">
      {rewards.map((r) => {
        const can = tokenBalance >= r.points_cost
        return (
          <div key={r.id} className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-gold-border bg-gold-bg text-xl">
              {r.icon}
            </span>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-semibold text-dark">{r.title}</div>
              <div className="mt-0.5 text-[10px] leading-snug text-muted">{r.description}</div>
              <div className="mt-1 text-[10px] font-bold text-gold">◈ {r.points_cost} tokens</div>
            </div>
            <Button size="sm" variant={can ? 'success' : 'outline'} disabled={!can} onClick={() => redeem(r)}>
              {can ? 'Redeem' : 'Locked'}
            </Button>
          </div>
        )
      })}
    </div>
  )
}

function ActiveTab() {
  const [items, setItems] = useState<Redemption[] | null>(null)
  const [active, setActive] = useState<Redemption | null>(null)
  const [error, setError] = useState(false)

  function load() {
    setItems(null)
    setError(false)
    getRedemptions().then(setItems).catch(() => setError(true))
  }
  useEffect(load, [])

  if (error) return <ErrorState description="Couldn’t load your rewards." onRetry={load} />
  if (!items) return <div className="flex flex-col gap-2">{Array.from({ length: 2 }).map((_, i) => <RowSkeleton key={i} />)}</div>
  if (items.length === 0)
    return <EmptyState emoji="🎁" title="No active rewards" description="Redeem tokens and your QR codes appear here." />

  return (
    <>
      <div className="flex flex-col gap-2.5">
        {items.map((r) => (
          <button
            key={r.id}
            onClick={() => setActive(r)}
            className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3 text-left active:scale-[0.99]"
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-gold-border bg-gold-bg text-xl">
              {r.reward?.icon ?? '🎁'}
            </span>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-semibold text-dark">{r.reward?.title}</div>
              <div className="mt-0.5 text-[10px] text-muted">Tap to show QR · {r.qr_code}</div>
            </div>
            <Badge variant={r.status === 'active' ? 'green' : 'muted'}>{r.status}</Badge>
          </button>
        ))}
      </div>
      <RewardQR redemption={active} onClose={() => setActive(null)} />
    </>
  )
}

function HistoryTab() {
  const [ledger, setLedger] = useState<TokenLedger[] | null>(null)
  const [error, setError] = useState(false)

  function load() {
    setLedger(null)
    setError(false)
    getTokenLedger().then(setLedger).catch(() => setError(true))
  }
  useEffect(load, [])

  if (error) return <ErrorState description="Couldn’t load history." onRetry={load} />
  if (!ledger) return <div className="flex flex-col gap-2">{Array.from({ length: 4 }).map((_, i) => <RowSkeleton key={i} />)}</div>
  if (ledger.length === 0)
    return <EmptyState emoji="🧾" title="No transactions yet" description="Your token activity will show up here." />

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card">
      {ledger.map((tx, i) => (
        <div key={tx.id} className={cn('flex items-center gap-3 px-3.5 py-2.5', i < ledger.length - 1 && 'border-b border-border')}>
          <div className="flex-1">
            <div className="text-xs font-medium text-dark">{tx.note ?? tx.type}</div>
            <div className="mt-0.5 text-[10px] capitalize text-muted">
              {tx.type.replace(/_/g, ' ')} ·{' '}
              {new Date(tx.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
            </div>
          </div>
          <span className={cn('whitespace-nowrap text-sm font-bold', tx.amount >= 0 ? 'text-green' : 'text-red')}>
            {tx.amount >= 0 ? '+' : ''}
            {tx.amount}
          </span>
        </div>
      ))}
    </div>
  )
}
