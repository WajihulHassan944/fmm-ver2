# Monetization spec — the money layer, ready to build

Everything here already exists and works in the prototype (`FantasyMMADNESS-standalone.html`). Open it, click through each flow, and match it. This document gives the exact values, trigger conditions, and backend requirements so nothing has to be guessed.

**Build order matters.** Ship in the order below — each one is independently releasable, and the earlier ones fund the later ones.

---

## Step 0 — Prerequisite: a real payment provider (blocks everything else)

Nothing below earns a cent until money can actually move. This is the one piece the prototype cannot supply, because it deducts coins client-side only.

**Required:**
- **Your merchant processor.** Card details are entered on its hosted/secure payment page — Fantasy MMAdness never collects or stores card numbers, which keeps the platform out of PCI scope. Get the merchant processor's hosted checkout / iframe integration docs and wire the handoff at the "PAY" step.
- **Apparel is NOT part of this.** All merchandise is sold through the Etsy shop (etsy.com/shop/FANTASYMMADNESS) and is out of scope for in-app payments. The app links out to Etsy; it does not process apparel orders.
- **Server-side balance as the source of truth.** The user's FM balance must live in the database and be adjusted only by the backend. Never trust a client-reported balance or a client-side deduction — that's a trivial way to mint free coins.
- **Webhook on payment success → credit coins → return updated balance.** Coins credit only after the provider confirms payment, not on button click.
- **Idempotency keys** on every purchase so a double-tap or a retried webhook doesn't double-charge or double-credit.

Until this exists, the five features below can be built and demoed but cannot take real money.

---

## Step 1 — Coin packs with "Most Popular" + first-purchase double

Smallest change, largest immediate return. Both parts ship together.

**Packs:**

| Coins | Price | Badge |
|---|---|---|
| 1,000 FM | $0.99 | — |
| 5,000 FM | $3.99 | **MOST POPULAR** |
| 15,000 FM | $9.99 | — |

**Most Popular badge:** on the 5,000 FM pack only. Gold pill, sits on the card's top edge. Purely visual, but it reliably pulls buyers up from the $0.99 tier — this is the highest-ROI hour of work on the whole list.

**First-purchase double:**
- On a user's **first ever coin purchase**, credit **2× the pack amount** (5,000 FM pack → 10,000 FM).
- Must be enforced **server-side**, keyed on the user account, one time only, permanently. Do not gate it on a client flag or localStorage — that's farmable.
- Show it in the modal before purchase ("First purchase — coins doubled"), and confirm it in the success state. The offer has to be visible to work.

