import { AdminHeader, DataTable, Td } from '@/components/admin/admin-ui'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ADMIN_MATCHES } from '@/lib/mock/admin-data'
import { matchTimeLabel } from '@/lib/utils'

const STATUS_VARIANT = {
  live: 'red',
  upcoming: 'gold',
  finished: 'green',
  cancelled: 'muted',
} as const

export default function AdminMatches() {
  return (
    <div>
      <AdminHeader
        title="Matches"
        subtitle="Create fixtures, set token costs and prediction windows"
        action={<Button size="sm">+ New match</Button>}
      />
      <DataTable columns={['Fixture', 'Competition', 'Kickoff', 'Token cost', 'Status', '']}>
        {ADMIN_MATCHES.map((m) => (
          <tr key={m.id}>
            <Td className="font-medium text-dark">
              {m.home_team.flag} {m.home_team.name} vs {m.away_team.flag} {m.away_team.name}
            </Td>
            <Td>
              {m.competition} · {m.group_name}
            </Td>
            <Td>{matchTimeLabel(m.kickoff_at, m.status)}</Td>
            <Td>{m.token_cost}</Td>
            <Td>
              <Badge variant={STATUS_VARIANT[m.status]} size="md">
                {m.status}
              </Badge>
            </Td>
            <Td>
              <button className="text-xs font-semibold text-gold">Edit</button>
            </Td>
          </tr>
        ))}
      </DataTable>
      <p className="mt-3 text-xs text-muted">
        Predictions auto-close 10 minutes before kickoff. Results are entered on the Results tab,
        which triggers settlement and points payout.
      </p>
    </div>
  )
}
