# Original Growth Engine back-office integration

Scope: frontend PR #193, `integration/growth-engine-admin-isolated-20261102`.
The administration route retains `GrowthEngineCommandCenter.jsx` and embeds the existing backend console. It does not substitute another dashboard or ship fixture data. The old generic `/growth-engine-public-preview` route redirects to the protected administration route.

## Frontend behavior

- The cross-origin health request is advisory. Its CORS/network failure no longer suppresses iframe navigation. Connection delays have a retry and a secure new-tab option.
- Existing administration navigation exposes Growth Engine only when its existing feature flag is enabled. All ten original console departments remain; Poster generation opens the original Marketing poster workflow.
- Incoming messages require both the configured engine origin and the current iframe window. Unknown sections are ignored. The iframe cannot navigate the top window; referrers are suppressed.
- Only a separately scoped Growth token is handed to the original console. Normal administrator credentials never go to the external engine or iframe.
- Expiration and administration logout clear the parent cache and remove the iframe. Backend token revocation and clearing the child's origin-specific session storage still require Claude's backend/console integration.

## Secure session contract for Claude — frontend consumer, NOT an implemented backend

`NEXT_PUBLIC_FMM_GROWTH_SESSION_PATH` must name a relative, same-origin `/api/...` endpoint implemented by the trusted first-party administration service. No endpoint is supplied by this PR. It defaults unconfigured and fails closed. The endpoint must validate the existing administrator session server-side, enforce role, rate limits, auditing and CSRF/session protections, and mint/exchange a separately scoped short-lived Growth token through the approved backend design. Do not relay the ordinary administrator bearer token to a different origin.

The frontend sends POST `{}` with its ordinary same-origin administrator Authorization header, credentials `same-origin`, no-store and redirects forbidden. Expected JSON:

```json
{"ok":true,"token":"<separate Growth-scoped token>","expiresAt":1793700060000,"engineOrigin":"https://fantasymmadness-growth-isolated-tes.vercel.app"}
```

`expiresAt` is epoch milliseconds, future and no more than 12 hours away (prefer minutes). `engineOrigin` must exactly match the configured engine origin. Echoing the administrator token, absent/expired tokens, unexpected origins and non-2xx responses fail closed. Return 401/403 for rejected administrator sessions; 503 for unavailable integration. Secrets belong on the trusted servers, never NEXT_PUBLIC variables. This response shape is a proposed frontend contract pending Claude's confirmation in issue #108. Claude subsequently supplied direct cross-origin `/api/growth/admin/sso` in backend commits `1d2e73b` through `6a4f11f` and frontend PR #194 (`2c18b5e`). That transport forwards the ordinary administrator token to the separate engine and was not incorporated: automatic approval review rejected that credential egress in this task. The safer first-party/signed-exchange contract remains outstanding. Coordination: https://github.com/WajihulHassan944/fantasymmadness-game-server-three/issues/108#issuecomment-6607252828 .

Original console protocol at backend commit `72f86e679a2961134934db6060ca41be49b98553`:

- Child sends `{type:'fmm-growth-console', section, signedIn}`.
- Parent sends `{type:'fmm-growth-session', token}` to the exact engine origin.
- Child verifies parent origin using its own health response and validates the Growth token using `/api/growth/admin/session`.
- Current child has no parent logout/revocation handler. Claude must define/implement that and the approved first-party exchange before normal-admin SSO is accepted.

## Isolated staging configuration / outstanding external verification

Preserve the existing isolated engine. Preview-only frontend variables:

- `NEXT_PUBLIC_FMM_GROWTH_ENGINE_ENABLED=true`
- `NEXT_PUBLIC_GROWTH_ENGINE_URL=https://fantasymmadness-growth-isolated-tes.vercel.app`
- `NEXT_PUBLIC_FMM_GROWTH_SESSION_PATH=<approved same-origin endpoint>` only after Claude implements it.

The backend's existing `GROWTH_CONSOLE_EMBED_ORIGINS` must include the exact isolated frontend preview origin. Verify actual console response CSP `frame-ancestors` and absence of a conflicting X-Frame-Options deny. Keep normal Vercel authentication/protection enabled; use an authorized staging test identity. No wildcard or production credential workaround. Claude reports the isolated backend still runs `72f86e6` without SSO: Vercel denied permission to create a deployment. This is reported evidence from Claude, not an independently verified deployment result; no deployment was attempted here.

On 2026-11-03 a read-only attempt to the isolated `/api/growth/health` failed before reaching the service: curl exit 56, `CONNECT tunnel failed, response 403`, HTTP code `000`. The cloud proxy's custom allowlist currently lacks the isolated engine and frontend preview hosts. Exact network-only additions required for staging browser verification:

