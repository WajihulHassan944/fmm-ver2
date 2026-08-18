# Fantasy MMAdness fmm-ver2 corrected UI update

This corrected package uses the previous UI-updated fmm-ver2 project as the base, then fixes the public routes that were still showing the old experience.

## Corrected in this package

- `/login` now uses the combined role-aware auth portal from the design source.
- `/CreateAccount`, `/AffiliateCreateAccount`, and `/affiliate-create-account` now open the same unified player / affiliate / sponsor portal instead of separate legacy layouts.
- Added `/auth` as the direct combined login-registration portal route.
- `/mock-game` was rebuilt visually using the design-source fight-night layout while preserving the original local `RoundByRoundMockScores` scoring behavior and avoiding new practice/v2 API calls.
- `/leaderboard` now uses the design-source podium/table experience, adapted to the original fmm-ver2 leaderboard hook and endpoints.
- Route experience links were corrected from source-only `/fights` routes to the fmm-ver2 routes such as `/upcomingfights`.

## Behavior preservation notes

- Existing Redux auth thunks remain the source of truth for player and affiliate login.
- Player registration still posts to `/register`, polls `/user/{email}`, and continues to the existing avatar upload / membership flow.
- Affiliate registration still posts to `/registerAffiliate` using `FormData`.
- Sponsor login still reads `/sponsors/email/{email}` and sponsor enquiry still posts to `/contact-us-fantasymmadness`.
- Forgot password remains on `/forgotPassword-user` for players and `/forgotPassword` for affiliates.
- No changes were made to `src/pages/api`, `src/Redux`, or `src/CustomFunctions` in this correction.
