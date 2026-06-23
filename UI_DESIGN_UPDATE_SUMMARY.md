# Fantasy MMAdness — fmm-ver2 UI Design Port

## Scope

This project keeps the original `fmm-ver2` pages, API calls, Redux modules, API routes, authentication flows, and form payloads. Visual ideas and assets from `fantasy-mmadness-just-new-design` were selectively ported without replacing the target project's newer/different business logic.

## Verification

- Production build: passed with Next.js 16.2.9.
- Route inventory: all 103 original page files are present; no target page was removed or renamed.
- Backend endpoint inventory: 211 endpoint references across 108 unique literal endpoints, exactly matching the original target source.
- `src/pages/api`: byte-identical to the original target.
- `src/Redux`: byte-identical to the original target.
- `src/CustomFunctions`: byte-identical to the original target.
- Representative production route checks returned HTTP 200 for public, authentication, and administration routes.

## Consistently Updated Administration Pages

The new administration shell, navigation, top bar, responsive drawer, typography, surfaces, controls, tables, forms, popups, and responsive behavior apply across every `/administration/*` page, including:

- Administration login and command-center dashboard
- Upcoming fights / score submission
- Add new match
- Previous matches
- Delete / update matches
- Match calendar
- Predictions / scoring
- Shadow fights library
- Affiliate matches
- Admin records
- Registered users
- Affiliate users and affiliate creator details
- Non-registered users
- Suspended accounts
- Affiliate payouts
- Sponsors
- Blogs, add blog, and blog details
- News
- FAQs
- Email templates
- Community forum and thread details
- Chatroom
- Notifications
- Blog AI bot
- Social AI bot
- AI post creation
- Tweet publisher
- TikTok publisher
- YouTube archive

The dashboard, registered-user management, affiliate-user management, creator details, distinction upload, account creation, token reward, suspension, deletion, affiliate approval, and confirmation-email screens received dedicated component-level UI updates while retaining their original requests and payloads.

## Consistently Updated Public and Account Pages

A shared fight-night experience frame, responsive hero treatment, page backgrounds, typography, controls, panels, tables, and local brand assets were added to:

- About
- Contact
- FAQs
- Privacy Policy
- Terms of Service
- Testimonials
- Guides
- Forum Rules
- Blogs and Blog Details
- Fight News
- Fantasy Tips
- Past Fight Records
- Calendar of Fights
- Community Forum
- Create Thread
- Fantasy Chatroom
- Login
- Player Create Account
- Profile and public player profile
- Your Fights
- Trashed Fights
- My Fantasy Team
- Fighter Performance Tracker
- Referral Leaderboard
- Invite
- Play for Free
- Spin Wheel
- Checkout
- Affiliate Profile
- Affiliate Promotion
- Affiliate Create Account (both existing route variants)
- Affiliate Guides
- Affiliate League
- Past Promotions
- How It Works
- Shadow Fight detail
- Player and affiliate password-reset routes

The existing self-contained home, fight, leaderboard, fighter, rewards, dashboard, league, sponsor, mock-game, thread-detail, and public affiliate pages remain structurally intact and receive the shared brand/theme layer without replacing their page logic.

## Main Design-Port Files

- `src/Components/Theme/RouteExperienceFrame.jsx`
- `src/Components/Header/AdminHeader.jsx`
- `src/Components/Login/AdminLogin.jsx`
- `src/Components/Admin/Admin.jsx`
- `src/Components/Admin/RegisteredUsers.jsx`
- `src/Components/Admin/AffiliateUsers.jsx`
- `src/Components/Admin/UserDetails.jsx`
- `src/styles/experience-theme.css`
- `src/styles/route-experience.css`
- `src/styles/admin-experience.css`
- `src/styles/frontend-final.css`
- `src/styles/design-port.css`
- `public/images/fmm-experience/*`
- `public/images/fmm-pages/*`
