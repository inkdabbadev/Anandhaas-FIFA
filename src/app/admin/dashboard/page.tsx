import { AdminHeader, StatCard } from '@/components/admin/admin-ui'
import { ADMIN_STATS, ADMIN_PURCHASES } from '@/lib/mock/admin-data'
import { formatINR, formatNumber } from '@/lib/utils'
import { getActiveCampaign } from '@/config/campaign'
import { Badge } from '@/components/ui/badge'

export default function AdminDashboard() {
  const campaign = getActiveCampaign()
  const s = ADMIN_STATS

  return (
    <div>
      <AdminHeader
        title="Dashboard"
        subtitle={`Active campaign · ${campaign.name}`}
        action={<Badge variant="green" size="md">● Live</Badge>}
      />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
        <StatCard label="Total users" value={formatNumber(s.totalUsers)} hint="All-time registrations" />
        <StatCard label="Active this week" value={formatNumber(s.activeThisWeek)} hint="Made ≥1 prediction" accent />
        <StatCard label="Predictions today" value={formatNumber(s.predictionsToday)} />
        <StatCard label="Pending results" value={s.pendingResults} hint="Need settlement" />
        <StatCard label="Tokens issued" value={formatNumber(s.tokensIssued)} />
        <StatCard label="Tokens redeemed" value={formatNumber(s.tokensRedeemed)} />
        <StatCard label="Attributed revenue" value={formatINR(s.revenueInr)} hint="This season" accent />
        <StatCard
          label="Redemption rate"
          value={`${Math.round((s.tokensRedeemed / s.tokensIssued) * 100)}%`}
        />
      </div>

      <h2 className="mb-3 mt-8 font-serif text-lg font-bold text-dark">Recent purchases</h2>
      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        {ADMIN_PURCHASES.map((p, i) => (
          <div
            key={p.id}
            className={`flex items-center justify-between px-4 py-3 text-sm ${i < ADMIN_PURCHASES.length - 1 ? 'border-b border-border' : ''}`}
          >
            <div>
              <span className="font-medium text-dark">{p.user}</span>
              <span className="ml-2 text-xs text-muted">{p.source}</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-mid">{formatINR(p.amount)}</span>
              <Badge variant="gold">+{p.tokens} tokens</Badge>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
