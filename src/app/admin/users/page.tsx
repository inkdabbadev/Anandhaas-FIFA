import { AdminHeader, DataTable, Td } from '@/components/admin/admin-ui'
import { Badge } from '@/components/ui/badge'
import { ADMIN_USERS } from '@/lib/mock/admin-data'
import { tierByKey } from '@/constants'
import { formatNumber } from '@/lib/utils'

export default function AdminUsers() {
  return (
    <div>
      <AdminHeader title="Users" subtitle={`${formatNumber(ADMIN_USERS.length)} shown · search & manage members`} />
      <DataTable columns={['Name', 'Phone', 'Tier', 'Season pts', 'Tokens', 'Predictions', 'Joined']}>
        {ADMIN_USERS.map((u) => (
          <tr key={u.id}>
            <Td className="font-medium text-dark">{u.name}</Td>
            <Td>{u.phone}</Td>
            <Td>
              <Badge variant="muted" size="md">
                {tierByKey(u.tier).name}
              </Badge>
            </Td>
            <Td>{formatNumber(u.seasonPoints)}</Td>
            <Td>{u.tokenBalance}</Td>
            <Td>{u.predictions}</Td>
            <Td>{u.joined}</Td>
          </tr>
        ))}
      </DataTable>
    </div>
  )
}
