# Fight Detail, Entry CTA, Duplicate Cards, and Image Quality Frontend Fix

## Scope
Frontend-only update.

## Changes
- Homepage fight cards now open `/fight/:matchId` instead of redirecting users to `/upcomingfights`.
- `/upcomingfights` fight cards now also open the same fight detail route for a consistent flow.
- Added a full public fight detail experience at `/fight/:matchId`.
- Fight detail page shows fight metadata, fighters, schedule, category, prize/player info, and fight leaderboard.
- Fight detail page hides raw/admin official score fields while still allowing the existing leaderboard component to calculate ranking.
- Logged-out users are sent to auth with a return path back to the same fight.
- Logged-in users can enter the existing prediction flow from the fight detail page.
- Users who have already submitted predictions are prevented from entering the prediction flow again.
- Homepage sections now de-duplicate repeated fight cards for public display while keeping all backend fight records intact.
- Improved upcoming fight image rendering by requesting larger image dimensions and higher-quality Cloudinary transforms.
- Local fallback fighter images now use the higher-quality PNG assets instead of the tiny compressed WebP fallbacks.

## Files Updated
- `src/Components/HomeAnother/HomeAnother.jsx`
- `src/Components/Fights/FightsHub.jsx`
- `src/Components/Fights/PublicFightDetailExperience.jsx`
- `src/Components/Dashboard/FightCosting.jsx`
- `src/Components/MakePredictions/MakePredictions.jsx`
- `src/Components/GlobalLeaderboard/FightLeaderboard.jsx`
- `src/Components/Theme/FightVisuals.jsx`
- `src/Components/Common/OptimizedImage.jsx`
- `src/Utils/fightExperience.js`
- `src/Utils/publicApi.js`
- `src/pages/fight/[matchId].jsx`
- `src/pages/_app.js`
- `src/styles/public-fight-detail.css`

## Backend
No backend change was required for this phase.
