-- ════════════════════════════════════════════════════════════════════════════
--  Anandhaas × FIFA Predict — Core schema (open campaign, points model)
--  0001_init.sql — extensions, enums, tables, indexes, triggers
--
--  Model: open campaign (no tokens). Customers register with phone + email + name + age,
--  make one free 1X2 prediction per match. A correct prediction earns points
--  (campaigns.points_correct, default 2) at settlement; wrong earns 0. Points are
--  spent on offers, deducted only when an admin redeems the claim in store.
--  The point_ledger is the append-only source of truth; profiles.points is a
--  trigger-maintained cache.
-- ════════════════════════════════════════════════════════════════════════════

create extension if not exists pgcrypto;   -- gen_random_uuid()
create extension if not exists citext;     -- case-insensitive text

-- ─── Enums ──────────────────────────────────────────────────────────────────
create type admin_role        as enum ('owner', 'manager', 'counter_staff', 'analyst');
create type match_status      as enum ('scheduled', 'open', 'locked', 'live', 'finished', 'cancelled');
create type prediction_pick   as enum ('home', 'draw', 'away');
create type prediction_status as enum ('pending', 'won', 'lost', 'void');
create type claim_status      as enum ('pending', 'redeemed', 'cancelled', 'expired');
create type ledger_reason     as enum ('prediction_win', 'redemption', 'redemption_reversal', 'manual_adjustment');

-- ─── updated_at helper ──────────────────────────────────────────────────────
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ─── Campaigns (reusable campaign engine) ───────────────────────────────────
create table campaigns (
  id             uuid primary key default gen_random_uuid(),
  slug           text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  name           text not null,
  tagline        text,
  sport          text not null default 'football',
  season         text not null,
  starts_at      timestamptz not null,
  ends_at        timestamptz not null,
  is_active      boolean not null default false,
  branding       jsonb not null default '{}'::jsonb,    -- colors, emoji, logo
  points_correct int  not null default 2 check (points_correct >= 0),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  constraint campaign_dates check (starts_at < ends_at)
);
-- At most one active campaign at a time.
create unique index uq_campaigns_one_active on campaigns (is_active) where is_active;
create trigger trg_campaigns_updated before update on campaigns
  for each row execute function set_updated_at();

-- ─── Profiles (customers) ───────────────────────────────────────────────────
-- 1:1 with auth.users. Phone and email are unique account identifiers; `points` is a maintained cache
-- of point_ledger; never written directly by clients (see ledger trigger below).
create table profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  phone      text not null unique check (phone ~ '^[6-9][0-9]{9}$'),
  email      citext not null unique check (email ~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$'),
  name       text not null check (length(btrim(name)) between 1 and 80),
  age        int  not null check (age between 12 and 120),
  points     int  not null default 0 check (points >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_profiles_points on profiles (points desc);
create trigger trg_profiles_updated before update on profiles
  for each row execute function set_updated_at();

-- ─── Admins ─────────────────────────────────────────────────────────────────
create table admins (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  role       admin_role not null default 'counter_staff',
  created_at timestamptz not null default now()
);

create or replace function is_admin(uid uuid default auth.uid())
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from admins a where a.user_id = uid);
$$;

create or replace function is_admin_role(roles admin_role[], uid uuid default auth.uid())
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from admins a where a.user_id = uid and a.role = any(roles));
$$;

-- ─── Matches (admin-authored) ───────────────────────────────────────────────
create table matches (
  id                   uuid primary key default gen_random_uuid(),
  campaign_id          uuid not null references campaigns(id) on delete cascade,
  competition          text not null default 'FIFA WC 2026',
  group_name           text,
  home_name            text not null,
  home_flag            text not null,
  home_ranking         text,
  away_name            text not null,
  away_flag            text not null,
  away_ranking         text,
  venue                text,
  kickoff_at           timestamptz not null,
  prediction_closes_at timestamptz not null,
  status               match_status not null default 'scheduled',
  home_score           int check (home_score is null or home_score between 0 and 99),
  away_score           int check (away_score is null or away_score between 0 and 99),
  -- Final outcome, generated from the score once entered.
  result               prediction_pick generated always as (
    case
      when home_score is null or away_score is null then null
      when home_score > away_score then 'home'::prediction_pick
      when away_score > home_score then 'away'::prediction_pick
      else 'draw'::prediction_pick
    end
  ) stored,
  settled_at           timestamptz,
  created_by           uuid references admins(user_id),
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),
  constraint match_close_before_kickoff check (prediction_closes_at <= kickoff_at),
  constraint match_score_pair check ((home_score is null) = (away_score is null))
);
create index idx_matches_campaign on matches (campaign_id);
create index idx_matches_kickoff  on matches (kickoff_at);
create index idx_matches_status   on matches (status);
create trigger trg_matches_updated before update on matches
  for each row execute function set_updated_at();

