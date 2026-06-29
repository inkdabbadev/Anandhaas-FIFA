'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRight, Ticket } from 'lucide-react'

/** Open-campaign nudge: free to play, earn points, redeem in store. */
export function CampaignBanner() {
  return (
    <motion.div
      className="mx-4 mt-3"
      initial={{ y: 14, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.32, ease: 'easeOut' }}
      whileTap={{ scale: 0.985 }}
    >
      <Link
        href="/rewards"
        className="flex items-center gap-3 rounded-2xl border border-dark-3 bg-dark p-4 shadow-float"
      >
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/10 text-gold-light">
          <Ticket className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-bg">Free to play this season</p>
          <p className="mt-0.5 text-[13px] leading-snug text-[var(--on-dark-dim)]">
            Predict any match to earn points and redeem rewards in store.
          </p>
        </div>
        <ArrowRight className="h-4 w-4 shrink-0 text-gold-light" />
      </Link>
    </motion.div>
  )
}
