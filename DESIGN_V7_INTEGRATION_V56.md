# Fantasy MMAdness design v7 integration — frontend v56

This build layers the current design-v7 handoff onto the last approved v55 frontend without replacing its working homepage, responsive navigation, fight routing, apparel imagery, or checkout flow.

## Player-facing changes

- The mobile app shell is included in the first page response on mapped phone routes, removing the delayed old-screen/empty-screen flash.
- A session-scoped, stale-while-refresh data snapshot keeps fights, leaderboard rows, apparel, leagues, and signed-in entries visible when the player navigates back.
- Duplicate fight/image hydration requests and forced leaderboard cache-busting were removed.
- Fight feeds are merged and deduplicated instead of allowing one shorter response to replace the rest of the published fights.
- `MY ENTRIES` uses the signed-in player's saved backend scorecards, pick side, live points, and real community split.
- Watch Party opens against the selected/actual entry and shows a real no-card prompt when the player has not entered.
- AI Scouting buttons and modals use the selected fight's backend report. Missing metrics are shown as unavailable; they are not replaced with sample numbers.
- `START HERE` uses the first real playable fight and its registered fee/prize/date values.
- Prediction confirmation includes the design-v7 cross-sport nudge and links to real entries.
- Champion-profile and league-detail taps open data-backed modals.
- All fight entry CTAs route to that fight's real scorecard. The free demo remains a separately labelled demo action.
- Community pick percentages are hidden until submitted picks exist; no 50/50 sample is presented as production data.
- FM+ monthly and 30-day pass choices route into the responsive Kurv checkout. Active FM+ accounts receive the 25-FM streak-save display/behavior.

## Desktop and administration

- Desktop routes keep the normal site header and use the wide app layout rather than a narrow phone column.
- The fight registry now has independent `Featured This Week` and `Featured Fight` controls, plus per-fight AI report generation/refresh.
- Checkout collapses to a single-column phone layout, including compact pack controls, plan choices, billing fields, and a non-sticky order summary.

## Data rules retained

- Dates, entry fees, prize pools, entry counts, fighters, and images come from registered backend records.
- Empty prediction fields remain empty/zero until the player enters them.
- Apparel cards use API images when available and stable bundled fallbacks with consistent cover sizing otherwise.
- The spelling `Fantasy MMAdness` is retained.

## Verification

- Next.js production build passes across all 124 routes.
- Updated JSX/JS files pass Babel parser validation.

