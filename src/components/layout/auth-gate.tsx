'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAppStore } from '@/store/app-store'

export function AuthGate({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const currentPhone = useAppStore((s) => s.currentPhone)
  const sessionChecked = useAppStore((s) => s.sessionChecked)
  const restoreSessionUser = useAppStore((s) => s.restoreSessionUser)

  useEffect(() => {
    if (!sessionChecked) restoreSessionUser()
  }, [restoreSessionUser, sessionChecked])

  useEffect(() => {
    if (sessionChecked && !currentPhone) router.replace('/welcome')
  }, [sessionChecked, currentPhone, router])

  if (!sessionChecked || !currentPhone) return <div className="min-h-dvh bg-brand" />
  return <>{children}</>
}
