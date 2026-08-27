# The public website — how to switch it on

The site is live at **`/welcome`** (`src/pages/welcome.js`), fully converted from
the design document. It is deliberately NOT on `/` yet, because `/` currently
renders your existing `HomeAnother` page and replacing it should be your call, not
a side effect of a conversion.

## To make it the homepage

`src/pages/index.js` is four lines. Replace them with:

```js
import FantasyMMAdnessSite from './welcome';

export default FantasyMMAdnessSite;
```

To revert, put the original back:

```js
import HomeAnother from "@/Components/HomeAnother/HomeAnother";

const HomePage = () => <HomeAnother />;

export default HomePage;
```

Nothing else needs to change. The old page stays on disk either way.

## What actually works on it

| Element | Behaviour |
|---|---|
| **Signup form** | Posts to `/register`. If the server returns a token, the new player is stored as signed in and sent to `/` — the app. If it returns a verify-email message, that is shown instead |
| Age check | Under-18 is refused in the browser before the request, so nobody fills the whole form to be rejected |
| State selector | All 51 jurisdictions. Required, because the server needs it to decide paid vs free |
| Terms + Privacy links | Real routes, on the consent line where the agreement is formed |
| Sign in | Goes to `/auth` |
| Etsy | Three links to the real shop, new tab, `noopener` |
| Everything else | Marketing. Fight cards, pots and the leaderboard are illustrative — see below |

## The data is real

Fight cards, the leaderboard, the ticker and the schedule all read live data via
`getStaticProps` with `revalidate: 60` — served from cache so the page stays
fast, refreshed a minute after you publish a fight. Server-rendering on every
request would undo the load-time work; a fully static build would go stale.

**Settled and past fights are filtered out.** A marketing page still advertising
a fight that happened last month reads as abandoned, and no amount of design
fixes that.

**Badges, pots and buttons derive from the fight itself:** a guaranteed pot shows
as one, a free contest reads "ENTER FREE" and promises badges rather than money,
and a paid contest shows its live entry count. Nothing is typed in.

**If the API is unreachable the page still renders.** The fight grid shows "NEXT
CARD BEING ANNOUNCED" with a signup CTA, the board says it opens when cards are
scored, and the ticker falls back to generic lines. An honest empty state, never
invented fights.

## Page weight

Images went from **13.2 MB to 973 KB** (93% smaller). First screen is **150 KB on
a phone** — a mobile crop of the banner plus the logo. Everything below the fold
is lazy-loaded, and the banner preloads from the document head.

Originals are kept in `assets/` at the project root; the served copies are in
`public/site/`.
