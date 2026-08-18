# Real backend ground truth — supersedes prior speculation

A real backend already exists: `Fantasy-MMadness-Backend-eMerchant-AuthorizeNet-v17` (in `uploads/`). It is not a mockup — it has working routes, tests, and a completion checklist. **This document replaces every guess made earlier about payments, AI reports, and backend status.** Where any other doc in this package (`README.md`, `MONETIZATION-SPEC.md`, `MIGRATION-GUIDE.md`) describes something as "still to build" or names a different payment processor, this document is correct and those are outdated guesses.

## Payments — Authorize.Net

The real, live-wired processor is **Authorize.Net**, using **Accept Hosted** checkout (`EMERCHANT-AUTHORIZE-NET-CHECKOUT-V17.md`):
- Card data is entered on Authorize.Net's hosted page — never touches Fantasy MMAdness's servers.
- A signed webhook (`POST /api/webhooks/authorize-net`, event `net.authorize.payment.authcapture.created`) verifies `X-ANET-Signature`, fetches the authoritative transaction, checks invoice and amount, and credits the wallet **idempotently**.
- Legacy raw-card routes return HTTP 410 — dead, cannot charge or reuse stored cards.
- A legacy webhook exists **only to settle already-created legacy orders** — every new order is created with `provider: authorize-net`.
- Env vars: `AUTHORIZE_NET_ENVIRONMENT`, `AUTHORIZE_NET_API_LOGIN_ID`, `AUTHORIZE_NET_TRANSACTION_KEY`, `AUTHORIZE_NET_SIGNATURE_KEY` (see `.env.authorize-net.example`). Live secrets go only in the host's encrypted environment settings, never committed.

## Coin cart — already server-priced and idempotent

Confirmed built (`AUG-2026-CLIENT-FIXES.md`, `DESIGN_V7_BACKEND_V15.md`):
- Exactly three packs, priced server-side: 1,000 FM/$0.99, 5,000 FM/$3.99, 15,000 FM/$9.99. Client-reported pricing is ignored entirely.
- Checkout creation requires an idempotency key.
- First confirmed coin purchase gets a **one-time server-enforced 2× credit.**
- A logged-out purchaser gets a real player account, the 500 FM welcome credit, and a single-use password-set email — **only after confirmed payment**, not on client click.
- New registration / first Google sign-in grants the 500 FM welcome balance server-side.
- Wallet settlement runs inside a MongoDB transaction — **requires a replica-set deployment (e.g. MongoDB Atlas)**, not a standalone Mongo instance.
- **Apparel is deliberately excluded from the FM cart.** Confirmed intentional, matches the Etsy-only decision already made.

## FM+ — 30-day pass works now, monthly is gated

- Server-priced FM+ **30-day pass** order type exists and works through Authorize.Net Accept Hosted today.
- FM+ **monthly auto-renew is displayed as "coming soon"** in the UI until recurring billing is explicitly enabled for the merchant account — this is a deliberate gate, not a bug.
- Entitlement expiry is enforced; expired FM+ entitlements are removed when the player profile loads.

## AI Scouting Report — already real on the backend

This is the opposite of what earlier docs assumed. The backend already has:
`POST /api/admin/fights/:id/ai-scouting-report` — generates and caches a report from the **registered fight and submitted cards**, numerically validated against real data, with a **deterministic database-grounded fallback** if generation is unavailable or invalid.

**What's left is wiring the frontend prototype to call this real endpoint** instead of showing its hardcoded Jones-vs-Aspinall text — `AI-SCOUTING-REPORT-SPEC.md`'s validation-gate concept is already implemented server-side; the remaining work is integration, not building the AI logic from scratch.

## Fight placement — already matches the back-office spec

`PATCH /api/admin/fights/:id/homepage-placement` manages `featured-this-week` and `featured-fight` **independently**, exactly as specified in `BACK-OFFICE-FIGHT-PLACEMENT.md`. Public fight records already expose both placement flags, surface-specific images, division/weight class, and the cached AI report. Upcoming Events remains automatic from future registered dates — no manual list.

## No invented data, anywhere

Confirmed backend-enforced: entry fees, prize pools, submitted-entry counts, and initial predictions are **never** supplied by the design prototype or invented by the API. Public leagues return real database leagues/members only — "empty and error states no longer substitute demo leagues." This closes the "0 Ranked players" / fake placeholder problem from earlier at the API level.

## Pro Wrestling — fully built, not a stub

A complete Pro Wrestling backend exists: wrestler profiles, versioned scoring/payout rules, atomic contest entry, live-stat polling with Pusher events, top-10%-with-minimum-winners payout logic, idempotent settlement/refunds, admin tooling, affiliate attribution and commission fields. See `PRO_WRESTLING_COMPLETION_CHECKLIST.md` for the full built list. **One explicit caveat from the checklist itself:** a live database settlement test was intentionally not run against production data — run an internal staging contest before public release.

## Growth/SEO/social automation — already built, approval-gated

A "swarm" automation system already exists, hooked to real backend events (fight published, result updated, wrestler added, blog created): daily SEO audits, broken-link checks, meta checks, fight-calendar refresh, and **draft** social posts for X/Instagram/Facebook. Explicitly safety-gated: the swarm **cannot** write users, wallets, contests, predictions, payouts, or settlements directly, and social publishing stays behind existing approval routes — it drafts, a human approves. This is your real answer to the "notify users / promote on social" ask, already partially built — see `PHASE2_SWARM_AUTOMATION_BACKEND.md` and `PHASE2_DAILY_SEO_SOCIAL_BACKEND_UPDATE.md`.

## Data integrity already enforced

Fight dates use date-only key/noon-UTC normalization — a fight saved as Aug 15 never displays as Aug 14 in another timezone. Public fight/fighter endpoints combine both Match and Shadow collections so pages don't go blank when content is stored as promotional/Shadow records; Draft fights stay hidden unless an admin explicitly requests `includeDrafts=true`.

## What to do with the rest of this handoff package now

- Treat `README.md`, `MONETIZATION-SPEC.md`, `MIGRATION-GUIDE.md`'s payment/backend sections as **historical design intent**, already largely realized in the real backend above — use this document to resolve any conflict.
- The **frontend prototype** (`FantasyMMADNESS.dc.html`) still needs to be rebuilt against these **real, already-existing endpoints** rather than against speculative ones — that wiring work is real and still needed.
- Do not re-introduce any other processor — Authorize.Net is the answer, confirmed and already integrated server-side.
