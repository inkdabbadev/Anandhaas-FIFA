'use client'

import { ReactNode } from 'react'
import { ToastViewport } from '@/components/ui/toast'
import { FreshAppReset } from '@/components/fresh-app-reset'

/** Global client providers. Kept lean — Zustand needs no provider. */
export function Providers({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <ToastViewport />
      <FreshAppReset />
    </>
  )
}
