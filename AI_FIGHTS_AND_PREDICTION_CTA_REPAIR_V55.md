# AI, Fight Catalog, and Prediction CTA Repair — v55

## Fixed regressions

- Restored a clearly labeled AI Scout control in the visible featured-fight card.
- Added AI Scouting controls to every upcoming fight and the detailed featured-fight block.
- Made the scouting modal use the selected fight instead of hard-coded Jones/Aspinall content.
- Replaced emoji-only AI controls with explicit text so they cannot render as blank squares.

## Restored fight coverage

- The homepage no longer treats one prediction-status response as the complete catalog.
- It now combines upcoming prediction fights, the broad prediction feed, public fights, promoted homepage fights, and the home-summary feed.
- Duplicate fights are removed while registered prediction data remains authoritative for date, entry fee, pool, and scorecard routing.
- The default All state shows every valid future fight; selecting a sport still filters intentionally.
- Non-playable published fights remain visible and use View Fight Details instead of pretending a scorecard is available.

## Corrected prediction actions

- Featured, upcoming, Bold-layout, contest-list, detailed-featured, and Make Predictions screen CTAs use the same action logic.
- Every playable CTA targets that fight's own `/fight/{id}` workflow.
- Logged-out users go to `/login?next=/fight/{id}`.
- Logged-in users go to `/fight/{id}?play=1`.
- Removed upcoming-card quick picks that only changed local percentages.
- Paid-fight CTAs no longer open Add Coins before authentication or before the real scorecard route.

## Verification

- Targeted ESLint checks passed.
- Browser regression test combined five independent fight sources and rendered all five fights.
- Verified AI modal receives the selected fight.
- Verified a Jones/Aspinall prediction CTA routes to `next=/fight/fight-jones`.
- Verified prediction-ready date and entry fee override conflicting display-feed values.
- Verified no horizontal overflow at 393px.

## Backend

- No backend code change was required for these regressions.
