# Fantasy Leagues, Readability, Dashboard Imagery, and Mock Game Completion Audit

## Updated route and modules

- `/FantasyLeagues`
  - Rebuilt as a dedicated premium league directory rather than a generic framed legacy page.
  - Added fight-night hero, league statistics, search, responsive league cards, reward presentation, member roster, safe loading/error/empty states, and joined-state handling.
  - Preserved the existing `GET /affiliates`, `GET /users`, and `POST /affiliate/:affiliateId/join` integrations.

- `/AffiliateDashboard`
  - Removed the separate low-opacity fighter layer that made the banner fighter appear soft/duplicated.
  - Applied a sharp, project-local command-center background with stronger contrast and readable content overlays.
  - All campaign, league, profile, and promotion behavior remains unchanged.

- `/UserDashboard`
  - Kept all existing completed/pending fight sections and behavior.
  - Added a richer red/blue fighter-arena background to the page and dashboard hero.

- `/mock-game`
  - Added a realistic local simulation flow:
    1. Pick a fight card.
    2. Enter the mock fight.
    3. Submit round-by-round predictions.
    4. Review the scorecard.
    5. Switch to the premium mock leaderboard.
  - Added three local simulation cards and dynamic Boxing/MMA metrics.
  - The mock game still makes no API calls and does not affect wallets, production fights, or production leaderboards.
  - Enlarged all prediction labels, abbreviations, controls, and numeric inputs.

## Global condensed-font readability

A final stylesheet now prevents the `FMMUFCCondensedBold` display face from being rendered at unreadably small UI sizes. Buttons, labels, inputs, helper text, navigation, table headers, and common eyebrow/kicker text receive larger minimum sizes while retaining the existing font family and visual identity.

## New background assets

- `public/images/fmm-pages/affiliate-command-premium.webp`
- `public/images/fmm-pages/player-fight-night-premium.webp`

## Pages to visually check for the new backgrounds

- `/FantasyLeagues`
- `/AffiliateDashboard`
- `/UserDashboard`
- `/mock-game`
- The mock-game leaderboard shown after submitting predictions

## Integrity and validation

- `src/pages/api` unchanged.
- `src/Redux` unchanged.
- `src/CustomFunctions` unchanged.
- `package.json` unchanged.
- `package-lock.json` unchanged.
- No API call was added to the mock game.
- Next.js webpack production compilation completed successfully.
- Webpack development smoke tests returned HTTP 200 for:
  - `/FantasyLeagues`
  - `/AffiliateDashboard`
  - `/UserDashboard`
  - `/mock-game`
