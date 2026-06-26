import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { Trophy, Gem, Target } from 'lucide-react'

export const metadata: Metadata = { title: 'Welcome' }

export default function WelcomePage() {
  return (
    <div className="flex min-h-svh justify-center bg-brand">
      <div className="flex min-h-svh w-full max-w-[430px] flex-col px-6 py-8">
        <Image
          src="/Logo.png"
          alt="Anandhaas Sweets &amp; Snacks"
          width={839}
          height={191}
          priority
          className="h-auto w-[190px] max-w-full object-contain"
        />

        <div className="mt-7">
          <p className="text-xs font-medium text-white/70">FIFA World Cup 2026</p>
          <h1 className="mt-3 font-serif text-[34px] font-extrabold leading-[1.04] text-bg">
            Predict the game.
            <br />
            <span className="text-gold-light">Win sweet rewards.</span>
          </h1>
          <p className="mt-4 max-w-[18rem] text-[13px] leading-[1.65] text-white/70">
            Every purchase at Anandhaas earns prediction tokens. Call the matches, climb the
            leaderboard, and redeem real rewards in store.
          </p>
        </div>

        <div className="mt-6 divide-y divide-white/10 border-y border-white/10">
          <Feature icon={Gem} title="Earn tokens" desc="₹100 spent = 1 prediction token" />
          <Feature icon={Target} title="Predict matches" desc="Winner, score and first scorer" />
          <Feature icon={Trophy} title="Win rewards" desc="Top the board for premium prizes" />
        </div>

        <div className="mt-auto space-y-3 pt-6">
          <Link
            href="/login"
            className="flex h-12 w-full items-center justify-center rounded-2xl bg-bg text-sm font-semibold text-dark shadow-[0_10px_24px_rgba(243,246,242,0.18)] transition-all hover:bg-white active:scale-[0.98]"
          >
            Get started
          </Link>
          <p className="text-center text-xs text-[var(--on-dark-dim)]">
            Sign in with your phone — no password needed
          </p>
        </div>
      </div>
    </div>
  )
}

function Feature({ icon: Icon, title, desc }: { icon: typeof Gem; title: string; desc: string }) {
  return (
    <div className="flex items-center gap-3 py-3">
      <Icon className="h-5 w-5 shrink-0 text-gold-light" strokeWidth={1.8} />
      <div>
        <p className="text-sm font-semibold text-bg">{title}</p>
        <p className="mt-0.5 text-xs text-white/55">{desc}</p>
      </div>
    </div>
  )
}
