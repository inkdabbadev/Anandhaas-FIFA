# Anandhaas Predict

A production-grade, UI-first **Progressive Web App** for **Anandhaas Sweets & Snacks** — a
seasonal customer-loyalty platform disguised as a football prediction game.

> This is **not** a football app, a betting app, or fantasy sports. It is a **loyalty engine**.
> Football is the engagement mechanism; the goal is retention, repeat purchases and store visits.
> The same engine runs IPL, Diwali, Pongal or any future campaign by changing **database
> configuration only** — no code changes.

Live target: **predict.anandhaassweets.com**

---

## Stack

| Layer | Choice |
| --- | --- |
| Framework | Next.js 16 (App Router, Server Components, Turbopack) |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS v4 |
| State | Zustand |
| Forms / validation | React Hook Form + Zod |
| Database / Auth | Supabase (Postgres + phone/email OTP flow) |
| Icons | Lucide |
| QR | qrcode.react |
| PWA | Manifest + service worker + offline shell |
| Deploy | Vercel |

---

## Quick start

```bash
npm install
cp .env.example .env.local      # works as-is — runs in mock mode (Phase 1)
npm run dev                     # http://localhost:3000
```

No Supabase credentials are required to explore the full UI. The app detects the absence of
config and serves **seeded mock data** with realistic loading, empty and error states.

| Demo login | |
| --- | --- |
| Phone | any valid Indian mobile (e.g. `+91 98765 43210`) |
| Email | any valid email address |
| OTP | `123456` |

---

## Development phases

The app was built UI-first, in deliberate phases:

1. **Phase 1 — Perfect UI on seeded data.** Every screen, animation, skeleton, empty/error state.
   `NEXT_PUBLIC_USE_MOCK_DATA=true`. _(Current state.)_
2. **Phase 2 — Connect Supabase.** Implement `src/repositories/*`; the `data-service` seam swaps
   from mock to live with zero screen changes. Apply `supabase/migrations`.
3. **Phase 3 — Admin dashboard** (separate admin application).
4. **Phase 4 — Notifications, QR redemption scanning, purchase integrations, analytics.**

See [docs/ROADMAP.md](docs/ROADMAP.md).

---

## Project structure

```
src/
├── app/                  # routes (App Router)
│   ├── (app)/            # authenticated mobile app group (Home, Leaderboard, Rewards, Profile)
│   ├── welcome/          # landing
│   ├── login/            # phone + email OTP auth
│   └── offline/          # PWA offline fallback
├── components/           # shared UI (ui/, layout/)
├── features/             # feature modules (home, matches, predictions, leaderboard, rewards, profile, auth)
├── services/             # data-service seam + purchase & notification engines
├── repositories/         # Supabase data access (Phase 2)
├── store/                # Zustand store
├── schemas/              # Zod schemas
├── config/               # campaign engine + env
├── constants/            # points, nav
├── lib/                  # utils, supabase clients, mock data
├── types/                # domain types
└── providers/            # client providers
supabase/
├── migrations/           # 0001_init.sql, 0002_functions.sql, 0003_rls.sql
└── seed.sql              # FIFA 2026 campaign seed
docs/                     # database, API, components, deployment, roadmap
```

See [docs/](docs/) for full documentation:
[Architecture](docs/ARCHITECTURE.md) ·
[Database](docs/DATABASE.md) ·
[API](docs/API.md) ·
[Components](docs/COMPONENTS.md) ·
[Deployment](docs/DEPLOYMENT.md) ·
[Roadmap](docs/ROADMAP.md)

---

## The campaign engine

Everything seasonal lives in a `campaigns` row (`config/campaign.ts` holds the Phase 1 default):
branding, scoring rules, token rates, prediction windows. To launch a new campaign you insert a
row and flip `is_active` — matches, rewards and the leaderboard all bind to it. The app never
hardcodes "FIFA".

---

## Scripts

```bash
npm run dev      # dev server (Turbopack)
npm run build    # production build
npm run start    # serve production build
npm run lint     # eslint
```

---

## License

Proprietary — © Anandhaas Sweets & Snacks.
