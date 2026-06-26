# Repositories

The repository layer is the **only** place that talks to Supabase. Screens and
features import from `src/services/data-service.ts`, which delegates here once
`NEXT_PUBLIC_USE_MOCK_DATA` is off.

Keeping all queries in one folder means:

- RLS-aware reads use the request-scoped client (`lib/supabase/server.ts`).
- Privileged writes (ledger inserts, settlement) use the admin client and run
  inside Postgres functions / RPCs so balances are transactional.
- The `data-service` signatures never change between Phase 1 (mock) and Phase 2
  (live) — only the implementation behind them does.

## Files (Phase 2)

| File | Responsibility |
| --- | --- |
| `user-repo.ts` | current user, profile updates, streak maintenance |
| `match-repo.ts` | campaign matches, single match, status transitions |
| `prediction-repo.ts` | create/edit prediction (with close-time + token guard), list |
| `reward-repo.ts` | catalogue reads, redemption creation + QR issuance |
| `ledger-repo.ts` | token & point ledger reads, balance helpers |
| `leaderboard-repo.ts` | weekly & season views |

Each export matches a `data-service` function 1:1.
