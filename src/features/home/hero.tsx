'use client'

import { motion, useReducedMotion } from 'framer-motion'
import { useAppStore } from '@/store/app-store'
import { formatNumber } from '@/lib/utils'

/** Editorial hero with co-brand line + live stat tiles. */
export function Hero() {
  const user = useAppStore((s) => (s.currentPhone ? s.users[s.currentPhone] : null))
  const reduceMotion = useReducedMotion()
  const points = user?.points ?? 0
  const predictions = user?.predictionsCount ?? 0
  const correct = user?.correctCount ?? 0

  return (
    <motion.section
      className="bg-brand px-5 pb-8 pt-5"
      initial={reduceMotion ? false : { opacity: 0 }}
      animate={reduceMotion ? undefined : { opacity: 1 }}
      transition={{ duration: 0.28, ease: 'easeOut' }}
    >
      <motion.div
        className="text-[13px] font-semibold text-white/80"
        initial={reduceMotion ? false : { y: 8, opacity: 0 }}
        animate={reduceMotion ? undefined : { y: 0, opacity: 1 }}
        transition={{ duration: 0.28, ease: 'easeOut' }}
      >
        FIFA World Cup 2026
      </motion.div>

      <motion.h1
        className="mt-4 font-serif text-[32px] font-extrabold leading-[1.05] text-bg"
        initial={reduceMotion ? false : { y: 10, opacity: 0 }}
        animate={reduceMotion ? undefined : { y: 0, opacity: 1 }}
        transition={{ delay: 0.05, duration: 0.32, ease: 'easeOut' }}
      >
        Predict the match.
        <br />
        <span className="text-gold-light">Win sweet rewards.</span>
      </motion.h1>

      <motion.div
        className="mt-6 grid grid-cols-3 gap-2"
        initial={reduceMotion ? false : 'hidden'}
        animate={reduceMotion ? undefined : 'show'}
        variants={{
          hidden: {},
          show: { transition: { staggerChildren: 0.06, delayChildren: 0.12 } },
        }}
      >
        <Stat value={formatNumber(points)} label="Points" />
        <Stat value={predictions} label="Predictions" />
        <Stat value={correct} label="Correct" />
      </motion.div>
    </motion.section>
  )
}

function Stat({ value, label }: { value: string | number; label: string }) {
  return (
    <motion.div
      className="min-w-0 rounded-2xl border border-white/10 bg-white/[0.08] px-1.5 py-3.5 text-center shadow-[0_12px_30px_rgba(0,0,0,0.10)] backdrop-blur-sm will-change-transform"
      variants={{
        hidden: { y: 12, opacity: 0 },
        show: { y: 0, opacity: 1, transition: { duration: 0.28, ease: 'easeOut' } },
      }}
    >
      <span className="tnum block truncate text-[clamp(16px,5.8vw,20px)] font-extrabold leading-none text-bg">{value}</span>
      <span className="mt-1.5 block text-[11px] font-medium leading-tight text-[var(--on-dark-dim)]">{label}</span>
    </motion.div>
  )
}
