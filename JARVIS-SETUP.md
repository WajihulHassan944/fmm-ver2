# Hooking up Jarvis (back-office AI assistant)

Jarvis is already fully built — it just needs one credential set on the
**frontend's** hosting environment (Vercel), then a redeploy.

## 1. Get an OpenAI API key
- Go to platform.openai.com → API keys → Create new key.
- Copy it immediately (shown once). This is billed separately from any
  ChatGPT consumer subscription — pay-as-you-go on that OpenAI account.

## 2. Add it to Vercel
In the **frontend** Vercel project (not the backend one):
- Settings → Environment Variables
- Add `OPENAI_API_KEY` = the key from step 1 (Production + Preview)
- Optional: `OPENAI_JARVIS_MODEL` to override the default model (`gpt-5`)
- Redeploy the frontend for the env var to take effect.

No other config needed — `src/pages/api/jarvis.js` reads it automatically.

## 3. What's already wired up (no dev work required)
- `src/pages/administration/jarvis.jsx` — the chat UI, behind
  `AdminPrivateRoute` (same admin auth as the rest of the back office).
- `src/pages/api/jarvis.js` — the Next.js API route:
  - Verifies the admin's bearer token against the real backend
    (`/api/admin/swarm/health`) before ever calling OpenAI — the OpenAI key
    is never reachable by an unauthenticated request.
  - Passes OpenAI a snapshot of `/api/admin/swarm/health` +
    `/api/admin/swarm/dashboard` as grounding context.
  - Exposes 4 tool-calling actions to the model: `score_fight`,
    `publish_fight`, `delete_fights`, `approve_payout`. Each maps to a real
    existing admin endpoint (scoring, homepage-promotion, bulk-delete,
    confirm-payment-affiliate) — nothing new on the backend.
  - When the model calls one of those tools, the API returns a
    `proposedAction` (never executes it). The chat UI renders an
    Approve/Reject card. Only when the admin clicks **Approve & run** does
    the browser call back with `{ execute: true, action }`, and the route
    forwards that to the real backend endpoint using the admin's own
    bearer token — so it can never do more than that admin could do by hand.
- Back-office login now speaks a one-time "Jarvis online" greeting per
  browser session (`PrivateRouteAdmin.js`, Web Speech API — no key needed).

## 4. Sanity check after deploy
- Log into the back office → should hear the greeting once.
- Open Administration → Jarvis → ask a question → should get a real reply
  instead of "Jarvis is not configured on this environment."
- Ask it to do something like "delete fight X" or "publish fight Y" →
  should show an approval card, not execute immediately.

## 5. If it still says "not configured"
- Confirm the env var name is exactly `OPENAI_API_KEY` (case-sensitive) on
  the **frontend** project, and that you redeployed after adding it —
  Vercel does not hot-reload env vars into a running deployment.
