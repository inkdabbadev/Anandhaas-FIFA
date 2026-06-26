-- ════════════════════════════════════════════════════════════════════════════
--  Anandhaas Predict — Initial Schema
--  Campaign-driven loyalty + prediction platform.
--  Run in Supabase SQL editor or via `supabase db push`.
-- ════════════════════════════════════════════════════════════════════════════

create extension if not exists "pgcrypto";

-- ─── ENUMS ──────────────────────────────────────────────────────────────────
create type user_tier        as enum ('mithai_fan', 'sweet_striker', 'golden_boot', 'fifa_legend');
create type match_status      as enum ('upcoming', 'live', 'finished', 'cancelled');
create type prediction_status as enum ('pending', 'won', 'lost', 'refunded');
create type reward_status     as enum ('active', 'redeemed', 'expired', 'cancelled');
create type token_tx_type     as enum ('purchase', 'prediction_spend', 'prediction_refund', 'redemption', 'bonus', 'referral', 'manual_grant', 'expiry');
create type point_tx_type     as enum ('purchase', 'prediction_win', 'exact_score', 'first_scorer', 'perfect_match', 'streak_bonus', 'referral', 'manual_grant');
create type purchase_source   as enum ('pos', 'shopify', 'manual', 'csv', 'webhook');
create type notif_channel      as enum ('whatsapp', 'push', 'sms', 'email', 'in_app');

-- ─── CAMPAIGNS ──────────────────────────────────────────────────────────────
-- The reusable "engine". A campaign bundles branding, scoring rules, matches,
-- rewards and leaderboard. Swap the active row to run IPL / Diwali / Pongal etc.
create table campaigns (
  id          uuid primary key default gen_random_uuid(),
  slug        text unique not null,
  name        text not null,
  tagline     text,
  sport       text not null default 'football',
  season      text not null,
  starts_at   timestamptz not null,
  ends_at     timestamptz not null,
  is_active   boolean not null default false,
  branding    jsonb not null default '{}',
  rules       jsonb not null default '{}',
  created_at  timestamptz not null default now()
);
-- Only one active campaign at a time.
create unique index one_active_campaign on campaigns (is_active) where is_active;

-- ─── USERS ──────────────────────────────────────────────────────────────────
-- Mirrors auth.users (1:1). `token_balance` & `season_points` are denormalised
-- caches kept in sync by ledger triggers; ledgers remain the source of truth.
create table users (
  id              uuid primary key references auth.users(id) on delete cascade,
  phone           text unique not null,
  name            text,
  avatar_url      text,
  tier            user_tier not null default 'mithai_fan',
  season_points   integer not null default 0,
  token_balance   integer not null default 0,
  referral_code   text unique not null default upper(substr(md5(random()::text), 1, 8)),
  referred_by     uuid references users(id),
  streak_count    integer not null default 0,
  streak_last_date date,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create table admins (
  user_id    uuid primary key references users(id) on delete cascade,
  role       text not null default 'admin',
  created_at timestamptz not null default now()
);

-- ─── MATCHES ────────────────────────────────────────────────────────────────
create table matches (
  id                   uuid primary key default gen_random_uuid(),
  campaign_id          uuid not null references campaigns(id) on delete cascade,
  home_team            jsonb not null,   -- { name, flag, ranking }
  away_team            jsonb not null,
  competition          text not null,
  group_name           text,
  kickoff_at           timestamptz not null,
  prediction_closes_at timestamptz not null,
  token_cost           integer not null default 1 check (token_cost >= 0),
  status               match_status not null default 'upcoming',
  home_score           integer check (home_score >= 0),
  away_score           integer check (away_score >= 0),
  first_scorer_team    text,
  venue                text,
  created_at           timestamptz not null default now()
);
create index matches_campaign_idx on matches (campaign_id, kickoff_at);
create index matches_status_idx   on matches (status);

-- ─── PREDICTIONS ────────────────────────────────────────────────────────────
create table predictions (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references users(id) on delete cascade,
  match_id          uuid not null references matches(id) on delete cascade,
  campaign_id       uuid not null references campaigns(id) on delete cascade,
  winner            text not null,
  home_goals        integer not null check (home_goals between 0 and 30),
  away_goals        integer not null check (away_goals between 0 and 30),
  first_scorer_team text,
  tokens_spent      integer not null default 0,
  status            prediction_status not null default 'pending',
  points_earned     integer not null default 0,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  unique (user_id, match_id)            -- one prediction per user per match
);
create index predictions_user_idx  on predictions (user_id);
create index predictions_match_idx  on predictions (match_id);

-- ─── REWARDS & REDEMPTIONS ──────────────────────────────────────────────────
create table rewards (
  id          uuid primary key default gen_random_uuid(),
  campaign_id uuid references campaigns(id) on delete cascade,
  title       text not null,
  description text not null,
  icon        text not null default '🎁',
  points_cost integer not null check (points_cost >= 0),
  inventory   integer check (inventory >= 0),     -- null = unlimited
  is_active   boolean not null default true,
  expires_at  timestamptz,
  created_at  timestamptz not null default now()
);

create table redemptions (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references users(id) on delete cascade,
  reward_id     uuid not null references rewards(id),
  points_spent  integer not null,
  status        reward_status not null default 'active',
  qr_code       text unique not null,
  qr_expires_at timestamptz not null,
  redeemed_at   timestamptz,
  created_at    timestamptz not null default now()
);
create index redemptions_user_idx on redemptions (user_id);

-- ─── LEDGERS (source of truth for balances) ─────────────────────────────────
create table token_ledger (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references users(id) on delete cascade,
  type          token_tx_type not null,
  amount        integer not null,         -- signed
  balance_after integer not null,
  ref_id        uuid,
  note          text,
  expires_at    timestamptz,              -- for expiry sweeps
  created_at    timestamptz not null default now()
);
create index token_ledger_user_idx    on token_ledger (user_id, created_at desc);
create index token_ledger_expiry_idx  on token_ledger (expires_at) where expires_at is not null;

create table point_ledger (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references users(id) on delete cascade,
  campaign_id   uuid not null references campaigns(id) on delete cascade,
  type          point_tx_type not null,
  amount        integer not null,
  balance_after integer not null,
  ref_id        uuid,
  note          text,
  created_at    timestamptz not null default now()
);
create index point_ledger_user_idx on point_ledger (user_id, created_at desc);

-- ─── PURCHASES ──────────────────────────────────────────────────────────────
create table purchases (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references users(id) on delete cascade,
  source         purchase_source not null default 'pos',
  amount_inr     numeric(10,2) not null check (amount_inr >= 0),
  tokens_granted integer not null default 0,
  points_granted integer not null default 0,
  ref_id         text,
  purchased_at   timestamptz not null default now(),
  created_at     timestamptz not null default now()
);
create index purchases_user_idx on purchases (user_id, purchased_at desc);

-- ─── NOTIFICATIONS & REFERRALS ──────────────────────────────────────────────
create table notifications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references users(id) on delete cascade,
  channel    notif_channel not null default 'in_app',
  event      text not null,
  payload    jsonb not null default '{}',
  sent_at    timestamptz,
  read_at    timestamptz,
  created_at timestamptz not null default now()
);
create index notifications_user_idx on notifications (user_id, created_at desc);

