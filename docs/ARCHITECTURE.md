# Architecture

## Principles

- UI-first customer experience backed by seeded data while the live backend is connected.
- One data seam: screens should read through `src/services/data-service.ts` or the Zustand store, not direct database calls.
- SQL owns balance-changing rules through RPCs and RLS.
- Campaign data lives in `campaigns`, `matches`, and `offers`, so seasonal changes do not require UI rewrites.

## Layers

```text
Customer routes and feature modules
  -> data-service / store
  -> mock data now, Supabase repositories later
  -> Supabase Postgres migrations, RLS, triggers, RPCs
```

## State

The current customer app uses an in-memory Zustand store for testing. Refreshing the browser clears local users, predictions, claims, matches, and offers back to seeded mock data.

## Backend

The current database model is an open campaign:

- one free 1X2 prediction per match
- correct predictions earn points at settlement
- offers create pending claims
- points are deducted only when a claim is redeemed by admin
- `point_ledger` is the source of truth for point changes

## Auth & Routing

Phone and email OTP delivery will back the production login flow. `proxy.ts` handles customer-route session refresh/gating when Supabase is configured. The admin console is a separate application.
