# Components

Theme tokens live in `src/app/globals.css` and flow into Tailwind through `@theme inline`.

## UI

| Component | Purpose |
| --- | --- |
| `Button` | Shared button variants and sizes. |
| `Badge` / `LiveDot` | Status pills and live indicator. |
| `Sheet` | Bottom sheet used by prediction flow. |
| `ToastViewport` | Store-driven toast notifications. |
| `EmptyState` | Shared zero-state UI. |
| `Segmented` | Compact tab switcher. |
| `Skeleton` | Loading placeholders. |

## Layout

| Component | Purpose |
| --- | --- |
| `AppShell` | Mobile app frame and global prediction sheet host. |
| `AuthGate` | Redirects unsigned users to login/welcome in mock mode. |
| `TopNav` | Customer header and points pill. |
| `BottomNav` | Customer tab navigation. |

## Features

| Folder | Purpose |
| --- | --- |
| `auth/` | Phone, email, and OTP login flow. |
| `home/` | Home hero and campaign banner. |
| `matches/` | Match feed and match cards. |
| `predictions/` | Interactive prediction sheet. |
| `leaderboard/` | Leaderboard UI. |
| `rewards/` | Offers and claimed rewards. |
| `profile/` | Customer profile and sign-out. |

The admin console is maintained as a separate application and is not part of this customer app component tree.
