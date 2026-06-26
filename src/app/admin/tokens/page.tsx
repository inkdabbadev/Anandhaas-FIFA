import { AdminHeader, StatCard } from '@/components/admin/admin-ui'
import { ADMIN_STATS } from '@/lib/mock/admin-data'
import { ManualGrantForm } from '@/components/admin/manual-grant-form'
import { formatNumber } from '@/lib/utils'

export default function AdminTokens() {
  const s = ADMIN_STATS
  return (
    <div>
      <AdminHeader title="Tokens" subtitle="Issue manual grants and monitor the token economy" />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Tokens issued" value={formatNumber(s.tokensIssued)} />
        <StatCard label="Tokens redeemed" value={formatNumber(s.tokensRedeemed)} />
        <StatCard label="In circulation" value={formatNumber(s.tokensIssued - s.tokensRedeemed)} accent />
        <StatCard label="Expiring (30d)" value={formatNumber(1240)} hint="Auto-expire policy" />
      </div>

      <div className="mt-8 max-w-md">
        <h2 className="mb-3 font-serif text-lg font-bold text-dark">Manual token grant</h2>
        <ManualGrantForm />
      </div>
    </div>
  )
}
