import type { Metadata } from 'next'
import { TokensView } from '@/features/tokens/tokens-view'

export const metadata: Metadata = { title: 'Tokens' }

export default function TokensPage() {
  return <TokensView />
}
