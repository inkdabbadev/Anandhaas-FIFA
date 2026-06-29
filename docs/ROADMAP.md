# Roadmap

## Phase 1 - Customer UI on Seeded Data

- Mobile app: Home, Leaderboard, Rewards, Tiers, Profile, Prediction Sheet.
- Landing and phone + email OTP-style mock login flow.
- Loading states, empty states, toasts, and polished interaction states.
- PWA shell with manifest, service worker, and offline page.
- In-memory Zustand store for local testing.

## Phase 2 - Connect Supabase

- Implement `src/repositories/*` behind `src/services/data-service.ts`.
- Wire real Supabase phone/email OTP delivery.
- Use SQL RPCs for prediction, claim, settlement, and redemption mutations.
- Replace local optimistic state with server-confirmed data and revalidation.

## Phase 3 - Admin Application Integration

- Keep admin as a separate application.
- Connect admin match, offer, claim, and settlement workflows to the same Supabase schema.
- Add audit log and role management around privileged operations.

## Phase 4 - Engagement & Integrations

- Notification providers for WhatsApp, Push, SMS, Email, and in-app events.
- Staff-facing claim redemption scanner.
- Purchase integrations if loyalty points from billing are needed.
- Analytics, exports, scheduled leaderboard resets, and season resets.

## Later

- Referrals.
- Tamil localization.
- Multiple concurrent campaigns.
- Boosted predictions or special campaign rules.
