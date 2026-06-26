/**
 * Centralised, validated environment access.
 *
 * `USE_MOCK_DATA` lets Phase 1 run with zero backend config. When real Supabase
 * credentials are present, the data layer transparently switches to live queries.
 */
export const env = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '',
  supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? '',
  appUrl: process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000',
}

/** True when Supabase is configured. Otherwise the app uses seeded mock data. */
export const isSupabaseConfigured =
  Boolean(env.supabaseUrl) && Boolean(env.supabaseAnonKey)

export const USE_MOCK_DATA =
  process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true' || !isSupabaseConfigured
