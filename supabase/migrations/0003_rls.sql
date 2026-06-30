-- ════════════════════════════════════════════════════════════════════════════
--  0003_rls.sql — Row-Level Security & grants
--  Reads are open where the campaign is meant to be public (matches, offers,
--  leaderboard). All point mutations happen through the SECURITY DEFINER
--  functions in 0002, which bypass RLS, so clients can never write the ledger
--  or settle matches directly.
-- ════════════════════════════════════════════════════════════════════════════

alter table campaigns    enable row level security;
alter table profiles     enable row level security;
alter table admins       enable row level security;
alter table matches      enable row level security;
alter table predictions  enable row level security;
alter table offers       enable row level security;
alter table claims       enable row level security;
alter table point_ledger enable row level security;

-- ─── Campaigns: public read, admin write ────────────────────────────────────
create policy campaigns_read   on campaigns for select using (true);
create policy campaigns_write  on campaigns for all
  using (is_admin_role(array['owner','manager']::admin_role[]))
  with check (is_admin_role(array['owner','manager']::admin_role[]));

-- ─── Profiles: owner manages own; admin reads all ──────────────────────────
create policy profiles_self_read   on profiles for select using (id = auth.uid() or is_admin());
create policy profiles_self_insert on profiles for insert
  with check (id = auth.uid() and points = 0);
create policy profiles_self_update on profiles for update
  using (id = auth.uid())
  with check (id = auth.uid());

-- ─── Admins: admins read; managed out-of-band (service role / owner) ────────
create policy admins_read  on admins for select using (is_admin());
create policy admins_owner on admins for all
  using (is_admin_role(array['owner']::admin_role[]))
  with check (is_admin_role(array['owner']::admin_role[]));

-- ─── Matches: public read, admin write ──────────────────────────────────────
create policy matches_read  on matches for select using (true);
create policy matches_write on matches for all
  using (is_admin_role(array['owner','manager']::admin_role[]))
  with check (is_admin_role(array['owner','manager']::admin_role[]));

-- ─── Predictions: owner reads own, admin reads all; insert own only ─────────
create policy predictions_read   on predictions for select using (user_id = auth.uid() or is_admin());
create policy predictions_insert on predictions for insert with check (user_id = auth.uid());
-- (no update/delete policy → blocked; settlement runs via SECURITY DEFINER)

-- ─── Offers: public read, admin write ───────────────────────────────────────
create policy offers_read  on offers for select using (is_active or is_admin());
create policy offers_write on offers for all
  using (is_admin_role(array['owner','manager']::admin_role[]))
  with check (is_admin_role(array['owner','manager']::admin_role[]));

-- ─── Claims: owner reads own + admin reads all; writes via functions ────────
create policy claims_read on claims for select using (user_id = auth.uid() or is_admin());
-- inserts/updates happen through fn_claim_offer / fn_redeem_claim (definer)

-- ─── Point ledger: owner reads own, admin reads all; never client-written ───
create policy ledger_read on point_ledger for select using (user_id = auth.uid() or is_admin());

-- ─── Grants ─────────────────────────────────────────────────────────────────
grant usage on schema public to anon, authenticated;

grant select on campaigns, matches, offers, v_leaderboard, v_match_breakdown to anon, authenticated;
grant select on profiles to authenticated;
grant insert (id, phone, email, name, age) on profiles to authenticated;
grant update (name, age) on profiles to authenticated;
grant select, insert on predictions to authenticated;
grant select on claims, point_ledger to authenticated;

revoke execute on function fn_predict(uuid, prediction_pick) from public;
revoke execute on function fn_claim_offer(uuid) from public;
revoke execute on function fn_cancel_claim(uuid) from public;
revoke execute on function fn_settle_match(uuid, int, int) from public;
revoke execute on function fn_redeem_claim(uuid) from public;
revoke execute on function is_admin(uuid) from public;

grant execute on function fn_predict(uuid, prediction_pick)            to authenticated;
grant execute on function fn_claim_offer(uuid)                         to authenticated;
grant execute on function fn_cancel_claim(uuid)                        to authenticated;
grant execute on function fn_settle_match(uuid, int, int)              to authenticated;
grant execute on function fn_redeem_claim(uuid)                        to authenticated;
grant execute on function is_admin(uuid)                               to authenticated;
