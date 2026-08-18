# Migration guide — taking this live on fantasymmadness.com

Step-by-step, in order. Do not skip ahead: each phase depends on the one before it.

---

## Step 0 — One entity, not two (read this before anything else)

The end state: a user should never feel a seam between "website" and "app." Concretely:

1. **One shared login/session.** Signing in on the website (or the app) creates one account, one token, valid on both. No separate account systems, no re-login when moving between them.
2. **The website hands off, it doesn't duplicate.** Per `WEBSITE-VS-APP.md`: the website keeps legal/SEO/contact pages and a short landing page with one "LAUNCH APP ›" button. Every other page that used to exist on the website (`/leaderboard`, `/FantasyLeagues`, `/watch-party`, `/upcomingfights`, `/apparel`) gets deleted, not fixed — the app is the only place those experiences exist now.
3. **Every button resolves to a real destination, immediately.** No toast-only dead ends, no route to a generic list when a specific fight was tapped, no route to the free demo from a real-money button. `INTEGRATION-MAP.md` names the exact real endpoint behind every screen so there's no guessing and no lag from retries or fallback states.
4. **No page reload between website and app.** If they're on the same domain/subdomain structure with shared auth, moving from the marketing site into the app should feel like one continuous session, not a fresh page load asking the user to log in again.

Everything below assumes this is true. If the developer does only one thing from this whole package, it's this.

---

## Step 1 — Download and open the prototype

1. Download the handoff folder.
2. Open **`FantasyMMADNESS-standalone.html`** by double-clicking it. It is fully self-contained — no server, no install, no internet needed.
3. Click through every screen, end to end, before writing any code:
   Home → Contests → Make Predictions → a scorecard → submit → Leagues → Watch Party → Profile → Settings → Free Demo → Blogs → the cart.
4. Also exercise these specific flows, because they carry the money logic:
   - ADD COINS → pick a pack → cart → billing form → terms checkbox → pay → confirmation
   - Join modal → player name + email → JOIN NOW (this signs you in)
   - Buy again while signed in (billing should prefill, no bonus repeat)
   - ⭐ GO FM+ → the two-plan chooser

**This file is the spec.** Where this guide and the prototype disagree, the prototype wins.

---

## Step 2 — Read the docs in this order

| Order | File | What it gives you |
|---|---|---|
| 0 | `REAL-BACKEND-GROUND-TRUTH.md` | **Read this first.** A real backend already exists (Authorize.Net) — supersedes every payment/AI-report guess below |
| 0b | `INTEGRATION-MAP.md` | Every prototype screen mapped to its exact real endpoint — the concrete fix for frontend/backend drift |
| 1 | `START-HERE.md` | How to treat the prototype; the rules that stop past handoffs from slipping |
| 1b | `PREVENTING-DESIGN-DRIFT.md` | **Read before writing any UI code** — why AI-assisted builds drift and the three rules that stop it |
| 1c | `design-tokens.json` | Every exact colour, font, size, radius and timing. Import it; never retype values. |
| 1d | `PAGE-BY-PAGE-BUILD-GUIDE.md` | Step-by-step walkthrough of every single screen, what to click, what must be true |
| 1e | `WEBSITE-VS-APP.md` | Which pages stay on fantasymmadness.com vs. which the app now owns — read before touching the website |
| 1f | `NOTIFICATIONS-AND-DATA-SYNC.md` | How back-office fight/affiliate updates flow to the app and trigger push notifications |
| 2 | `FIX-LIST-AUG-2026.md` | What is broken on the live site right now, prioritized |
| 3 | `MONETIZATION-SPEC.md` | The money layer: packs, bonuses, FM+, account creation at checkout |
| 4 | `README.md` | Every screen, feature, design token and asset explained |
| 5 | `scoring-config.json` | Exact point values — the authoritative source |
| 6 | `DEVELOPER-HANDOFF.md` | Backend scoring engine and data collectors (real, tested Node.js) |
| 7 | `AI-SCOUTING-REPORT-SPEC.md` | How to make the AI report real per fight (it is hardcoded today) |
| 8 | `BACK-OFFICE-FIGHT-PLACEMENT.md` | The three separate fight surfaces and how admins assign them |
| 9 | `INTEGRATION-CHECKLIST.md` | The sign-off checklist — used at the end of every deploy |

---

## Step 3 — Release 1: fix what's broken (no new features)

From `FIX-LIST-AUG-2026.md`, P0 only:

1. **Repoint MAKE PREDICTIONS** away from `/free-demo?start=scorecard&genre=boxing` to the real scorecard route for that fight. This currently makes it impossible to enter a paid contest from the homepage — fix it first.
2. **Repoint ENTER NOW** on each event card to that specific fight, not `/upcomingfights?category=…`.
3. **Wire the insufficient-balance bridge**: any submit with too few coins opens the coin purchase flow instead of failing silently.
4. Leave `/free-demo` linked from exactly one place: the "NEW HERE?" banner.

