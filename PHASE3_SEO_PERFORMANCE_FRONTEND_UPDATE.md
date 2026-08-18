# Phase 3 SEO + Performance Frontend Update

This phase keeps the existing FantasyMMAdness frontend structure intact and adds the SEO/performance foundation needed before building the larger landing-page and admin-growth phases.

## Added

- Global SEO head component with route-aware metadata.
- Canonical URLs for public routes.
- OpenGraph and Twitter Card metadata defaults.
- Robots handling for private/admin/dashboard routes.
- Organization, WebSite, and Breadcrumb structured data defaults.
- Dynamic server sitemap route: `/server-sitemap.xml`.
- Production `robots.txt` referencing static and server sitemap files.
- Public API helper for SEO-aware paginated endpoints.
- Public fights fetch now prefers the new `/api/public/fights` backend API and falls back to legacy `/match`.
- Blog list now prefers the new `/api/public/blogs` backend API and includes pagination metadata.
- Blog detail pages now include Article schema, better OpenGraph data, image decoding, and cache headers.
- Upcoming and past fight pages now hydrate with server-side cached public fight data.
- Static asset cache headers for `/images` and `/Fonts`.
- Next image optimization configuration for AVIF/WebP and remote assets.
- Footer internal links expanded for stronger public SEO crawl paths.
- Resource hints added for backend and media domains.
- Inaccurate legacy LocalBusiness schema replaced with SportsOrganization schema.
- Lightweight skeleton utility styles for public-page loading states.

## Preserved

- Existing public routes.
- Existing admin routes.
- Existing assets and fonts.
- Existing premium homepage design.
- Existing swarm/admin controls.
- Existing fight, blog, pro-wrestling, dashboard, and affiliate flows.

## Notes

- This is the foundation phase only. New SEO landing pages, individual fighter/fight SEO page builds, and admin SEO dashboards are planned for Phases 4 and 5.
- The frontend now consumes the backend SEO/pagination foundation added in Phase 2 where available, but keeps legacy fallbacks for safety.
