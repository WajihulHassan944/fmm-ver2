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
| Promotion notifications | Publishing an affiliate fight notifies that affiliate's league bells, respects player email opt-outs/cooldown, and records a Back Office notification. It never enables the legacy platform-wide blast. | Publish as a verified affiliate; confirm member bell/reach, Back Office notification, and `notify=false` on `/addMatch`. |
| Affiliate public links | New universal links use the affiliate's stable ID; previously shared full-name, username, and league-name links continue resolving. | Open both an ID link and a legacy name link on desktop and phone. |
| Back office | Existing admin, Swarm, Jarvis, Economics, scoring, and Full Card routes are outside phone/affiliate-only changes. | Review changed-file list before merge. |

## September 18, 2026 release scope

- Restore the phone banner selection code to its pre-PR-40 version.
- Replace unstable affiliate page dynamic imports with direct imports.
- Route the configured Gmail sender through Gmail SMTP.
- No fight records, affiliate records, league members, scoring data, or back-office features are modified.

## September 19, 2026 release scope

- Notify only the publishing affiliate's connected league when a promotion goes live.
- Keep the authenticated Gmail sender and all member email preference protections unchanged.
- Add a durable Back Office audit notification for successful affiliate announcements.
- Repair public affiliate URLs with stable ID links plus backward-compatible legacy link resolution.
- Show both promoted live fights and scored Shadow campaigns in the affiliate's public fight room.
- No users, affiliates, league members, fights, wallets, predictions, or winnings are deleted or rewritten.
