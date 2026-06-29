import type { Metadata } from 'next'
import { RewardsView } from '@/features/rewards/rewards-view'

export const metadata: Metadata = { title: 'Rewards' }

export default function RewardsPage() {
  return <RewardsView />
}
