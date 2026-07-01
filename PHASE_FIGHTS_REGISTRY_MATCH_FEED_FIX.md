# Phase: Admin Fight Registry Match Feed Fix

## Issue

`/administration/fights` showed `No fights found` because the frontend first used the new admin LIVE endpoint:

```http
GET /api/admin/fights/live?limit=200&includeDrafts=true
```

Production returned an empty `items` array, so the UI did not fall back to the legacy `/match` registry feed.

Meanwhile the legacy feed:

```http
GET /match?limit=100&includeDrafts=true
```

returns the actual fight records from the `match` collection. Some real fight records in that collection have `matchType: SHADOW`, but they are still fight records, not Shadow Fights Library templates.

## Fix

`AdminFightsWorkspace` now loads the legacy `/match` registry feed directly for `/administration/fights`.

The page no longer filters registry rows by `matchType=LIVE`. It displays all records returned from `/match`, while `/administration/ShadowFightsLibrary` remains responsible for the separate shadow library/template feed.

## Files changed

```text
src/Components/Admin/AdminFightsWorkspace.jsx
```

## Result

- `/administration/fights` shows all records from `/match`.
- `/administration/ShadowFightsLibrary` continues to show the shadow-library endpoint data.
- Existing scoring, promotion, edit, delete, and data-quality actions remain connected.
