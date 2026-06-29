'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAppStore } from '@/store/app-store'

export function AuthGate({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const currentPhone = useAppStore((s) => s.currentPhone)

  useEffect(() => {
    if (!currentPhone) router.replace('/welcome')
  }, [currentPhone, router])

  if (!currentPhone) return <div className="min-h-dvh bg-brand" />
  return <>{children}</>
}
