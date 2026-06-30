-- Keep DB-generated coupon codes longer for manual/admin inserts.
-- The app also generates a unique 10-character code and retries on collision.
alter table public.reward_claims
  alter column code set default upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 12));
