-- Rewards for the current user_profiles based app.
-- Claiming reserves a reward and spends points immediately.
-- Store staff redemption only marks the claim as redeemed.

create extension if not exists pgcrypto;

create table if not exists public.reward_offers (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  description text not null default '',
  icon text not null default 'Gift',
  points_cost int not null check (points_cost >= 0),
  inventory int check (inventory is null or inventory >= 0),
  is_active boolean not null default true,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.reward_claims (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.user_profiles(id) on delete cascade,
  offer_id uuid not null references public.reward_offers(id) on delete restrict,
  offer_title text not null,
  offer_icon text not null default 'Gift',
  points_cost int not null check (points_cost >= 0),
  status text not null default 'pending'
    check (status in ('pending', 'redeemed', 'cancelled', 'expired')),
  code text not null unique default upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 12)),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  redeemed_at timestamptz
);

create index if not exists reward_offers_active_idx
  on public.reward_offers (is_active, points_cost);

create index if not exists reward_claims_user_idx
  on public.reward_claims (user_id, created_at desc);

create index if not exists reward_claims_status_idx
  on public.reward_claims (status);

insert into public.reward_offers (title, slug, description, icon, points_cost, inventory, is_active)
values
  ('10% off next order', '10-percent-off-next-order', 'Valid on orders 300+ - 7-day expiry', 'Tag', 100, null, true),
  ('Free Ghee Mysore Pak 200g', 'free-ghee-mysore-pak-200g', 'Claim in store - show code at counter', 'Gift', 200, 50, true),
  ('FIFA Mithai Box', 'fifa-mithai-box', 'Limited edition FIFA-themed assortment box', 'Trophy', 350, 25, true),
  ('Premium gift box', 'premium-gift-box', '499 value - ribbon packaging included', 'Gift', 400, 15, true)
on conflict (slug) do nothing;
