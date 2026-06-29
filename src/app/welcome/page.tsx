import type { Metadata } from 'next'
import Image from 'next/image'
import { Trophy, Gem, Target } from 'lucide-react'
import { WelcomeCta } from '@/features/auth/welcome-cta'

export const metadata: Metadata = { title: 'Welcome' }

export default function WelcomePage() {
  return (
    <div className="flex min-h-svh justify-center bg-brand">
      <div className="flex min-h-svh w-full max-w-[430px] flex-col px-6 py-8">
        <Image
          src="/Logo.png"
          alt="Anandhaas Sweets & Snacks"
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
            Predict matches, earn points, and redeem real rewards at any Anandhaas store.
          </p>
        </div>

        <div className="mt-6 divide-y divide-white/10 border-y border-white/10">
          <Feature icon={Target} title="Predict matches" />
          <Feature icon={Gem} title="Earn points" />
          <Feature icon={Trophy} title="Redeem rewards" />
        </div>

        <WelcomeCta />
      </div>
    </div>
  )
}

function Feature({ icon: Icon, title }: { icon: typeof Gem; title: string }) {
  return (
    <div className="flex items-center gap-3 py-3">
      <Icon className="h-5 w-5 shrink-0 text-gold-light" strokeWidth={1.8} />
      <p className="text-sm font-semibold text-bg">{title}</p>
    </div>
  )
}
