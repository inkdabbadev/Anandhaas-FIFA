'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import {
  DEV_AUTH_COOKIE,
  DEV_AUTH_VALUE,
  DEV_PASSWORD,
  getSafeDevNextPath,
} from '@/lib/admin-auth'

export type DevLoginState = {
  status: 'idle' | 'error'
  message: string
}

export async function devLoginAction(
  _previousState: DevLoginState,
  formData: FormData
): Promise<DevLoginState> {
  const password = String(formData.get('password') ?? '')
  const nextPath = getSafeDevNextPath(formData.get('next'))

  if (password !== DEV_PASSWORD) {
    return {
      status: 'error',
      message: 'Wrong developer password. Please try again.',
    }
  }

  const cookieStore = await cookies()
  cookieStore.set(DEV_AUTH_COOKIE, DEV_AUTH_VALUE, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/dev',
    maxAge: 60 * 60 * 12,
  })

  redirect(nextPath)
}
