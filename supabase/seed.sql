-- ════════════════════════════════════════════════════════════════════════════
--  Seed data — FIFA World Cup 2026 campaign.
--  Run after migrations: `supabase db reset` applies migrations + this seed.
-- ════════════════════════════════════════════════════════════════════════════

insert into campaigns (id, slug, name, tagline, sport, season, starts_at, ends_at, is_active, branding, rules)
values (
  '00000000-0000-0000-0000-000000000001',
  'fifa-world-cup-2026',
  'FIFA World Cup 2026',
  'Predict. Win. Taste victory.',
  'football',
  '2026',
  '2026-06-11T00:00:00Z',
  '2026-07-19T23:59:59Z',
  true,
  '{"primary_color":"#1a140d","accent_color":"#93c5fd","emoji":"⚽"}',
  '{"token_cost_per_prediction":2,"points_winner":50,"points_exact_score":150,"points_first_scorer":30,"points_perfect":280,"streak_bonus_at":7,"streak_bonus_points":50,"tokens_per_100_inr":1,"prediction_close_minutes":10,"token_expiry_days":30}'
);

insert into matches (campaign_id, home_team, away_team, competition, group_name, kickoff_at, prediction_closes_at, token_cost, status)
values
  ('00000000-0000-0000-0000-000000000001', '{"name":"Brazil","flag":"🇧🇷","ranking":"FIFA #1"}', '{"name":"Germany","flag":"🇩🇪","ranking":"FIFA #3"}', 'FIFA WC 2026', 'Group A', now() + interval '3 hours', now() + interval '2 hours 50 minutes', 2, 'upcoming'),
  ('00000000-0000-0000-0000-000000000001', '{"name":"Argentina","flag":"🇦🇷","ranking":"FIFA #2"}', '{"name":"France","flag":"🇫🇷","ranking":"FIFA #4"}', 'FIFA WC 2026', 'Group B', now() + interval '6 hours', now() + interval '5 hours 50 minutes', 2, 'upcoming'),
  ('00000000-0000-0000-0000-000000000001', '{"name":"Spain","flag":"🇪🇸","ranking":"FIFA #8"}', '{"name":"Morocco","flag":"🇲🇦","ranking":"FIFA #14"}', 'FIFA WC 2026', 'Group C', now() + interval '1 day', now() + interval '23 hours', 1, 'upcoming');

insert into rewards (campaign_id, title, description, icon, points_cost, inventory) values
  ('00000000-0000-0000-0000-000000000001', '10% off next order', 'Valid on orders ₹300+ · 7-day expiry', '🏷️', 100, null),
  ('00000000-0000-0000-0000-000000000001', 'Free Ghee Mysore Pak 200g', 'Claim instore · show QR code at counter', '🍬', 200, 50),
  ('00000000-0000-0000-0000-000000000001', 'FIFA Mithai Box', 'Limited edition FIFA-themed assortment box', '🪄', 350, 25),
  ('00000000-0000-0000-0000-000000000001', 'Premium gift box', '₹499 value · ribbon packaging included', '🎁', 400, 15),
  ('00000000-0000-0000-0000-000000000001', 'VIP Leaderboard badge', 'Gold badge for top-tier season finishers', '🏆', 500, null);

insert into settings (key, value) values
  ('active_campaign', '"fifa-world-cup-2026"'),
  ('maintenance_mode', 'false');
