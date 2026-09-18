# Production regression ledger

This file protects confirmed Fantasy MMAdness behavior from being overwritten by unrelated work.

## Release rules

1. Change only the files owned by the requested fix.
2. Preserve every confirmed behavior below unless the owner explicitly requests a replacement.
3. Run the listed verification before merging.
4. Use a separate pull request for backend and frontend changes.
5. Verify the Vercel status for each merged commit.

## Protected behavior

| Area | Confirmed behavior | Regression check |
| --- | --- | --- |
| Phone app | Uses the phone experience that existed immediately before frontend PR #40. | Production build; compare `FantasyMobileAppCore.jsx` with commit `ea5dae` for the rollback section. |
| Affiliate pages | Dashboard, profile, league, promotions, money, guides, settings, and history must render without an indefinite dynamic-import loading screen. | Production build; affiliate route modules use direct imports. |
| Affiliate sessions | Current scoped affiliate tokens and older unscoped tokens remain accepted until expiration. | Backend auth tests and `requireScope()` legacy-token guard. |
| Affiliate league | Saved members and management actions remain available on phone and computer. | Do not change league-member endpoints or `AffiliateLeague.jsx` without a focused test. |
| Shadow inventory | Only officially scored Shadow fights appear as reusable Shadow templates. | Backend and frontend Shadow inventory tests. |
| Live promotions | Affiliates may promote live fights without turning them into Shadow templates. | Affiliate dashboard production build and promotion route tests. |
| Auto discovery | Discovered UFC events remain Draft/Closed and private until admin promotion. | `ufc-event-discovery.test.js` and backend suite. |
| Affiliate email | Gmail accounts use Gmail SMTP even if an obsolete custom host remains configured; recipient remains editable. | Backend suite; frontend production build; production send test by an authenticated admin. |
| Back office | Existing admin, Swarm, Jarvis, Economics, scoring, and Full Card routes are outside phone/affiliate-only changes. | Review changed-file list before merge. |

## September 18, 2026 release scope

- Restore the phone banner selection code to its pre-PR-40 version.
- Replace unstable affiliate page dynamic imports with direct imports.
- Route the configured Gmail sender through Gmail SMTP.
- No fight records, affiliate records, league members, scoring data, or back-office features are modified.
