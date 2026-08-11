# Client Mobile Design Integration

The approved Fantasy MMAdness mobile prototype is integrated as the phone experience for the existing Next.js frontend. Desktop routes retain their current presentation.

## Mapped routes

- Home: `/` and `/home`
- Contests: `/fights` and `/upcomingfights`
- Make Predictions: `/UserDashboard`
- Leaderboard: `/leaderboard` and `/global-leaderboard`
- Leagues: `/FantasyLeagues`
- Watch Party: `/watch-party`
- Profile: `/profile`
- Settings: `/account-settings`
- Free Demo: `/free-demo`, `/mock-game`, and `/playforfree`
- Blogs: `/blogs` and `/fights-news`

## Production connections

- Public fights, home summary, leaderboards, blogs, and apparel load through the existing public API utilities.
- Prediction submission continues through the existing authenticated fight flow.
- Coin and FM+ actions continue through the existing checkout flow.
- Join, apparel, and share actions use the existing production routes or native browser capabilities.
- Back-office scoring controls are shown only for authenticated staff/admin sessions.
- Pro-wrestling copy and inputs follow the handoff source of truth: two-way winner pick (+100), no draw, and a Pinfall/Submission finish market (+500; non-finish Survival Bonus +25).

## Verification

- `npm run build` completes successfully.
- All ten mobile screens render from the approved component.
- Bottom navigation, settings permissions, and the free-demo walkthrough were interaction-tested.
- Mobile assets are local and the exact mobile CSS is scoped so it does not leak into desktop pages.
