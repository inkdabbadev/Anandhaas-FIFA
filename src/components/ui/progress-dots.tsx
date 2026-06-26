import { cn } from '@/lib/utils'

interface ProgressDotsProps {
  total: number
  filled: number
  className?: string
}

export function ProgressDots({ total, filled, className }: ProgressDotsProps) {
  return (
    <div className={cn('flex gap-1.5', className)} role="img" aria-label={`${filled} of ${total} complete`}>
      {Array.from({ length: total }, (_, i) => (
        <span
          key={i}
          className={cn(
            'h-1.5 flex-1 rounded-full transition-colors duration-200',
            i < filled ? 'bg-gold' : 'bg-border'
          )}
        />
      ))}
    </div>
  )
}
