# Phase 3 Swarm Frontend Integration

This update adds an admin-only frontend control layer for the Phase 1 IONOS swarm and Phase 2 backend gateway.

## Added

- `/administration/swarm` admin page
- Swarm status card inside `/administration` command center
- Navigation link under `Automation & social`
- Frontend swarm API helper at `src/Utils/swarmApi.js`
- Isolated admin-only styling at `src/styles/adminswarm.css`

## Runtime flow

Frontend admin panel → Vercel backend swarm routes → IONOS swarm runtime → backend artifact cache → frontend review/publish panel.

The browser never calls the IONOS swarm directly.

## Required frontend environment variable

```env
NEXT_PUBLIC_API_BASE_URL=https://YOUR_BACKEND_VERCEL_DOMAIN
```

If this is missing, the frontend falls back to the current production backend URL already used by the project.

## Test after deployment

1. Deploy Phase 1 swarm to IONOS.
2. Deploy Phase 2 backend to Vercel with swarm env vars enabled.
3. Deploy this frontend to Vercel.
4. Login as admin.
5. Open `/administration` and check the Swarm automation status card.
6. Open `/administration/swarm`.
7. Click Refresh.
8. Create a `content.article` job in `DRAFT_ONLY` mode.
9. After the worker completes, refresh artifacts.
10. Approve & publish the content artifact.
11. Confirm the article appears in `/administration/blogs` and public blog pages.

## Current capability

- Blog creation: yes, through generated content artifact approval.
- SEO handling: yes, as SEO audit/recommendation artifacts.
- Social automation: social draft generation is available; real auto-posting requires Phase 1/2 provider credentials and `SWARM_SOCIAL_PUBLISH_ENABLED=true` later.
- Blog update: not automatic yet. Current backend adapter publishes a new blog or attaches to an existing blog by duplicate meta title. True update/edit of existing blog should be added as a small backend adapter extension if required.
