import { AdminHeader, DataTable, Td } from '@/components/admin/admin-ui'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ADMIN_REWARDS, ADMIN_REDEMPTIONS } from '@/lib/mock/admin-data'

export default function AdminRewards() {
  return (
    <div className="space-y-8">
      <div>
        <AdminHeader
          title="Rewards"
          subtitle="Configure catalogue, points cost & inventory"
          action={<Button size="sm">+ New reward</Button>}
        />
        <DataTable columns={['Reward', 'Points', 'Inventory', 'Status', '']}>
          {ADMIN_REWARDS.map((r) => (
            <tr key={r.id}>
              <Td className="font-medium text-dark">
                {r.icon} {r.title}
              </Td>
              <Td>{r.points_cost}</Td>
              <Td>{r.inventory ?? '∞'}</Td>
              <Td>
                <Badge variant={r.is_active ? 'green' : 'muted'} size="md">
                  {r.is_active ? 'Active' : 'Hidden'}
                </Badge>
              </Td>
              <Td>
                <button className="text-xs font-semibold text-gold">Edit</button>
              </Td>
            </tr>
          ))}
        </DataTable>
      </div>

      <div>
        <h2 className="mb-3 font-serif text-lg font-bold text-dark">Redemptions & QR approval</h2>
        <DataTable columns={['Customer', 'Reward', 'QR code', 'Status', 'When']}>
          {ADMIN_REDEMPTIONS.map((r) => (
            <tr key={r.id}>
              <Td className="font-medium text-dark">{r.user}</Td>
              <Td>{r.reward}</Td>
              <Td className="font-mono text-xs">{r.qr}</Td>
              <Td>
                <Badge variant={r.status === 'active' ? 'gold' : 'green'} size="md">
                  {r.status}
                </Badge>
              </Td>
              <Td>{r.at}</Td>
            </tr>
          ))}
        </DataTable>
      </div>
    </div>
  )
}