create table referrals (
  id          uuid primary key default gen_random_uuid(),
  referrer_id uuid not null references users(id) on delete cascade,
  referee_id  uuid references users(id),
  code        text not null,
  rewarded    boolean not null default false,
  created_at  timestamptz not null default now()
);

create table settings (
  key        text primary key,
  value      jsonb not null,
  updated_at timestamptz not null default now()
);

-- ════════════════════════════════════════════════════════════════════════════
--  TRIGGERS
-- ════════════════════════════════════════════════════════════════════════════

-- Keep users.updated_at fresh.
create or replace function touch_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end; $$ language plpgsql;

create trigger users_touch before update on users
  for each row execute function touch_updated_at();

-- Maintain token_balance cache from the ledger.
create or replace function apply_token_ledger() returns trigger as $$
begin
  update users set token_balance = new.balance_after where id = new.user_id;
  return new;
end; $$ language plpgsql;

create trigger token_ledger_apply after insert on token_ledger
  for each row execute function apply_token_ledger();

-- Maintain season_points cache + recompute tier from the point ledger.
create or replace function apply_point_ledger() returns trigger as $$
declare new_tier user_tier;
begin
  select case
    when new.balance_after >= 3000 then 'fifa_legend'
    when new.balance_after >= 1500 then 'golden_boot'
    when new.balance_after >= 500  then 'sweet_striker'
    else 'mithai_fan'
  end into new_tier;
  update users set season_points = new.balance_after, tier = new_tier where id = new.user_id;
  return new;
end; $$ language plpgsql;

create trigger point_ledger_apply after insert on point_ledger
  for each row execute function apply_point_ledger();

-- Auto-create a public.users row when an auth user signs up.
create or replace function handle_new_auth_user() returns trigger as $$
begin
  insert into public.users (id, phone)
  values (new.id, coalesce(new.phone, new.email, new.id::text))
  on conflict (id) do nothing;
  return new;
end; $$ language plpgsql security definer;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function handle_new_auth_user();

-- ════════════════════════════════════════════════════════════════════════════
--  VIEWS
-- ════════════════════════════════════════════════════════════════════════════

-- Season leaderboard.
create or replace view leaderboard_season as
select
  row_number() over (order by u.season_points desc) as rank,
  u.id as user_id, u.name, u.avatar_url, u.tier, u.season_points as points,
  count(p.id) filter (where p.status = 'won')                                   as correct_predictions,
  count(p.id) filter (where p.home_goals = m.home_score
                        and p.away_goals = m.away_score
                        and m.status = 'finished')                              as exact_scores
from users u
left join predictions p on p.user_id = u.id
left join matches m on m.id = p.match_id
group by u.id;

-- Weekly leaderboard (current ISO week, from point_ledger).
create or replace view leaderboard_weekly as
select
  row_number() over (order by sum(pl.amount) desc) as rank,
  u.id as user_id, u.name, u.avatar_url, u.tier,
  coalesce(sum(pl.amount), 0)::int as points
from users u
left join point_ledger pl
  on pl.user_id = u.id and pl.created_at >= date_trunc('week', now())
group by u.id;
