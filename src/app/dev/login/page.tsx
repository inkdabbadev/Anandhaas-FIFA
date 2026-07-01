import type { Metadata } from 'next'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { DEV_AUTH_COOKIE, DEV_AUTH_VALUE, getSafeDevNextPath } from '@/lib/admin-auth'
import { DevLoginForm } from './dev-login-form'

export const metadata: Metadata = {
  title: 'Developer Login',
}

type DevLoginPageProps = {
  searchParams?: Promise<{
    next?: string | string[]
  }>
}

export default async function DevLoginPage({ searchParams }: DevLoginPageProps) {
  const params = await searchParams
  const nextPath = getSafeDevNextPath(Array.isArray(params?.next) ? params.next[0] : params?.next)
  const cookieStore = await cookies()
  const authenticated = cookieStore.get(DEV_AUTH_COOKIE)?.value === DEV_AUTH_VALUE

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
              Developer access
            </h1>
            <p className="mt-3 text-sm leading-6 text-[var(--on-dark-dim)]">
              Enter the developer password to manage teams, fixtures, and match results.
            </p>
          </div>

          <DevLoginForm nextPath={nextPath} />
        </div>
      </section>
    </main>
  )
}
