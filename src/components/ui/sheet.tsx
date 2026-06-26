'use client'

import { useEffect } from 'react'
import { cn } from '@/lib/utils'

interface SheetProps {
  open: boolean
  onClose: () => void
  children: React.ReactNode
  labelledBy?: string
}

/** Accessible bottom sheet with backdrop, scroll-lock and Esc-to-close. */
export function Sheet({ open, onClose, children, labelledBy }: SheetProps) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  return (
    <div
      className={cn(
        'fixed inset-0 z-[200] flex items-end justify-center bg-[rgba(20,12,4,0.75)] transition-opacity duration-200',
        open ? 'opacity-100' : 'pointer-events-none opacity-0'
      )}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        className={cn(
          'max-h-[92vh] w-full max-w-[430px] overflow-y-auto rounded-t-[28px] bg-bg px-5 pb-8 shadow-pop thin-scrollbar transition-transform duration-300 [transition-timing-function:cubic-bezier(0.32,0.72,0,1)]',
          open ? 'translate-y-0' : 'translate-y-full'
        )}
      >
        <div className="mx-auto mb-4 mt-3 h-1.5 w-10 rounded-full bg-border-2" aria-hidden />
        {children}
      </div>
    </div>
  )
}
