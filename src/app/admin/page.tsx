import type { Metadata } from 'next'
import Link from 'next/link'
import {
  BarChart3,
  CalendarDays,
  CheckCircle2,
  Gift,
  ListChecks,
  TicketCheck,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardBody } from '@/components/ui/card'
import { createAdminClient } from '@/lib/supabase/server'
import { cn, formatNumber } from '@/lib/utils'

export const metadata: Metadata = {
  title: 'Admin Dashboard',
}

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type DashboardTab = 'matches' | 'coupons'

type AdminPageProps = {
  searchParams?: Promise<{
    tab?: string | string[]
  }>
}

type TeamRow = {
  id: string
  name: string
  code: string
  flag_url: string | null
}

type MatchRow = {
  id: string
  stage: string | null
  group_name: string | null
  starts_at: string
  status: string
  team1_score: number | null
  team2_score: number | null
  winning_pick: string | null
  team1: TeamRow | TeamRow[] | null
  team2: TeamRow | TeamRow[] | null
}

type MatchCardData = Omit<MatchRow, 'team1' | 'team2'> & {
  team1: TeamRow | null
  team2: TeamRow | null
  predictionsCount: number
  wonCount: number
}

type PredictionRow = {
  match_id: string
  is_correct: boolean | null
}

type RewardOfferRow = {
  id: string
  title: string
  description: string | null
  icon: string | null
  points_cost: number
  inventory: number | null
  is_active: boolean
  expires_at: string | null
}

type RewardClaimRow = {
  offer_id: string
  status: string
}

type CouponCardData = RewardOfferRow & {
  claimsCount: number
  redeemedCount: number
  pendingCount: number
}

type DashboardData = {
  totalPredictions: number
  correctPredictions: number
  matches: MatchCardData[]
  coupons: CouponCardData[]
  error: string | null
}

export default async function AdminPage({ searchParams }: AdminPageProps) {
  const params = await searchParams
  const tabValue = Array.isArray(params?.tab) ? params.tab[0] : params?.tab
  const activeTab: DashboardTab = tabValue === 'coupons' ? 'coupons' : 'matches'
  const data = await getDashboardData()

  return (
    <main className="min-h-dvh bg-bg px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <header className="rounded-3xl bg-brand px-5 py-7 text-bg shadow-pop sm:px-7">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="flex w-fit items-center gap-2 rounded-full border border-white/10 bg-white/[0.08] px-3 py-1 text-xs font-semibold text-gold-light">
                <BarChart3 className="h-3.5 w-3.5" />
                Admin dashboard
              </div>
              <h1 className="mt-4 font-serif text-3xl font-extrabold sm:text-4xl">Shop dashboard</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--on-dark-dim)]">
                Track prediction results by match and coupon activity by reward offer.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <AdminLink href="/admin" active icon={BarChart3} label="Dashboard" />
              <AdminLink href="/admin/reedem" icon={TicketCheck} label="Redeem" />
            </div>
          </div>
        </header>

        {data.error && (
          <p className="rounded-2xl border border-red/20 bg-red-bg px-4 py-3 text-sm font-semibold text-red">
            {data.error}
          </p>
        )}

        <section className="grid gap-4 sm:grid-cols-2">
          <SummaryCard
            icon={ListChecks}
            label="Total predictions"
            value={data.totalPredictions}
            note="All locked match predictions"
          />
          <SummaryCard
            icon={CheckCircle2}
            label="Correct predictions"
            value={data.correctPredictions}
            note="Predictions marked as won"
          />
        </section>

        <section className="rounded-3xl border border-border bg-card p-2 shadow-card">
          <div className="grid grid-cols-2 gap-2">
            <TabLink href="/admin?tab=matches" active={activeTab === 'matches'} icon={CalendarDays} label="Matches" />
            <TabLink href="/admin?tab=coupons" active={activeTab === 'coupons'} icon={Gift} label="Coupons" />
          </div>
        </section>

        {activeTab === 'matches' ? <MatchesGrid matches={data.matches} /> : <CouponsGrid coupons={data.coupons} />}
      </div>
    </main>
  )
}

