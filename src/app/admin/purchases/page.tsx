import { AdminHeader, DataTable, Td } from '@/components/admin/admin-ui'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ADMIN_PURCHASES } from '@/lib/mock/admin-data'
import { formatINR } from '@/lib/utils'

export default function AdminPurchases() {
  return (
    <div>
      <AdminHeader
        title="Purchases"
        subtitle="Unified ledger across POS, online, CSV import & webhooks"
        action={
          <div className="flex gap-2">
            <Button size="sm" variant="outline">
              Import CSV
            </Button>
            <Button size="sm">+ Manual entry</Button>
          </div>
        }
      />
      <DataTable columns={['Ref', 'Customer', 'Source', 'Amount', 'Tokens', 'When']}>
        {ADMIN_PURCHASES.map((p) => (
          <tr key={p.id}>
            <Td className="font-mono text-xs">{p.id}</Td>
            <Td className="font-medium text-dark">{p.user}</Td>
            <Td>
              <Badge variant="muted" size="md">
                {p.source}
              </Badge>
            </Td>
            <Td>{formatINR(p.amount)}</Td>
            <Td className="text-gold">+{p.tokens}</Td>
            <Td>{p.at}</Td>
          </tr>
        ))}
      </DataTable>
      <p className="mt-3 text-xs text-muted">
        All sources flow through a single Purchase service that grants tokens (1 / ₹100) and season
        points. POS, Shopify and webhook adapters plug in without UI changes.
      </p>
    </div>
  )
}
