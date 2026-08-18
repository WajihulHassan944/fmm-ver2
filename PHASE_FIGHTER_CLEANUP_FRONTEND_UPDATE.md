# Phase: Fighter Link Cleanup Frontend Update

## Summary
This frontend phase aligns the admin and public UI with the backend fighter-library cleanup model.

## Changes

- Public `/our-fighters` now fetches directly from the fighter-library APIs instead of deriving fighters from `/match` and `/shadow` records.
- `fetchPublicFighters` now tries the fighter-library endpoints only:
  - `/api/public/combat-fighters`
  - `/api/public/fighters`
  - `/api/combat-fighters`
- Admin fighter selectors now support paginated infinite-scroll loading.
- The fighter selector requests active fighters using `page`, `limit`, `search`, and `category`.
- Added admin cleanup controls on `/administration/fighters`:
  - Dry-run cleanup
  - Normalize fight links
- Cleanup execution runs repeatedly in safe backend batches until `batch.hasMore=false`.
- Cleanup UI reports total targets, modified match/shadow counts, removed legacy fields, resolved-by-name counts, and unresolved sides.

## Safety

- Cleanup action still requires admin confirmation.
- Legacy fight-side fighter fields are removed only by the backend when a valid fighter-library reference exists.
- Frontend fight creation/editing continues using `fighterAId` and `fighterBId`.
- Promotion/background media remains fight-specific and unaffected.
