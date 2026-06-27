# Phase 3 Swarm Automation Frontend Expansion

This package preserves the existing frontend structure and expands the admin-only swarm panel at:

```text
/administration/swarm
```

## Added admin controls

- Swarm overview with health, enabled automation count, jobs, artifacts, and review count.
- Manual swarm job creation for combat and pro-wrestling.
- Full automation catalog UI for 50+ automation types.
- Per-automation controls:
  - enable / disable
  - default mode
  - approval requirement
  - manual run
- Global controls:
  - pause / resume all automations
  - default mode
  - daily scheduler toggle
  - weekly scheduler toggle
  - social publishing toggle
- Manual event trigger UI for backend hooks such as:
  - fight_published
  - fight_result_updated
  - upcoming_event
  - blog_approved
  - pro_wrestling_match_published
  - contest_completed
- Automation event logs.
- Artifact review, approve, reject, regenerate, and approve/publish blog actions.
- Job retry/cancel controls.

## Frontend safety boundary

The browser still calls only the Vercel backend:

```text
Frontend -> Vercel Backend -> IONOS Swarm
```

No IONOS secrets, API keys, HMAC secrets, OpenAI keys, or Twitter/X credentials are exposed to the browser.

## Required frontend env

```env
NEXT_PUBLIC_API_BASE_URL=https://YOUR_BACKEND_VERCEL_DOMAIN
```

## Test path

1. Login as admin.
2. Open `/administration/swarm`.
3. Confirm status shows IONOS swarm online.
4. Open **Create job** tab and submit a `content.article` job in `DRAFT_ONLY` mode.
5. Open **Review artifacts**, refresh after worker completes, then approve/publish if it is a blog artifact.
6. Open **Automation controls**, disable/enable one non-critical automation, then restore it.
7. Open **Event triggers**, run `blog_approved` or `fight_published` in `DRAFT_ONLY` mode.
8. Open **Jobs & logs** and confirm created jobs appear.

## Notes

Social publishing remains controlled by backend/swarm environment and settings. The frontend can toggle settings, but real publishing stays disabled unless backend and swarm safety flags allow it.
