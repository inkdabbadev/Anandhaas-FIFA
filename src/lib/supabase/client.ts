'use client'

import { createBrowserClient } from '@supabase/ssr'
import { env, isSupabaseConfigured } from '@/config/env'

/** Browser-side Supabase client (uses the public anon key + cookie session). */
export function createClient() {
  if (!isSupabaseConfigured) {
    throw new Error(
      'Supabase is not configured. Running in mock mode — the data layer should not reach this client.'
    )
  }
  return createBrowserClient(env.supabaseUrl, env.supabaseAnonKey)
}
