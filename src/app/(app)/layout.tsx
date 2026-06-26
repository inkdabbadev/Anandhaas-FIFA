import { AppShell } from '@/components/layout/app-shell'
import { StoreHydrator } from '@/components/layout/store-hydrator'
import { getCurrentUser, getPredictions } from '@/services/data-service'

/**
 * Authenticated app group. In Phase 2 this layout (a Server Component) also
 * enforces the session — redirecting to /login when there is no user — while
 * the data fetch becomes a real Supabase query.
 */
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const [user, predictions] = await Promise.all([getCurrentUser(), getPredictions()])

  return (
    <>
      <StoreHydrator user={user} predictions={predictions} />
      <AppShell>{children}</AppShell>
    </>
  )
}
