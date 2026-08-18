# AI Scouting Report — build spec

## Current state in the prototype

The "🤖 AI SCOUTING REPORT" button opens a modal whose content is **hardcoded to Jones vs Aspinall**. It will show that same text for every fight. It is a visual mockup of the feature, not a working one. This document is what makes it real.

## Core rule: the model writes prose, never numbers

**Your backend computes every figure. The model only writes the sentences around figures you supply.** A model left to freestyle will invent records, finish rates and strike averages. On a platform where users spend money on predictions, a fabricated stat is a trust and liability problem, not a cosmetic bug.

Every number that appears in a published report must trace back to a row in your database.

---

## 1. Inputs — assemble server-side before calling the model

Build a structured payload per fight. Nothing enters the prompt that you didn't compute:

| Field | Source |
|---|---|
| `fighters[].name`, `record`, `age`, `reach`, `stance` | Fighter table (populated by the collectors in `DEVELOPER-HANDOFF.md`) |
| `fighters[].finishRate`, `koRate`, `submissionRate` | Derived from historical results |
| `fighters[].avgStrikesPerRound`, by category | Historical stat data |
| `fighters[].lastFive` | Recent results, most recent first |
| `pickSplit` | **Your own data** — live percentage from submitted scorecards |
| `pickCount` | Number of entries submitted so far |
| `fight` | Sport, event name, scheduled rounds, date |

`pickSplit` is the most valuable field and the one no competitor has. Lead with it.

## 2. Prompt contract

Send the payload as structured data (JSON) alongside instructions that state plainly:

- Use **only** the figures provided. Do not introduce any statistic not present in the payload.
- Do not round, restate approximately, or convert the supplied numbers.
- If a field is missing or null, omit that point entirely — never estimate it.
- Output three parts: a short data-backed read on the matchup, the community pick split framed as context, and one underdog or contrarian angle.
- Length cap so it fits the modal without scrolling.

Request structured output (a JSON object with `summary`, `pickSplitNote`, `underdogAngle`) rather than free text. It's easier to validate and easier to render.

## 3. Validation gate — required before publishing

Do not publish model output directly. Between generation and storage:

1. Extract every numeric token from the generated text.
2. Assert each one matches a value in the payload (allow exact matches only — no tolerance window).
3. On mismatch: reject, log the offending output, retry once. If it fails again, fall back to a template-rendered report built from the payload with no model involvement.

A regex-and-compare check is enough. Models occasionally embellish or round even when instructed not to, and this catches it cheaply.

Also gate: no claims about injuries, personal conduct, or betting odds. Reject outputs containing them.

## 4. Generation lifecycle

**Generate once per fight, cache, serve to all users.** Never generate per page view — that multiplies cost by traffic for identical output.

- **On fight creation:** generate the initial report from fighter data. `pickSplit` will be null or thin; the prompt must handle that (omit the split section until a minimum entry count, e.g. 25).
- **On a schedule as the fight approaches:** the pick split moves. Prefer re-rendering the split section from live data over regenerating prose — the numbers stay current at no model cost. Regenerate the full report only on a meaningful shift (e.g. split moves more than 10 points) or on a fixed cadence (daily in fight week).
- **On fight start:** freeze the report. No regeneration during or after the fight.

Store against the fight ID with a `generatedAt` timestamp and the payload version used, so any published claim can be reconstructed and audited.

## 5. Failure behaviour

The feature must never block the fight card or show an error to users:

- Model unavailable or validation failed twice → serve the **template-rendered fallback**: the same figures laid out without generated prose. Users see real data, just plainer.
- Insufficient fighter data → hide the AI Scouting Report button for that fight rather than showing a thin report.

The button should not appear unless a valid report exists.

## 6. Cost note

Cost scales with **number of fights**, not number of users. A few hundred fights a year with daily fight-week regeneration is a small, predictable bill. The pattern that breaks this is per-view generation — don't.

---

## Acceptance criteria

- [ ] Open three different fights; each shows a distinct report naming its own fighters
- [ ] Every number in a report matches a database value (spot-check three reports)
- [ ] Submit scorecards to move the pick split; the report's split figure updates
- [ ] Force a model failure; the fallback renders and no error reaches the user
- [ ] A fight with sparse fighter data hides the button rather than showing a thin report
- [ ] Reports are cached — repeated views of one fight trigger no new generation
