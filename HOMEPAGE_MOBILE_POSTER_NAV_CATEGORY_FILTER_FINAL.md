# Homepage Mobile Poster, Navbar, and Category Filter Update

## Implemented

- Moved the supplied updated Fantasy MMAdness artwork into the phone homepage navbar.
- Removed the phone notification action and retained the hamburger menu as the right-side navigation control.
- Rebuilt the phone navbar as a normal grid/flex layout; the logo, wallet, and hamburger are no longer individually absolutely positioned.
- Replaced the large banner logo with the same promoted fight-poster carousel used by the desktop homepage data source.
- Preserved desktop-equivalent poster behavior:
  - automatic rotation,
  - previous/next controls,
  - active position indicators,
  - click-to-open premium fight details modal.
- Corrected mobile category filtering so selecting Boxing, MMA, Bare Knuckle, Kickboxing, or Pro Wrestling only renders that category's live contests.
- Added same-category fallback cards when a category has fewer than three production contests; no cross-category cards are mixed in.
- Redesigned the category `Play Now` action with category-specific premium gradients, highlights, glow, and an arrow treatment.
- Corrected the phone hero statistics typography to use the project's UFC condensed display font instead of Arial.

## Main files changed

- `src/Components/HomeAnother/HomeAnother.jsx`
- `src/Components/Header/Header.jsx`
- `src/styles/home-mobile-banner-menu-followup.css`