-- ─── Predictions (one per user per match) ───────────────────────────────────
create table predictions (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references profiles(id) on delete cascade,
  match_id       uuid not null references matches(id) on delete cascade,
  pick           prediction_pick not null,
  status         prediction_status not null default 'pending',
  points_awarded int not null default 0 check (points_awarded >= 0),
  created_at     timestamptz not null default now(),
  settled_at     timestamptz,
  unique (user_id, match_id)                        -- ← one locked pick per match
);
create index idx_predictions_match on predictions (match_id);
create index idx_predictions_user  on predictions (user_id);

-- Reject predictions once the window has closed / match is no longer open.
create or replace function enforce_prediction_window()
returns trigger language plpgsql as $$
declare m matches;
begin
  select * into m from matches where id = new.match_id;
  if m.id is null then
    raise exception 'Match % not found', new.match_id;
  end if;
  if m.status <> 'open' or now() >= m.prediction_closes_at then
    raise exception 'Predictions are closed for this match';
  end if;
  return new;
end;
$$;
create trigger trg_predictions_window before insert on predictions
  for each row execute function enforce_prediction_window();

-- Predictions are immutable to clients once made; settlement sets app.settling='on'.
create or replace function block_prediction_mutation()
returns trigger language plpgsql as $$
begin
  raise exception 'Predictions cannot be changed once locked';
end;
$$;
create trigger trg_predictions_no_update before update on predictions
  for each row when (current_setting('app.settling', true) is distinct from 'on')
  execute function block_prediction_mutation();

-- ─── Offers (admin-authored rewards) ────────────────────────────────────────
create table offers (
  id          uuid primary key default gen_random_uuid(),
  campaign_id uuid references campaigns(id) on delete cascade,
  title       text not null,
  description text not null default '',
  icon        text not null default '🎁',
  points_cost int  not null check (points_cost >= 0),
  inventory   int  check (inventory is null or inventory >= 0),   -- null = unlimited
  is_active   boolean not null default true,
  valid_until timestamptz,
  created_by  uuid references admins(user_id),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index idx_offers_active on offers (is_active, points_cost);
create trigger trg_offers_updated before update on offers
  for each row execute function set_updated_at();

-- ─── Claims (reward redemptions) ────────────────────────────────────────────
-- A claim reserves an offer. Points are deducted only at in-store redemption.
create table claims (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references profiles(id) on delete cascade,
  offer_id    uuid not null references offers(id) on delete restrict,
  points_cost int  not null check (points_cost >= 0),    -- snapshot at claim time
  status      claim_status not null default 'pending',
  code        text not null unique default upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8)),
  created_at  timestamptz not null default now(),
  redeemed_at timestamptz,
  redeemed_by uuid references admins(user_id)
);
create index idx_claims_user   on claims (user_id);
create index idx_claims_status on claims (status);
-- Only one open (pending) claim per user per offer.
create unique index uq_claims_open on claims (user_id, offer_id) where status = 'pending';

-- ─── Point ledger (append-only source of truth) ─────────────────────────────
create table point_ledger (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references profiles(id) on delete cascade,
  delta      int  not null,                        -- + earned, − spent
  reason     ledger_reason not null,
  ref_type   text,                                 -- 'prediction' | 'claim'
  ref_id     uuid,
  note       text,
  created_at timestamptz not null default now()
);
create index idx_ledger_user on point_ledger (user_id, created_at desc);

-- Maintain profiles.points cache from the ledger.
create or replace function apply_ledger_to_balance()
returns trigger language plpgsql as $$
begin
  update profiles set points = points + new.delta where id = new.user_id;
  if (select points from profiles where id = new.user_id) < 0 then
    raise exception 'Insufficient points';
  end if;
  return new;
end;
$$;
create trigger trg_ledger_balance after insert on point_ledger
  for each row execute function apply_ledger_to_balance();
