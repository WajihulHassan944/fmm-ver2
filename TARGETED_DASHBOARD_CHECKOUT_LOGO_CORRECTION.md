# Targeted dashboard, checkout, logo, and fighter correction

## Updated

- `/UserDashboard`
  - The dashboard-only workspace navigation now remains in normal page flow.
  - The pending/submitted/wallet/rank cards no longer use the negative overlap position beneath the navigation.
  - Other workspace pages keep their existing navigation behavior.

- `/checkout`
  - Reorganized into a premium fight-wallet checkout with a fighter-arena hero, player identity card, package summary, billing section, card section, terms acknowledgement, accepted-card artwork, and purchase action.
  - All existing fields and the Authorize.Net request remain present.
  - Endpoint and request payload keys remain unchanged.

- Header and footer logo
  - Replaced the prior low-resolution 65x55 image with the supplied 352x353 transparent logo.
  - The logo now routes authenticated players to `/UserDashboard`, affiliates to `/AffiliateDashboard`, and sponsors to `/sponsor-dashboard`.
  - Public visitors continue to `/home`; the admin brand already routes to `/administration`.

- `/our-fighters`
  - Replaced the blurry featured banner portrait with a local 900x1040 high-resolution image.
  - Removed the portrait filter that reduced sharpness.

## Preserved

- `src/pages/api`
- `src/Redux`
- `src/CustomFunctions`
- `package.json`
- `package-lock.json`
- Checkout endpoint, method, and payload
- User dashboard cards, links, counts, and actions
