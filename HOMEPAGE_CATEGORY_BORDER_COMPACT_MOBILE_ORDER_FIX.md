# Homepage Category Border, Compact Height, and Mobile Order Fix

Updated the first homepage category navigation section to:

- Remove the old partial/half-width category accent frame from every desktop and mobile category card.
- Keep one continuous rounded outer border around the complete card.
- Use the category accent color only for the full active-card border and subtle glow.
- Reduce desktop card height while retaining readable labels and fight counts.
- Render phone card content in the required sequence: category image, category name, then fight count.
- Reduce phone card dimensions and image scale without hiding category names.

Changed file:

- `src/styles/homepage-final-premium-polish.css`
