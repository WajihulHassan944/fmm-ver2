# Fantasy MMAdness — Complete Frontend (fmm-ver2 + updates)

This is your **full frontend repo**, not an overlay. Structure and files match `WajihulHassan944/fmm-ver2@main` exactly, with the updates below applied.

## Run it
```bash
npm install
npm run build
npm start
```
Nothing is missing — `package.json`, `package-lock.json`, `next.config.mjs`, `jsconfig.json`, `eslint.config.mjs`, full `src/` (Components, pages, Redux, Utils, styles, Fonts, Assets, CustomFunctions) and full `public/` (images, Fonts, favicons, ads.txt, sitemap.xml) are all here.

## What changed vs. your current main branch

**1. New apparel product — BKFC Bareknuckle Boxing Tee**
- `src/pages/apparel.jsx` — added one entry (`FMM-BKFC-TEE-001`) to `FALLBACK_APPAREL_ITEMS`, positioned after Snapback Cap.
- `public/images/mobile-home/final-v35/bkfc-tee.png` — new asset.
- Note: live apparel comes from `/api/public/apparel-products` (Etsy-backed). This guarantees the tee renders if that feed is down; to actually sell it, list it in the Etsy shop.

**2. New header banner artwork** (BOXING / UFC / KICKBOXING / BARE KNUCKLE / PRO WRESTLING)
- `public/images/mobile-home/final-v35/hero-banner-new.jpg` — replaced with the new artwork.
- `src/Components/MobileApp/FantasyMobileAppCore.jsx` — three references repointed from `hero-banner-crop-v62.webp` to `hero-banner-new.jpg` (the `directSlotAssets['bold-hero']` entry, the mobile `<source srcSet>`, and the classic hero `<img>`) so the new banner shows on mobile and desktop alike. If you'd prefer to keep webp for mobile performance, convert the new jpg to `hero-banner-crop-v62.webp` and revert those three lines.

No other files were modified.

**3. Build fix — React 19 peer dependency conflict**
Your `npm install` was failing on Vercel with `ERESOLVE`: `@testing-library/react@13.4.0` requires `react@^18`, but the project runs `react@19.2.7`. Bumped the three testing-library packages to their React 19-compatible majors in `package.json`:
- `@testing-library/react` `^13.4.0` → `^16.1.0`
- `@testing-library/jest-dom` `^5.17.0` → `^6.6.3`
- `@testing-library/user-event` `^13.5.0` → `^14.5.2`

`package-lock.json` was deleted so npm regenerates it cleanly against the new versions — the old lock still pinned the React 18 tree and would have reproduced the same conflict. Run `npm install` once locally and commit the fresh lockfile.

These are dev/test-only packages, so nothing in the shipped app changes.

**4. Build fix — remaining React 19 peer conflicts (`.npmrc`)**
After the testing-library bump, `npm install` then failed on `react-custom-roulette@1.4.1` (peer `react@^18.2.0`). That package has no React 19 release, and it's genuinely used (`src/Components/Home/SpinWheel.jsx`), so it can't just be bumped or dropped. Several other deps have the same stale-peer situation (`react-helmet`, `react-howler`, `react-media-recorder`, `react-player`, `react-google-recaptcha`).

Added a root `.npmrc`:
```
legacy-peer-deps=true
```
This makes npm install the working tree instead of hard-failing on advisory peer ranges — the standard fix for React 19 projects with older React ecosystem packages, and Vercel reads it automatically. It resolves this error and every remaining peer conflict at once, rather than fixing them one build at a time.

**Also worth removing (not done — your call):** `react-scripts@^5.0.1` is Create React App tooling and is unused in a Next.js app. It pulls a very large dependency tree and is a common source of peer conflicts and slow installs. Safe to delete from `dependencies` if nothing references it.

**5. Mobile header fit + 5–10s load time**

Two separate causes, both fixed.

*Header not fitting / jumping on phone:* the hero `<img>` had no intrinsic `width`/`height`, so the browser reserved no space for it and the layout shifted once the image decoded. Added `width={1983} height={793}` plus `aspectRatio: '1983 / 793'` so the slot is reserved at the correct shape from first paint. The `<picture>` element's mobile `<source>` was also pointing at the *same* full-size desktop file, making it a no-op — it now serves a real phone-sized variant (`hero-banner-new-mobile.jpg`, 900px wide).

*Slow load:* three home-screen images were multi-megabyte PNGs, several of them mislabelled with a `.jpg` extension. Resized to their actual display sizes:

| File | Before | After |
| --- | --- | --- |
| `pick-winner-fighter.png` | 3.2 MB | 507 KB (`-sm.png`) |
| `mma-arena-bg.jpg` (really a PNG) | 2.7 MB | 1.0 MB (`-sm.png`) |
| `treasure-chest.jpg` (really a PNG) | 2.1 MB | 233 KB (`-sm.png`) |

That's ~8 MB down to ~1.7 MB on the initial screen. Originals are left in place untouched; the code now points at the `-sm` variants. Also added `loading="lazy"` to the below-fold Bold hero and arena background so they no longer compete with the header for bandwidth.

**Recommended next step:** convert these to WebP during your build (Next.js `<Image>` or a squoosh/sharp step). WebP would take that 1.7 MB to roughly 400 KB. I could only resize here, not re-encode, so the remaining weight is PNG overhead on photographic content.

**6. Buttons behaving differently on the live phone vs. the prototype**

I audited every `onClick` in `FantasyMobileAppCore.jsx` against the class — **no dead or missing handlers**, so nothing is broken. The difference is a real branch in the code, not a bug:

```js
if (!event?.playable) { this.props.onOpenFight?.({ event }); return; }
```

`playable` is `fight.__playable !== false && !predictionSubmitted`. In the prototype every demo fight is playable, so every button opens the in-app prediction flow. With real backend data, fights that aren't currently open for prediction get `playable: false` — so the label silently becomes "VIEW FIGHT DETAILS" and the tap calls `onOpenFight`, which in `FantasyMobileExperience.jsx` does `router.push('/fight/<id>')` and **leaves the app for a website page**. That is exactly the "buttons don't do what they do here" symptom.

**Changed:** `openEvent` and `openFeaturedPick` now open the in-app fight-detail modal for non-playable fights instead of routing out to the website. Users stay in the app. `onOpenFight` is kept only as a fallback when there's no event object.

**Two things I did NOT change, because they're your call, not mine:**

1. `enterEvent` still routes out for non-playable fights. It's the *submit* path, so bouncing to a real page is arguably correct there — but say the word and I'll make it match.
2. **JOIN FREE** (`onJoin`) does `router.push('/CreateAccount')` — it leaves the app entirely, whereas the prototype opens an in-app join modal. This one is genuinely ambiguous: real signup lives on that page, so keeping it may be intentional. I didn't want to rewire your auth flow without you deciding. If you want the in-app modal to handle signup instead, that's a real change to how accounts get created and we should talk through it first.

**Worth checking on your side:** if most of your live fights are coming through with `__playable: false`, the buttons will *all* fall into the detail branch. That's a backend data question — verify your fights are being marked playable when their prediction window is open.
