# Architecture

## Principles

- **UI-first.** Screens were perfected against seeded data before any backend existed.
- **One data seam.** All reads funnel through `src/services/data-service.ts`. Swapping mock →
  Supabase changes implementations behind that seam, never the screens.
- **Server Components by default.** Client Components only where interaction/state demands it
  (`'use client'` is the exception, not the rule).
- **Ledger is truth.** Token and point balances are derived from append-only ledgers; the
  `users.token_balance` / `season_points` columns are caches maintained by triggers.
- **Campaign engine.** No seasonal concept is hardcoded — it's data in a `campaigns` row.

## Layers

```
 Screens (app/, features/)                 ← Server + Client Components
        │  imports
        ▼
 data-service.ts  ─────────────┐           ← the single seam
        │ mock                 │ live (Phase 2)
        ▼                      ▼
 lib/mock/data.ts        repositories/*     ← Supabase access (RLS / admin client)
                               │
                               ▼
                         Supabase Postgres   ← migrations + RLS + triggers + views
```

Cross-cutting services that are not simple reads:

- **`purchase-service.ts`** — normalises POS / Shopify / CSV / webhook / manual sources into one
  `recordPurchase` that credits ledgers atomically.
- **`notification-service.ts`** — event-driven fan-out across WhatsApp / Push / SMS / Email /
  In-App via per-event channel routing.
- **`features/predictions/scoring.ts`** — pure, server-authoritative scoring shared by settlement.

## State

- **Server state** is fetched in Server Components and passed down.
- **Client/session state** (token balance, streak, open prediction sheet, optimistic predictions,
  toasts) lives in a single Zustand store (`store/app-store.ts`), hydrated once on mount by
  `StoreHydrator`.

## Auth & routing

- Phone OTP via Supabase Auth (Phase 1 uses a mock `123456` flow).
- `middleware.ts` refreshes the session cookie, gates the `(app)` and `/admin` route groups, and
  enforces the admin role against the `admins` table. In mock mode it is a pass-through.

## Rendering & performance

- Static prerender for all routes; dynamic data streams via `<Suspense>` with skeleton fallbacks.
- Fonts via `next/font` (Playfair Display + DM Sans), self-hosted & preloaded.
- Lucide icons tree-shaken; no heavy animation libraries on the critical path.