function SummaryCard({
  icon: Icon,
  label,
  value,
  note,
}: {
  icon: typeof BarChart3
  label: string
  value: number
  note: string
}) {
  return (
    <Card className="rounded-3xl">
      <CardBody className="flex min-h-32 items-center gap-4 p-5">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gold-bg text-gold">
          <Icon className="h-5 w-5" />
        </span>
        <span className="min-w-0">
          <span className="block text-sm font-semibold text-muted">{label}</span>
          <span className="tnum mt-1 block text-4xl font-black leading-none text-dark">{formatNumber(value)}</span>
          <span className="mt-2 block text-xs font-medium text-muted">{note}</span>
        </span>
      </CardBody>
    </Card>
  )
}

function MatchesGrid({ matches }: { matches: MatchCardData[] }) {
  if (matches.length === 0) {
    return <EmptyDashboardCard icon={CalendarDays} title="No matches yet" />
  }

  return (
    <section className="flex flex-col gap-4">
      {matches.map((match) => (
        <MatchDashboardCard key={match.id} match={match} />
      ))}
    </section>
  )
}

function MatchDashboardCard({ match }: { match: MatchCardData }) {
  const cancelled = match.status === 'cancelled'
  const finished = match.status === 'completed' || match.status === 'finished'

  return (
    <Card className={cn('rounded-3xl', cancelled && 'border-red/20 bg-red-bg/50')}>
      <CardBody className="grid gap-4 p-5 lg:grid-cols-[minmax(260px,0.85fr)_minmax(360px,1.3fr)_minmax(220px,0.65fr)] lg:items-center">
        <div className="flex min-w-0 flex-col gap-4">
          <div className="min-w-0">
            <p className="truncate text-xs font-bold uppercase text-gold">{match.stage ?? 'Match'}</p>
            <h2 className="mt-1 text-xl font-black leading-tight text-dark">
              {match.team1?.name ?? 'Team 1'} vs {match.team2?.name ?? 'Team 2'}
            </h2>
            <p className="mt-1 truncate text-xs font-medium text-muted">
              {match.group_name ?? formatDateTime(match.starts_at)}
            </p>
          </div>
          <div>
            <StatusBadge status={match.status} />
          </div>
        </div>

        {cancelled ? (
          <div className="flex min-h-24 items-center justify-center rounded-2xl border border-red/20 bg-white px-3 text-sm font-bold text-red">
            Cancelled
          </div>
        ) : (
          <div className="grid min-h-24 grid-cols-[1fr_auto_1fr] items-center gap-4 rounded-2xl bg-bg p-4">
            <TeamMini team={match.team1} align="right" />
            <span className="tnum min-w-14 rounded-xl bg-white px-3 py-2 text-center text-sm font-black text-dark shadow-card">
              {finished ? scoreLabel(match) : 'VS'}
            </span>
            <TeamMini team={match.team2} align="left" />
          </div>
        )}

        <div className={cn('grid gap-3', finished ? 'grid-cols-2 lg:grid-cols-1' : 'grid-cols-1')}>
          <MetricTile label="Predictions" value={match.predictionsCount} />
          {finished && <MetricTile label="Won" value={match.wonCount} />}
        </div>
      </CardBody>
    </Card>
  )
}

function CouponsGrid({ coupons }: { coupons: CouponCardData[] }) {
  if (coupons.length === 0) {
    return <EmptyDashboardCard icon={Gift} title="No coupons yet" />
  }

  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {coupons.map((coupon) => (
        <CouponDashboardCard key={coupon.id} coupon={coupon} />
      ))}
    </section>
  )
}

