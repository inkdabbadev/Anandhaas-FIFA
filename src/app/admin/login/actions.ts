'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import {
  ADMIN_AUTH_COOKIE,
  ADMIN_AUTH_VALUE,
  ADMIN_PASSWORD,
  getAdminAuthCookieOptions,
  getLegacyAdminAuthCookieOptions,
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
  cookieStore.set(ADMIN_AUTH_COOKIE, '', {
    ...getLegacyAdminAuthCookieOptions(0),
  })
  cookieStore.set(ADMIN_AUTH_COOKIE, ADMIN_AUTH_VALUE, {
    ...getAdminAuthCookieOptions(),
  })

  redirect(nextPath)
}
