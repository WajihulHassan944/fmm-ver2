# FANTASY MMADNESS — controlled Growth Engine back-office release

This release branch is based on the current **production frontend main**, not on draft PR #193 or #195's stale merge base. It carries only the original Growth Engine admin route, command-center iframe, first-party administrator session bridge, feature-gated admin navigation, and narrow supporting tests.

## Safety and activation gate

- Production flag `NEXT_PUBLIC_FMM_GROWTH_ENGINE_ENABLED` defaults **OFF**. No live admin menu entry appears until explicitly enabled after all checks.
- Do not copy preview keys into production. Generate a **new Ed25519 signing keypair** through a trusted secrets manager. Private key `GROWTH_SSO_SITE_PRIVATE_KEY` is **server-only** on the website; public key `GROWTH_SSO_SITE_PUBLIC_KEY` belongs only on the isolated Growth service.
- Configure `NEXT_PUBLIC_FMM_GROWTH_SESSION_PATH=/api/admin/growth-session`, `FMM_ADMIN_VERIFY_URL` to the correct read-only existing admin identity backend, `GROWTH_ENGINE_SERVER_URL` to the isolated Growth backend, and `NEXT_PUBLIC_GROWTH_ENGINE_URL` to the same HTTPS origin. Confirm strict `GROWTH_SSO_SITE_ORIGINS`, `CORS_ORIGINS`, and `GROWTH_CONSOLE_EMBED_ORIGINS` include the exact approved website origin, with no wildcard.
- Growth service remains **separate** from the live game backend and payments. Keep `GROWTH_STAGING_MODE=isolated`, `GROWTH_OUTBOUND_ENABLED=false`, `GROWTH_DELIVERY_PROVIDER=sandbox-capture`, and `GROWTH_SOCIAL_PROVIDER=sandbox`. Never send live mail/social or write payments while deploying the back-office interface.
- Confirm the **original** Growth console is loaded (not generic placeholder) with all 11 sections, and that the connected Growth database is the approved dedicated test database.
- Before any production flag enablement, test owner login, expiry, logout/revoke, negative auth, CSRF, iframe origin verification, exact URL/QR, poster and CTA link, no live sends, mobile, and rollback. Validate deployment and build SHA.
- Any rollback: set production feature flag OFF and redeploy website; restore previous Vercel production deployment if an unexpected regression appears. Preserve existing admin, payment, and affiliate navigation.
- The draft backend PR #109 is a broad staging branch; **do not merge it wholesale into the live game backend**. The original isolated service is the separate backend runtime.

## Deployment sequence

1. Verify the isolated engine deployment/keys/headers and obtain passing release-branch CI and preview for this branch.
2. Perform authenticated staging browser acceptance with the original website-admin login and full Growth dashboard.
3. Get explicit go-live approval for the exact version. Merge only this minimal frontend PR after reviewing changed files.
4. Configure production-only secrets (new signing keypair) and domain trust, initially leave Growth feature flag off.
5. Release the website admin-only feature flag; verify normal back-office login, dashboard and sandbox operation. Do not enable real outreach.
6. Observe health and rollback controls. Handle CHINGAZOS cutoff, contest statuses, and real-channel authorization as separate owner decisions.

## Known conditions
- The most recent staging screenshot showed the affiliate recruitment **See the affiliate program** button worked after staging repair.
- Staging Marketing improved to two verified fights and one approval draft after correcting LIVE-fight legacy shadow flags; CHINGAZOS scheduled cards lack verified first fight times and must not be auto-unlocked/closed by guessing an event-day cutoff.
- This file is a release checklist, **not evidence that the production deployment is complete**.
