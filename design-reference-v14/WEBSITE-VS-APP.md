# Website vs. App — what stays, what goes

## The problem this fixes

The website and the app have been drifting apart because both were treated as full products with their own homepage, their own leaderboard, their own leagues page. That's what produced stacked/duplicate homepage sections and pages that never got the real design ported over. **The app is now the product. The website's job shrinks to what the app genuinely cannot do for itself.**

## Keep on the website

| Page | Why it stays here, not in the app |
|---|---|
| **Homepage / landing** | Rebuild as a short marketing page: what the game is, why it's different, one clear "LAUNCH APP ›" button. Not a duplicate of the app's Home screen — a pitch that hands off to it. |
| **Terms of Service** | Required for taking payment. Currently missing entirely. |
| **Privacy Policy** | Required for account creation and payment. Currently missing. |
| **Refund Policy** | Confirm the refund terms with your merchant processor, then publish. Referenced from checkout in the app — needs a real URL to link to. |
| **Contact / Support** | Currently broken (no visible form fields) — this is legitimately a website page, not an app screen, since users need support before and outside of being logged in. |
| **Press / Sponsorship / Advertising** | The B2B side of the business (gyms, brands, fighter affiliates, sponsorship inquiries) — this audience isn't inside the app and shouldn't need to be. |
| **Fighter / event SEO pages** | Individual, server-rendered pages per fighter and event so Google can index them. The app is a client-rendered SPA and can't do this on its own — this is the website's real job. |
| **Blog** (optionally) | Can live on the website as real SEO content instead of inside the app, *or* stay in-app with a working fallback — pick one home for it, not both. |

## Cut from the website — the app owns these now

| Page | What to do |
|---|---|
| `/leaderboard` | Delete. Real leaderboard is an app screen. |
| `/FantasyLeagues` | Delete. Real leagues are an app screen. |
| `/watch-party` | Delete. This was never more than static placeholder text anyway. |
| `/upcomingfights` | Delete as a standalone marketing page. If you want an SEO version, it's the "event pages" row above, not a copy of the app's Contests screen. |
| `/apparel` | Delete any in-app-style cart attempt here. Apparel sells through Etsy — either link out directly, or keep one simple website page that also just links to Etsy. Don't build two apparel experiences. |
| Homepage hero/pitch content | Replace, don't duplicate. One hero, one message, hands off to the app. |

## What "hands off to the app" means concretely

Every path from the website that used to lead to a half-built marketing page should instead lead to the real app:
- Website "LAUNCH APP" / "PLAY NOW" → the app's URL, landing on its own JOIN FREE or Returning Hero (it already knows which to show)
- Website "MAKE PREDICTIONS" (if any remains) → same, straight into the app
- No page on the website should attempt to reproduce what happens inside the app

## Immediate priority order

1. **Delete** the six pages in the "cut" table. Don't leave them half-fixed — remove them and redirect their URLs to the homepage or the app.
2. **Write** Terms, Privacy, Refund Policy — blocking for payments regardless of anything else.
3. **Fix** Contact so it actually has fields.
4. **Rebuild** the homepage as a short pitch + LAUNCH APP button.
5. **Later:** SEO fighter/event pages, once the app itself is stable and taking payments.

This turns "two products drifting apart" into "one product (the app) plus a thin marketing/legal shell that points at it."
