# Phase 4 SEO Landing Pages + Public Traffic Pages

This frontend update adds premium public SEO pages and crawlable traffic paths while preserving the existing Fantasy MMAdness design system and all current functionality.

## Added public sport landing pages

- `/fantasy-mma`
- `/fantasy-boxing`
- `/fantasy-kickboxing`
- `/fantasy-bare-knuckle`
- `/fantasy-pro-wrestling`

Each page uses premium dark/red/gold gradients, fighter/wrestler-style background treatments, CTAs, FAQs, related fights, and related stories.

## Added dynamic SEO pages

- `/fight/[matchId]`
- `/fighters/[fighterId]`
- `/wrestlers/[wrestlerId]`
- `/blogs/[category]`

These pages fetch from the Phase 2 public backend APIs when available and safely fall back where possible.

## Added guide pages

- `/guides/how-to-play-fantasy-mma`
- `/guides/how-to-play-fantasy-boxing`
- `/guides/pro-wrestling-scoring`

## Added SEO support

- Added metadata entries for all new static pages.
- Added fallback metadata for dynamic fight/fighter/wrestler/category routes.
- Added schema support through the existing `SeoHead` integration.
- Added new routes to `server-sitemap.xml`.
- Added footer internal links to new sport landing pages.

## Added files

- `src/Utils/phase4SeoPages.js`
- `src/Utils/phase4PageLoaders.js`
- `src/Components/SEO/PremiumSeoBlocks.jsx`
- `src/styles/phase4-seo-pages.css`
- New page files under `src/pages`.

## Safety

- Removed nothing.
- Existing routes remain intact.
- Existing fonts/assets remain intact.
- New pages are additive and premium-theme consistent.
