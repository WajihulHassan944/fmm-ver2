# Client Banner + Category Repair Audit

## Updated areas

- Replaced the homepage category asset references with cache-proof v2 filenames so the old Pro Wrestling photo cannot be served from the previous `pro-wrestling.png` path.
- Removed the previous category image filenames from `public/images/mobile-home/categories/`; the folder now only contains the five reference-style neon icons:
  - `fmm-category-boxing-reference-v2.png`
  - `fmm-category-mma-reference-v2.png`
  - `fmm-category-bare-knuckle-reference-v2.png`
  - `fmm-category-kickboxing-reference-v2.png`
  - `fmm-category-pro-wrestling-reference-v2.png`
- Updated homepage and mobile dashboard category constants to use the new category asset paths.
- Added a brighter money-arena hero background asset: `public/images/home-premium/fantasy-mmadness-money-arena-bg-v2.svg`.
- Reworked desktop hero CSS so the banner content and featured poster rail align at the top hero viewport instead of dropping into the lower half of the section.
- Reworked the featured poster carousel so posters use `object-fit: contain`, preventing cropped fight posters.
- Simplified the banner featured fight rail by hiding the extra thumbnail/footer UI in the hero; users still navigate with left/right controls and open details by clicking the poster.
- Kept the premium modal details flow intact and made modal poster rendering use `object-fit: contain`.
- Strengthened upcoming fight card fighter staging with fixed VS alignment, balanced card image sizes, and cleaner top-centered fighter image cropping.

## Validation

- Ran Prettier successfully on:
  - `src/Components/HomeAnother/HomeAnother.jsx`
  - `src/Components/Dashboard/Dashboard.jsx`
  - `src/styles/homepage-final-premium-polish.css`
- Parsed `homepage-final-premium-polish.css` with `tinycss2`; no CSS parser errors were returned.

## Build note

A full Next.js build was not executed in this handoff because this ZIP does not include `node_modules`.
