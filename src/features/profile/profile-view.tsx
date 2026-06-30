'use client'

import { useRouter } from 'next/navigation'
import { useAppStore } from '@/store/app-store'
import { initials, formatNumber } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { POINTS } from '@/constants'
import { ChevronRight, LogOut, Bell, Globe, Shield } from 'lucide-react'

export function ProfileView() {
  const user = useAppStore((s) => (s.currentPhone ? s.users[s.currentPhone] : null))
  const logout = useAppStore((s) => s.logout)
  const pushToast = useAppStore((s) => s.pushToast)
  const router = useRouter()

  if (!user) return <ProfileSkeleton />

  const accuracy = user.predictionsCount ? Math.round((user.correctCount / user.predictionsCount) * 100) : 0
  const totalPoints = user.correctCount * POINTS.CORRECT

  return (
    <div className="animate-fade-in-up pb-3">
      <section className="bg-brand px-5 pb-8 pt-7 text-center">
        <div className="mx-auto mb-3 flex h-20 w-20 items-center justify-center rounded-full bg-gold font-serif text-3xl font-bold text-white">
          {initials(user.name)}
        </div>
        <h1 className="font-serif text-2xl font-bold text-bg">{user.name}</h1>
        <p className="mt-1 text-[13px] text-[var(--on-dark-dim)]">{user.phone}</p>
        <p className="mt-0.5 break-all text-[13px] text-[var(--on-dark-dim)]">{user.email}</p>
      </section>

      <div className="relative z-10 -mt-5 rounded-t-[28px] bg-bg pt-3 shadow-[0_-12px_30px_rgba(8,26,22,0.14)]">
        <div className="grid grid-cols-3 gap-2 px-4 pb-1 pt-2">
          <Stat value={formatNumber(totalPoints)} label="Total points" />
          <Stat value={user.predictionsCount} label="Predictions" />
          <Stat value={`${accuracy}%`} label="Accuracy" />
        </div>

        <div className="mx-4 mb-3 mt-3 overflow-hidden rounded-2xl border border-border bg-card">
          <SettingRow icon={Bell} label="Notifications" onClick={() => pushToast('Notification settings coming soon', 'info')} />
          <SettingRow icon={Globe} label="Language" value="English" onClick={() => pushToast('More languages coming soon', 'info')} />
          <SettingRow icon={Shield} label="Privacy & data" onClick={() => pushToast('Privacy centre coming soon', 'info')} last />
        </div>

        <div className="px-4">
          <Button
            variant="outline"
            block
            onClick={() => {
              logout()
              router.replace('/login')
            }}
          >
            <LogOut className="h-4 w-4" /> Log out
          </Button>
        </div>
      </div>
    </div>
  )
}

function Stat({ value, label }: { value: string | number; label: string }) {
  return (
    <div className="min-w-0 rounded-2xl border border-border bg-card px-1.5 py-4 text-center">
      <div className="tnum truncate font-serif text-[clamp(18px,7vw,26px)] font-bold leading-none text-dark">
        {value}
      </div>
      <div className="mt-1 text-[12px] leading-tight text-muted">{label}</div>
    </div>
  )
}

function SettingRow({
  icon: Icon,
  label,
  value,
  onClick,
  last,
}: {
  icon: typeof Bell
  label: string
  value?: string
  onClick: () => void
  last?: boolean
}) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-3 px-4 py-3.5 text-left ${last ? '' : 'border-b border-border'}`}
    >
      <Icon className="h-[18px] w-[18px] text-mid" />
      <span className="flex-1 text-sm font-medium text-dark">{label}</span>
      {value && <span className="text-sm text-muted">{value}</span>}
      <ChevronRight className="h-[18px] w-[18px] text-muted" />
    </button>
  )
}

function ProfileSkeleton() {
  return (
    <div className="p-4">
      <div className="flex flex-col items-center gap-2">
        <Skeleton className="h-20 w-20 rounded-full" />
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-3 w-40" />
      </div>
      <div className="mt-4 grid grid-cols-3 gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-20" />
        ))}
      </div>
    </div>
  )
}
