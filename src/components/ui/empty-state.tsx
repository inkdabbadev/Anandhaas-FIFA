import { cn } from '@/lib/utils'
import type { LucideIcon } from 'lucide-react'

interface EmptyStateProps {
  icon?: LucideIcon
  emoji?: string
  title: string
  description?: string
  action?: React.ReactNode
  className?: string
}

export function EmptyState({ icon: Icon, emoji, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center px-6 py-12 text-center', className)}>
      <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl border border-border bg-card text-2xl">
        {emoji ?? (Icon ? <Icon className="h-6 w-6 text-muted" /> : '✨')}
      </div>
      <h3 className="font-serif text-lg font-bold text-dark">{title}</h3>
      {description && <p className="mt-1 max-w-xs text-sm text-muted">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

interface ErrorStateProps {
  title?: string
  description?: string
  onRetry?: () => void
}

export function ErrorState({ title = 'Something went wrong', description, onRetry }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
      <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl border border-[#e0b4b4] bg-red-bg text-2xl">
        ⚠️
      </div>
      <h3 className="font-serif text-lg font-bold text-dark">{title}</h3>
      {description && <p className="mt-1 max-w-xs text-sm text-muted">{description}</p>}
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-4 rounded-xl bg-gold px-4 py-2 text-sm font-semibold text-dark active:scale-[0.98]"
        >
          Try again
        </button>
      )}
    </div>
  )
}
