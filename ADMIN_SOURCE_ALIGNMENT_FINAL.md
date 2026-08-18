# Admin source-design alignment final pass

This pass was applied after the user requested the re-attached design source to be used for the administration system only.

## Requested changes implemented

- Removed the extra administration route cards: `APIs / Preserved`, `UI / Updated`, `Routes / Intact`, and `Flow / Original`.
- Removed the `AdminRouteFrame` wrapper from the active `_app.js` administration render path so admin pages now render directly inside the source-style `admin-experience-main` shell.
- Replaced the administration sidebar/topbar with the re-attached source design navigation structure:
  - Fight registry
  - Scoring rules / score center
  - Create fight
  - Fight calendar
  - Prediction scoring
  - Shadow fights
  - Affiliate fights
  - Records & video
  - People, finance, editorial, community, automation, social publishing, and video archive groups
- Added `/administration/fights` as a unified fight registry table using the original Redux match feed and the original `/shadow` endpoint.
- Added `/administration/scoring-rules` as a source-style scoring-center entry point backed by the existing scoring workflow.
- Reworked `/administration/upcomingFights` to the unified fight table/score-center layout.
- Reworked `/administration/DeleteUpdateMatches` into a source-style table while preserving the existing delete, edit, and token-return behavior.
- Reworked `/administration/PreviousMatches` to the unified completed-fights table.
- Reworked `/administration/AddNewMatch` to the source-style create-fight layout with visual preview, grouped panels, upload cards, publishing controls, and the original `addMatch` / `addShadow` endpoints.
- Reworked the admin score submission UI (`AdminPredictions.jsx`) into a source-style scoring center with large readable labels and editable numeric inputs for every field while keeping the original score/video/finish/reward endpoints and buttons.
- Updated `UserDashboard` only as requested: it now shows completed and pending fights and hides the upcoming/active fights section.

## Behavior protection

- `src/pages/api` unchanged.
- `src/Redux` unchanged.
- `src/CustomFunctions` unchanged.
- No `apiClient`, `v2Request`, or `/api/v2` calls were added to the administration components.
- Existing production backend base URL is preserved: `https://fantasymmadness-game-server-three.vercel.app`.
- Existing admin score endpoints are preserved:
  - `/match/addRoundResults/:matchId`
  - `/shadow/addShadowRoundResults/:matchId`
  - `/finishMatch/:matchId`
  - `/finishShadow/:matchId`
  - `/updateMatchVideo`
  - `/updateShadowVideo`
  - `/api/reward-tokens/:userId`
- Existing fight creation endpoints are preserved:
  - `/addMatch`
  - `/addShadow`
- Existing fight deletion endpoint is preserved:
  - `/api/matches/:matchId?updateWallet=...`

## Validation performed

- TypeScript JSX parse validation passed for modified admin files, `_app.js`, and `Dashboard.jsx`.
- Redux, API pages, and CustomFunctions directories were compared against the original target archive and remained unchanged.
- ZIP packaging excludes `node_modules` and `.next`.
