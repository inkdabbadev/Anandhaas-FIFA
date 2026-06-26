import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { env, isSupabaseConfigured } from '@/config/env'

const PUBLIC_PATHS = ['/welcome', '/login', '/auth']
const ADMIN_PREFIX = '/admin'

/**
 * Refreshes the Supabase session cookie and enforces auth.
 *
 * In Phase 1 (no Supabase configured) this is a no-op pass-through so the mock
 * experience is reachable without credentials. Once configured, it gates the
 * `(app)` and `/admin` routes and redirects unauthenticated users to /welcome.
 */
export async function updateSession(request: NextRequest): Promise<NextResponse> {
  const response = NextResponse.next({ request })
  const { pathname } = request.nextUrl

  if (!isSupabaseConfigured) return response

  const supabase = createServerClient(env.supabaseUrl, env.supabaseAnonKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (cookiesToSet) => {
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        )
      },
    },
  })

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p))

  // Unauthenticated → bounce to landing (except on public pages).
  if (!user && !isPublic) {
    const url = request.nextUrl.clone()
    url.pathname = '/welcome'
    return NextResponse.redirect(url)
  }

  // Admin routes require an `admins` row. Checked here as a coarse gate; RLS
  // enforces the real boundary at the data layer.
  if (user && pathname.startsWith(ADMIN_PREFIX)) {
    const { data: admin } = await supabase
      .from('admins')
      .select('user_id')
      .eq('user_id', user.id)
      .maybeSingle()
    if (!admin) {
      const url = request.nextUrl.clone()
      url.pathname = '/'
      return NextResponse.redirect(url)
    }
  }

  return response
}
