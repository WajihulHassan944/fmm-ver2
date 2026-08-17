# Fantasy MMadness design v12 integration (frontend v59)

This release ports the v12 mobile-app handoff into the production-connected Next.js frontend while retaining the existing desktop header, responsive desktop expansion, Authorize.Net checkout, authentication, fight, league, apparel, and account workflows.

## Implemented experience

- Classic and Bold homepage modes, real fight/category cards, featured fight, AI scouting action, My Entries, Watch Party, leagues, community predictions, progression, streak, coin wallet, apparel, affiliates, START HERE, notifications, and bottom navigation.
- Sport and event actions open the selected fight's real genre scorecard. Score fields always start at zero unless a saved user entry is being restored.
- Leaderboard supports Rookie, Regular, Expert, and Global views from official scored results; honest empty states replace fabricated ranks and points.
- Watch Party reads the entered fight, pick, live clock, points, moments, and heat from live API fields. It does not simulate match statistics.
- Profile, contact/support, rules, champion, league-detail, shopping cart, coin purchase, FM+, entry-confirmation, and returning-player flows are connected and responsive.
- Dead-week Shadow cards, streak-save, skip-the-wait, 30-day FM+ status, and first-purchase eligibility are driven by backend responses.

## Compact archive note

The delivery ZIP stays below common upload limits by storing `public/` as `public-assets.tar.gz`. Running `npm install` automatically restores it through `restore-public-assets.js`. To restore manually, run:

```bash
node restore-public-assets.js
```

Then use the normal commands:

```bash
npm install
npm run build
npm start
```

Do not commit `.next/` or `node_modules/` into deployment archives.
