import { env } from '@/config/env'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const mode = url.searchParams.get('hub.mode')
  const token = url.searchParams.get('hub.verify_token')
  const challenge = url.searchParams.get('hub.challenge')

  if (!env.whatsappWebhookVerifyToken) {
    return new Response('Webhook verify token is not configured.', { status: 500 })
  }

  if (mode === 'subscribe' && token === env.whatsappWebhookVerifyToken && challenge) {
    return new Response(challenge, {
      status: 200,
      headers: { 'Content-Type': 'text/plain' },
    })
  }

  return new Response('Forbidden', { status: 403 })
}

export async function POST(request: Request) {
  const payload = await request.json().catch(() => null)

  console.info('[WHATSAPP_WEBHOOK]', JSON.stringify(summarizeWebhookPayload(payload)))

  return Response.json({ ok: true })
}

function summarizeWebhookPayload(payload: unknown) {
  if (!payload || typeof payload !== 'object') return { type: 'invalid' }

  const value = (payload as {
    entry?: Array<{
      changes?: Array<{
        field?: string
        value?: {
          metadata?: { phone_number_id?: string }
          messages?: Array<{ from?: string; type?: string }>
          statuses?: Array<{
            recipient_id?: string
            status?: string
            errors?: Array<{ code?: number; title?: string }>
          }>
        }
      }>
    }>
  }).entry?.[0]?.changes?.[0]

  return {
    field: value?.field,
    phoneNumberId: value?.value?.metadata?.phone_number_id,
    messages: value?.value?.messages?.map((message) => ({
      from: message.from,
      type: message.type,
    })),
    statuses: value?.value?.statuses?.map((status) => ({
      recipientId: status.recipient_id,
      status: status.status,
      errors: status.errors?.map((error) => ({
        code: error.code,
        title: error.title,
      })),
    })),
  }
}
