# Integration map — one system, not two

This is the final piece that makes the frontend prototype and the real backend act as one unit instead of two things that drifted apart. Every screen below names the exact real endpoint it must call. No screen should read from the prototype's hardcoded arrays once this is done.

**A note on scope:** this document is buildable by a developer with access to both the frontend build and the backend repo running against a real MongoDB Atlas deployment. It cannot be executed inside a design tool — there is no server to connect to from here. What follows is the precise, zero-ambiguity spec for that developer.

---

## Home

| Prototype element | Real endpoint | Notes |
|---|---|---|
| Upcoming Events / Contests list | `GET /api/public/prediction-fights?limit=20` | Replaces the hardcoded `eventsRaw` array entirely. Draft fights excluded automatically. |
| Featured This Week / Featured Fight | Fields already present on the fight objects returned above (`featured-this-week`, `featured-fight` flags, placement images, division) | Set via `PATCH /api/admin/fights/:id/homepage-placement` in the back office — the app only reads. |
| MY ENTRIES | `GET /api/users/me/fight-entries` | Requires auth. Returns only the signed-in user's real entries, picks, live points. |
| Community pick-split % | Included in the public prediction-fights payload as an aggregate field — never computed client-side from local state. |
| AI Scouting Report | `POST /api/admin/fights/:id/ai-scouting-report` (or its public read equivalent, if one exists — confirm with backend team) | Replaces the hardcoded Jones-vs-Aspinall modal text. Already numerically validated server-side with a deterministic fallback — the frontend just needs to call it and render the cached result. |

## Make Predictions (scorecards)

| Prototype element | Real endpoint |
|---|---|
| Submit scorecard | The real fight-entry/prediction submission route (Pro Wrestling's is documented; MMA/boxing/kickboxing/bareknuckle share the general contest-entry pattern — confirm exact path in the backend's route manifest) |
| Balance check before submit | Server validates and rejects if insufficient — the frontend's client-side `coins < fee` check becomes a UX pre-check only; the server is the real gate |
| Entry fee / prize pool shown | From the fight record returned by `prediction-fights` — **never** the prototype's hardcoded `entryFee: 100` |

## Cart / coin checkout

| Prototype element | Real endpoint |
|---|---|
| Coin packs | Server-priced — the three packs (1,000/5,000/15,000) are fixed server-side; the frontend cannot send a price |
| Checkout creation | Requires an idempotency key generated client-side per attempt |
| Payment | Authorize.Net Accept Hosted — the frontend redirects/embeds the hosted form token the backend issues; card fields are never rendered in the app's own form |
| Coin credit | Happens only after the signed webhook settles — the frontend's confirmation screen should poll or wait for a "settled" status from the backend, not assume success from a client-side redirect |
| First-purchase 2× / 500 FM welcome | Both already enforced server-side — remove the prototype's local `hasPurchased`/`welcomeClaimed` flags; read the real account state instead |

## FM+

| Prototype element | Real endpoint |
|---|---|
| 30-day pass | Real order type, works now through Accept Hosted |
| Monthly auto-renew | Keep disabled/"coming soon" in the UI until backend confirms recurring billing is enabled — do not build a working monthly button against this backend yet |
| Entitlement check (streak-save discount, etc.) | Read from the player profile's real entitlement/expiry field, not a local `isSubscribed` flag |

## Leaderboard / Leagues

| Prototype element | Real endpoint |
|---|---|
| Leaderboard rankings | Real leaderboard endpoint — if it returns empty, that means no scored contests exist yet in the database, which is a content/launch-readiness issue, not a code bug |
| Public leagues list | Real leagues endpoint — confirmed to return database leagues/members only, no demo substitution |

## Watch Party

| Prototype element | Real endpoint |
|---|---|
| Live stats / strike ticker | Pusher live-update events (already built for Pro Wrestling; confirm the equivalent live-stats channel for MMA/boxing) |
| Your scorecard / live points | `GET /api/users/me/fight-entries` for that fight ID — do not compute points client-side |

## Back office → app notifications

Already partially built via the swarm automation system: backend events (fight published, result updated, wrestler added, blog created) already trigger job hooks. What's confirmed built is **draft social posts requiring approval** — not push notifications to end users. If you want a push notification to users (not just a social draft), that is a separate, not-yet-built path: it needs its own listener off the same backend events, sending through a push provider (e.g. Firebase Cloud Messaging) to registered device tokens. Say so explicitly to the developer — don't assume the swarm system already does this, it doesn't.

---

## The one rule that keeps this from drifting again

**The frontend never invents a number.** Every price, balance, entry fee, prize pool, pick-split percentage, and point total must come from a network response. If a screen shows a number and there's no fetch behind it, that's the bug — not a missing feature, a literal instance of the frontend and backend being two systems instead of one.
