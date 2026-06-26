# Database

Postgres on Supabase. Schema lives in `supabase/migrations/` and seed in `supabase/seed.sql`.

## Apply

```bash
# with the Supabase CLI
supabase db reset           # applies migrations + seed locally
supabase db push            # push migrations to a linked project

# or paste 0001_init.sql, 0002_rls.sql, seed.sql into the SQL editor in order
```

## Tables

| Table | Purpose |
| --- | --- |
| `campaigns` | The reusable engine: branding, rules, season window. One active at a time. |
| `users` | 1:1 with `auth.users`. Caches `token_balance`, `season_points`, `tier`, `streak`. |
| `admins` | Grants admin console access (checked by `is_admin()` + middleware). |
| `matches` | Fixtures bound to a campaign. Teams stored as JSONB `{name,flag,ranking}`. |
| `predictions` | One per `(user, match)`. Winner + score + first scorer. |
| `rewards` | Redeemable catalogue with points cost, inventory, expiry. |
| `redemptions` | Issued reward instances with a unique one-time `qr_code`. |
| `token_ledger` | Append-only signed token transactions. Source of truth for balance. |
| `point_ledger` | Append-only signed point transactions. Drives season points + tier. |
| `purchases` | Unified purchase records across all sources. |
| `notifications` | Event log per channel. |
| `referrals` | Referral codes and reward state. |
| `settings` | Key/value app config (active campaign, maintenance flag). |

## Enums

`user_tier`, `match_status`, `prediction_status`, `reward_status`, `token_tx_type`,
`point_tx_type`, `purchase_source`, `notif_channel`.

## Triggers

| Trigger | Effect |
| --- | --- |
| `users_touch` | Maintains `users.updated_at`. |
| `token_ledger_apply` | After insert → updates `users.token_balance = balance_after`. |
| `point_ledger_apply` | After insert → updates `season_points` **and recomputes `tier`**. |
| `on_auth_user_created` | Auto-creates a `public.users` row on signup. |

## Views

- `leaderboard_season` — ranked by `season_points`, with correct/exact counts.
- `leaderboard_weekly` — ranked by points earned since `date_trunc('week', now())`.

## Balance integrity

Never trust the client. Predictions debit tokens and settlement credits points **server-side**
(service-role) by inserting ledger rows; the triggers keep the cached columns correct. The cached
columns exist only to make reads cheap.

## Indexes

Hot paths are covered: `matches(campaign_id, kickoff_at)`, `predictions(user_id)`,
`predictions(match_id)`, `token_ledger(user_id, created_at desc)`, `token_ledger(expires_at)` for
expiry sweeps, and equivalents on points/purchases/redemptions.

## Scoring rules (default campaign)

| Outcome | Points |
| --- | --- |
| Correct winner | 50 |
| Exact scoreline | 150 |
| First scoring team | 30 |
| Perfect match (all three) | 280 (flat) |
| 7-day streak bonus | +50 |

Tokens: ₹100 spent = 1 token; tokens expire after 30 days. Predictions close 10 minutes before
kickoff. All values are read from the active campaign's `rules` JSONB, not hardcoded.
