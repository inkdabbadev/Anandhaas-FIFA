import type { NotificationChannel } from '@/types'

/**
 * Notification Engine — event-driven, channel-agnostic architecture.
 *
 * Domain code emits semantic events; channel providers (WhatsApp, Push, SMS,
 * Email, In-App) subscribe. Phase 4 wires real transports; the contract is
 * defined now so emitting sites never change.
 */

export type NotificationEvent =
  | { type: 'prediction_locked'; userId: string; matchLabel: string }
  | { type: 'match_starting_soon'; userId: string; matchLabel: string; minutes: number }
  | { type: 'prediction_won'; userId: string; points: number; matchLabel: string }
  | { type: 'reward_redeemed'; userId: string; rewardTitle: string; qrCode: string }
  | { type: 'tokens_expiring'; userId: string; amount: number; inDays: number }
  | { type: 'streak_bonus'; userId: string; bonus: number }
  | { type: 'tier_up'; userId: string; tier: string }

export interface NotificationProvider {
  readonly channel: NotificationChannel
  send(event: NotificationEvent, recipient: string): Promise<void>
}

/** Default channel routing per event type (overridable in `settings`). */
const ROUTING: Record<NotificationEvent['type'], NotificationChannel[]> = {
  prediction_locked: ['in_app'],
  match_starting_soon: ['push', 'whatsapp'],
  prediction_won: ['push', 'in_app'],
  reward_redeemed: ['whatsapp', 'in_app'],
  tokens_expiring: ['whatsapp', 'push'],
  streak_bonus: ['in_app', 'push'],
  tier_up: ['in_app', 'push', 'whatsapp'],
}

const providers = new Map<NotificationChannel, NotificationProvider>()

export function registerProvider(provider: NotificationProvider) {
  providers.set(provider.channel, provider)
}

/**
 * Emit a domain event. Persists to `notifications` and fans out to the routed
 * channels. In Phase 1 this is a no-op stub safe to call from anywhere.
 */
export async function emit(event: NotificationEvent): Promise<void> {
  const channels = ROUTING[event.type] ?? ['in_app']
  // TODO(phase-2): insert into notifications table for each channel.
  // TODO(phase-4): resolve recipient + dispatch through registered providers.
  await Promise.all(
    channels.map(async (ch) => {
      const provider = providers.get(ch)
      if (provider) {
        // recipient resolution happens here in Phase 4
      }
    })
  )
}
