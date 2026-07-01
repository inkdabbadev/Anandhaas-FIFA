export const ADMIN_AUTH_COOKIE = 'fifa-dashboard-admin-auth'
export const ADMIN_AUTH_VALUE = 'dashboard-authenticated'
export const ADMIN_PASSWORD = '989898'
export const ADMIN_AUTH_MAX_AGE = 60 * 60 * 12

export const DEV_AUTH_COOKIE = 'fifa-dev-auth'
export const DEV_AUTH_VALUE = 'dev-authenticated'
export const DEV_PASSWORD = '363636'

const isProduction = process.env.NODE_ENV === 'production'

export function getAdminAuthCookieOptions(maxAge = ADMIN_AUTH_MAX_AGE) {
  return {
    httpOnly: true,
    sameSite: isProduction ? 'none' : 'lax',
    secure: isProduction,
    path: '/admin',
    maxAge,
    ...(isProduction ? { partitioned: true } : {}),
  } as const
}

export function getLegacyAdminAuthCookieOptions(maxAge = 0) {
  return {
    httpOnly: true,
    sameSite: 'lax',
    secure: isProduction,
    path: '/',
    maxAge,
  } as const
}

export function isAdminPath(pathname: string): boolean {
  return pathname === '/admin' || pathname.startsWith('/admin/')
}

export function isDevPath(pathname: string): boolean {
  return pathname === '/dev' || pathname.startsWith('/dev/')
}

export function isAdminLoginPath(pathname: string): boolean {
  return pathname === '/admin/login'
}

export function isDevLoginPath(pathname: string): boolean {
  return pathname === '/dev/login'
}

export function getSafeAdminNextPath(value: FormDataEntryValue | string | null | undefined): string {
  if (typeof value !== 'string' || !value) {
    return '/admin'
  }

  if (!value.startsWith('/') || value.startsWith('//')) {
    return '/admin'
  }

  const pathname = value.split(/[?#]/, 1)[0] ?? value
  if (!isAdminPath(pathname) || isAdminLoginPath(pathname)) {
    return '/admin'
  }

  return value
}

export function getSafeDevNextPath(value: FormDataEntryValue | string | null | undefined): string {
  if (typeof value !== 'string' || !value) {
    return '/dev/team'
  }

  if (!value.startsWith('/') || value.startsWith('//')) {
    return '/dev/team'
  }

  const pathname = value.split(/[?#]/, 1)[0] ?? value
  if (!isDevPath(pathname) || isDevLoginPath(pathname)) {
    return '/dev/team'
  }

  return value
}
