import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badge = cva(
  'inline-flex items-center gap-1 rounded-lg font-semibold whitespace-nowrap',
  {
    variants: {
      variant: {
        gold: 'bg-gold-bg text-gold',
        fifa: 'bg-fifa-bg text-fifa',
        green: 'bg-green-bg text-green',
        red: 'bg-red-bg text-red',
        muted: 'bg-bg border border-border text-muted',
        dark: 'bg-dark-2 text-gold-light',
      },
      size: {
        sm: 'px-2 py-1 text-[10px]',
        md: 'px-2.5 py-1.5 text-xs',
      },
    },
    defaultVariants: { variant: 'gold', size: 'sm' },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badge> {}

export function Badge({ className, variant, size, ...props }: BadgeProps) {
  return <span className={cn(badge({ variant, size }), className)} {...props} />
}

export function LiveDot({ className }: { className?: string }) {
  return (
    <span
      className={cn('inline-block h-1.5 w-1.5 rounded-full bg-[#d04040] animate-pulse-dot', className)}
      aria-hidden
    />
  )
}
