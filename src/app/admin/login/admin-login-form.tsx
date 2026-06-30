'use client'

import { LockKeyhole } from 'lucide-react'
import { useActionState } from 'react'
import { Button } from '@/components/ui/button'
import { adminLoginAction, type AdminLoginState } from './actions'

const initialState: AdminLoginState = {
  status: 'idle',
  message: '',
}

export function AdminLoginForm({ nextPath }: { nextPath: string }) {
  const [state, formAction, pending] = useActionState(adminLoginAction, initialState)

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="next" value={nextPath} />

      <label className="block space-y-2">
        <span className="text-sm font-semibold text-bg">Admin password</span>
        <span className="flex min-h-12 items-center gap-3 rounded-2xl border border-dark-3 bg-dark-2 px-4 text-bg shadow-sm focus-within:border-gold-light focus-within:ring-2 focus-within:ring-gold-light/25">
          <LockKeyhole className="h-5 w-5 shrink-0 text-gold-light" aria-hidden="true" />
          <input
            name="password"
            type="password"
            inputMode="numeric"
            autoComplete="current-password"
            className="auth-dark-input min-w-0 flex-1 bg-transparent text-base font-semibold outline-none placeholder:text-[var(--on-dark-dim)]"
            placeholder="Enter password"
            required
          />
        </span>
      </label>

      {state.status === 'error' ? (
        <p className="rounded-2xl border border-red/20 bg-red-bg px-4 py-3 text-sm font-semibold text-red">
          {state.message}
        </p>
      ) : null}

      <Button type="submit" size="lg" block disabled={pending}>
        {pending ? 'Checking...' : 'Open admin'}
      </Button>
    </form>
  )
}
