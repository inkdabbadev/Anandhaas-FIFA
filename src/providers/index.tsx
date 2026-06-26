'use client'

import { ReactNode } from 'react'
import { ToastViewport } from '@/components/ui/toast'
import { PWARegister } from '@/components/pwa-register'

/** Global client providers. Kept lean — Zustand needs no provider. */
export function Providers({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <ToastViewport />
      <PWARegister />
    </>
  )
}
