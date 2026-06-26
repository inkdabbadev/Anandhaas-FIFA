# API & data access

There is no bespoke REST layer in Phase 1 — the app talks to its data through the **`data-service`
seam** and (in Phase 2) Supabase's auto-generated PostgREST API guarded by RLS. This keeps the
surface small and the security model in the database.

## The data-service contract

`src/services/data-service.ts` — every function is async and returns typed domain objects.

| Function | Returns | Live source (Phase 2) |
| --- | --- | --- |
| `getCurrentUser()` | `User` | `users` where `id = auth.uid()` |
| `getMatches()` | `Match[]` | `matches` for active campaign |
| `getPredictions()` | `Prediction[]` | `predictions` for current user |
| `getRewards()` | `Reward[]` | `rewards` where `is_active` |
| `getLeaderboard()` | `LeaderboardEntry[]` | `leaderboard_weekly` / `leaderboard_season` |
| `getTokenLedger()` | `TokenLedger[]` | `token_ledger` for current user |
| `getRedemptions()` | `Redemption[]` | `redemptions` for current user |

Screens import these only. Implementations swap from `lib/mock/data.ts` to `repositories/*` based
on `NEXT_PUBLIC_USE_MOCK_DATA` / Supabase config.

## Mutations (Phase 2 — server actions / RPCs)

Mutations run server-side with validation and must be transactional.

### `lockPrediction(input)`
1. Validate with `predictionSchema`.
2. Assert `now() < match.prediction_closes_at` and match `status = 'upcoming'`.
3. Assert one prediction per user per match (DB unique constraint).
4. Insert `predictions` + debit `token_ledger` in a single RPC.
5. Emit `prediction_locked`.

### `settleMatch(matchId, result)` (admin)
1. Validate with `resultSchema`; update `matches` (scores, first scorer, `status='finished'`).
2. For each pending prediction, run `scorePrediction()` and insert `point_ledger` credits.
3. Update prediction `status` + `points_earned`.
4. Emit `prediction_won` to winners.

### `redeemReward(rewardId)`
1. Assert balance ≥ `points_cost` and inventory available.
2. Debit points, decrement inventory, create `redemptions` row with a unique `qr_code` and
   `qr_expires_at`.
3. Emit `reward_redeemed`.

### `recordPurchase(input)` — see `services/purchase-service.ts`
Normalises any source and credits tokens + points. Adapters: `manualSource`, `csvSource`,
plus POS / Shopify / webhook in Phase 4.

## Auth endpoints (Supabase Auth)

| Action | Call |
| --- | --- |
| Request OTP | `supabase.auth.signInWithOtp({ phone })` |
| Verify OTP | `supabase.auth.verifyOtp({ phone, token, type: 'sms' })` |
| Session | refreshed in `middleware.ts` on every request |
| Sign out | `supabase.auth.signOut()` |

## Security

All access is enforced by **Row Level Security** (`0002_rls.sql`): users read/write only their own
rows; the catalogue is world-readable; ledger/purchase writes are service-role only. The admin
console additionally checks the `admins` table via `is_admin()` and middleware.
