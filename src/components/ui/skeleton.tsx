import { cn } from '@/lib/utils'

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('skeleton', className)} aria-hidden />
}

/** Match-card shaped skeleton for the Home feed. */
export function MatchCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card">
      <Skeleton className="h-7 w-full rounded-none" />
      <div className="space-y-3 p-3">
        <div className="flex items-center justify-between gap-2">
          <Skeleton className="h-12 w-16" />
          <Skeleton className="h-5 w-8" />
          <Skeleton className="h-12 w-16" />
        </div>
        <Skeleton className="h-9 w-full" />
      </div>
    </div>
  )
}

export function RowSkeleton() {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3">
      <Skeleton className="h-9 w-9 rounded-full" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-3 w-32" />
        <Skeleton className="h-2.5 w-24" />
      </div>
      <Skeleton className="h-5 w-10" />
    </div>
  )
}
