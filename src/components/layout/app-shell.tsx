import { TopNav } from './top-nav'
import { BottomNav } from './bottom-nav'
import { PredictionSheet } from '@/features/predictions/prediction-sheet'

/**
 * The mobile-first app shell. On larger screens it centres a 430px "device"
 * column against the dark brand backdrop, mirroring the prototype while
 * remaining fully responsive down to small phones.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh justify-center bg-dark">
      <div className="relative flex h-dvh w-full max-w-[430px] flex-col overflow-hidden bg-bg">
        <TopNav />
        <main className="flex-1 overflow-y-auto overflow-x-hidden pb-[76px] thin-scrollbar">
          {children}
        </main>
        <BottomNav />
        <PredictionSheet />
      </div>
    </div>
  )
}