function CouponDashboardCard({ coupon }: { coupon: CouponCardData }) {
  return (
    <Card className={cn('rounded-3xl', !coupon.is_active && 'opacity-75')}>
      <CardBody className="p-5">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase text-gold">{formatNumber(coupon.points_cost)} points</p>
            <h2 className="mt-1 truncate text-lg font-black text-dark">{coupon.title}</h2>
            <p className="mt-1 line-clamp-2 text-xs font-medium leading-5 text-muted">
              {coupon.description || 'Coupon reward'}
            </p>
          </div>
          <Badge variant={coupon.is_active ? 'green' : 'muted'} size="md">
            {coupon.is_active ? 'Active' : 'Inactive'}
          </Badge>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <MetricTile label="Claims" value={coupon.claimsCount} />
          <MetricTile label="Redeemed" value={coupon.redeemedCount} />
        </div>

        <div className="mt-3 flex items-center justify-between gap-3 rounded-2xl bg-bg px-3 py-3 text-xs font-semibold">
          <span className="text-muted">Pending</span>
          <span className="tnum text-dark">{formatNumber(coupon.pendingCount)}</span>
          <span className="ml-auto text-muted">Inventory</span>
          <span className="tnum text-dark">{coupon.inventory == null ? 'Unlimited' : formatNumber(coupon.inventory)}</span>
        </div>
      </CardBody>
    </Card>
  )
}

function MetricTile({
  label,
  value,
  muted,
}: {
  label: string
  value: number | null
  muted?: boolean
}) {
  return (
    <div className="rounded-2xl border border-border bg-white px-3 py-3">
      <p className="text-xs font-semibold text-muted">{label}</p>
      <p className={cn('tnum mt-1 text-2xl font-black leading-none text-dark', muted && 'text-muted')}>
        {value == null ? '-' : formatNumber(value)}
      </p>
    </div>
  )
}

function EmptyDashboardCard({ icon: Icon, title }: { icon: typeof CalendarDays; title: string }) {
  return (
    <Card className="rounded-3xl">
      <CardBody className="flex min-h-44 flex-col items-center justify-center gap-3 p-6 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gold-bg text-gold">
          <Icon className="h-5 w-5" />
        </span>
        <p className="text-sm font-bold text-muted">{title}</p>
      </CardBody>
    </Card>
  )
}

function AdminLink({
  href,
  active,
  icon: Icon,
  label,
}: {
  href: string
  active?: boolean
  icon: typeof BarChart3
  label: string
}) {
  return (
    <Link
      href={href}
      className={`inline-flex h-10 items-center gap-2 rounded-xl border px-3 text-sm font-semibold transition ${
        active
          ? 'border-gold-light bg-white text-dark'
          : 'border-white/10 bg-white/[0.08] text-bg hover:bg-white/[0.14]'
      }`}
    >
      <Icon className="h-4 w-4" />
      {label}
    </Link>
  )
}

function TabLink({
  href,
  active,
  icon: Icon,
  label,
}: {
  href: string
  active: boolean
  icon: typeof CalendarDays
  label: string
}) {
  return (
    <Link
      href={href}
      className={cn(
        'inline-flex h-12 items-center justify-center gap-2 rounded-2xl text-sm font-black transition',
        active ? 'bg-dark text-bg shadow-card' : 'text-muted hover:bg-bg hover:text-dark'
      )}
    >
      <Icon className="h-4 w-4" />
      {label}
    </Link>
  )
}

function StatusBadge({ status }: { status: string }) {
  const variant =
    status === 'cancelled' ? 'red' : status === 'completed' || status === 'finished' ? 'green' : 'gold'

  return (
    <Badge variant={variant} size="md" className="capitalize">
      {status === 'completed' ? 'finished' : status}
    </Badge>
  )
}

function TeamMini({ team, align }: { team: TeamRow | null; align: 'left' | 'right' }) {
  return (
    <div className={cn('min-w-0', align === 'right' && 'text-right')}>
      <p className="truncate text-sm font-black text-dark">{team?.name ?? 'Unknown'}</p>
      <p className="mt-0.5 truncate text-[11px] font-semibold text-muted">{team?.code ?? '---'}</p>
    </div>
  )
}

