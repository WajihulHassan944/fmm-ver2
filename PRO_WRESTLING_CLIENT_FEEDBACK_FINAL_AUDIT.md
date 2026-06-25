# Pro Wrestling client feedback final corrections

## Layout and presentation
- Removed negative-margin overlap on `/pro-wrestling` between the game-mode navigation and game-mode introduction card.
- Removed overlap on `/pro-wrestling/matches/[matchId]` between game-mode navigation, contest metrics, wallet, and entry action.
- Removed overlap on `/YourFights` between player workspace navigation and statistics cards.
- Added four locally bundled, high-resolution wrestling arena backgrounds for roster, history, live scoring, and contest presentations.

## Player and live scoring
- Added authenticated `my-entry` fallback to live scoring so a signed-in participant receives an accurate contextual state while score calculation is pending.
- Replaced the current logged-in user's backend leaderboard alias with the Redux first/last name when IDs match.
- Upgraded the standard fight MakePredictions component with wrestler-style round scorecards, fighter imagery on every round, readable action inputs, and mirrored RW/RL and KO/SP states while preserving all original score fields, endpoints, and payloads.

## Administration
- Added a visible expand-navigation control whenever the admin sidebar is compact.
- Normalized Administration Overview metric cards, including Tracked visitors.
- Restored visible edit, deactivate, and delete-draft action icons.
- Replaced raw JSON-only rule editing with labeled scoring, multiplier, category, and payout fields plus an optional JSON preview.
- Enabled valid lifecycle status transitions from the wrestling match editor through the protected status endpoint.

## Preserved
- `src/pages/api`, `src/Redux`, `src/CustomFunctions`, `package.json`, `package-lock.json`, and `next.config.mjs` are unchanged.
- Existing standard fight prediction submission endpoints and payload field names are unchanged.
