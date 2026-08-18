# READ THIS FIRST

## What this package IS
A complete, pixel-exact **design + logic prototype** of Fantasy MMAdness — every screen, flow, animation, scoring rule, and copy string, built as one interactive file (`FantasyMMADNESS.dc.html`). Open it in any browser to see and click through the entire app exactly as it should behave live.

## What this package is NOT
- **Not production code.** It is not connected to a real database, real payment processor, or real user accounts. Nothing here should be deployed as-is.
- **Not a partial spec.** Every screen, every rule, every edge case shown in the file is intentional and final — treat it as the exact target, not a rough sketch.

## Your job as the developer
Rebuild this as real production code (backend, database, auth, payments) on your stack, matching what this file does **exactly** — same flows, same copy, same scoring math, same screens. Where you're unsure what something should do, look at how it behaves in the file (open it, click it) before guessing.

## Read order
1. **This file**
2. `INTEGRATION-CHECKLIST.md` — the literal, testable checklist. Nothing is "done" until the live site matches every row.
3. `DEVELOPER-HANDOFF.md` — backend architecture, scoring engine, file map, data sources.
4. `scoring-config.json` — the single source of truth for every point value. If any doc disagrees with this file, this file wins.
5. `PAGE-BY-PAGE-BUILD-GUIDE.md`, `MONETIZATION-SPEC.md`, `NOTIFICATIONS-AND-DATA-SYNC.md`, `AI-SCOUTING-REPORT-SPEC.md`, `BACK-OFFICE-FIGHT-PLACEMENT.md`, `RETENTION-AND-SKILL-TIERS-SPEC.md`, `WEBSITE-VS-APP.md` — as needed per feature area.

## Golden rule
If something you're building doesn't match the prototype's behavior exactly, **stop and ask** — don't ship an approximation. Past handoffs on this project slipped because approximations shipped silently as "done." See `PREVENTING-DESIGN-DRIFT.md`.
