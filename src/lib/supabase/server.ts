import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { env, isSupabaseConfigured } from '@/config/env'

/** Server-side Supabase client bound to the request cookie store. */
export async function createClient() {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase is not configured. The server data layer should use mock data instead.')
  }

  const cookieStore = await cookies()

  return createServerClient(env.supabaseUrl, env.supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        } catch {
          // `setAll` called from a Server Component — safe to ignore when middleware
          // refreshes sessions.
        }
      },
    },
  })
}

/** Privileged client using the service-role key. Server-only. Bypasses RLS — use
 *  only for admin actions and trusted server jobs. */
export function createAdminClient() {
  if (!env.supabaseUrl || !env.supabaseServiceKey) {
    throw new Error('Supabase admin client requires SUPABASE_SERVICE_ROLE_KEY.')
  }
  return createServerClient(env.supabaseUrl, env.supabaseServiceKey, {
    cookies: { getAll: () => [], setAll: () => {} },
  })
}
