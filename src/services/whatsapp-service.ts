import { env } from '@/config/env'

type MatchResultRecipient = {
  phone: string
  name: string
  pickName: string
  didWin: boolean
}

type WhatsAppSendResult =
  | { ok: true }
  | { ok: false; code?: number; message: string }

type ResultMessageInput = {
  name: string
  winnerName: string
  pickName: string
  didWin: boolean
  points: number
}

export type WhatsAppDispatchSummary = {
  ok: boolean
  sent: number
  failed: number
  skipped: number
  message: string
}

const GRAPH_API_VERSION = 'v21.0'
const MAX_PARALLEL_SENDS = 5
const RECIPIENT_NOT_ALLOWED_CODE = 131030

export async function sendMatchResultWhatsAppMessages(input: {
  recipients: MatchResultRecipient[]
  winnerName: string
  points: number
}): Promise<WhatsAppDispatchSummary> {
  if (!isWhatsAppConfigured()) {
    return {
      ok: false,
      sent: 0,
      failed: 0,
      skipped: input.recipients.length,
      message: 'WhatsApp skipped because Cloud API credentials are not configured.',
    }
  }

  if (!env.whatsappResultTemplateName && !env.whatsappAllowFreeformResultMessages) {
    return {
      ok: false,
      sent: 0,
      failed: 0,
      skipped: input.recipients.length,
      message: 'WhatsApp skipped because WHATSAPP_RESULT_TEMPLATE_NAME is not configured.',
    }
  }

  const recipients = input.recipients
    .map((recipient) => ({
      ...recipient,
      phone: normalizeWhatsAppPhone(recipient.phone),
    }))
    .filter((recipient) => recipient.phone)

  const skipped = input.recipients.length - recipients.length
  let sent = 0
  let failed = 0
  let notAllowed = 0

  for (let index = 0; index < recipients.length; index += MAX_PARALLEL_SENDS) {
    const batch = recipients.slice(index, index + MAX_PARALLEL_SENDS)
    const results = await Promise.all(
      batch.map((recipient) =>
        sendWhatsAppResultMessage({
          to: recipient.phone,
          message: createResultMessageInput({
            name: recipient.name,
            winnerName: input.winnerName,
            pickName: recipient.pickName,
            didWin: recipient.didWin,
            points: input.points,
          }),
        })
      )
    )

    for (const result of results) {
      if (result.ok) {
        sent += 1
      } else {
        failed += 1
        if (result.code === RECIPIENT_NOT_ALLOWED_CODE) {
          notAllowed += 1
        }
        console.warn(`[WHATSAPP_RESULT_FAILED] ${result.message}`)
      }
    }
  }

  const allowedListNote =
    notAllowed > 0 ? ` ${notAllowed} recipient(s) are not in the Meta allowed list.` : ''

  return {
    ok: failed === 0,
    sent,
    failed,
    skipped,
    message: `WhatsApp submitted ${sent}, failed ${failed}, skipped ${skipped}.${allowedListNote}`,
  }
}

async function sendWhatsAppResultMessage(input: {
  to: string
  message: ResultMessageInput
}): Promise<WhatsAppSendResult> {
  const response = await fetch(
    `https://graph.facebook.com/${GRAPH_API_VERSION}/${env.whatsappPhoneNumberId}/messages`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.whatsappAccessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(createWhatsAppPayload(input)),
    }
  )

  if (!response.ok) {
    const apiError = await readApiError(response)
    return {
      ok: false,
      code: apiError.code,
      message: `WhatsApp API ${response.status}: ${apiError.message}`,
    }
  }

  return { ok: true }
}

function createWhatsAppPayload(input: {
  to: string
  message: ResultMessageInput
}) {
  if (env.whatsappResultTemplateName) {
    return {
      messaging_product: 'whatsapp',
      to: input.to,
      type: 'template',
      template: {
        name: env.whatsappResultTemplateName,
        language: {
          code: env.whatsappTemplateLanguage,
        },
        components: [
          {
            type: 'body',
            parameters: [
              templateText(input.message.name),
              templateText(input.message.winnerName),
              templateText(input.message.pickName),
              templateText(createOutcomeText(input.message)),
            ],
          },
        ],
      },
    }
  }

  return {
    messaging_product: 'whatsapp',
    to: input.to,
    type: 'text',
    text: {
      preview_url: false,
      body: createResultText(input.message),
    },
  }
}

function createResultMessageInput(input: {
  name: string
  winnerName: string
  pickName: string
  didWin: boolean
  points: number
}): ResultMessageInput {
  return {
    ...input,
    name: input.name.trim().split(/\s+/)[0] || 'Predictor',
  }
}

function createResultText(input: ResultMessageInput) {
  return [
    `Hi ${input.name},`,
    '',
    `${input.winnerName} won the match.`,
    `Your prediction: ${input.pickName}.`,
    '',
    createOutcomeText(input),
    '',
    'Anandhaas Predict',
  ].join('\n')
}

function createOutcomeText(input: ResultMessageInput) {
  return input.didWin
    ? `You won ${input.points} points. Congratulations!`
    : 'You got nothing this time. Try the next match!'
}

function templateText(text: string) {
  return {
    type: 'text',
    text,
  }
}

function isWhatsAppConfigured() {
  return Boolean(
    env.whatsappAccessToken &&
      env.whatsappPhoneNumberId &&
      !isPlaceholder(env.whatsappAccessToken) &&
      !isPlaceholder(env.whatsappPhoneNumberId)
  )
}

function isPlaceholder(value: string) {
  const lower = value.toLowerCase()
  return lower.includes('your_') || lower.includes('_here') || lower.includes('placeholder')
}

function normalizeWhatsAppPhone(value: string) {
  const digits = value.replace(/\D/g, '')
  if (/^[6-9]\d{9}$/.test(digits)) return `91${digits}`
  if (/^91[6-9]\d{9}$/.test(digits)) return digits
  return digits.length >= 8 && digits.length <= 15 ? digits : ''
}

async function readApiError(response: Response): Promise<{ code?: number; message: string }> {
  try {
    const payload = (await response.json()) as {
      error?: {
        code?: number
        message?: string
        error_data?: {
          details?: string
        }
      }
    }

    const details = payload.error?.error_data?.details
    const message = details || payload.error?.message || JSON.stringify(payload)
    return {
      code: payload.error?.code,
      message,
    }
  } catch {
    return { message: await response.text() }
  }
}
