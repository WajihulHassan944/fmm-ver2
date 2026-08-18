# Homepage Mobile Scroll + Card Size Fix

## Summary

This phase updates the homepage category fight sections after the end-user confirmed the new sectioned layout, but reported that the fight cards were difficult to drag/scroll on phone and slightly too large.

## Frontend updates

- Added pointer-drag support to homepage category fight rails.
- Horizontal dragging now updates the rail scroll position directly.
- Dragging temporarily disables scroll snap so the rail does not feel stuck.
- Clicks are protected so dragging a card does not accidentally open the fight link.
- Mobile fight cards are smaller and cleaner:
  - reduced card width
  - reduced card height
  - reduced fighter image size
  - reduced lock badge size
  - reduced card text/meta spacing
- Desktop category tab clicks now use a calculated smooth scroll offset instead of the previous basic `scrollIntoView` behavior.
- Category tab buttons also center smoothly inside their own tab rail when clicked.

## Files changed

- `src/Components/HomeAnother/HomeAnother.jsx`
- `src/styles/new-theme.css`

## Notes

This is frontend-only. Backend fight/category APIs were not changed.
