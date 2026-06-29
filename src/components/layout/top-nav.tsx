'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useAppStore } from '@/store/app-store'
import { formatNumber } from '@/lib/utils'
import { Sparkles } from 'lucide-react'

export function TopNav() {
  const points = useAppStore((s) => s.currentUser()?.points ?? 0)

  return (
    <header className="flex shrink-0 items-center justify-between bg-dark px-5 pb-3.5 pt-3.5">
      <Link href="/home" aria-label="Anandhaas Predict home">
        <Image
          src="/Logo.png"
          alt="Anandhaas Sweets &amp; Snacks"
          width={150}
          height={32}
          priority
          className="h-7 w-auto"
        />
      </Link>

      <Link
        href="/rewards"
        className="flex items-center gap-2 rounded-xl bg-white/10 px-3 py-2"
        aria-label={`${points} points - open rewards`}
      >
        <Sparkles className="h-4 w-4 text-gold-light" />
        <span className="tnum text-sm font-bold text-gold-light">{formatNumber(points)}</span>
        <span className="text-xs font-medium text-[var(--on-dark-dim)]">points</span>
      </Link>
    </header>
  )
}
