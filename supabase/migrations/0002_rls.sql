-- ════════════════════════════════════════════════════════════════════════════
--  Row Level Security
--  Principle: users see/modify only their own rows; campaign/match/reward
--  catalogue is world-readable; writes to sensitive tables go through the
--  service role (server actions) or admin checks only.
-- ════════════════════════════════════════════════════════════════════════════

-- Helper: is the current user an admin?
create or replace function is_admin() returns boolean as $$
  select exists (select 1 from admins where user_id = auth.uid());
$$ language sql security definer stable;

-- Enable RLS everywhere.
alter table users          enable row level security;
alter table admins         enable row level security;
alter table campaigns      enable row level security;
alter table matches        enable row level security;
alter table predictions    enable row level security;
alter table rewards        enable row level security;
alter table redemptions    enable row level security;
alter table token_ledger   enable row level security;
alter table point_ledger   enable row level security;
alter table purchases      enable row level security;
alter table notifications  enable row level security;
alter table referrals      enable row level security;
alter table settings       enable row level security;

-- ─── USERS ──────────────────────────────────────────────────────────────────
create policy "read own user"        on users for select using (auth.uid() = id or is_admin());
create policy "update own profile"   on users for update using (auth.uid() = id)
  with check (auth.uid() = id);
create policy "admins manage users"  on users for all using (is_admin());

-- ─── PUBLIC CATALOGUE (read-only to all authenticated users) ────────────────
create policy "campaigns readable" on campaigns for select using (true);
create policy "matches readable"   on matches   for select using (true);
create policy "rewards readable"   on rewards   for select using (is_active or is_admin());

create policy "admins write campaigns" on campaigns for all using (is_admin()) with check (is_admin());
create policy "admins write matches"   on matches   for all using (is_admin()) with check (is_admin());
create policy "admins write rewards"   on rewards   for all using (is_admin()) with check (is_admin());

-- ─── PREDICTIONS ────────────────────────────────────────────────────────────
create policy "read own predictions" on predictions for select using (auth.uid() = user_id or is_admin());
-- Inserts validated server-side (token debit + close-time check) via service role.
create policy "insert own predictions" on predictions for insert with check (auth.uid() = user_id);
create policy "update own predictions" on predictions for update using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ─── REDEMPTIONS ────────────────────────────────────────────────────────────
create policy "read own redemptions" on redemptions for select using (auth.uid() = user_id or is_admin());
create policy "admins manage redemptions" on redemptions for all using (is_admin());

-- ─── LEDGERS & PURCHASES (read own; writes service-role only) ───────────────
create policy "read own token ledger" on token_ledger for select using (auth.uid() = user_id or is_admin());
create policy "read own point ledger" on point_ledger for select using (auth.uid() = user_id or is_admin());
create policy "read own purchases"    on purchases    for select using (auth.uid() = user_id or is_admin());

-- ─── NOTIFICATIONS & REFERRALS ──────────────────────────────────────────────
create policy "read own notifications"   on notifications for select using (auth.uid() = user_id);
create policy "update own notifications" on notifications for update using (auth.uid() = user_id);
create policy "read own referrals"       on referrals for select using (auth.uid() = referrer_id or auth.uid() = referee_id);

-- ─── ADMIN-ONLY TABLES ──────────────────────────────────────────────────────
create policy "admins read admins" on admins   for select using (is_admin());
create policy "admins settings"    on settings  for all using (is_admin()) with check (is_admin());

-- Note: token_ledger / point_ledger / purchases inserts are intentionally NOT
-- granted to authenticated users — they are written exclusively by trusted
-- server code using the service-role key, which bypasses RLS.
