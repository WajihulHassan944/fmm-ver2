# Upcoming Fights Fighter Image Priority Fix

## Scope
Frontend-only update for `/upcomingfights` and shared public fight cards/banners.

## Fixes
- Public fight cards and featured fight banners now resolve fighter images from the fighter-library/database fields first.
- Image priority order is now:
  1. `fighterAPrimaryImage` / `fighterBPrimaryImage`
  2. `resolvedFighterAImage` / `resolvedFighterBImage`
  3. `fighterA.primaryImage` / `fighterB.primaryImage`
  4. nested fighter-library image fields
  5. legacy fight-side image fields
  6. local fallback images
- `fetchPublicFights` now hydrates public fight rows with `/match` fighter image data when available, so `/upcomingfights` uses the same fighter images visible in the match response.
- `OptimizedImage` now resets its fallback/error state when the image source changes, preventing stale fallback images from staying visible after newer fighter DB images load.

## Files updated
- `src/Utils/fightExperience.js`
- `src/Utils/publicApi.js`
- `src/Components/Common/OptimizedImage.jsx`
