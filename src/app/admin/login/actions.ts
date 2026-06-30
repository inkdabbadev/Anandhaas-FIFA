'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import {
  ADMIN_AUTH_COOKIE,
  ADMIN_AUTH_VALUE,
  ADMIN_PASSWORD,
  getSafeAdminNextPath,
} from '@/lib/admin-auth'

export type AdminLoginState = {
  status: 'idle' | 'error'
  message: string
}

export async function adminLoginAction(
  _previousState: AdminLoginState,
  formData: FormData
): Promise<AdminLoginState> {
  const password = String(formData.get('password') ?? '')
  const nextPath = getSafeAdminNextPath(formData.get('next'))

  if (password !== ADMIN_PASSWORD) {
    return {
      status: 'error',
      message: 'Wrong admin password. Please try again.',
    }
  }

  const cookieStore = await cookies()
  cookieStore.set(ADMIN_AUTH_COOKIE, ADMIN_AUTH_VALUE, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/admin',
    maxAge: 60 * 60 * 12,
  })

  redirect(nextPath)
}
