# Plain-language integration guide — read this first

**The goal in one sentence:** the live website must look, flow, and behave exactly like the prototype file (`FantasyMMADNESS-standalone.html` / `FantasyMMADNESS.dc.html`) — every screen, every button, every animation — with real data and real payments underneath instead of demo data.

## The simplest way to think about this
The prototype is not a mood board or a rough sketch — it is the finished design, screen by screen, click by click. Treat it like a locked spec:

0. **If you are using an AI coding assistant, read `PREVENTING-DESIGN-DRIFT.md` first.** Describing a screen to an assistant and asking it to build it will produce something plausible and subtly wrong every time — wrong font, rounded values, conventional shadows. Paste the prototype's actual markup instead, and import `design-tokens.json` rather than retyping values.

1. **Open the prototype file yourself and click through it end to end** before writing any code. Home → tap Make Predictions → tap a fight → fill a scorecard → submit → back to Home → tap Leagues → tap a Fantasy Card → etc. Note every screen, every modal, every button.
2. **Rebuild each screen to match, in order.** Don't reinterpret layouts, spacing, colors, copy, or button placement — copy them exactly. If something is unclear or seems like a mistake, ask instead of guessing.
3. **Every button must do what it does in the prototype** — same destination, same modal, same resulting state. A button that goes somewhere different, does nothing, or shows different content is a bug, not a variation.
4. **Nothing gets "half-built."** If a screen isn't ready, don't ship a broken/empty version of it live — better to leave the old screen up than replace it with something incomplete.
5. **Replace, don't stack.** When a page changes, the old version of that page must be removed in the same update — never leave two versions of the same page live at once.

## Where to find the answer for anything ambiguous
- **Overall structure, every screen, every feature explained in words:** `README.md`
- **Exact copy fixes for two wrong FAQ answers:** `faqs-corrected-copy.md`
- **Exact point values for every prediction type:** `scoring-config.json`
- **The real backend logic already written and tested (not just described) for scoring, data collection, and Shadow Fights:** `DEVELOPER-HANDOFF.md`
- **A row-by-row checklist to confirm each specific fix actually shipped correctly:** `INTEGRATION-CHECKLIST.md`
- **The actual working prototype to click through and compare against:** `FantasyMMADNESS-standalone.html` (open directly in any browser, works offline, no setup needed)

## The one habit that fixes the recurring problem
Before saying anything is "done," **open the live site next to the prototype file, side by side, and click through both the same way.** If a click, look, or flow doesn't match, it isn't done yet. Screenshots and code review are not enough — the live click-through is the only real test.
