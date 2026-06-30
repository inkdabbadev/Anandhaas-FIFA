import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import {
  ADMIN_AUTH_COOKIE,
  ADMIN_AUTH_VALUE,
  isAdminLoginPath,
  isAdminPath,
} from '@/lib/admin-auth'
import { updateSession } from '@/lib/supabase/middleware'

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (isAdminPath(pathname) && !isAdminLoginPath(pathname)) {
    const authenticated = request.cookies.get(ADMIN_AUTH_COOKIE)?.value === ADMIN_AUTH_VALUE
    if (!authenticated) {
      const loginUrl = request.nextUrl.clone()
      loginUrl.pathname = '/admin/login'
      loginUrl.searchParams.set('next', `${pathname}${request.nextUrl.search}`)
      return NextResponse.redirect(loginUrl)
    }
  }

  return updateSession(request)
}

export const config = {
  matcher: [
    /*
     * Match all request paths except static assets, images and the manifest.
     */
    '/((?!_next/static|_next/image|favicon.ico|icon.svg|manifest.webmanifest|sw.js|.*\\.(?:png|jpg|jpeg|svg|webp|ico)$).*)',
  ],
}
