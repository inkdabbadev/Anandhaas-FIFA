'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Trophy, Gem, Star, CircleUser, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

const ITEMS: { href: string; label: string; icon: LucideIcon }[] = [
  { href: '/home', label: 'Home', icon: Home },
  { href: '/leaderboard', label: 'Rankings', icon: Trophy },
  { href: '/tokens', label: 'Tokens', icon: Gem },
  { href: '/tiers', label: 'Tiers', icon: Star },
  { href: '/profile', label: 'Profile', icon: CircleUser },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="frost absolute inset-x-0 bottom-0 z-[100] flex border-t border-border/70 px-1.5 pb-[env(safe-area-inset-bottom)] pt-1.5">
      {ITEMS.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || pathname.startsWith(`${href}/`)
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? 'page' : undefined}
            className="group flex flex-1 flex-col items-center gap-1 pb-2 pt-2"
          >
            <Icon
              className={cn(
                'h-6 w-6 transition-colors',
                active ? 'text-gold' : 'text-muted group-active:text-mid'
              )}
              strokeWidth={active ? 2.3 : 1.8}
            />
            <span
              className={cn(
                'text-[10px] transition-colors',
                active ? 'font-semibold text-gold' : 'font-medium text-muted'
              )}
            >
              {label}
            </span>
          </Link>
        )
      })}
    </nav>
  )
}
