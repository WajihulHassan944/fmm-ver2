# Fantasy MMAdness v12 true visual port

This package replaces the prior runtime overlay approach with direct route ownership by the client-approved v12 mobile-app experience.

## Directly mounted v12 routes

- `/` and `/home` — Home
- `/fights` and `/upcomingfights` — Contests
- `/UserDashboard` — Make Predictions
- `/leaderboard` and `/global-leaderboard` — Leaderboard
- `/FantasyLeagues` — Leagues
- `/watch-party` — Watch Party
- `/profile` — Profile
- `/account-settings` — Settings
- `/free-demo`, `/mock-game`, `/playforfree` — Free Demo
- `/blogs` and `/fights-news` — Fight News

The old homepage, leaderboard, leagues, static watch-party and blog page components are no longer mounted by those routes.

## Visual source of truth

- The v12 authored hero artwork is rendered directly instead of being recreated with the older stacked overlay composition.
- Exact Anton/Rajdhani fonts, colors, half-pixel type sizes, radii, spacing, glows and animation timings are retained.
- `src/Components/MobileApp/design-tokens.json` contains the imported v12 token subset used by the production component.
- Mobile begins at the top viewport edge; desktop keeps the full website navigation and widens the app canvas.

## Live functionality retained

- Real public fights, placement metadata, posters, entries, leaderboard, leagues, blogs and apparel feeds.
- Per-fight routing to `/fight/:id?play=1`, including a featured quick-pick handoff.
- Authorize.Net hosted checkout, server-priced coin packs and confirmation polling.
- Real entry/watch-party resolution, real/empty AI report states, streak actions and player profile updates.
- No hardcoded entry fees, prize pools, active leaderboard ranks or fake live entry totals are introduced by the v12 port.

## Verification

`npm run build` completes successfully across all 127 Next.js routes. Static route output was checked to confirm every app-owned URL carries the correct `data-fmm-mobile-screen` marker and the old internal build-note copy/localhost canonical strings are absent.
