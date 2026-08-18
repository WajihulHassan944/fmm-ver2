# Fix list — audit of fantasymmadness.com, August 2026

Good news first: **the homepage is now a correct port of the prototype.** Sport-photo cycling, streak countdown, AI scouting block, community predictions, coins wallet, apparel row, affiliates, real social icons, past-fight filtering — all working. That proves the port is doable. Everything below is about finishing the job the same way.

---

## P0 — Revenue-blocking. Fix these first.

### 1. "MAKE PREDICTIONS" goes to the free demo instead of the real scorecard
Every MAKE PREDICTIONS button on the homepage — including the one on the $100,000 featured fight and the one in the bottom nav — currently points to:

    /free-demo?start=scorecard&genre=boxing

**Users literally cannot enter a paid contest from the homepage.** The demo is a tutorial, not a contest.

**Fix:** point these at the real scorecard route for the specific fight, e.g.

    /fights/{fightId}/scorecard

Keep `/free-demo` for exactly one button: the "NEW HERE? TRY A FREE DEMO FIGHT" banner. Nothing else should route to the demo.

### 2. "ENTER NOW" on event cards goes to a filtered list, not that fight
Currently `ENTER NOW` on the Spence vs. Tszyu card goes to `/upcomingfights?category=boxing` — the user then has to find the fight again in a list.

**Fix:** link each card to its own fight, `/fights/{fightId}`. One click = that fight's scorecard.

### 3. Insufficient-balance path must open the buy-coins modal
On every submit (scorecards and Fantasy Cards): if balance < entry fee, show the toast and open the buy-coins modal — never a silent failure or a dead-end error. This is the single highest-converting moment in the app. Reference implementation is in the prototype's submit handlers (`submitScorecard`, `submitBoxingScorecard`, `submitMmaScorecard`, `submitFantasyCard`).

---

## P1 — Pages that were never ported

Four pages are still running the **old generic desktop marketing template** (hero headline + two CTA buttons + "Trusted by fans" partner strip + footer). They need the same treatment the homepage just got: build the prototype screen, and **delete the old page in the same commit** — do not leave both.

### 4. `/watch-party` — currently just text describing a watch party
Right now it's three static paragraphs ("Live scoring", "Crowd reactions", "Leaderboard pulse") with buttons that bounce back to `/upcomingfights`. Nothing interactive exists.

**Should be** (see prototype Watch Party screen): live match clock, round-by-round strike tracker, crowd reaction bar, Cage Cam friend chat with a working text input, animated stadium-light background over the arena photo.

### 5. `/contact` — form fields are missing entirely
The page renders a heading and a bare "Send Message" button. There is no Full name, Email, Subject, or Message field on the page at all.

**Fix:** render all four fields, wired to the existing contact endpoint. Compare against `/apparel`, whose order form *does* render its fields correctly — same pattern.

### 6. `/leaderboard` — still "0 Ranked players / 0 Leading points / — Your rank"
### 7. `/FantasyLeagues` — still "0 Active leagues / 0 League members / 0 Reward leagues"

Both have been flagged in previous rounds and are unchanged.

**Fix, in order of preference:**
1. Connect the real data source, or
2. If no scored fights exist yet, ship a **designed empty state** — not zeros. Zeros read as "this product is broken/abandoned." An honest line like "Standings publish after the first scored card — enter one now →" with a CTA converts; `0 / 0 / —` does not.

Never ship a screen whose primary content is three zeros.

---

## P2 — Copy and technical cleanup

### 8. Internal build notes are visible to users
On `/contact` and `/watch-party`, an "Experience standard" block is rendering:
- "01 Fight-night UI — Homepage design language"
- "02 Responsive — Desktop through mobile"
- "03 Production connected — Existing workflows retained"

And on `/FantasyLeagues`: "Joining still uses the existing account and affiliate league APIs."

These are engineering handoff notes that shipped to production. **Delete all of them.**

### 9. `canonical` still points at localhost
`/leaderboard`, `/contact`, and `/FantasyLeagues` all emit:

    canonical: http://localhost:3000/...

It's already correct on the homepage and `/watch-party`, so the fix is known — it just wasn't applied to the rest. This actively hurts Google indexing.

---

## The process change that prevents repeats

The recurring pattern is that a fix gets written but the live page doesn't change — old code stays underneath, or the change lands on one page and not its siblings.

1. **One page = one PR.** Rebuild the page, delete the old version in the same commit.
2. **Verify on the live URL, not locally and not from a screenshot.** Open the prototype and the live page side by side and click through both identically.
3. **Report back page by page** with the live URL, ✅ or ❌ — not "should be fixed now."
4. When a fix is global (canonical tags, brand spelling, dev-note removal), **grep the whole codebase** and apply it everywhere at once, rather than page by page.
