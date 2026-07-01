'use client'

import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useAppStore } from '@/store/app-store'

const AUTH_ENTRY_PATHS = new Set(['/welcome', '/login'])

export function SessionRestorer() {
  const pathname = usePathname()
  const router = useRouter()
  const currentPhone = useAppStore((s) => s.currentPhone)
  const sessionChecked = useAppStore((s) => s.sessionChecked)
  const restoreSessionUser = useAppStore((s) => s.restoreSessionUser)

  useEffect(() => {
    if (!sessionChecked) restoreSessionUser()
  }, [restoreSessionUser, sessionChecked])

  useEffect(() => {
    if (sessionChecked && currentPhone && AUTH_ENTRY_PATHS.has(pathname)) {
      router.replace('/home')
    }
  }, [currentPhone, pathname, router, sessionChecked])

  return null
}
