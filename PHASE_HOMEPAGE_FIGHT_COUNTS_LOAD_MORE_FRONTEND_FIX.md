# Homepage Fight Counts + Load More Frontend Fix

## Scope
Frontend-only update.

## Fixes
- Homepage fight feed now requests a larger combat fight feed instead of counting only the small featured/home-summary subset.
- Homepage category counts now use the full loaded fight pool, so Bare-knuckle and Kickboxing counts are not hidden just because they were outside the first featured rows.
- Homepage still displays a controlled slice of fight cards while keeping full counts accurate.
- `/past-fights` and fight hub views now show an explicit `Load more fights` button when more rows are available than the first rendered batch.
- Homepage fighter thumbnails were changed from rectangular/oval presentation to true circular crops.

## Files changed
- `src/Components/HomeAnother/HomeAnother.jsx`
- `src/Components/Fights/FightsHub.jsx`
- `src/styles/new-theme.css`
- `src/styles/experience-theme.css`
- `src/pages/past-fights.js`
