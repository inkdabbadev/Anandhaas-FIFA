import type { Metadata } from 'next'
import { LoginFlow } from '@/features/auth/login-flow'

export const metadata: Metadata = { title: 'Sign in' }

export default function LoginPage() {
  return <LoginFlow />
}
