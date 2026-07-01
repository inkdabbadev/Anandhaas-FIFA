'use client'

import { ReactNode } from 'react'
import { ToastViewport } from '@/components/ui/toast'
import { SessionRestorer } from '@/components/session-restorer'

/** Global client providers. Kept lean — Zustand needs no provider. */
export function Providers({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <ToastViewport />
      <SessionRestorer />
    </>
  )
}
