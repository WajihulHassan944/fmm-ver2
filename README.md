# Fantasy MMAdness

Next.js combat-sports prediction platform with one premium visual system across the public website, authentication, role dashboards, legacy account/community pages, and administration console.

## Local development

```bash
npm ci
npm run dev
```

Open `http://localhost:3000`.

## Production verification

```bash
npm run lint
npm run build
npm start
```

## Main experiences

- `/fights` — unified upcoming, live, and past fight hub
- `/leaderboard`
- `/our-fighters`
- `/Sponsors`
- `/fights-rewards`
- `/FantasyLeagues`
- `/auth` — player, affiliate, and sponsor account portal
- `/UserDashboard`
- `/AffiliateDashboard`
- `/sponsor-dashboard`
- `/administration` — compact command-center navigation, tables, metrics, and quick actions

All remaining public, profile, editorial, community, rewards, and affiliate pages are presented through the same responsive homepage-derived experience frame.

See [`REDESIGN_NOTES.md`](./REDESIGN_NOTES.md) for route compatibility, assets, and implementation details.
