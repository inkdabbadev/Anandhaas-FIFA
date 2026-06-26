# Deployment

Target: **Vercel** + **Supabase**, domain `predict.anandhaassweets.com`.

## 1. Supabase

1. Create a project at supabase.com.
2. **SQL editor** → run in order: `supabase/migrations/0001_init.sql`,
   `supabase/migrations/0002_rls.sql`, `supabase/seed.sql`.
   (Or, with the CLI linked: `supabase db push` then run the seed.)
3. **Authentication → Providers → Phone**: enable, and connect an SMS provider (Twilio /
   MessageBird) with your credentials.
4. Promote yourself to admin:
   ```sql
   insert into admins (user_id) values ('<your-auth-user-uuid>');
   ```
5. **Settings → API**: copy the Project URL, `anon` key and `service_role` key.

## 2. Environment variables

Set these in Vercel (Project → Settings → Environment Variables) and locally in `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...          # server-only, never NEXT_PUBLIC
NEXT_PUBLIC_APP_URL=https://predict.anandhaassweets.com
NEXT_PUBLIC_USE_MOCK_DATA=false        # flip to true to demo without a backend
```

> When Supabase vars are absent, the app **auto-falls back to mock mode** — useful for previews.

## 3. Vercel

1. Import the Git repo into Vercel (Framework preset: Next.js — auto-detected).
2. Add the env vars above for Production (and Preview if desired).
3. Deploy. Build command `next build`, output is handled by the Next.js adapter.
4. **Domains** → add `predict.anandhaassweets.com` and point the DNS `CNAME` at Vercel.

## 4. Supabase Auth redirect URLs

In **Authentication → URL Configuration** add:
- Site URL: `https://predict.anandhaassweets.com`
- Redirect URLs: the production domain (and your Vercel preview domain).

## 5. Post-deploy checks

- [ ] Phone OTP sends and verifies on a real device.
- [ ] PWA installs (manifest + service worker served; "Add to Home Screen" works).
- [ ] RLS: a normal user cannot read another user's ledger (test with two accounts).
- [ ] `/admin` is blocked for non-admins and reachable for admins.
- [ ] Lighthouse ≥ 95 (mobile) for Performance / Best Practices / SEO / PWA.

## Notes

- The `middleware.ts` convention shows a Next 16 deprecation notice in favour of `proxy.ts`; it
  still functions. Rename when you adopt the new convention.
- Replace `public/icon-192.png` / `icon-512.png` with real raster icons (an SVG fallback ships).
- Token expiry and weekly leaderboard reset run as scheduled jobs (Supabase cron / Vercel Cron) —
  see [ROADMAP.md](ROADMAP.md).
