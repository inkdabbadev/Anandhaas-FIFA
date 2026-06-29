# Database

Postgres on Supabase. Schema lives in `supabase/migrations/` and seed data lives in `supabase/seed.sql`.

## Apply

```bash
supabase db reset
supabase db push
```

SQL editor order:

1. `supabase/migrations/0001_init.sql`
2. `supabase/migrations/0002_functions.sql`
3. `supabase/migrations/0003_rls.sql`
4. `supabase/seed.sql`

## Current Model

| Table | Purpose |
| --- | --- |
| `campaigns` | Active seasonal campaign, branding, and scoring value. |
| `profiles` | Customer profile linked 1:1 to `auth.users`; stores unique phone, unique email, name, age, points, tier. |
| `admins` | Role table for the separate admin application and privileged RPC checks. |
| `matches` | Admin-authored fixtures with teams, kickoff, prediction close time, score, result. |
| `predictions` | One locked 1X2 pick per user per match. |
| `offers` | Customer rewards catalogue with cost, inventory, active flag, expiry. |
| `claims` | Customer reward claims; points are deducted only when redeemed by admin. |
| `point_ledger` | Append-only point transactions; trigger maintains `profiles.points`. |

## Business Rules

- Predictions are free in the open campaign model.
- A user can make only one prediction per match.
- Predictions are accepted only when the match status is `open` and before `prediction_closes_at`.
- Settlement is done through `fn_settle_match`, which scores all pending predictions and writes point credits.
- Offers are claimed through `fn_claim_offer`; claiming reserves intent but does not deduct points.
- Store redemption is done through `fn_redeem_claim`, which checks inventory and balance, writes the ledger debit, then marks the claim redeemed.
- Customers can cancel only their own pending claims through `fn_cancel_claim`.

## Security

RLS is enabled on all app tables. Customer writes are narrow:

- `profiles`: users can insert their own phone/email profile and update only `name` and `age`.
- `predictions`: users can insert their own prediction only.
- `claims` and `point_ledger`: users can read their own rows only.
- Admin writes are checked through `admins` and the `is_admin_role` helper.

All balance-changing writes happen through security-definer functions in `0002_functions.sql`.
