# Fantasy MMAdness — Backend Architecture & Developer Handoff

**Prepared for:** fantasymmadness.com development handoff
**Status:** Working, tested logic — not yet connected to production database/site
**Last updated:** August 2026

---

## 1. What this document is

Everything in this doc was built and *run* (not just described) during a design session covering Fantasy MMAdness's scoring engine, data pipeline, and automation. Every code file listed below is real, executable JavaScript (Node.js), tested with real output shown alongside it. None of it is wired into the live site yet — that's the next step, and this doc exists to make that step fast for whoever does it.

**Read order for a new developer:** Section 2 (architecture) → Section 3 (scoring rules) → Section 4 (file map) → Section 6 (what's left).

---

## 2. System architecture, top to bottom

```
                    COLLECTORS (Section 5)
      Wikipedia / bkfc.com / wwe.com / BoxingInsider.com
                            ↓
                    DATA HUB (draft events)
              validates sources, catches conflicts,
                tracks source health, admin lane
                            ↓
              Admin approves → fight goes LIVE
                            ↓
              Users submit round-by-round predictions
                            ↓
         LIVE SCORING ENGINE (Section 3 — per sport)
        applies round/KO/survival points as rounds happen
                            ↓
              hub.onOfficial() fires automatically
                    ↙                    ↘
       Scoring Engine settles      Shadow Fight Scheduler
         the live contest          queues fight for next-day
                                    promotion into archive
                                            ↓
                                   SHADOW FIGHTS
                          same fight, hidden identity,
                          fresh blind contest, later
```

**The one architectural idea worth understanding before anything else:** the Data Hub uses a **listener pattern** (`hub.onOfficial(callback)`). When a fight result goes official, every registered listener fires automatically. Right now there are two listeners (live scoring settlement, Shadow Fight queueing) — adding new automated behavior later (payout triggers, leaderboard updates, push notifications) means adding a new listener, never editing existing code.

---

## 3. Scoring rules — the source of truth

All point values live in **`scoring-config.json`** — nowhere else. If a rule below ever conflicts with that file, the file wins; this doc could go stale, the config is what the code actually reads.

### 3.1 Combat sports (MMA, Boxing, Kickboxing, Bare-Knuckle)

Users predict a **winner for every scheduled round** — no separate "method" prediction; it's implied by round picks. Per round:

| Outcome | Points | Notes |
|---|---|---|
| Correct round-winner pick | **100** | "Round Winner" (RW) |
| Same pick, automatic credit | **+25** | "Round Loser" (RL) — auto-paired, same one guess covers both |
| Round is the actual finish round, pick correct | **+500** | "Finish Bonus" — KO, TKO, **and Submission** all count as a finish (only Decision doesn't) |
| Wrong pick, but round is NOT the finish round | **25 (flat)** | "Survival Bonus" — automatic, since nobody was finished that round by definition. Applies almost every round regardless of accuracy. |
| Wrong pick AND round IS the finish round | **0** | Total miss — the predicted loser was the one actually finished |

**All values stack/are cumulative.** A correct finish-round pick pays 100+25+500=625 in one round. Nothing is ever replaced or overwritten.

**Scheduled round counts (fixed per sport):**
| Sport | Rounds |
|---|---|
| Boxing | 12 |
| MMA | 5 |
| Bare-Knuckle | 5 |
| Kickboxing | 5 |

**Sport → stat-category groupings** (for the separate stat-accuracy prediction layer — head/body punches etc.):
- **`strikingGroup`** (MMA + Kickboxing): ST (Strikes), KI (Kicks), KN (Knees), EL (Elbows)
- **`punchingGroup`** (Boxing + Bare-Knuckle): HP (Head Punches), BP (Body Punches), TP (Total Punches — tracked separately, NOT derived from HP+BP)

**Stat-accuracy scoring rule — CONFIRMED (this replaces an earlier unconfirmed tolerance/closeness-based placeholder that was never actually approved, and also replaces older live-site FAQ copy that had this backwards):**

A stat prediction is a **floor, not a target**. It scores only if the actual number is **≥** the prediction (a tie counts). If it scores, the points awarded **equal the predicted number itself** — there is no fixed max and no tolerance band.

- Predict 5, fighter throws 5 or more → **5 points**
- Predict 45, fighter throws 45 or more → **45 points**
- Predict 100, fighter only throws 40 → **0 points** (predicted too high)

This is deliberate risk/reward: a higher *correct* prediction always outscores a lower correct prediction, so guessing low only caps your score — it doesn't guarantee a win. An informed guesser who correctly predicts a high number beats a lazy guesser who "safely" predicts a low number, every time both predictions land. Implemented in `scoring-engine-v5.js`'s `scoreStats()`; documented as the source of truth in `scoring-config.json`'s `statAccuracyScoring` block.

### 3.2 Pro Wrestling (separate rules — no rounds, 25-minute match)

- Users predict stats for **both wrestlers** across categories: HP, BP, K (Kicks), PM (Power Moves), FM (Finishers)
- **Match Winner bonus: flat 100 points** — 2-way pick only, **no draw option**
- **Finish market (Pinfall or Submission = the "KO" equivalent): 500 points** if correctly called
- **Survival Bonus: 25 points** if the finish market misses (e.g. match ends by Countout/DQ instead)
- Scored **live over the full 25-minute match** — score should visibly climb as real events happen, not appear as one number at the end
- ⚠️ **Known formula gotcha:** a stat predicted as "0" (e.g. "this wrestler lands 0 finishers") must only score full credit once the match has **actually ended** — crediting it mid-match falsely inflates the score before the outcome is confirmed. See `live-wrestling-scoring.js` for the fix.

### 3.3 Shadow Fights (not a separate ruleset — a wrapper)

Takes an **already-completed, already-scored** fight from the archive, hides its identity, and re-releases it as a fresh contest. Users predict the **full scheduled length for the sport** (e.g. all 12 rounds for a Boxing shadow fight) even though the real fight may have ended early — this requires zero special handling, because the scoring engine already only scores rounds that actually happened. Identity is revealed only after scoring completes. **Automatically queued** for promotion into the archive exactly 24 hours after a fight goes official (see `shadow-fight-auto-promotion.js`).

---

## 4. File map — every file built, what it proves, and its status

All files are in the project's `outputs` folder. **"Runnable"** means it was executed during this session with real console output confirming it works. **"Needs deployment"** means the logic is complete but requires a live network/database connection this sandbox doesn't have.

### Core data & scoring engine
| File | What it does | Status |
|---|---|---|
| `fantasy-mmadness-data-hub.js` | First version — source priority, conflict detection between data sources | Runnable |
| `fantasy-mmadness-data-hub-v2.js` | Adds source health monitoring, active admin alerts, duplicate-fighter detection, persistent audit log, config-driven scoring | Runnable |
| `integrated-demo.js` | Proves the listener pattern: `markOfficial()` automatically triggers scoring, no manual step | Runnable |
| `scoring-config.json` | **The single source of truth for every point value across every sport.** Edit this file to change scoring anywhere on the platform. | Config file |
| `scoring-engine-v3.js` → `v5.js` | Iterative builds of the round-based scoring engine, ending in the sport-aware version that auto-selects stat categories by sport | Runnable |
| `live-combat-scoring.js` | Shows combat-sports scoring applied live, round by round, with the running total being the final score | Runnable |
| `pro-wrestling-scoring-v2.js` | Final Pro Wrestling scoring rules (no draw, 100pt winner bonus, reused 500/25 finish market) | Runnable |
| `live-wrestling-scoring.js` | Live version of wrestling scoring — **includes the fix** for the "predicted 0" bug described in 3.2 | Runnable |
| `validate-scheduled-length.js` | Pre-submission validation catching mismatched round counts per sport | Runnable |

### Shadow Fights
| File | What it does | Status |
|---|---|---|
| `shadow-fights.js` | Full Shadow Fight flow: archive → hidden contest → blind predictions → score → reveal | Runnable |
| `shadow-fight-auto-promotion.js` | Automatic next-day promotion into the Shadow Fight archive via the listener pattern | Runnable |

### Collectors (real data sources)
| File | Sport | Source | Status |
|---|---|---|---|
| `real-collector-ufc.js` | MMA | Wikipedia | Runnable, real data |
| `real-collector-bkfc.js` | Bare-Knuckle | bkfc.com/events (official) | Runnable, real data — best-quality source |
| `real-collector-boxing.js` | Boxing | BoxingInsider.com | Runnable, real data (DAZN blocks bots — see Section 5) |
| `real-collector-wrestling.js` | Pro Wrestling | wwe.com/events (official) | Runnable, real data |
| `all-sports-collector-demo.js` | All 5 | Combined, real data across all sports in one run | Runnable |
| `production-ufc-collector.js` | MMA | Real `fetch()` call, not hardcoded | **Needs deployment** — no network in this sandbox |
| `production-all-sports-collector.js` | All 5 | Generalized multi-source version; Boxing & Wrestling marked `needsCustomParser` | **Needs deployment** |

### Superseded/early versions (kept for reference, not for use)
`prediction-engine.js`, `real-scoring-engine.js`, `pro-wrestling-scoring.js` — each was corrected by a later file above based on real clarification from the site owner. **Use the versions listed above them, not these.**

---

## 5. Data sources — confirmed status

| Sport | Source | Fetchable? | Quality |
|---|---|---|---|
| MMA | `en.wikipedia.org/wiki/List_of_UFC_events` | Yes | Good — event/venue/location, dates inconsistent |
| Kickboxing | `en.wikipedia.org/wiki/2026_in_Glory` | Yes | Good |
| Bare-Knuckle | `bkfc.com/events` | Yes | **Best** — real matchups, exact dates/times |
| Boxing | `boxinginsider.com/updated-boxing-schedule` | Yes | Very good — matchups, weight class, title status |
| Boxing (DAZN) | `dazn.com` | **Blocked** — active bot detection | N/A — use BoxingInsider instead |
| Pro Wrestling | `wwe.com/events` | Yes | Good — mixes weekly TV with Premium Live Events, needs filtering |
| Boxing stats (punch counts) | `beta.compuboxdata.com` | Yes, but **licensing required** | Official round-by-round data; site explicitly names "fantasy sports" as a licensable use — **this is a real business contact to make**, not a scraping target |

---

## 6. What's NOT done yet — the honest gap list

1. **Nothing writes to a real database.** Every collector and scoring engine here runs in-memory and prints to console. The `submitDraftEvent()` / `db.collection(...).insertOne(...)` calls throughout the code are clearly marked as placeholders for the real database layer.
2. **No live network access was available in the build environment**, so the `production-*.js` files' `fetch()` calls are untested against a live server — the parsing logic is real and was validated against real fetched HTML, but the file needs to run somewhere with outbound internet access to prove it end-to-end.
3. **Pro Wrestling collector needs a filter decision**: should weekly Raw/SmackDown tapings become contests, or only Premium Live Events? This is a product call, not a technical one.
4. **CompuBox is a licensing conversation, not a code task** — reach out to them before building anything against their data.
5. **No admin dashboard UI exists** — all the monitoring data (source health, conflicts, pending Shadow Fight promotions) is generated but has nowhere to be *viewed* yet.
6. **DAZN needs an alternate path** for any data beyond schedule (results, live stats) — it blocks automated access entirely.

---

## 7. Suggested first sprint for a developer

1. Stand up a real database (Postgres/MongoDB) matching the shapes already used throughout these files (`draftEvent`, `prediction`, `actualResult`, `contest`)
2. Wire ONE collector (recommend starting with `real-collector-bkfc.js` — best data quality) to actually write drafts to that database on a schedule
3. Build a minimal admin approval view — even a simple table with an "Approve" button — so draft events can become live fights
4. Wire the scoring engine (`scoring-engine-v5.js`) to score live predictions against the database instead of hardcoded demo data
5. Everything else (Shadow Fights, the other four collectors, live scoring animation) follows the same pattern once step 2–4 prove out for one sport
