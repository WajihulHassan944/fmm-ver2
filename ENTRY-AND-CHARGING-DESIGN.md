# Entry, Charging & Authentication — recommended design

**Decision:** one authenticated endpoint that debits the wallet and saves the prediction in a **single database transaction**. Replaces the current `/api/scores` + `/api/matches/<id>/updatePredictionStatus` pair.

---

## Why the current design is unsafe

```js
// No Authorization header. User identified by an ID in the body.
POST /api/scores
  { playerId: user._id, matchId, predictions: rounds, category }

POST /api/matches/<matchId>/updatePredictionStatus
  { userId: user._id, predictionStatus: 'submitted' }
```

Three concrete problems, all live today:

1. **Impersonation.** No token. Change `playerId` to someone else's and you submit predictions as them.
2. **No charge.** Neither call debits the wallet. The app checks the balance client-side, which enforces nothing. Users can enter paid contests without paying.
3. **Split state.** Two calls, and the second only logs a warning on failure — so a user can have a saved score with status still `not_submitted`. They paid attention, we lost the entry.

---

## The endpoint to build

```
POST /api/fights/:fightId/entries

Headers
  Authorization:   Bearer <token>       // REQUIRED — user comes from the token, never the body
  Idempotency-Key: <uuid>               // REQUIRED — prevents double-charge on double-tap
  Content-Type:    application/json

Body
  {
    "predictions": [ /* per-round objects, one per round */ ],
    "category":    "Boxing" | "MMA" | "Kickboxing" | "Bare Knuckle" | "Pro Wrestling"
  }
```

Note what is **absent** from the body: no `userId`, no `playerId`, no `entryFee`, no `price`. All three are derived server-side. If the client can name the price, the price is zero.

### Server sequence — all inside one transaction

```
BEGIN TRANSACTION
  1. Resolve user from the Bearer token.            → 401 if invalid
  2. Load the fight.                                → 404 if missing
  3. Assert the fight is open for entry
     (status open AND now < lockAt).                → 409 FIGHT_LOCKED
  4. Assert no existing entry for (user, fight).    → 409 ALREADY_ENTERED
  5. Read entryFee FROM THE FIGHT RECORD.
     Never from the request.
  6. If entryFee > 0:
       Assert wallet.balance >= entryFee.           → 402 INSUFFICIENT_FUNDS
       Debit wallet by entryFee.
       Write a Transaction row (type: 'entry_fee').
  7. Validate + save the prediction.
  8. Set predictionStatus = 'submitted'.
  9. Increment the fight's pot / player count.
COMMIT
```

If any step fails, the whole thing rolls back. No half-entries, no phantom charges.

### Response

```json
{
  "entryId": "...",
  "walletBalance": 11950,       // authoritative — app replaces its local value with this
  "entryFeeCharged": 500,
  "potTotal": 24500,
  "playerCount": 49
}
```

Returning the new balance matters: the app should **never** compute the balance by subtracting locally. It displays what the server reports. That's what keeps the coin counter honest across devices.

### Error codes the app needs distinctly

| Status | Code | App behaviour |
| --- | --- | --- |
| 401 | `UNAUTHENTICATED` | Open in-app signup, preserve the picks |
| 402 | `INSUFFICIENT_FUNDS` | Open Add Coins, preserve the picks, return here after purchase |
| 409 | `ALREADY_ENTERED` | Show their existing entry — do not re-charge |
| 409 | `FIGHT_LOCKED` | Explain entry closed, offer another open fight |
| 422 | `INVALID_PREDICTION` | Point at the offending field |

A single generic 400 forces the app to guess, and the guess will be wrong at the worst moment.

---

## Idempotency

The app generates a UUID per submit attempt and reuses it on retry.

- First request with a given key: process, store the key with the resulting response.
- Repeat of the same key: return the **stored response**, do not charge again.
- Suggested retention: 24h.

Mobile users double-tap. Networks time out after the server has already committed. Without this you will double-charge real customers, and refunding by hand does not scale.

---

## Free contests

Same endpoint, same code path. A free fight simply has `entryFee: 0`, so step 6 is skipped. Do not build a parallel free-entry route — divergent paths are how one of them ends up unprotected.

---

## Guest flow — deliberately permissive, then strict

Let guests **open the scorecard and make picks**. Require auth only at submit.

```
Guest taps a fight
  → in-app scorecard opens (no auth)
  → guest fills in picks
  → taps SUBMIT
  → app holds the draft, opens in-app signup
  → on success, submits the held draft with the new token
  → confirmation, coin update, receipt — all in-app
```

The picks must survive the signup. Landing a new user back on a filled-in card converts; landing them on an empty one loses them. Gate at submit, not at the door.

---

## Also needed: in-app authentication

The website sends guests to `/auth?mode=signup&role=player&next=...`. For the app to own this flow it needs API-based auth returning the same token the checkout endpoints accept:

```
POST /api/auth/signup   { email, password, playerName }  → { token, user }
POST /api/auth/login    { email, password }              → { token, user }
```

Google OAuth is already in the project (`@react-oauth/google`) and can post its credential to a matching endpoint.

---

## Migration

The two legacy endpoints can stay while the website still uses them, but **add token auth to both now** — the impersonation hole is live regardless of the app work. New app traffic goes to `/api/fights/:fightId/entries`; retire the old pair once the website's prediction room is switched over.

---

## Summary of the decisions

1. **Auth on every entry.** User identity from the token, never the request body.
2. **Charge server-side, atomically with the save.** Debit and prediction succeed or fail together.
3. **Fee comes from the fight record.** The client never names a price.
4. **Idempotency key required.** Double-tap must not double-charge.
5. **Balance is server-authoritative.** The app mirrors it; it does not calculate it.
6. **Guests can look, not submit.** And their picks survive signup.
