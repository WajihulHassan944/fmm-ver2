# Integration Checklist — for the developer working on fantasymmadness.com

This exists because prior handoffs didn't translate cleanly into what shipped live. Use this as a literal checklist — check off each row only when the LIVE site matches the "Expected" column exactly, not when code is written.

## Why past handoffs slipped
- The design was handed off as a big reference file + a README — enough detail existed, but nothing forced item-by-item sign-off, so partial/approximate implementations shipped as "done."
- Multiple duplicate homepage sections have appeared live at once (old layout + new layout stacked) — suggests changes are being appended/deployed alongside old code instead of replacing it. **The fix for this is process, not code**: every deploy of a homepage change should DELETE the old section it replaces in the same commit, not add a new one beside it.

## How to use this doc
Each row = one concrete, testable thing. Don't mark a row done until you've opened the live URL yourself and visually/functionally confirmed it. If something can't be done exactly as specified, flag it back — don't ship an approximation silently.

| # | Area | Expected (exact) | Source of truth |
|---|---|---|---|
| 1 | Brand spelling | "Fantasy MMAdness" everywhere on fantasymmadness.com (app/site copy). Note: the Etsy apparel shop uses "Fantasy MMADness" (caps MMAD) — that's a separate, already-live product listing; don't change Etsy, just don't copy its capitalization onto the main site. | README.md |
| 2 | Homepage structure | ONE homepage section, not stacked duplicates. If replacing a section, delete the old one in the same change. | This doc |
| 3 | Past-fight filtering | Upcoming Events never shows a fight whose date has already passed. Query must filter by `date >= today`, computed server-side at request time, not cached. | README.md |
| 3b | Three separate fight surfaces | Featured This Week, Featured Fight (detail card), and Upcoming Events are **independently assigned** — setting one never changes another. Featured Fight's division label must read from the fight record, not the hardcoded "HEAVYWEIGHT BOUT". Upcoming Events is a date query, not a manual list. | BACK-OFFICE-FIGHT-PLACEMENT.md |
| 4 | Scoring — combat sports | Round Winner 100 + Round Loser auto-credit 25 + Finish Bonus 500 (KO/TKO/Submission only, not Decision) if the finish round pick is correct. Survival Bonus 25 flat on any non-finish round regardless of pick accuracy. All stack/cumulative — see exact table in `scoring-config.json` → `combatSports`. | scoring-config.json |
| 5 | Scoring — stat accuracy | Floor rule: score only if actual ≥ predicted; points awarded = the predicted number itself. NOT a tolerance/closeness system. See `scoring-config.json` → `statAccuracyScoring`. | scoring-config.json |
| 6 | Scoring — Pro Wrestling | Match Winner 100 (2-way, no draw). Finish market (Pinfall/Submission) 500. Survival Bonus 25 if finish market missed. No rounds — scored live over 25-min match. | scoring-config.json → `proWrestling` |
| 7 | FAQ copy | Replace the two contradicting FAQ answers (KO handling, stat-accuracy) with the exact corrected text in `faqs-corrected-copy.md`. Also re-check FAQ #11 so all three agree. | faqs-corrected-copy.md |
| 8 | Coin buy flow | 1,000 FM=$0.99, 5,000 FM=$3.99 (badged "Most Popular"), 15,000 FM=$9.99. First-ever purchase doubles the coin amount (enforced server-side, once per account). Picking a pack opens the coin cart → billing form → handoff to **the merchant processor's hosted payment page**. Insufficient balance on ANY submit (scorecards, Fantasy Cards) routes straight into this flow, not a dead end. | README.md "Payments & Coins", MONETIZATION-SPEC.md |
| 8b | Apparel | **Not sold in-app.** Apparel tiles and "SHOP ON ETSY ›" open etsy.com/shop/FANTASYMMADNESS in a new tab. No in-app cart, sizes, or order form for merchandise. | README.md |
| 9 | Streak-save / skip-wait | Streak-save button (50 FM) appears only once streak has <1hr left. Skip-wait button (75 FM) appears only after today's reward is already claimed. Both are optional — free path always still works. | FantasyMMADNESS.dc.html `saveStreak`/`unlockNextReward` |
| 10 | FM+ subscription | $4.99/mo. Grants 1,000 bonus FM/mo, early access, exclusive leagues, no ads, 25 FM streak-save (half price). Ads and streak-save discount must actually check `isSubscribed` — don't ship the modal without the entitlements working. | FantasyMMADNESS.dc.html `subscribeFmPlus` |
| 11 | AI Scouting Report | Regenerates per fight from real data (currently hardcoded to Jones vs Aspinall — it shows the same text for every fight). Backend computes every number; the model only writes prose around supplied figures, and output is validated before publishing. Generated once per fight and cached, never per page view. | **AI-SCOUTING-REPORT-SPEC.md** |
| 12 | Fighter Affiliates | A fighter can hold an affiliate profile + host a Fantasy Card, shown with a "✓ FIGHTER" verified badge. Fans can Follow a fighter and get notified of new cards. Verification badge requires an actual approval step, not self-declared. | README.md "AI Features" |
| 13 | Leaderboard/Leagues empty states | Never show "0 Ranked players" / broken zeros. Either real data or an honest, designed empty state ("Scores publish after official results"). | README.md |
| 14 | Contact form | Full name, email, subject, message fields all visibly rendered and functional — not just a bare "Send Message" button. | README.md |
| 15 | Social icons | Real platform icons/labels (X, Instagram, Facebook, TikTok) — never raw broken text fragments. | README.md |
| 16 | Backend scoring engine | Wire `scoring-engine-v5.js` (see DEVELOPER-HANDOFF.md Section 4/7) to real submitted predictions instead of hardcoded demo data — this is what makes #4–6 actually true in production, not just correct in a config file. | DEVELOPER-HANDOFF.md |

## Recommended process going forward
1. **One feature = one PR = one row above**, reviewed against the live URL before merging, not against a screenshot.
2. **No duplicate/stacked sections ever** — any homepage or FAQ edit removes what it replaces in the same change.
3. **Re-run this checklist after every deploy** and report back row-by-row (✅/❌ with URL evidence), not "should be done now."
