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
  mailUser: process.env.MAIL_USER ?? '',
  mailPass: process.env.MAIL_PASS ?? '',
  whatsappAccessToken: process.env.WHATSAPP_ACCESS_TOKEN ?? '',
  whatsappPhoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID ?? '',
  whatsappBusinessAccountId: process.env.WHATSAPP_BUSINESS_ACCOUNT_ID ?? '',
  whatsappResultTemplateName: process.env.WHATSAPP_RESULT_TEMPLATE_NAME ?? '',
  whatsappTemplateLanguage: process.env.WHATSAPP_TEMPLATE_LANGUAGE ?? 'en_US',
  whatsappAllowFreeformResultMessages:
    process.env.WHATSAPP_ALLOW_FREEFORM_RESULT_MESSAGES === 'true',
  whatsappWebhookVerifyToken: process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN ?? '',
}

/** True when Supabase is configured. Otherwise the app uses seeded mock data. */
export const isSupabaseConfigured =
  isHttpUrl(env.supabaseUrl) && Boolean(env.supabaseAnonKey)

export const USE_MOCK_DATA =
  process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true' || !isSupabaseConfigured

function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}
