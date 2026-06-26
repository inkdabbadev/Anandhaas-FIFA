import { AdminHeader, StatCard } from '@/components/admin/admin-ui'
import { ADMIN_STATS } from '@/lib/mock/admin-data'
import { formatINR, formatNumber } from '@/lib/utils'

const ENGAGEMENT = [
  { day: 'Mon', value: 62 },
  { day: 'Tue', value: 71 },
  { day: 'Wed', value: 80 },
  { day: 'Thu', value: 68 },
  { day: 'Fri', value: 92 },
  { day: 'Sat', value: 100 },
  { day: 'Sun', value: 85 },
]

export default function AdminReports() {
  const s = ADMIN_STATS
  return (
    <div>
      <AdminHeader title="Reports & analytics" subtitle="Engagement, retention and loyalty impact" />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Attributed revenue" value={formatINR(s.revenueInr)} accent />
        <StatCard label="Repeat-purchase rate" value="47%" hint="vs 31% pre-campaign" />
        <StatCard label="Avg predictions / user" value="6.4" />
        <StatCard label="Weekly active" value={formatNumber(s.activeThisWeek)} />
      </div>

      <h2 className="mb-4 mt-8 font-serif text-lg font-bold text-dark">Daily engagement</h2>
      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="flex h-48 items-end justify-between gap-3">
          {ENGAGEMENT.map((d) => (
            <div key={d.day} className="flex flex-1 flex-col items-center gap-2">
              <div className="flex w-full flex-1 items-end">
                <div
                  className="w-full rounded-t-lg bg-gold transition-all"
                  style={{ height: `${d.value}%` }}
                  title={`${d.value}% active`}
                />
              </div>
              <span className="text-xs text-muted">{d.day}</span>
            </div>
          ))}
        </div>
      </div>

      <p className="mt-4 text-xs text-muted">
        Exports (CSV / PDF) and cohort retention curves are part of the Phase 4 analytics roadmap.
      </p>
    </div>
  )
}
