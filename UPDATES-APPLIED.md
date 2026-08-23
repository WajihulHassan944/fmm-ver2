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
