'use client'

import { useEffect } from 'react'
import { createPortal } from 'react-dom'
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

  if (typeof document === 'undefined') return null

  return createPortal(
    <div
      className={cn(
        'fixed inset-0 z-[1000] flex items-end justify-center bg-[rgba(8,26,22,0.54)] px-0 backdrop-blur-md transition-opacity duration-200',
        open ? 'opacity-100' : 'pointer-events-none opacity-0'
      )}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        className={cn(
          'max-h-[min(92dvh,760px)] w-full max-w-[430px] overflow-y-auto rounded-t-[28px] border border-white/60 bg-bg/95 px-5 pb-[calc(2rem+env(safe-area-inset-bottom))] shadow-[0_-20px_70px_rgba(8,26,22,0.36)] thin-scrollbar backdrop-blur-xl transition-transform duration-300 [transition-timing-function:cubic-bezier(0.32,0.72,0,1)]',
          open ? 'translate-y-0' : 'translate-y-full'
        )}
      >
        <div className="mx-auto mb-4 mt-3 h-1.5 w-10 rounded-full bg-border-2" aria-hidden />
        {children}
      </div>
    </div>,
    document.body
  )
}
