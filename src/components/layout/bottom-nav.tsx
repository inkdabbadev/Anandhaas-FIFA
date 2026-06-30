'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutGroup, motion } from 'framer-motion'
import { Home, Trophy, Gift, Star, CircleUser, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

const ITEMS: { href: string; label: string; icon: LucideIcon }[] = [
  { href: '/home', label: 'Home', icon: Home },
  { href: '/leaderboard', label: 'Rankings', icon: Trophy },
  { href: '/rewards', label: 'Rewards', icon: Gift },
  { href: '/tiers', label: 'Tiers', icon: Star },
  { href: '/profile', label: 'Profile', icon: CircleUser },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="absolute inset-x-0 bottom-0 z-[100] border-t border-border bg-white px-1.5 pb-[env(safe-area-inset-bottom)] pt-1.5 shadow-[0_-10px_30px_rgba(8,26,22,0.12)]">
      <LayoutGroup id="bottom-nav">
        <div className="flex">
          {ITEMS.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(`${href}/`)
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? 'page' : undefined}
                className="group relative flex min-h-[58px] min-w-0 flex-1 flex-col items-center justify-center gap-1 overflow-hidden rounded-2xl px-0.5"
              >
                {active && (
                  <motion.span
                    layoutId="bottom-nav-active"
                    className="absolute inset-x-1 top-1 h-11 rounded-2xl bg-gold-bg"
                    transition={{ type: 'spring', stiffness: 430, damping: 34, mass: 0.7 }}
                  />
                )}
                <Icon
                  className={cn(
                    'relative z-10 h-5.5 w-5.5 transition-colors duration-200',
                    active ? 'text-gold' : 'text-muted group-active:text-mid'
                  )}
                  strokeWidth={active ? 2.4 : 1.9}
                />
                <span
                  className={cn(
                    'relative z-10 max-w-full truncate text-[10px] leading-none transition-colors duration-200',
                    active ? 'font-semibold text-gold' : 'font-medium text-muted'
                  )}
                >
                  {label}
                </span>
              </Link>
            )
          })}
        </div>
      </LayoutGroup>
    </nav>
  )
}
