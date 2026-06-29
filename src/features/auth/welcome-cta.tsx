'use client'

import Link from 'next/link'
import { useAppStore } from '@/store/app-store'

export function WelcomeCta() {
  const currentPhone = useAppStore((s) => s.currentPhone)
  const signedIn = !!currentPhone
  const href = signedIn ? '/home' : '/login'
  const label = signedIn ? 'Continue' : 'Get started'

  return (
    <div className="mt-auto space-y-3 pt-6">
      <Link
        href={href}
        className="flex h-12 w-full items-center justify-center rounded-2xl bg-bg text-sm font-semibold text-dark shadow-[0_10px_24px_rgba(243,246,242,0.18)] transition-all hover:bg-white active:scale-[0.98]"
      >
        {label}
      </Link>
      <p className="text-center text-xs text-[var(--on-dark-dim)]">
        {signedIn ? 'You are signed in' : 'Sign in with your phone'}
      </p>
    </div>
  )
}
