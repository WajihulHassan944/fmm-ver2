# Fantasy MMAdness — API & Data Schema Spec

Derived directly from the prototype's behavior (`FantasyMMADNESS.dc.html`). Use with `scoring-config.json` (point values) and `DEVELOPER-HANDOFF.md` (architecture/pipeline).

## Data models (Postgres/Mongo shape-agnostic — pick your DB)

**User**
```
id, email, displayName, passwordHash, coins (int), createdAt,
isAffiliate (bool), affiliateStatus ('active'|'blocked'|'eliminated'),
fmPlusExpiresAt (timestamp|null), streakDays (int), lastLoginAt
```

**Event** (a fight/contest)
```
id, sport ('mma'|'boxing'|'bareknuckle'|'kickboxing'|'wrestling'),
f1Name, f2Name, f1Photo, f2Photo, scheduledRounds (int, per sport table),
lockAt (timestamp), status ('draft'|'live'|'locked'|'scoring'|'completed'),
isShadowFight (bool), shadowSourceEventId (fk, null unless shadow),
tag ('featured'|'upcoming'|'shadow'), entryFeeCoins (int),
prizePoolCoins (int), createdBy (admin userId), affiliateId (fk, null unless affiliate-run)
```

**Prediction**
```
id, userId (fk), eventId (fk), roundPicks (json: {roundNum: 'f1'|'f2'}),
statPredictions (json: {category: number}), // HP/BP/TP/ST/KI/KN/EL/K/PM/FM
matchWinnerPick (for wrestling: 'f1'|'f2'), submittedAt, locked (bool)
```

**ActualResult** (admin-entered, drives scoring)
```
id, eventId (fk), roundWinners (json: {roundNum: 'f1'|'f2'}),
finishRound (int|null), finishType ('KO'|'TKO'|'Submission'|'Decision'|'Pinfall'|'DQ'|'CountOut'|'NoContest'|null),
actualStats (json: {fighter: {category: number}}), enteredBy (admin userId), enteredAt
```

**Score** (computed, per user per event — see scoring-config.json for math)
```
id, userId, eventId, roundPoints (int), finishBonus (int), survivalBonus (int),
statPoints (int), matchWinnerBonus (int, wrestling only), totalPoints (int), computedAt
```

**Affiliate / ShadowFight promo**
```
affiliateId (fk User), eventId (fk), potTargetCoins (int), potFilledCoins (int),
profitSplitPct (fixed 50), status ('filling'|'profit_zone'|'closed'),
leagueMembers (array of userIds), startedAt (affiliate-controlled, no fixed start time)
```

**Transaction** (coin purchases, entry fees, payouts)
```
id, userId, type ('purchase'|'entry_fee'|'payout'|'streak_save'|'skip_wait'|'fm_plus_sub'),
coins (int, +/-), usdAmount (nullable), status, createdAt
```

## API endpoints (REST, adjust to your framework)

**Auth**
- `POST /api/auth/signup` — includes 500 FM signup bonus grant
- `POST /api/auth/login`

**Events**
- `GET /api/events?sport=&status=` — list, filtered
- `GET /api/events/:id`
- `POST /api/events` (admin) — create fight
- `PATCH /api/events/:id` (admin) — edit/lock
- `POST /api/events/:id/result` (admin) — enter ActualResult, triggers scoring listener

**Predictions**
- `POST /api/events/:id/predict` — submit Prediction (reject if locked)
- `GET /api/users/:id/predictions`

**Scoring**
- Triggered server-side automatically when ActualResult posted (listener pattern per DEVELOPER-HANDOFF.md) — no client endpoint needed
- `GET /api/events/:id/leaderboard`
- `GET /api/users/:id/score-history`

**Wallet / Coins**
- `GET /api/users/:id/wallet`
- `POST /api/wallet/purchase` — coin packs (500/1500/5000/etc, see MONETIZATION-SPEC.md)
- `POST /api/wallet/streak-save` (50 FM, 25 FM for FM+)
- `POST /api/wallet/skip-wait` (75 FM)
- `POST /api/subscriptions/fm-plus` — $4.99/mo recurring

**Affiliates**
- `POST /api/affiliates/apply` (admin approves)
- `POST /api/affiliates/:id/shadow-fights` — create pot/promote a Shadow Fight
- `GET /api/affiliates/:id/league` — members + fill status
- Server MUST reject self-entry: `if (prediction.userId === event.affiliateId) return 403`

**Notifications**
- `POST /api/notifications/broadcast` (admin, on new fight posted) — see NOTIFICATIONS-AND-DATA-SYNC.md
- `GET /api/users/:id/notifications`

## Critical business rules to enforce server-side (not just UI)
1. Reject predictions submitted after `lockAt`.
2. Reject an affiliate's own entry into their own contest (403, and flag for elimination review per site owner's rule).
3. Coin balance must be checked server-side before any spend — never trust client-sent balance.
4. Scoring only runs once per event (idempotent) — guard against double-firing the listener.
5. Shadow Fight auto-promotion: exactly 24hrs after an event's `status` becomes `completed` (see `shadow-fight-auto-promotion.js`).
