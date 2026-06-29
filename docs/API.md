# API & Data Access

The customer app currently runs on seeded in-memory data. Live Supabase access should be added behind `src/services/data-service.ts` and repository functions so screens do not need to change.

## Read Contract

| Function | Returns | Live source |
| --- | --- | --- |
| `getCurrentUser()` | `User` | `profiles` for `auth.uid()` |
| `getMatches()` | `Match[]` | `matches` for the active campaign |
| `getPredictions()` | `Prediction[]` | `predictions` for the current profile |
| `getRewards()` | `Reward[]` | active `offers` |
| `getLeaderboard()` | `LeaderboardEntry[]` | `v_leaderboard` |

## RPC Contract

| Action | Function |
| --- | --- |
| Make prediction | `fn_predict(match_id, pick)` |
| Claim offer | `fn_claim_offer(offer_id)` |
| Cancel claim | `fn_cancel_claim(claim_id)` |
| Settle match | `fn_settle_match(match_id, home_score, away_score)` |
| Redeem claim | `fn_redeem_claim(claim_id)` |

Balance-changing operations must stay in SQL RPCs. The client should never write `point_ledger` directly.

## Auth

The production auth flow should deliver OTP to the submitted phone and email, then create a `profiles` row with the unique phone/email pairing. The current UI flow is still mock-friendly for local testing.

## Security

RLS lives in `supabase/migrations/0003_rls.sql`. Users can read/write only their own profile, predictions, claims, and ledger rows. Public catalogue reads are limited to campaigns, matches, active offers, leaderboard, and match breakdown.
