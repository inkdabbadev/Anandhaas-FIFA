# Components

Atomic, reusable, theme-driven. Colours/typography come from CSS variables defined in
`globals.css` and surfaced to Tailwind via `@theme inline` (e.g. `bg-dark`, `text-gold`,
`border-border`). No magic hex values in components.

## UI primitives — `components/ui/`

| Component | Notes |
| --- | --- |
| `Button` | `cva` variants: primary, dark, success, outline, ghost, danger × sizes × `block`. |
| `Card` / `CardBody` | Rounded, soft-shadow surface. |
| `Badge` / `LiveDot` | Pill labels (gold/green/red/muted/dark) + pulsing live indicator. |
| `Skeleton` + `MatchCardSkeleton` / `RowSkeleton` | Shimmer loading states. |
| `Toast` (`ToastViewport`) | Store-driven, auto-dismiss, success/error/info. |
| `Sheet` | Accessible bottom sheet — backdrop, scroll-lock, Esc-to-close, focus dialog. |
| `EmptyState` / `ErrorState` | Consistent zero/error UI with optional retry. |
| `SectionHeader` | Title + optional link. |
| `ProgressDots` | Streak / progress segments. |
| `PageHero` | Shared dark editorial header. |
| `Segmented` | Tab switcher (leaderboard scope, token tabs). |

## Layout — `components/layout/`

`TopNav` (brand + token pill) · `BottomNav` (5-tab, active-aware) · `AppShell` (centres the
≤430px device column, hosts the global `PredictionSheet`) · `StoreHydrator` (seeds Zustand once).

## Admin — `components/admin/`

`AdminSidebar` + `AdminMobileNav` · `AdminHeader` / `StatCard` / `DataTable` / `Td` ·
`ResultEntryCard` (interactive settlement) · `ManualGrantForm` (RHF + Zod).

## Feature modules — `features/`

Each screen's logic is colocated:

- `home/` — `Hero`, `StreakCard`, `EarnBanner`
- `matches/` — `MatchCard`, `MatchList` (async server component)
- `predictions/` — `PredictionSheet`, `scoring.ts`
- `leaderboard/` — `LeaderboardView` (scope tabs, search)
- `tokens/` — `TokensView` (earn/redeem/history/active tabs), `RewardQR`
- `tiers/` — `TiersView`
- `profile/` — `ProfileView`
- `auth/` — `LoginFlow` (phone → OTP state machine)

## Conventions

- Server Component unless it needs state/events/browser APIs.
- Props typed; no `any`. Variants via `class-variance-authority`, merged with `cn()`.
- Accessibility: `aria-*`, `role`, focus-visible rings, keyboard handling on interactive elements.
- Mobile-first; the app column is capped at 430px and the admin is desktop-first with mobile fallback.
