# Public Fight Category Visibility Frontend Fix

## Problem
Some public fight views appeared to lose fights after the fighter-library cleanup because category and fighter display data were still being read from legacy fight fields only. Fights such as:

- `matchCategory: boxing` + `matchCategoryTwo: Bare-knuckle`
- `matchCategory: mma` + `matchCategoryTwo: kickboxing`

must be grouped and displayed by the secondary category first.

## Frontend Fix
- Public fight fetching now prefers `/api/public/fights` first so the frontend receives the backend-normalized category fields.
- Legacy `/match` and `/shadow` feeds remain as fallback only.
- Public fight rows are normalized on the frontend with:
  - `effectiveCategory`
  - `effectiveCategorySlug`
  - `displayCategory`
  - `categoryLabel`
  - `categorySlug`
- `matchCategoryTwo` is preferred for visible sport/category labels.
- If `matchCategoryTwo` is empty, the frontend falls back to the backend effective category and then `matchCategory`.
- Bare-knuckle fights are no longer swallowed by generic Boxing views.
- Kickboxing fights are no longer swallowed by generic MMA views.
- `/fights`, `/upcomingfights`, `/past-fights`, and sport landing pages now use the normalized category data.
- Public fight hub no longer performs aggressive duplicate collapsing that could hide records after fighter-name cleanup.

## User Dashboard / My Fights
- Prediction fight fetches now pass the current user id/player id when available.
- Completed cards can use backend fields:
  - `predictionSubmitted`
  - `userPredictionSubmitted`
  - `userPredictionStatus`
  - `userFightBucket`
- If the user has not submitted a prediction, the fight remains in pending/playable cards.

## Fighter Cleanup Compatibility
- Fight cards now resolve fighter names/images from fighter-library references when old fight-side fields are missing.
- Existing old fields remain supported as fallback.

## Verification
- JS utility syntax checks passed.
- JSX/React syntax validation passed for the updated frontend files using TypeScript transpile diagnostics.
