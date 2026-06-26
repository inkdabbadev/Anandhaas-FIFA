'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  CalendarClock,
  Users,
  ShoppingBag,
  Gift,
  Coins,
  ClipboardCheck,
  BarChart3,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const LINKS: { href: string; label: string; icon: LucideIcon }[] = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/matches', label: 'Matches', icon: CalendarClock },
  { href: '/admin/results', label: 'Results', icon: ClipboardCheck },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/purchases', label: 'Purchases', icon: ShoppingBag },
  { href: '/admin/rewards', label: 'Rewards', icon: Gift },
  { href: '/admin/tokens', label: 'Tokens', icon: Coins },
  { href: '/admin/reports', label: 'Reports', icon: BarChart3 },
]

export function AdminSidebar() {
  const pathname = usePathname()
  return (
    <aside className="hidden w-60 shrink-0 flex-col border-r border-border bg-card px-3 py-5 lg:flex">
      <Link href="/admin/dashboard" className="mb-6 flex items-center gap-2.5 px-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gold font-serif text-lg font-black text-dark">
          A
        </span>
        <div className="leading-tight">
          <div className="text-sm font-bold text-dark">Anandhaas</div>
          <div className="text-[10px] text-muted">Admin Console</div>
        </div>
      </Link>
      <nav className="flex flex-col gap-1">
        {LINKS.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                active ? 'bg-gold-bg text-gold' : 'text-mid hover:bg-bg'
              )}
            >
              <Icon className="h-4 w-4" strokeWidth={active ? 2.4 : 1.8} />
              {label}
            </Link>
          )
        })}
      </nav>
      <Link href="/home" className="mt-auto rounded-lg px-3 py-2 text-xs text-muted hover:bg-bg">
        ← Back to app
      </Link>
    </aside>
  )
}

/** Mobile top bar with horizontally scrolling tabs. */
export function AdminMobileNav() {
  const pathname = usePathname()
  return (
    <div className="no-scrollbar flex gap-1 overflow-x-auto border-b border-border bg-card px-3 py-2 lg:hidden">
      {LINKS.map(({ href, label }) => {
        const active = pathname.startsWith(href)
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              'whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-medium',
              active ? 'bg-gold-bg text-gold' : 'text-mid'
            )}
          >
            {label}
          </Link>
        )
      })}
    </div>
  )
}