**Where the modal must open from:** the wallet pill, the treasure chest on the homepage, the ADD COINS button, **and every insufficient-balance event** (see P0 #3 in the fix list). Right now ADD COINS on the homepage is the only entry point — that alone is suppressing revenue.

---

## Step 2 — 500 FM signup bonus

The conversion problem is that a new user has no coins, so they cannot try the paid product, so they leave.

- On account creation, credit **500 FM** automatically, server-side.
- Surface it **in the join modal, above the email/password fields** — "🎁 Sign up now — get 500 FM coins free to make your first picks." It must be visible *before* signing up; a surprise afterward doesn't convert anyone.
- 500 FM = five 100 FM scorecard entries, deliberately: enough to feel the product and build a streak, not enough to play indefinitely for free.

---

## Step 3 — Streak-save (50 FM) and skip-the-wait (75 FM)

Small, high-frequency, high-margin. These work because the user already has coins and is emotionally invested.

**Streak-save — 50 FM (25 FM for FM+ members):**
- Button appears **only when the streak has under 1 hour left**. Showing it earlier destroys the urgency that makes it convert.
- Restores/extends the streak on purchase.
- The free path must always still work — a user who logs in on time keeps their streak for nothing. This is insurance, not a toll.

**Skip-the-wait — 75 FM:**
- Appears **only after today's daily reward is already claimed**.
- Unlocks the next daily reward immediately instead of waiting out the cooldown.

Both are optional, both are impulse-priced, and both must check and deduct balance server-side.

---

## Step 4 — FM+ subscription, $4.99/mo

Recurring revenue, and the only item here that compounds month over month.

**Entitlements — all of these must actually be enforced in code, not just listed in the modal:**
- 1,000 bonus FM credited monthly, automatically
- Early access to Fantasy Cards before general release
- Access to exclusive FM+ leagues
- No ads
- Streak-save at half price (25 FM instead of 50 FM)

**Implementation notes:**
- Recurring billing runs through the merchant processor — confirm with your merchant processor that stored-credential/recurring transactions are supported on your account before building.
- A single `isSubscribed` flag on the user record, checked at every entitlement point. **Do not ship the purchase modal before the entitlements work** — charging $4.99/mo for benefits that don't apply is the fastest way to generate chargebacks and one-star reviews.
- Handle expiry and failed renewals: entitlements must drop cleanly when a subscription lapses.

---

## What to hand the developer

1. This file.
2. `FIX-LIST-AUG-2026.md` — **P0 first.** Item #3 (insufficient balance → buy-coins modal) is the connective tissue for everything here; without it users hit a dead end instead of the purchase screen.
3. `FantasyMMADNESS-standalone.html` — the working reference. Every flow above is clickable in it. Match the layout, copy, and timing exactly.

**Suggested release plan:**
- **Release 1:** Fix list P0 (routing + insufficient-balance bridge) — makes paying possible at all.
- **Release 2:** Steps 0 + 1 (payments + packs + first-purchase double) — makes paying attractive.
- **Release 3:** Steps 2 + 3 (signup bonus + micro-purchases) — makes paying frequent.
- **Release 4:** Step 4 (FM+) — makes paying recurring.
- **Release 5:** The remaining page rebuilds from the fix list P1.

---

## Two things to settle with your merchant processor before building

1. **Recurring billing.** Confirm the account supports stored-credential / recurring transactions. **The prototype now hedges this** — see "FM+ without recurring billing" below.
2. **Refunds and coin policy.** Agree the refund window and whether spent coins are refundable, then publish it. This is the single biggest driver of customer confidence at checkout, and the app's terms copy stays deliberately neutral until it's decided.

---

## Account creation at checkout (built — do not skip)

**Coins cannot be bought as a true guest.** Merchandise can ship to a guest; coins have to land in a wallet that persists, so every coin purchase must resolve to a player account. The prototype handles this without adding a signup wall:

- **Logged-out user:** the checkout form *is* the signup. A gold banner above the billing fields states the account is created automatically from those details, plus **500 FM welcome coins**, with a password-set link emailed after. Name and email are already required for billing, so this adds **zero extra fields**.
- **Logged-in user:** a green "Signed in as — coins credit straight to this wallet" bar replaces the banner and the billing fields prefill from the profile. No retyping on the highest-intent screen.
- On payment success the confirmation screen shows a "PLAYER ACCOUNT CREATED" block naming the account and confirming the welcome coins.

**Backend requirements:**
- Create the account **only after** the merchant processor confirms payment, in the same transaction that credits coins — never on button click.
- **Email already registered?** Don't silently create a duplicate. Either attach the purchase to the existing account and tell the user, or block with a "sign in to continue" prompt. Decide which and implement it explicitly.
- **Payment succeeds but account creation fails** must never lose the customer's money. Record the payment against the email and reconcile; make this path recoverable by support.
- The password-set link must be single-use and expiring.
- The 500 FM welcome bonus is **once per account**, enforced server-side, and stacks with the first-purchase double.

---

## FM+ without recurring billing (contingency — already built)

If the merchant processor can't do recurring transactions, FM+ still ships. The subscribe modal now offers **two plans** and the pay button relabels to match:

| Plan | Price | Mechanics |
|---|---|---|
| **Monthly** | $4.99/mo | Auto-renews, cancel anytime — needs stored-credential support |
| **30-day pass** | $4.99 | One-time charge, no auto-renew — works on any one-time-only merchant account |

The pass is the fallback, and it's worth keeping **even if** recurring is approved — some customers won't accept auto-renew at all, and offering both raises total takeup.

**Pass implementation:** store an expiry timestamp on the account rather than a subscription record; entitlements check `expiry > now`. Notify at 3 days and 1 day remaining with a one-tap renew — without auto-renew, those reminders *are* the retention mechanism, so don't treat them as optional polish.

Either way, entitlements (ad-free, discounted 25 FM streak-save, early Fantasy Card access, exclusive leagues, 1,000 bonus FM/mo) must be enforced against the account, and must drop cleanly on lapse or failed renewal.