function scoreLabel(match: MatchCardData): string {
  if (match.team1_score == null || match.team2_score == null) return 'FT'
  return `${match.team1_score}-${match.team2_score}`
}

function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

async function getDashboardData(): Promise<DashboardData> {
  try {
    const admin = createAdminClient()
    const [matchesResult, predictionsResult, offersResult, claimsResult] = await Promise.all([
      admin
        .from('matches')
        .select(
          'id,stage,group_name,starts_at,status,team1_score,team2_score,winning_pick,team1:teams!matches_team1_id_fkey(id,name,code,flag_url),team2:teams!matches_team2_id_fkey(id,name,code,flag_url)'
        )
        .order('starts_at', { ascending: true }),
      admin.from('predictions').select('match_id,is_correct'),
      admin
        .from('reward_offers')
        .select('id,title,description,icon,points_cost,inventory,is_active,expires_at')
        .order('is_active', { ascending: false })
        .order('points_cost', { ascending: true }),
      admin.from('reward_claims').select('offer_id,status'),
    ])

    const firstError = matchesResult.error ?? predictionsResult.error ?? offersResult.error ?? claimsResult.error
    if (firstError) {
      return emptyDashboard(firstError.message)
    }

    const predictions = (predictionsResult.data ?? []) as PredictionRow[]
    const claims = (claimsResult.data ?? []) as RewardClaimRow[]
    const predictionStats = countPredictionsByMatch(predictions)
    const claimStats = countClaimsByOffer(claims)

    return {
      totalPredictions: predictions.length,
      correctPredictions: predictions.filter((prediction) => prediction.is_correct === true).length,
      matches: ((matchesResult.data ?? []) as MatchRow[]).map((match) => ({
        ...match,
        team1: firstTeam(match.team1),
        team2: firstTeam(match.team2),
        predictionsCount: predictionStats.get(match.id)?.total ?? 0,
        wonCount: predictionStats.get(match.id)?.won ?? 0,
      })),
      coupons: ((offersResult.data ?? []) as RewardOfferRow[]).map((offer) => ({
        ...offer,
        claimsCount: claimStats.get(offer.id)?.total ?? 0,
        redeemedCount: claimStats.get(offer.id)?.redeemed ?? 0,
        pendingCount: claimStats.get(offer.id)?.pending ?? 0,
      })),
      error: null,
    }
  } catch (error) {
    return emptyDashboard(error instanceof Error ? error.message : 'Could not load dashboard.')
  }
}

function countPredictionsByMatch(predictions: PredictionRow[]) {
  const stats = new Map<string, { total: number; won: number }>()

  for (const prediction of predictions) {
    const current = stats.get(prediction.match_id) ?? { total: 0, won: 0 }
    current.total += 1
    if (prediction.is_correct === true) current.won += 1
    stats.set(prediction.match_id, current)
  }

  return stats
}

function countClaimsByOffer(claims: RewardClaimRow[]) {
  const stats = new Map<string, { total: number; redeemed: number; pending: number }>()

  for (const claim of claims) {
    const current = stats.get(claim.offer_id) ?? { total: 0, redeemed: 0, pending: 0 }
    current.total += 1
    if (claim.status === 'redeemed') current.redeemed += 1
    if (claim.status === 'pending') current.pending += 1
    stats.set(claim.offer_id, current)
  }

  return stats
}

function firstTeam(team: TeamRow | TeamRow[] | null): TeamRow | null {
  if (Array.isArray(team)) return team[0] ?? null
  return team
}

function emptyDashboard(message: string): DashboardData {
  return {
    totalPredictions: 0,
    correctPredictions: 0,
    matches: [],
    coupons: [],
    error: message,
  }
}
