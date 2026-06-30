# Phase 5 Legacy Homepage + Bulk Delete Frontend Update

## Updated

- Homepage fight feed now prioritizes legacy `/match` and `/shadow` endpoints again through the public API helper.
- Homepage no longer renders the placeholder featured fight card when no real fight is available.
- Homepage sport tabs now include Pro Wrestling alongside All Fights, Boxing, Kickboxing, MMA, and Bareknuckle.
- Homepage all-fights tab can include combat fights and pro-wrestling cards.
- Admin fight registry now supports selecting fights in bulk.
- Admin fight registry now supports bulk deletion through the backend bulk-delete endpoint.
- Single delete in the fight registry now uses the same source-aware bulk-delete route, so Match and Shadow records both delete correctly.

## Preserved

- Existing homepage premium UI.
- Mobile draggable fight cards.
- Draft filtering on public-facing feeds.
- Existing admin fight edit/score/promote flows.
- Existing assets, fonts, routes, and SEO work.