Deploy. Verify on the live URL. Do not continue until these three work.

---

## Step 4 — Release 2: coin payments through the merchant processor

**Before coding**, get from your merchant processor:
- Hosted checkout / iframe integration docs
- Whether the account supports recurring (stored-credential) transactions — this decides FM+ later
- Test/sandbox credentials
- Their published refund policy, so the app's terms text can stop being generic

**Then build, in this order:**

1. **Server-side wallet.** Move the FM balance into the database. Every credit and every entry-fee deduction happens on the backend. The prototype deducts client-side — that must not ship, it's a free-coins exploit.
2. **Coin packs** as server-defined products: 1,000/$0.99, 5,000/$3.99 (badged MOST POPULAR), 15,000/$9.99. Never let the client send the price.
3. **Cart + billing form** matching the prototype's `renderCart`: line items with quantity steppers, order summary, billing fields for AVS, 18+/terms checkbox gating the pay button.
4. **Handoff to the merchant processor's hosted page** at the pay button. Card details are entered on the processor's page, never in your form — the checkout copy promises the customer exactly this, and it keeps you out of PCI scope.
5. **Credit coins only on the merchant processor's confirmation callback.** Not on the client success screen. Use idempotency keys so a double-tap or retried callback can't double-charge or double-credit.
6. **Account creation at checkout** (see `MONETIZATION-SPEC.md` for the full rules):
   - Logged out → create the account from the billing name/email *after* payment confirms, email a single-use password-set link, credit 500 FM welcome once
   - Logged in → prefill billing from the profile, no new account, no repeat bonus
   - Handle: email already registered, and payment-succeeded-but-account-creation-failed. Neither may lose the customer's money.
7. **First-purchase double** enforced server-side, once per account, permanently. A client flag is farmable with throwaway accounts.

Test the whole flow in the merchant processor's sandbox before touching live keys.

---

## Step 5 — Release 3: the retention hooks

- 500 FM signup bonus surfaced **in** the join modal, before signup (it converts only if visible up front)
- Streak-save 50 FM — appears only when the streak has under 1 hour left
- Skip-the-wait 75 FM — appears only after today's reward is claimed
- Both deduct server-side; the free path must always still work

---

## Step 6 — Release 4: FM+

Which version depends on your merchant processor's answer from Step 4:
- **Recurring supported** → $4.99/mo auto-renew, plus keep the 30-day pass as a second option (some customers refuse auto-renew)
- **Recurring not supported** → ship the **30-day pass only**: one-time charge, expiry timestamp on the account, renewal reminders at 3 days and 1 day

Either way: entitlements (ad-free, 25 FM streak-save, early Fantasy Card access, exclusive leagues, 1,000 bonus FM/mo) must be enforced against the account and drop cleanly on lapse. **Do not ship the purchase before the entitlements work.**

---

## Step 7 — Release 5: rebuild the pages still on the old template

`/watch-party`, `/contact`, `/leaderboard`, `/FantasyLeagues` are all still the old generic marketing layout. For each one: build the prototype screen, and **delete the old page in the same commit**. Never leave two versions live — that's what produced the stacked/duplicate homepage sections previously.

Also in this release: remove the "Experience standard" internal build notes visible on `/contact` and `/watch-party`, and fix the `canonical` tags still pointing at `http://localhost:3000` on `/leaderboard`, `/contact` and `/FantasyLeagues`.

---

## Step 8 — Before every deploy

1. Open the live URL and the prototype side by side. Click through both the same way.
2. Work the relevant rows of `INTEGRATION-CHECKLIST.md` and mark ✅/❌ **against the live site**, not against local or a screenshot.
3. Report back row by row. "Should be fixed now" is not a status.

---

## Apparel — explicitly out of scope

All merchandise sells through Etsy (etsy.com/shop/FANTASYMMADNESS). Apparel tiles and "SHOP ON ETSY ›" open Etsy in a new tab. Do **not** build an in-app cart, size picker or order form for merchandise — the only in-app purchase is FM coins (and FM+).

---

## Go-live safety checks

- [ ] Live merchant-processor credentials in server-side environment variables — never in the frontend, never committed
- [ ] Payment confirmation callback verified and signature-checked
- [ ] Wallet balance provably server-authoritative (try to spend coins you don't have; it must fail)
- [ ] First-purchase double and 500 FM welcome each fire exactly once per account
- [ ] Refund policy published and linked from checkout
- [ ] Receipt email sending and arriving
- [ ] Full purchase tested end to end with a real card, then refunded through the merchant processor
