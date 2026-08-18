# Phase: Fight Detail, Duplicate Rows, Admin Search Frontend Fix

## Scope
Frontend-only update.

## Changes
- Removed repeated public fight cards by using semantic duplicate keys instead of only `_id`.
- Upcoming/public fight hubs now de-duplicate LIVE/SHADOW copies for the same matchup and category.
- Public fight status now treats legacy `Ongoing` records without a real scheduled date as playable/upcoming instead of incorrectly marking them live.
- Homepage `Start Playing` now opens the currently featured fight details page instead of the generic upcoming-fights page.
- Fighter images now prefer fighter-library images first and use legacy fight-side images only as fallback.
- Admin fight registry now defaults to a unique-fights view so LIVE/SHADOW copies are not shown twice by default.
- Admin fight registry now includes view filters: Unique fights, All records, LIVE only, SHADOW only.
- Admin fight search now searches fight IDs, match IDs, fighter ref IDs, fighter names, card name, sport, and description.
- Fight detail page typography and hero styling were softened to match the premium upcoming-fights/dashboard style.

## Verification
- `node --check src/Utils/fightExperience.js`
- `node --check src/Utils/publicApi.js`
- `tsc --allowJs --jsx react-jsx --noEmit --skipLibCheck --moduleResolution node --target es2020 --module esnext src/Components/Fights/FightsHub.jsx src/Components/Admin/AdminFightsWorkspace.jsx src/Components/HomeAnother/HomeAnother.jsx src/Components/Fights/PublicFightDetailExperience.jsx`
- CSS brace balance check passed for updated CSS files.
