import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { env, isSupabaseConfigured } from '@/config/env'

/**
 * Refreshes the Supabase session cookie when Supabase Auth is present.
 *
 * The customer app currently uses the client-side app store for login state,
 * and AuthGate handles route access for the app routes.
 */
export async function updateSession(request: NextRequest): Promise<NextResponse> {
  const response = NextResponse.next({ request })

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

  await supabase.auth.getUser()

  return response
}
