import type { Metadata } from 'next'
import Link from 'next/link'
import { BarChart3, Store, TicketCheck } from 'lucide-react'
import { Card, CardBody } from '@/components/ui/card'
import { RedeemCouponForm } from './redeem-coupon-form'

export const metadata: Metadata = {
  title: 'Admin Redeem',
}

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export default function AdminReedemPage() {
  return (
    <main className="min-h-dvh bg-bg px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
        <header className="rounded-3xl bg-brand px-5 py-7 text-bg shadow-pop sm:px-7">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="flex w-fit items-center gap-2 rounded-full border border-white/10 bg-white/[0.08] px-3 py-1 text-xs font-semibold text-gold-light">
                <Store className="h-3.5 w-3.5" />
                Store counter
              </div>
              <h1 className="mt-4 font-serif text-3xl font-extrabold sm:text-4xl">Redeem coupon</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--on-dark-dim)]">
                Verify a claimed reward by customer phone number and coupon code before marking it as redeemed.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <AdminLink href="/admin" icon={BarChart3} label="Dashboard" />
              <AdminLink href="/admin/reedem" active icon={TicketCheck} label="Redeem" />
            </div>
          </div>
        </header>

        <Card className="rounded-3xl">
          <CardBody className="p-5 sm:p-6">
            <div className="mb-5 flex items-center gap-2">
              <TicketCheck className="h-5 w-5 text-gold" />
              <h2 className="text-lg font-bold text-dark">Coupon details</h2>
            </div>
            <RedeemCouponForm />
          </CardBody>
        </Card>
      </div>
    </main>
  )
}

function AdminLink({
  href,
  active,
  icon: Icon,
  label,
}: {
  href: string
  active?: boolean
  icon: typeof BarChart3
  label: string
}) {
  return (
    <Link
      href={href}
      className={`inline-flex h-10 items-center gap-2 rounded-xl border px-3 text-sm font-semibold transition ${
        active
          ? 'border-gold-light bg-white text-dark'
          : 'border-white/10 bg-white/[0.08] text-bg hover:bg-white/[0.14]'
      }`}
    >
      <Icon className="h-4 w-4" />
      {label}
    </Link>
  )
}
