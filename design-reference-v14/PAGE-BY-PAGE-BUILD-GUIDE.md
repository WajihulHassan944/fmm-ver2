# Page-by-page build guide

Step-by-step for every screen in the prototype. Open `FantasyMMADNESS-standalone.html` next to this doc — each section tells you exactly what to click to see it live.

---

## 1. Home

1. Open the app. If no account exists yet, you see the **JOIN FREE hero** (crown logo, red/blue corner lighting, "PREDICT EVERY FIGHT" tagline, gold JOIN FREE button).
2. Sign in via the join modal (name + email) — the hero swaps to the **Returning Hero**: wallet balance top-right, and either "WATCH LIVE ›" (if you have a live entry) or "MAKE A PICK ›" (if you don't).
3. Below the hero: live ticker → stats bar (predictors/prizes/live events/leaderboards, all tappable) → sport selector (5 sports, photos auto-cycle every 7s) → Featured Banner → Upcoming Events carousel → Featured Fight detail card.
4. **START HERE card**: shows only before a user's first entry. One fight, one button. Disappears permanently after first entry — build this as a one-time-per-account flag, not a session flag.
5. **MY ENTRIES**: appears once the user has ≥1 live entry. Each card shows pick, live split %, countdown; tapping opens Watch Party for that fight.
6. Community Predictions block, Rewards Row (daily claim, streak, skip-wait), Apparel row (links out to Etsy only — no in-app cart), Affiliates + treasure chest, real social icons.
7. Bottom nav: Home / Contests / Make Predictions / Leagues / Profile. Cart icon + notification bell in top bar.

**Build order:** hero states → sport selector → featured/upcoming → START HERE / MY ENTRIES → rewards row → apparel/affiliate. Each is an independent component; none blocks the others.

---

## 2. Contests

1. Tap "Contests" in the bottom nav.
2. Full list of every open fight across all 5 sports, filterable by sport.
3. Each card: event tag, fighters, date, venue, prize pool, entry fee, "ENTER NOW" button.
4. **ENTER NOW must link to that specific fight's scorecard** — not a filtered list. This was a routing bug on the live site; verify it's fixed here.
5. Posters use `object-fit: contain`, never `cover` — fighter heads must never crop.

---

## 3. Make Predictions (scorecards)

1. Tap a fight's "PREDICT" or "ENTER NOW."
2. Sport-specific scorecard opens:
   - **Boxing / Bare Knuckle:** HP, BP, TP per round, winner pick, KO/Survival toggle
   - **MMA / Kickboxing:** HP, BP, Kicks, Knees, Elbows per round, winner pick, KO/Survival toggle
   - **Pro Wrestling:** no rounds — HP, BP, Kicks, Power Moves, Finishers over the whole match, winner pick
3. AI Scouting Report button opens a modal — **currently hardcoded to Jones vs Aspinall.** See `AI-SCOUTING-REPORT-SPEC.md` before shipping this for other fights.
4. Tap Submit:
   - If balance < entry fee → toast + buy-coins modal opens automatically. Verify this fires for every scorecard type.
   - If balance is sufficient → coins deduct, **"YOU'RE IN" confirmation modal** opens showing wallet balance and either "ENTER ANOTHER FIGHT" or "TOP UP" (if balance now low), plus a cross-sport nudge button ("NOW TRY MMA ›" etc., cycling through all 5 sports).

---

## 4. Cart (FM coins only)

1. Tap the cart icon (top bar) or "ADD COINS" anywhere.
2. Pick a pack: 1,000 FM/$0.99, 5,000 FM/$3.99 ("MOST POPULAR"), 15,000 FM/$9.99.
3. Cart screen: line item with qty stepper, order summary (subtotal, first-purchase-double bonus line if applicable, total).
4. **If logged out:** gold banner reads account will be created automatically from billing details + 500 FM welcome bonus. **If logged in:** green "Signed in as —" bar, fields prefilled.
5. Billing form: name, email, phone, address, city, state, zip, country. 18+/Terms checkbox gates the pay button.
6. Pay button → hand off to **the merchant processor's hosted payment page** (card entry happens there, never in this form). Credit coins only on the merchant processor's confirmed-payment callback.
7. Confirmation screen: order number, coins credited, new-account block if one was created.
8. **Apparel is NOT here.** Apparel tiles and "SHOP ON ETSY ›" open etsy.com/shop/FANTASYMMADNESS in a new tab. Do not build an apparel cart.

---

## 5. Leaderboard

1. Tap "Leaderboard" in the bottom nav.
2. Hall of Fame section: past champions with belt graphic. Tapping a champion opens a profile modal with real season points, Fight IQ, accuracy — **wire this to real data, not placeholder dashes.**
3. Current season rankings below.
4. Never ship "0 Ranked players" — if no data yet, show a designed empty state ("Standings publish after the first scored card").

---

## 6. Leagues

1. Tap "Leagues" in the bottom nav.
2. Affiliate alerts (auto-generated: "new fight" / "fight week" notices).
3. Fantasy Cards: season-long draft, one fighter per genre, entry fee shown, score accumulates across the whole campaign. Submit checks balance the same way scorecards do.
4. Public leagues browser: tapping a league opens a detail modal (host, members online, pot for a league you haven't joined; your rank for one you have) with JOIN LEAGUE or VIEW STANDINGS.
5. Head-to-head challenges (Shadow Fights).

---

## 7. Watch Party

1. Reached via MY ENTRIES card tap, or the bottom nav / homepage promo.
2. Resolves the specific fight from what was tapped — real fighter names in the header and round line, not hardcoded.
3. **If you have an entry** in that fight: your scorecard panel at top shows your pick, live point total (ticks up with the strike counter), RW/RL/SP point breakdown.
4. **If you have no entry:** that panel becomes a conversion prompt — "YOU HAVE NO CARD IN THIS FIGHT" + "ENTER THIS FIGHT ›" button, since entries stay open until the first bell.
5. Below: live match clock, round-by-round strike tracker (per real fighter names), crowd reaction bar, Cage Cam friend chat with working text input, animated stadium-light background.

---

## 8. Profile

1. Tap "Profile" in the bottom nav.
2. Stats, Fight IQ XP bar, streak tracker, "Share Fight IQ Receipt."
3. "⭐ GO FM+" banner → opens the FM+ modal: two plans side by side (monthly auto-renew vs. 30-day pass), pay button relabels to match selection. If already subscribed, shows "✓ FM+ MEMBER — MANAGE."
4. Settings link.

---

## 9. Settings

1. Notification toggles (push/email/text), wager limits, automation toggles.
2. Staff-only tools (never shown to regular users): Live Scoring Team assignment, AI-Assisted Admin Scorecard.

---

## 10. Free Demo Walkthrough

1. Reached via the homepage "NEW HERE? TRY A FREE DEMO FIGHT" banner — **this should be the only link to this screen.** MAKE PREDICTIONS and ENTER NOW must never route here (that was a live-site bug).
2. Guided, no-money tutorial: meet fighters → fill scorecard with explainers → round-by-round reveal → leaderboard movement → recap with CTAs into real Contests.

---

## 11. Blogs & Fight News

1. Reached via menu.
2. Full blog list + treasure chest buy-coins CTA.
3. Must have a real fallback if the API fails — never a broken/empty page.

---

## Cross-cutting checks (apply to every page above)

- [ ] Brand spelling: "Fantasy MMAdness" everywhere
- [ ] No page shows raw zeros as its primary content — designed empty states instead
- [ ] No internal dev/build notes visible to users
- [ ] `canonical` tag points to the real domain, never localhost
- [ ] Every button lands somewhere real — no toast-only dead ends
- [ ] Fonts are Anton (headings) / Rajdhani (body) — see `design-tokens.json`, no substitutions
- [ ] Diff against the prototype screen-by-screen before merging — see `PREVENTING-DESIGN-DRIFT.md`
