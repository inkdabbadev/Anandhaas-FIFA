-- ════════════════════════════════════════════════════════════════════════════
--  seed.sql — sample campaign, matches and offers for local development.
--  Profiles/admins reference auth.users, so create those via Supabase Auth, then
--  `insert into admins (user_id, role) values ('<auth-uid>', 'owner');`
-- ════════════════════════════════════════════════════════════════════════════

insert into campaigns (id, slug, name, tagline, sport, season, starts_at, ends_at, is_active, branding, points_correct)
values (
  '00000000-0000-0000-0000-000000000001',
  'fifa-world-cup-2026',
  'FIFA World Cup 2026',
  'Predict. Win. Win sweet rewards.',
  'football',
  '2026',
  '2026-06-11T00:00:00Z',
  '2026-07-19T23:59:59Z',
  true,
  '{"primary_color":"#0b1f1a","accent_color":"#2563eb","emoji":"⚽"}'::jsonb,
  2
)
on conflict (id) do nothing;

-- ─── Sample matches (open for prediction) ───────────────────────────────────
insert into matches
  (campaign_id, competition, group_name, home_name, home_flag, home_ranking,
   away_name, away_flag, away_ranking, venue, kickoff_at, prediction_closes_at, status)
values
  ('00000000-0000-0000-0000-000000000001','FIFA WC 2026','Group A','Brazil','🇧🇷','FIFA #1',
   'Germany','🇩🇪','FIFA #3','MetLife Stadium', now() + interval '3 hour', now() + interval '2 hour 50 minute','open'),
  ('00000000-0000-0000-0000-000000000001','FIFA WC 2026','Group B','Argentina','🇦🇷','FIFA #2',
   'France','🇫🇷','FIFA #4','SoFi Stadium', now() + interval '6 hour', now() + interval '5 hour 50 minute','open'),
  ('00000000-0000-0000-0000-000000000001','FIFA WC 2026','Group C','Spain','🇪🇸','FIFA #8',
   'Morocco','🇲🇦','FIFA #14','AT&T Stadium', now() + interval '27 hour', now() + interval '26 hour 50 minute','open'),
  ('00000000-0000-0000-0000-000000000001','FIFA WC 2026','Group D','England','🏴',  'FIFA #5',
   'Portugal','🇵🇹','FIFA #6','Levi''s Stadium', now() + interval '30 hour', now() + interval '29 hour 50 minute','open');

-- ─── Sample offers ──────────────────────────────────────────────────────────
insert into offers (campaign_id, title, description, icon, points_cost, inventory)
values
  ('00000000-0000-0000-0000-000000000001','10% off next order','Valid on orders ₹300+ · 7-day expiry','🏷️',6,null),
  ('00000000-0000-0000-0000-000000000001','Free Ghee Mysore Pak 200g','Claim in store at the counter','🍬',10,50),
  ('00000000-0000-0000-0000-000000000001','FIFA Mithai Box','Limited-edition FIFA assortment box','🪄',18,25),
  ('00000000-0000-0000-0000-000000000001','Premium gift box','₹499 value · ribbon packaging','🎁',24,15);
