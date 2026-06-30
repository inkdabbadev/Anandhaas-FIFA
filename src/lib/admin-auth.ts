export const ADMIN_AUTH_COOKIE = 'fifa-admin-auth'
export const ADMIN_AUTH_VALUE = 'authenticated'
export const ADMIN_PASSWORD = '363636'

export function isAdminPath(pathname: string): boolean {
  return pathname === '/admin' || pathname.startsWith('/admin/')
}

export function isAdminLoginPath(pathname: string): boolean {
  return pathname === '/admin/login'
}

export function getSafeAdminNextPath(value: FormDataEntryValue | string | null | undefined): string {
  if (typeof value !== 'string' || !value) {
    return '/admin/team'
  }

  if (!value.startsWith('/') || value.startsWith('//')) {
    return '/admin/team'
  }

  const pathname = value.split(/[?#]/, 1)[0] ?? value
  if (!isAdminPath(pathname) || isAdminLoginPath(pathname)) {
    return '/admin/team'
  }

  return value
}
