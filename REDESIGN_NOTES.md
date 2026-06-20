# Fantasy MMAdness Final Premium Experience

## Unified public fight routing

| Experience | Route |
| --- | --- |
| Unified fight hub | `/fights` |
| Upcoming fights | `/fights?status=upcoming` |
| Live fights | `/fights?status=live` |
| Past fights | `/fights?status=past` |

The former `/upcomingfights`, `/past-fights`, and `/past-fights-records` pages now redirect to the corresponding state of `/fights`. Individual fight-detail routes remain available where the existing product flow requires them.

## Unified account portal

`/auth` serves player, affiliate, and sponsor audiences through query parameters:

- Player login: `/auth?mode=login&role=player`
- Player signup: `/auth?mode=signup&role=player`
- Affiliate login: `/auth?mode=login&role=affiliate`
- Affiliate signup: `/auth?mode=signup&role=affiliate`
- Sponsor login: `/auth?mode=login&role=sponsor`
- Sponsor enquiry: `/auth?mode=signup&role=sponsor`

The portal preserves `next`, `fight`, `league`, and `referrer` query parameters. Its artwork uses a dedicated high-resolution local asset rather than a backend-delivered background.

## Dashboard routes

- Player: `/UserDashboard`
- Affiliate: `/AffiliateDashboard`
- Sponsor: `/sponsor-dashboard`

Existing contest-entry, prediction, affiliate promotion, membership, and backend API workflows remain connected inside the new presentation layer.

## Site-wide consistency layer

The following files extend the homepage visual language to legacy and secondary routes without rewriting their business logic:

- `src/Components/Theme/RouteExperienceFrame.jsx`
- `src/styles/route-experience.css`
- `src/styles/new-theme.css`
- `src/styles/experience-theme.css`

The shared system uses dark navy surfaces, red/blue fight-light gradients, condensed UFC Sans display typography, bordered glass panels, technical grids, larger button labels, and responsive content widths.

Secondary routes are grouped into route-specific visual families so backgrounds do not feel repeated:

- editorial and news
- community and chat
- profile and account
- rewards and checkout
- affiliate and leagues
- legal, support, and company pages

## Administration experience

The administration console has been reorganized around a compact grouped sidebar and command-center top bar:

- collapsible navigation groups
- optional compact icon mode
- mobile drawer navigation
- route search
- larger action labels
- overview metrics and operations table
- searchable registered-user table
- searchable/filterable affiliate-user table
- consistent table, form, modal, status, and action styling across remaining administration modules

Primary files:

- `src/Components/Header/AdminHeader.jsx`
- `src/Components/Admin/Admin.jsx`
- `src/Components/Admin/RegisteredUsers.jsx`
- `src/Components/Admin/AffiliateUsers.jsx`
- `src/Components/Login/AdminLogin.jsx`
- `src/styles/admin-experience.css`

## Local visual assets

New dedicated backgrounds are stored in:

`public/images/fmm-experience/backgrounds/`

They are 1500–1920 px source assets and are used for authentication, administration, editorial, community, profile, rewards, league, and legal experiences. Live backend fighter imagery remains supported for fight data, but page backgrounds no longer depend on low-resolution backend image URLs.

## Verification

```bash
npm ci
npm run lint
npm run build
npm start
```

The final source passes ESLint with no errors and completes a production Next.js build. Remaining warnings are in pre-existing legacy modules and are listed in `VERIFICATION.md`.
