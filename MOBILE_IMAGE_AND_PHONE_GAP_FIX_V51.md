# Mobile image and phone-gap follow-up (v51)

## User feedback addressed

- Contest cards now display the mobile fight poster supplied by the public API. If a fight has no poster, or its remote image fails, the card uses a bundled event-poster fallback instead of showing an empty/black media area.
- The homepage Apparel row now reads the catalog's `images`, `image`, `imageUrl`, and thumbnail fields, including Etsy image objects, matching the already-working `/apparel` catalog behavior. Broken or absent catalog images fall back to bundled product artwork.
- Removed the hard-coded 58px spacer above the mobile top controls, eliminating the reported black strip while preserving the existing navigation and screen design.
- Backend-relative media paths such as `/uploads/...` are now resolved against `NEXT_PUBLIC_API_BASE_URL`; local `/images/...` assets remain frontend-relative.

## Backend assessment

No backend source change was required. Backend v13 already exposes the necessary fields: `fightPosterMobileImage`, `fightPosterImage`, `homepagePromotion.mobilePosterImage`, `homepagePromotion.posterImage`, fighter images, and apparel product images.

## Verification

- `npm run build` — passed (Next.js production build, all 124 pages).
- Mobile component QA — passed for zero top padding, API apparel images, API contest posters, missing-image fallbacks, broken-image fallbacks, and backend-relative media URL resolution.
- Bundled event-poster and apparel fallback files were checked in `public/images/mobile-home/final-v35`.

Note: standalone ESLint could not initialize because the existing project configuration references the `typescript` package without declaring/installing it. The production compiler and targeted runtime checks completed successfully.
