import { AdminHeader } from '@/components/admin/admin-ui'
import { ADMIN_MATCHES } from '@/lib/mock/admin-data'
import { ResultEntryCard } from '@/components/admin/result-entry-card'

export default function AdminResults() {
  const settleable = ADMIN_MATCHES.filter((m) => m.status === 'live' || m.status === 'finished')

  return (
    <div>
      <AdminHeader title="Results & settlement" subtitle="Enter final scores to settle predictions and award points" />
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {settleable.map((m) => (
          <ResultEntryCard key={m.id} match={m} />
        ))}
      </div>
    </div>
  )
}