- `fantasymmadness-growth-isolated-tes.vercel.app`
- `fmm-ver2-git-integration-g-5220ed-kelly-davis-projects-6c108d0b.vercel.app` (verify latest PR preview alias before applying)

Do not disable Vercel protection to work around this. After narrow network access, approved staging identity, Claude's exchange/logout contract and backend frame-ancestor configuration are available, run actual authenticated staging checks for every department, approval authorization, session rejection/expiry/revocation and original generated artwork. Local contract tests are not evidence of actual staging data or real service receipts.

## Local verification

`npm run test:growth-integration` checks origin/window validation, secure endpoint configuration, token isolation, expiry and feature defaults. `npm run test:growth-browser` uses real Chromium, the ORIGINAL console assets fetched from the pinned backend commit, and explicitly labeled local API fixtures. Mocked session exchange is local only. These fixtures are not mounted by Next, not deployed and not fallbacks for staging failures. No database, payment or publishing provider is contacted.

The browser suite exercises normal/failed login, all departments, dynamic API data, full-size original poster links, mobile, failed health CORS, spoofed messages, approval confirmation, expiry/logout and feature-off rollback. Media fixtures verify dimensions and routing, not premium visual quality or artwork rights.

Quality commands: `npm run lint`, `npm run build`, `node scripts/fight-registry-regression.test.cjs`, `npm audit --omit=dev --audit-level=high`. CI preserves browser screenshots/traces in the `growth-admin-integration-evidence` artifact.

## Rollback and preserved work

Disable `NEXT_PUBLIC_FMM_GROWTH_ENGINE_ENABLED` and rebuild the isolated preview; no backend/database changes are required. The default stays OFF. Prior clean-link work was preserved without resetting the recovered workspace: frontend local preservation commit `3aa1877`, backend local preservation commit `d4fbe40`, each on `preservation/clean-fight-links-20261103`. Neither preservation branch was pushed as part of this integration.

No production merge/deployment, payment change, live affiliate modification, real email or social publishing is included.

## Mobile overflow repair handoff

Screenshot review found that the original console's intrinsic grid width overflowed a 334px iframe viewport. The basic mobile navigation test alone did not establish responsive layout acceptance. A two-line CSS repair was implemented and separately browser-tested at 390×844 across Overview, Marketing, Approvals, Connections, Analytics and Revenue: use `minmax(0,1fr)` for the embedded layout and set embedded main `min-width:0;overflow-wrap:anywhere`. Document scroll width must not exceed viewport width. Original department markup, assets and branding are retained.

Apply [the CSS-only patch](patches/growth-console-mobile.patch) to Claude's isolated backend branch before staging acceptance. It is also preserved locally as backend commit `c7e4589` on `integration/growth-console-mobile-layout-20261103` in a separate worktree. This backend branch was NOT pushed: backend deployment triggers could not be verified. It changes no authentication code. The separately named CSS-repair browser case intercepts only the local stylesheet to test this exact candidate; it does not prove that deployed staging contains it. The baseline original-console mobile screenshot retains the known overflow. The candidate screenshot shows the corrected layout. Backend incorporation and deployment remain outstanding.

## Verification record — 2026-11-03

| Check | Result | Limits |
| --- | --- | --- |
| Original-console Chromium suite | 13 passed | Local API/session fixtures; includes separately labeled mobile CSS candidate |
| Credential/origin/expiry security tests | 8 passed | No real owner credential used |
| Fight registry regression | 3 passed | Existing clean-link/time behavior preserved |
| Full frontend lint | Pass: 0 errors, 63 existing warnings | Existing font/image/hook warnings retained |
| Production build, feature OFF | Pass | No deployment |
| Production build, feature ON | Pass | Isolated build output; no deployment |
| Production dependency audit, high threshold | Pass; 1 LOW `deepmerge` advisory | No claim of zero vulnerabilities; no forced dependency updates |
| Original console asset identity | All three SHA-256 comparisons match backend `72f86e6` | Candidate mobile CSS is separately identified |
| Real authenticated staging / owner login / generated artwork | BLOCKED | Proxy CONNECT 403; first-party signed-exchange/logout contract; undeployed SSO backend and CSS patch |

The final browser harness aborts every browser request outside the three local test-server origins. Screenshots: `desktop-original-console.png`, `poster-workflow-original-console.png`, `mobile-original-console.png` (baseline overflow), and `mobile-original-console-css-repair-candidate.png`. CI retains these in `growth-admin-integration-evidence`. Chromium console still reports existing legacy stylesheet/font/fetchPriority development warnings; those are not presented as zero-warning browser output. No new hydration error remains on the Growth route.
