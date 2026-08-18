# FANTASY MMADNESS — Retention & Skill Tiers (Dev Handoff)

Goal: keep players active between live fight cards, and keep new/casual players from getting demoralized out of the game by expert-level competition.

---

## 1. Off-fight-week retention: auto-surfaced Shadow Fights

The Shadow Fights feature (already speced: a completed fight re-released with its identity hidden, scored against the same live-fight rules) is the natural fix for dead weeks — it just needs to be automatic instead of something a user has to go find.

**Logic:**
1. A scheduled job checks: is there a live/upcoming real fight card within the next 7 days?
2. If **no** upcoming card is scheduled, auto-publish a new Shadow Fight to the homepage/active-contests section, pulled from the existing archive.
3. Rotate which archived fight gets used (e.g. avoid repeating one used in the last 60 days) so returning players don't hit the same hidden fight twice.
4. Send a push/email to recently-active users when a new Shadow Fight goes live: "No live fight this week — but here's a mystery card to test your skills." Keeps the notification honest (not pretending it's a live fight) while still giving a reason to open the app.

**Data needed:** a flag on the fights table for `is_shadow` and `shadow_last_used_at`, plus a simple scheduler (cron or equivalent) that checks the real-fight calendar and triggers publication.

**Why this matters more than it looks:** this is the difference between "app I check once a month when there's a big fight" and "app I check every week" — weekly habit is what turns a casual downloader into a retained player.

---

## 2. Skill tiers / matchmaking

**Problem it solves:** a first-time player finishing #3,800 of 4,000 on the global leaderboard has no reason to come back. Tiering keeps early experiences competitive.

**Simplest version to ship first:**
1. Track a rolling average score/percentile per user across their last 5-10 contests.
2. Bucket users into 3 tiers: Rookie (new / bottom-tier history), Regular (middle), Expert (consistently top-scoring).
3. Show each user their **tier-specific leaderboard** by default (e.g. "Rookie Leaderboard — You're #4 of 200") alongside — not instead of — the global one, so competitive players can still chase the top spot globally.
4. New users start in Rookie by default; auto-promote after enough contests once their percentile crosses a threshold (avoids needing a placement quiz).

**Data needed:** a `tier` field on the user profile, recalculated after each contest based on rolling performance — no separate matchmaking infrastructure required since everyone still plays the same shared contest, just gets a different leaderboard lens on the results.

**Optional v2:** tier-specific small bonuses or badges (e.g. "Rookie of the Week") to give the tiered leaderboard its own sense of achievement, not just a consolation view.

---

## 3. Build order (fits after the referral loop work)
1. Skill tiers — smaller build, immediate effect on new-player retention, no scheduler needed
2. Shadow Fight auto-publish + rotation logic — slightly bigger build (needs the scheduler), bigger effect on weekly active usage
3. Notification tie-in for both (new Shadow Fight live / tier leaderboard updates) — layer on last, once 1 and 2 are stable
