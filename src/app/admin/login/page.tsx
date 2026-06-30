import type { Metadata } from 'next'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { ADMIN_AUTH_COOKIE, ADMIN_AUTH_VALUE, getSafeAdminNextPath } from '@/lib/admin-auth'
import { AdminLoginForm } from './admin-login-form'

export const metadata: Metadata = {
  title: 'Admin Login',
}

type AdminLoginPageProps = {
  searchParams?: Promise<{
    next?: string | string[]
  }>
}

export default async function AdminLoginPage({ searchParams }: AdminLoginPageProps) {
  const params = await searchParams
  const nextPath = getSafeAdminNextPath(Array.isArray(params?.next) ? params.next[0] : params?.next)
  const cookieStore = await cookies()
  const authenticated = cookieStore.get(ADMIN_AUTH_COOKIE)?.value === ADMIN_AUTH_VALUE

  if (authenticated) {
    redirect(nextPath)
  }

  return (
    <main className="min-h-screen bg-dark px-5 py-10 text-bg">
      <section className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-md items-center">
        <div className="w-full overflow-hidden rounded-[28px] border border-dark-3 bg-brand p-6 shadow-pop sm:p-8">
          <div className="mb-8">
            <p className="mb-2 text-sm font-bold text-gold-light">FIFA Fan Fest</p>
            <h1 className="font-serif text-3xl font-black leading-tight text-white">
              Admin access
            </h1>
            <p className="mt-3 text-sm leading-6 text-[var(--on-dark-dim)]">
              Enter the admin password to manage teams, matches, and results.
            </p>
          </div>

          <AdminLoginForm nextPath={nextPath} />
        </div>
      </section>
    </main>
  )
}
