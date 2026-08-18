# Phase: Signup-First + Fight-First Homepage Update

## Scope
Frontend-only update.

## What changed
- Reworked the homepage toward a combined signup-first and fight-first flow.
- Primary hero CTA is now `Sign Up Free`.
- Secondary hero CTA opens the featured fight detail page.
- Added a quick signup strip near the top of the homepage.
- Added a sticky mobile signup CTA so traffic can convert faster.
- Kept category navigation for Boxing, MMA, Bare-knuckle, Kickboxing, and Pro Wrestling.
- Category tabs now jump smoothly to their clean sections.
- Homepage no longer presents the old app-style/today-fight rail copy above the category sections.
- Homepage fight cards now require real fighter images before being shown on the front page.
- Homepage fight card names/images prefer fighter-library data first, then fall back to legacy fight fields.
- Category `View all` links route to `/upcomingfights?category=<category>`.
- Fight hub pages now accept category query filtering.
- Added a signup CTA near the top of the fight hub page.
- Fight detail unauthenticated CTA now encourages free signup before entering predictions.

## Safety
- No backend routes changed.
- No API contracts changed.
- No admin functionality changed.
- Existing fight detail and prediction entry route is preserved.
