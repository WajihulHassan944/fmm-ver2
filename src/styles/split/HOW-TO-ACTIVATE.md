# Prepared CSS split — 492 KB off the app's first paint

**Status: ACTIVE.** `_app.js` imports the split copies and links the legacy
halves on website routes only. Total CSS parsed before the app's first paint went
from 2,994 KB → **1,939 KB**.

Verified after activation: every `@font-face` (14), every `:root` block (6),
every `@keyframes` (16) and every `body` rule stayed in the app half — nothing
global was moved out. Kept + legacy accounts for 100% of the original bytes, so
no rule was dropped.

**Still to check in a browser** (this is the part source cannot prove): the four
website pages below. Their stylesheets now load as `<link>` tags after the bundle
rather than inside it, so a rule that was previously overridden could start
winning.

## What is here

Four stylesheets were each cut in two by a rule-by-rule scan. A rule stays in the
app bundle if it is global (`html`, `body`, `*`, `:root`, `@font-face`,
`@keyframes`) **or** if it targets one of the 24 CSS classes the mobile app
actually renders. Everything else is legacy-website styling the app never uses.

| File | Was | App keeps | Legacy only |
|---|---|---|---|
| `frontend-final.css` | 182 KB | 1 KB | 181 KB |
| `globals.css` | 134 KB | 4 KB | 130 KB |
| `new-theme.css` | 105 KB | 3 KB | 102 KB |
| `client-feedback-final.css` | 79 KB | 1 KB | 78 KB |
| | **500 KB** | **9 KB** | **492 KB** |

- `src/styles/split/<file>` — the part the app needs (import these).
- `public/legacy-css/<file>` — the part only website pages need (link these).
- `src/styles/_backup-legacy-css/<file>` — the untouched originals.

## Check these four pages after deploying

1. Home page (`/`)
2. A fight detail page
3. Affiliate dashboard (`/AffiliateDashboard`)
4. A pro-wrestling page

The app route itself is not at risk — the split keeps every rule that touches an
app class.

## To revert

In `src/pages/_app.js`, change the four `@/styles/split/<file>` imports back to
`@/styles/<file>`, and delete the four `/legacy-css/` links for
`globals`, `frontend-final`, `new-theme` and `client-feedback-final`. Originals
are untouched in `src/styles/_backup-legacy-css/`.

## Why this needed a browser check

The split itself is safe by construction — nothing global is dropped, and no rule
touching an app class is moved. The risk is **cascade order on the legacy pages**.
Those files currently sit part-way through 114 bundled stylesheets; served as
`<link>` tags they load after the bundle instead. Rules that were being overridden
by a later file would start winning.

That cannot be detected by reading source. It was activated on the owner's
decision so testers judge the app on a fast open — with the four website pages
above to be confirmed on the preview deploy, and a two-line revert if one is off.
