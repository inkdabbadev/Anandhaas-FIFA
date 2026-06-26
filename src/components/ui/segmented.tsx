'use client'

import { cn } from '@/lib/utils'

interface SegmentedProps<T extends string> {
  value: T
  onChange: (v: T) => void
  options: { value: T; label: string }[]
  className?: string
}

export function Segmented<T extends string>({ value, onChange, options, className }: SegmentedProps<T>) {
  return (
    <div className={cn('flex gap-1 rounded-xl border border-border bg-card p-1', className)} role="tablist">
      {options.map((o) => {
        const active = o.value === value
        return (
          <button
            key={o.value}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(o.value)}
            className={cn(
              'flex-1 rounded-lg px-3 py-2 text-xs font-semibold transition-colors',
              active ? 'bg-gold text-dark' : 'text-muted'
            )}
          >
            {o.label}
          </button>
        )
      })}
    </div>
  )
}
