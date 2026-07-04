# Phase: End-user category, homepage font, and fight detail consistency fix

## Fixed

- Homepage category tabs no longer auto-expand a sport section on page load or simple category jump.
- Boxing section no longer opens expanded by default on desktop.
- Category cards now continue to classify fights by `matchCategoryTwo` first, then `matchCategory`.
- Public fight normalization now avoids stale `effectiveCategory`/`categorySlug` values overriding the real primary category.
- `/upcomingfights?category=...` now receives and applies the category on SSR, avoiding desktop/mobile hydration mismatch.
- Fight hub category filter now normalizes `bare-knuckle`, `bareknuckle`, `kickboxing`, `boxing`, and `mma` consistently.
- Fight hub status filter now preserves the selected category in the URL.
- Fighter names now prefer fighter-library references before legacy fight text fields.
- Homepage requested headings now use `"FMMUFCBold", Inter, Roboto, Arial, sans-serif`.
- Public fight detail page headings/buttons/meta text now use the Fantasy MMADNESS font family and theme direction consistently.

## Backend

No backend change was required. The current backend already exposes `matchCategoryTwo`-preferred normalized fields; this fix was handled in the frontend display/filtering layer.
