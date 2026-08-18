# Desktop Prototype Navigation and Width Fix — v53

## Updated routes

- `/leaderboard`
- `/global-leaderboard`
- `/FantasyLeagues`
- `/watch-party`

## Changes

- Restored the production desktop header/navigation on all prototype-powered desktop routes.
- Kept the approved full-screen app shell unchanged on phones.
- Removed the phone-only top bar and bottom tab bar from desktop rendering to avoid duplicate navigation.
- Expanded the prototype desktop shell from a narrow phone column to a responsive 1440px canvas.
- Added a centered 1280px content area with desktop spacing, borders, and fight-night background treatment.
- Preserved the existing API-backed leaderboard, league, watch-party, wallet, and fight data behavior.

## Responsive behavior

- **Desktop (768px and above):** fixed production header, wide responsive content shell, desktop navigation.
- **Phone (767px and below):** exact full-screen mobile prototype, mobile top controls, fixed bottom navigation, no desktop header.

## Backend impact

No backend changes are required for this UI-only correction.
