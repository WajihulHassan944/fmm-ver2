# Questions for the developer — bringing predictions in-app

**Context:** the mobile app currently hands users off to the website for predictions (app → `/fight/<matchId>` → `/auth` → back → prediction room). We want the app to own this flow end-to-end. I've located the real endpoints; I need three things confirmed before wiring it, because a wrong guess here mis-scores paid entries silently.

---

## 1. SECURITY — please fix regardless of the app work

These two endpoints, called from `MakePredictions.jsx`, send **no authentication**:

```js
POST /api/scores
  headers: { 'Content-Type': 'application/json' }        // no Authorization
  body:    { playerId: user._id, matchId, predictions: rounds, category }

POST /api/matches/<matchId>/updatePredictionStatus
  headers: { 'Content-Type': 'application/json' }        // no Authorization
  body:    { userId: user._id, predictionStatus: 'submitted' }
```

The user is identified only by an ID **in the request body**. As written, anyone can submit or overwrite predictions as any user by changing that ID. This is live now and matters more than the funnel work.

By contrast `WrestlingPredictionPage.jsx` does it correctly:
```js
wrestlingRequest(`/api/wrestling/matches/${matchId}/prediction`, { auth: true, method: 'POST' | 'PUT' })
```

**Q1.1** — Can `/api/scores` and `/api/matches/<id>/updatePredictionStatus` be changed to require a Bearer token and derive the user from the token instead of the body?

**Q1.2** — Once they do, should the app send `Authorization: Bearer <localStorage.authToken>`, matching the checkout endpoints?

---

## 2. THE PAYLOAD SHAPE — what I need to map correctly

`predictions` is an array of one object per round. `buildRound()` in `MakePredictions.jsx` creates 22 prediction fields per round, and the backend appears to score off the **numeric point values**, not off pick labels:

```js
{
  round: 1,
  hpPrediction1: '', hpPrediction2: '',   // head punches   A / B
  bpPrediction1: '', bpPrediction2: '',   // body punches   A / B
  tpPrediction1: '', tpPrediction2: '',   // total punches  A / B
  kiPrediction1: '', kiPrediction2: '',   // kicks          A / B
  knPrediction1: '', knPrediction2: '',   // knees          A / B
  elPrediction1: '', elPrediction2: '',   // elbows         A / B
  pmPrediction1: '', pmPrediction2: '',   // power moves    A / B
  fmPrediction1: '', fmPrediction2: '',   // finishers      A / B
  rwPrediction1: 0,  rwPrediction2: 0,    // round winner   A / B
  koPrediction1: 0,  koPrediction2: 0,    // finish         A / B
  rwBorder, rlBorder, koBorder, spBorder, // UI-only?
  rwText, rlText, koText, spText          // UI-only?
}
```

From `src/Utils/scoringRules.js`: `KO: 500, SP: 25, RW: 100, RL: 25`, and picking A to win a round writes `rwPrediction1 = 100 (RW)` / `rwPrediction2 = 25 (RL)`.

**Q2.1** — Confirm: does the backend read the **numeric values** in `rwPrediction1/2` and `koPrediction1/2` to determine the pick, or does it read `rwText`/`koText`? (This decides whether the text fields are required or cosmetic.)

**Q2.2** — Are `rwBorder` / `rlBorder` / `koBorder` / `spBorder` (CSS strings like `'2px solid #95a04d'`) actually stored/required by the API, or purely presentational? I'd rather not send CSS to the scoring engine if it's ignored.

**Q2.3** — The stat fields (`hp`, `bp`, `tp`, `ki`, `kn`, `el`, `pm`, `fm`) default to empty string `''`. Should unused stats be sent as `''`, `0`, or omitted? Does `''` vs `0` change scoring?

**Q2.4** — Which stat fields apply per sport? Our category codes are:
- Boxing / Bare Knuckle: `HB · BP · TP · RW/RL · KO/SP`
- MMA / Kickboxing: `HB · BP · KI · KN · EL · RW/RL · KO/SP`
- Pro Wrestling: `HB · BP · KI · EL · PW · KO/SP`

Does the backend validate/ignore fields that don't apply to the fight's `category`, or must we send all 22 every time?

**Q2.5** — What exact string does `category` expect? Is it `match.matchCategory` verbatim, and what are the valid values (e.g. `Boxing`, `MMA`, `Kickboxing`, `Bare Knuckle`, `Pro Wrestling` — exact casing/spelling)?

**Q2.6** — Must `predictions` contain **every** round of the fight, or only rounds the user actually filled in? What happens to omitted rounds?

---

## 3. ORDERING, IDEMPOTENCY, AND ENTRY FEES

**Q3.1** — Is the two-call sequence (`/api/scores` then `/api/matches/<id>/updatePredictionStatus`) required in that order? The current code only warns on a failed status call — so a user can end up with a saved score but status still `not_submitted`. Is there a single endpoint that does both atomically, or should the app retry the status call?

**Q3.2** — Is `/api/scores` idempotent? If a user double-taps submit (very likely on mobile), do we get two score rows? Should the app send an `Idempotency-Key` like the checkout endpoints do?

**Q3.3** — Where is the **entry fee** deducted? The app checks the coin balance client-side before submitting, but I don't see a fee deduction in this flow. Does `/api/scores` debit the wallet server-side, or is that a separate call we're missing? **This is important** — if the app submits without a real debit, users enter paid contests for free.

**Q3.4** — Editing: the UI says "entries remain editable until the fight locks." Does re-POSTing `/api/scores` overwrite the previous entry, or create a duplicate? Wrestling uses `PUT` for updates — is there an equivalent here?

---

## 4. AUTH INSIDE THE APP

**Q4.1** — When a guest taps a prediction CTA, the website sends them to `/auth?mode=signup&role=player&next=/fight/<id>`. To keep this in-app, can the app authenticate against an API endpoint directly (email/password or the Google OAuth flow already in use) and receive the same token, or must signup happen on that page?

---

## What I'll build once these are answered

A `submitPredictionInApp()` in `FantasyMobileExperience.jsx` that translates the app's draft state into the confirmed round payload, POSTs to the real endpoints with auth + idempotency, handles the entry-fee debit properly, and returns success to the app core so the in-app confirmation, coin update, and receipt all fire — with **no navigation away from the app**.

Until Q2.1–Q2.6 and Q3.3 are answered I'm deliberately not writing that mapping. A wrong field or point constant produces predictions that look valid, save without error, and score incorrectly on entries people paid real money for.
