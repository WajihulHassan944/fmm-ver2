# Handoff: Fantasy MMAdness Mobile App

## Overview
A mobile-first fantasy sports app for combat sports (MMA, Boxing, Bare Knuckle, Kickboxing, Pro Wrestling). Brand spelling is **Fantasy MMAdness** (capital MMA, lowercase "dness") — confirmed against fantasymmadness.com. Users predict fight stats/outcomes via scorecards, join leagues and season-long "Fantasy Cards," watch live fights with real-time scoring, and affiliates promote fights for referral leagues. Domain: fantasymmadness.com.

## About the Design Files
The bundled HTML file (`FantasyMMADNESS.dc.html`) is a **design reference/prototype** built in an internal component format — not production code. Open it directly in a browser to click through every screen and interaction (it's wrapped in an iOS device frame via `ios-frame.jsx` for presentation only). The actual product should be **rebuilt natively in your target stack** (React Native, Flutter, native iOS/Android, or a mobile web framework — whatever this codebase already uses). Treat this file as the spec for layout, copy, states, and interaction — not something to transplant directly. Ignore the custom tags/attributes it uses internally (`<image-slot>`, `hint-*`, `data-*`, the `ios-frame.jsx` bezel) — these are prototype-only plumbing standing in for real image upload/CDN, internal component wiring, and device-preview chrome.

## Fidelity
**High-fidelity.** Colors, typography, spacing, copy, and micro-interactions (animations, glows, sound cues) are intentional and final. Recreate pixel-close using your codebase's design system/component library where one exists; otherwise implement using the values documented below.

## Screen Map
1. **Home** — hero (fighter photos + title), stats bar (predictors/prizes/live events/leaderboards, clickable), sport selector carousel, featured banner + featured fight detail, upcoming events carousel, community predictions (auto-cycles all open fights every ~4.5s), rewards row (daily reward, coin wallet, mini leaderboard, streak bonus w/ live countdown), apparel carousel, affiliate promoter banner + social icons + treasure chest (buy-coins CTA).
2. **Contests** — full list of open fights across all sports/affiliates, filterable, posters use `contain` fit (never crops fighter heads).
3. **Make Predictions** — per-sport scorecards (Boxing/Bare Knuckle, MMA/Kickboxing, Pro Wrestling) with round-by-round stat inputs, winner pick, AI scouting notes. Submitting checks the user's FM balance first (see Monetization Funnel below).
4. **Leaderboard** — Hall of Fame (past champions with belt graphic), current season rankings.
5. **Leagues** — Affiliate alerts (new fight / fight week notices, auto-generated), Fantasy Cards (season-long cross-genre draft — pick 1 fighter per genre, score accumulates across the whole campaign span), public leagues browser, head-to-head challenges.
6. **Watch Party** — live match clock, round-by-round strike tracker, crowd reactions, Cage Cam friend chat (live feed + user text input), animated stadium-light background (flickering red/blue + flashing bulbs) over an arena photo.
7. **Profile** — stats, Fight IQ XP bar, Share Fight IQ Receipt (shareable stat card), settings link.
8. **Settings** — notification toggles (push/email/text), wager limits, automation toggles (auto-settle, AI auto-score, etc.), plus admin/back-office-only tools: **Live Scoring Team** (assign staff to Red/Blue corner per live event) and an **AI-Assisted Admin Scorecard demo** (AI auto-fills strike categories live, staff nudge +/- to correct) — both explicitly marked staff-only; regular users never see them, only the resulting point totals.
9. **Free Demo Walkthrough** (reachable from menu + Home banner) — a full guided, no-money tutorial: meet fighters → fill scorecard (with category explainers) → round-by-round reveal with full stat breakdown vs. your prediction → leaderboard movement → post-fight comments → recap with FAQ and CTAs into real Contests/Shadow Fights.
10. **Blogs & Fight News** (menu item) — full blog list + treasure chest buy-coins CTA.
11. **Menu drawer** (hamburger, top-left) — links to every tab above plus Rules/Support.

## Monetization Funnel (critical for revenue)
- **FM Coins pricing stays fractional/bulk, not 1:1 with USD**: 1,000 FM = $0.99, 5,000 FM = $3.99 (badged **"Most Popular"**), 15,000 FM = $9.99. This matches the entry-fee scale already in the app (25–200 FM per pick) — do not rescale to 1 coin = $1 without also reworking every entry fee across scorecards, Shadow Fights, and Fantasy Cards.
- **Insufficient-funds guard on every entry point.** All submit paths (`submitScorecard`, `submitBoxingScorecard`, `submitMmaScorecard`, `submitFantasyCard`) check the user's FM balance against the entry fee *before* allowing submission. If short, the flow shows a toast and opens the buy-coins modal directly — the highest-intent purchase moment in the app.
- **Signup bonus**: Join modal leads with "🎁 Sign up now — get 500 FM coins free to make your first picks."
- **First-purchase bonus**: `addCoins(amount, price)` doubles the coin amount on a user's first-ever purchase (tracked via `state.hasPurchased`) — the buy-coins modal shows the doubled total live per package and a green banner while unpurchased. Move this flag server-side (tied to account, not client state) in production.
- **Streak-save paywall**: once `streakExpiresIn` drops under 1 hour, a "💾 SAVE STREAK — 50 FM" button appears on the Streak Bonus card (`saveStreak()`), deducting 50 FM and resetting the timer to 24h without losing streak progress.
- **Skip-the-wait**: once the daily reward is claimed, a "⚡ SKIP WAIT — 75 FM" button (`unlockNextReward()`) instantly re-arms tomorrow's claim, deducting 75 FM and crediting the next 250 FM reward immediately.
- **FM+ subscription** ($4.99/mo, `subscribeFmPlus()` / `modal === 'subscribe'`, reachable via a "⭐ GO FM+" banner in the buy-coins modal): 1,000 bonus FM/month, early access to Fantasy Cards, exclusive private leagues, no ads, discounted streak-saves (25 FM instead of 50 for members). Not yet enforced elsewhere in the UI — e.g. ad-free and the discounted streak-save price aren't wired to `isSubscribed` yet; do that plus real recurring billing through the merchant processor in production.
- **Still to build for production**: merchant processor wiring (the merchant processor) behind ALL of the above (buy-coins, streak-save, skip-wait, FM+); server-side balance/entitlement as source of truth (the prototype deducts client-side only, trivially exploitable as-is); analytics/funnel tracking on each of these moments to validate pricing; a post-submit upsell (e.g. multi-entry bonus) is recommended but not yet built.

## AI Features (added this pass)
- **AI Scouting Assistant** (`modal === 'aiScout'`, triggered by the "🤖 AI SCOUTING REPORT" button on Home's featured fight card): shows a personalized fight breakdown, pick-split %, and an underdog-bonus callout, then funnels straight into the prediction modal. **Currently static/hardcoded to one matchup** — production should regenerate this per fight from real data (fighter stats, community pick %, betting-style insights) each time a new event is posted; treat it as a backend content-generation job triggered on event creation, not client-side copy.
- **Fighter Affiliates** (`modal === 'fighterAffiliate'`, example: "Aspinall's Fight Card" in Leagues → Fantasy Cards, badged "✓ FIGHTER"): a fighter can become an affiliate the same way a promoter does (profile → promote → share link/QR → track → payout), fronted by their own name/photo. Fans tap the host name to see a verified-fighter profile (followers, pot, cards hosted) with a Follow button and a direct draft CTA. Production should add: a real "Follow Fighter" mechanic (persisted per user), push notifications to followers when a followed fighter launches a new card/promotion, and a verification pipeline for granting the "✓ FIGHTER" badge.

## SEO (current state vs. what the backend must own)
The prototype's `<head>` carries page-level `<title>`, meta description/keywords (Boxing, UFC, MMA, Kickboxing, BKFC, Pro Wrestling), Open Graph tags, and a JSON-LD schema block — copy these into the real site's static shell as a baseline.
**This is a single-page client app and cannot do real SEO on its own.** For actual Google indexing of blogs/fighters/events, the backend must provide: server-side rendering (or static generation) so each blog post / fighter profile / event has its own real crawlable URL; an auto-generated, auto-growing `sitemap.xml` submitted to Search Console as content is added; per-page unique meta title/description/keywords generated from each blog's own fight genre/fighters (Boxing, UFC, MMA, Kickboxing, BKFC, Wrestling keyword sets); structured data (Article/SportsEvent schema) per blog/event page. An "AI SEO bot" running 24/7 is a backend content pipeline (auto-tag new blogs with the right combat-sport keywords, auto-build meta tags, auto-ping sitemap on publish) — not something the client app can execute itself.

## Scoring System — source of truth is now `scoring-config.json` + `DEVELOPER-HANDOFF.md`
This supersedes the earlier "KO doesn't award points" note in previous versions of this doc — the real, tested rule set (built and run as real Node.js logic, see `DEVELOPER-HANDOFF.md` Section 3) is:

- **Combat sports (Boxing, MMA, Kickboxing, Bare-Knuckle)** — users predict a winner **per scheduled round** (Boxing 12 rounds, MMA/Kickboxing/Bare-Knuckle 5 rounds). Per round, points **stack/are cumulative**, nothing is overwritten:
  - Correct round-winner pick: **100** (RW)
  - Same pick, automatic paired credit: **+25** (RL — "Round Loser," auto-credited from the same guess)
  - If that round is the actual finish round (KO, TKO, **or Submission** — Decision doesn't count) and the pick was correct: **+500** Finish Bonus
  - Wrong pick but round is NOT the finish round: **25 flat** Survival Bonus (automatic — applies almost every round)
  - Wrong pick AND round IS the finish round: **0**
  - Example: a correct finish-round pick pays 100+25+500 = 625 that round alone.
  - Stat groupings: **strikingGroup** (MMA + Kickboxing) = ST/KI/KN/EL; **punchingGroup** (Boxing + Bare-Knuckle) = HP/BP/TP (TP tracked independently, never derived from HP+BP).
  - **Stat-accuracy scoring (confirmed, supersedes any earlier tolerance-based placeholder and old FAQ copy)**: each stat prediction is a **floor, not a target** — it scores only if the actual number is ≥ the prediction (a tie counts), and if it scores, points awarded equal the predicted number itself (no fixed max, no tolerance band). Predict 5, actual ≥5 → 5 pts. Predict 100, actual only 40 → 0 pts. This rewards informed high guesses over "safe" low ones — a correct higher prediction always outscores a correct lower one.
- **Pro Wrestling** (no rounds — scored live over the full 25-minute match): stats for both wrestlers across HP, BP, K (Kicks), PM (Power Moves), FM (Finishers). Match Winner bonus flat **100** (2-way pick, no draw). Finish market (Pinfall or Submission) **500** if called correctly, else **25** Survival Bonus. ⚠️ known gotcha: a stat predicted as "0" must only score once the match has actually ended (see `live-wrestling-scoring.js`), or it falsely inflates the score mid-match.
- **Shadow Fights**: not a separate ruleset — a wrapper. Takes an already-scored archived fight, hides identity, re-releases as a fresh contest; users predict the full scheduled length for the sport even if the real fight ended early (scoring engine only scores rounds that actually happened, so this needs no special handling). Auto-queued for promotion into the archive 24 hours after a fight goes official.
- **UI mapping**: the prototype's boxing/MMA scorecards already capture `rw`/`rl` tallies per round plus a winner pick and a KO/Survival outcome toggle — that outcome toggle IS the Finish Bonus market above; wire its point value from `scoring-config.json`, not a hardcoded number.
- **All stat categories count attempts thrown, not just landed strikes** — surface this in tooltip/help copy.
- If `scoring-config.json` and this doc ever disagree, the config file wins — see its `_sourceOfTruth` note.

## FAQ copy fixes needed on the live site — see `faqs-corrected-copy.md`
Two live FAQ answers on fantasymmadness.com currently contradict the confirmed scoring rules above and must be replaced: the KO/Finish answer (old copy claims KOs don't matter — wrong, a Finish pays a 500-pt bonus) and the stat-accuracy answer (old copy has the floor rule backwards — it should reward equal-or-higher predictions, not penalize overestimation as a hard rule). Corrected replacement text for both is in `faqs-corrected-copy.md`. Also flagged there: FAQ #11 "How do the 500-point bonuses work?" needs to be opened and checked against these fixes before publishing, so all three FAQ answers agree.

## Backend Architecture (see `DEVELOPER-HANDOFF.md` for full detail — data hub, collectors, listener pattern, file map, and honest gap list)
`DEVELOPER-HANDOFF.md` (bundled in this package) is real, tested Node.js logic — not just a spec — covering: a Data Hub with source-conflict detection and a `hub.onOfficial()` listener pattern (adding new automated behavior like payouts or push notifications means adding a listener, never editing existing code); five real data collectors (UFC/Wikipedia, BKFC official site — best quality, BoxingInsider, WWE official site, combined multi-sport); the Shadow Fight auto-promotion flow; and a numbered list of what's genuinely NOT done yet (no real database writes, no live network tested, Pro Wrestling collector needs a product decision on Raw/SmackDown vs. Premium Live Events only, CompuBox needs a licensing conversation before any integration, no admin dashboard UI exists). Read its "Suggested first sprint" section (bottom) for the recommended build order.

## Fantasy Cards (season-long contest)
Fixed-length campaigns (first fight of a stretch to the last, e.g. "JUL 27 – AUG 25"), hosted by admin or any affiliate. User drafts exactly one fighter per genre (Boxing, MMA, Bare Knuckle, Kickboxing, Wrestling) from whoever's already scheduled that stretch — no snake draft, just pick-and-lock. Score accumulates across every event in the span. Users can join as many campaigns as they want (each has its own entry fee + pot).

## Automation / Admin-facing rules (for backend)
- New fight listings auto-generate an affiliate "🆕 just listed" alert; fights within 7 days auto-generate a "📅 FIGHT WEEK" alert — both are computed, not manually triggered.
- Community Prediction odds update immediately when any user submits a scorecard or taps a quick-pick chip.
- Photo/fighter carousels (sport cards, apparel, upcoming events) must show **zero empty slots**: 0 uploaded photos → one placeholder; 1 photo → static; 2+ → auto-cycle every 7s. Never show a blank tile.
- **Every fighter photo upload (Featured This Week, Featured Fight, sport-selector circles, apparel, event posters) must run automatic background removal** (e.g. remove.bg API or a trained segmentation model) server-side on upload, so white/studio backgrounds never show against the app's dark cards. In this prototype that was done manually per-photo (canvas alpha-threshold on white/near-white pixels) — the real app needs this to run automatically on every future upload, not as a one-off.
- Streak Bonus needs a live countdown ("Streak expires in Xh Ym"), red/pulsing under 1 hour remaining, resetting to 24h on claim.
- Upcoming Events auto-drop off the list once their date passes (no manual pruning).
- Live fights are scored live by admin; users only see point totals/deltas update in real time — never the raw admin scoring UI.

## Design Tokens
- **Background**: near-black `#05060a` / `#0b0c12` gradients.
- **Accent — Fire red**: `#ef4444` (MMA/UFC tag color, alerts, red-corner).
- **Accent — Blue**: `#4d8dff` (blue-corner, links, secondary CTAs).
- **Accent — Gold**: `#f2b544` / `#f2c869` (currency, points, streaks, premium).
- **Accent — Purple**: `#a855f7` (leagues, XP, Fight IQ).
- **Green**: `#22c55e` (success, live indicators, positive money).
- **Typography**: Headlines in `'Anton', sans-serif` (condensed display face); body/UI text in `'Rajdhani', sans-serif`.
- **Radius**: 8–16px on cards/buttons; pill (999px) on primary CTAs.
- **Glow pattern**: cards use layered `radial-gradient` "stadium light" glows (red/blue/gold) plus a colored `box-shadow` border-glow — this is the signature visual motif, replicate consistently across all card surfaces.
- **Animations**: `pulseLive` (live dot), `moneyPulse`/`moneyPulseGold` (currency emphasis), `ptsTwinkle` (gold shimmer on point values), `glimmerCrown` (icon bubbles), `stadiumFlickerRed/Blue` + `bulbFlash` (arena light backgrounds), `cardPop`/`quickFlash` (quick-pick feedback), `toastIn` (toast/notification entrance).
- **Sound cues**: bell ring on picks/submissions, crowd cheer on wins/streak claims — implement as short audio triggers tied to those same actions.

## Assets
- `uploads/HANDSHAKE PHOTO.jpg` / `handshake-transparent.png` — affiliate/partner section (transparent bg version used on-screen).
- `uploads/pasted-1785011607947-0.png` — stadium crowd photo (Watch Party + Home hero background).
- `uploads/pasted-1785012202182-0.png` — friends watching fight photo (Leagues promo + screen background).
- `uploads/pasted-1785012542538-0.png` — ring corner photo (mini Leaderboard card, Home).
- `uploads/chest-transparent.png` — treasure chest graphic (transparent bg) used for the buy-coins CTA; click triggers a coin-burst animation before opening the payment modal.
- All fighter/event photos are user-uploaded placeholders (`<image-slot>` in the prototype) — build real upload → CDN → carousel wiring, plus real background-removal (e.g. remove.bg API) for fighter cutouts if that visual treatment is wanted at scale, since the current transparent PNGs were manually processed.

## Payments & Coins — the merchant processor (coins only)
"FM Coins" is the in-app currency and the **only** thing paid for inside the app. **Apparel is NOT sold in-app** — all merchandise goes through the Etsy shop (etsy.com/shop/FANTASYMMADNESS); apparel tiles and the "SHOP ON ETSY ›" link open Etsy in a new tab and nothing else.

**Coin checkout flow (built in the prototype, `renderCart` / `placeOrder`):**
1. User picks a pack in the buy-coins modal (wallet pill, treasure chest, or an insufficient-funds redirect) — 1,000 FM $0.99 / 5,000 FM $3.99 ("MOST POPULAR") / 15,000 FM $9.99.
2. The pack drops into a cart and the cart screen opens: line items with quantity steppers and Remove, order summary (subtotal, coin pack amount, first-purchase bonus line when it applies, FM coins credited, total). No shipping or tax rows — it's a digital purchase.
3. Billing form: name on card, receipt email, phone, billing address, city, state, ZIP, country. Required fields validated; email format checked. Billing address is collected for **AVS matching**, not shipping.
4. An **18+ / Terms & Refund Policy confirmation checkbox** gates the pay button.
5. Pay button reads "PAY $X.XX · GET N FM". On success: coins credit to the wallet, confirmation screen with order number.

**Wiring it to the merchant processor:**
- The prototype's pay button is where the **handoff to the merchant processor's hosted payment page** goes. Card details must be entered on the processor's secure page, never in the app's own form — that keeps Fantasy MMAdness out of PCI scope, and the checkout copy already promises the customer exactly that.
- Get from the merchant processor their hosted checkout / iframe integration docs; pass the order total, coin quantity, and billing details at handoff.
- **Credit coins only on the merchant processor's payment-confirmation callback**, never on the client-side success screen.
- Balance and entry-fee deduction must move **server-side** — currently client-state only in the prototype.
- **First-purchase double-coins must be enforced server-side, once per account, permanently.** The prototype models it correctly (`cartTotals()` → `bonus` flag, settled in `placeOrder`), but a client flag is farmable with throwaway accounts.
- Use idempotency keys so a double-tap or retried callback can't double-charge or double-credit.

**Still to settle with your merchant processor:** whether the account supports recurring/stored-credential transactions (needed for FM+ at $4.99/mo), and the published refund policy. See `MONETIZATION-SPEC.md`.

## Files in This Bundle
- `FantasyMMADNESS.dc.html` — full interactive prototype, open directly in a browser to click through every screen.
- `support.js`, `image-slot.js`, `ios-frame.jsx` — prototype runtime/presentation plumbing (not app logic — see "About the Design Files").
- `uploads/` — background/branding images referenced above.

Open the HTML file and click through Home → Contests → Make Predictions → Leagues → Watch Party → Profile → Settings → Free Demo → Blogs to see every state and copy exactly as designed.
