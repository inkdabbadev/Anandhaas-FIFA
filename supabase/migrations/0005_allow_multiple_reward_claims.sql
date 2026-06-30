-- Allow a user to claim the same reward offer multiple times.
drop index if exists public.reward_claims_one_pending_offer_idx;
