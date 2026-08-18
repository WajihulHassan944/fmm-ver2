# Fantasy MMAdness design v14 production integration (v61)

This source tree implements the client handoff in `design-reference-v14/FantasyMMADNESS.dc.html` without promoting prototype sample values into production data.

## Implemented design system

- Exact v14 Classic and Bold hero artwork, layout switch, sport selector artwork, fight/card backgrounds, apparel rail, affiliate artwork, START HERE fighter artwork, and treasure chest artwork.
- Exact v14 motion language: hero gloss, welcome pulse, sport icon entrance/breathe, tab transition, wallet flash, bell wiggle, activity toast, modal entrance, new-fight tag, confetti, countdown urgency, hover glow, and reduced-motion support.
- Responsive phone shell and wide desktop app canvas. The normal desktop header remains visible on desktop app routes; the mobile top and bottom app navigation remain active on phones.
- Production-connected fights, featured placement, direct scorecard routing, MY ENTRIES, Watch Party card/pick/official points, live viewer count when supplied, leagues, leaderboard, notifications, apparel, AI report, Shadow Fights, cart, Authorize.Net checkout handoff, FM+ 30-day pass, and affiliate dashboard route.

## Data integrity rules retained

- Fight dates continue through date-only-safe conversion.
- Prediction scorecards start at zero.
- Prize pools, entry fees, entries, points, ranks, viewers, AI prose, rewards, and affiliate campaign values are never copied from prototype examples.
- AI buttons render only when a real per-fight `aiScoutingReport` is returned by the server.
- Monthly FM+ is not advertised as live; the production CTA uses the supported 30-day pass checkout.
- Reward, streak-save, and skip-wait balance changes require server callbacks; the browser does not invent wallet settlement.

## Runtime dependencies

- Payment remains Authorize.Net Accept Hosted through the existing `/checkout` flow.
- Real cross-device push requires the deployed backend device-token/send pipeline. The frontend can request browser notification permission and renders real notification rows from `/notifications/:userId`.
- Server-settled reward/streak endpoints must be exposed by the current backend before their optional callbacks can be enabled.

## Reference files

The full v14 HTML prototype and all supplied specification documents are preserved in `design-reference-v14/`. The 12 supplied production artworks are installed under `public/images/mobile-home/final-v35/` and referenced by the implementation.
