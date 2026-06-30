'use client'

import { forwardRef } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const button = cva(
  'inline-flex min-w-0 items-center justify-center gap-2 whitespace-normal text-center font-semibold leading-tight rounded-2xl transition-all duration-150 disabled:cursor-not-allowed select-none active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/40 focus-visible:ring-offset-2 focus-visible:ring-offset-bg',
  {
    variants: {
      variant: {
        primary: 'bg-gold text-white shadow-[var(--shadow-gold)] hover:brightness-105 disabled:bg-border disabled:text-muted disabled:shadow-none',
        dark: 'bg-dark text-gold-light hover:bg-dark-2 disabled:opacity-50',
        success: 'bg-green text-white shadow-[0_6px_18px_rgba(21,128,61,0.25)] hover:brightness-105 disabled:bg-border disabled:text-muted disabled:shadow-none',
        outline: 'border border-border-2 bg-card text-mid hover:bg-gold-bg hover:border-gold-border',
        ghost: 'text-mid hover:bg-gold-bg',
        danger: 'bg-red text-white hover:brightness-105',
      },
      size: {
        sm: 'min-h-9 px-3.5 py-2 text-xs',
        md: 'min-h-11 px-5 py-2.5 text-sm',
        lg: 'min-h-[54px] px-6 py-3 text-base',
        icon: 'h-10 w-10',
      },
      block: { true: 'w-full' },
    },
    defaultVariants: { variant: 'primary', size: 'md' },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof button> {}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, block, ...props }, ref) => (
    <button ref={ref} className={cn(button({ variant, size, block }), className)} {...props} />
  )
)
Button.displayName = 'Button'
