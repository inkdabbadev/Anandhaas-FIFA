'use client'

import { useAppStore } from '@/store/app-store'
import { cn } from '@/lib/utils'
import { CheckCircle2, XCircle, Info } from 'lucide-react'

const ICONS = {
  success: CheckCircle2,
  error: XCircle,
  info: Info,
}

const STYLES = {
  success: 'bg-green text-white shadow-[0_4px_16px_rgba(26,92,53,0.3)]',
  error: 'bg-red text-white shadow-[0_4px_16px_rgba(140,32,32,0.3)]',
  info: 'bg-dark text-gold-light shadow-[0_4px_16px_rgba(26,20,13,0.3)]',
}

export function ToastViewport() {
  const toasts = useAppStore((s) => s.toasts)

  return (
    <div className="pointer-events-none fixed inset-x-0 top-4 z-[300] flex flex-col items-center gap-2 px-4">
      {toasts.map((t) => {
        const Icon = ICONS[t.type]
        return (
          <div
            key={t.id}
            role="status"
            className={cn(
              'pointer-events-auto flex max-w-sm items-center gap-2 rounded-2xl px-4 py-3 text-sm font-medium animate-fade-in-up',
              STYLES[t.type]
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            <span>{t.message}</span>
          </div>
        )
      })}
    </div>
  )
}
