# Roadmap

## Phase 1 — UI on seeded data ✅ (current)

- Full mobile app: Home, Leaderboard, Tokens, Tiers, Profile, Prediction Sheet.
- Landing + phone-OTP auth flow (demo OTP `123456`).
- Admin console: dashboard, matches, results, users, purchases, rewards, tokens, reports.
- Loading skeletons, empty states, error states, toasts, optimistic updates.
- PWA shell (manifest, service worker, offline page).
- Campaign engine, scoring logic, full type system, Zod schemas, Zustand store.

## Phase 2 — Connect Supabase

- Implement `src/repositories/*` behind the existing `data-service` seam (no screen changes).
- Apply migrations + RLS; wire real phone OTP via Supabase Auth.
- Server actions / RPCs: `lockPrediction`, `settleMatch`, `redeemReward`, `recordPurchase` —
  transactional, server-authoritative, ledger-backed.
- Replace optimistic-only store updates with revalidation after server confirms.

## Phase 3 — Admin hardening

- Match & reward CRUD writes (currently read + simulated).
- CSV import pipeline and manual purchase entry → `recordPurchase`.
- Role management, audit log, settlement preview before commit.

## Phase 4 — Engagement & integrations

- **Notifications**: implement WhatsApp / Push / SMS / Email / In-App providers behind
  `notification-service.ts`; recipient resolution + delivery tracking.
- **QR redemption scanning**: staff-facing scanner that marks `redemptions` used (one-time).
- **Purchase integrations**: POS adapter, Shopify webhook, scheduled CSV sync.
- **Analytics**: cohort retention, repeat-purchase attribution, CSV/PDF exports.
- **Scheduled jobs**: token expiry sweep (30-day), weekly leaderboard reset, season tier reset.

## Later

- Referral program activation and rewards.
- Multi-language (i18n scaffolding is in place) — Tamil first.
- Wildcard / boosted predictions for higher tiers.
- A/B testable campaign rules; multiple concurrent micro-campaigns.
- Dark mode (token system already dark-ready).
