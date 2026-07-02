# Homepage Category Sections Frontend Fix

## Scope
Frontend-only update for the homepage fight display.

## Changes
- Removed the homepage all-fights rail behavior from the active contests area.
- Replaced it with dedicated category sections:
  - Boxing
  - MMA
  - Bare-knuckle
  - Kickboxing
  - Pro Wrestling
- Top category chips now jump/scroll to the matching section instead of filtering one large all-fights rail.
- Each section shows newest uploaded fights first based on the existing normalized fight ordering.
- Each section shows a clean preview and has an `Open all <category>` button when more fights are available.
- Mobile layout now presents category sections in a cleaner vertical flow, with horizontally scrollable cards inside each section.
- Desktop layout now shows structured category blocks instead of one crowded row.

## Backend impact
No backend change required. Existing backend APIs already return the required category-normalized fight data.
