# Back-office spec — fight placement

## The problem

The homepage has **three separate fight surfaces**. They are currently treated as if they were one, and they are not:

| # | Surface | Prototype label | What it is |
|---|---|---|---|
| 1 | Featured banner | `★ FEATURED THIS WEEK` | One hero promo slot. Big arena background, countdown, one headline bout. |
| 2 | Featured fight detail | `FEATURED FIGHT · <DIVISION>` | A different, separately chosen bout with full fighter cutouts and stat detail. |
| 3 | Upcoming Events | `UPCOMING EVENTS` | The full list/carousel of every scheduled fight, as posters. |

**These are three independent assignments.** The admin may want a kickboxing match as Featured This Week, a heavyweight boxing bout as the Featured Fight, and neither of them highlighted in Upcoming Events — or both appearing there too. The back office must allow any combination without one choice forcing another.

## Required admin structure

Three separate controls, not one "featured" toggle:

### 1. Featured This Week
- Single-select: pick **one** scheduled fight.
- Own image upload: arena/background photo for the banner.
- Own countdown: derived from that fight's date ("⏱ 2 DAYS LEFT" is currently hardcoded — compute it).
- Empty state: if nothing is assigned, **hide the banner entirely** rather than showing a placeholder.

### 2. Featured Fight (detail card)
- Single-select: pick **one** scheduled fight, independent of #1.
- Must be selectable as the *same* fight as #1 or a *different* one — both are valid.
- Own image uploads: background photo plus a fighter cutout per corner.
- **Division/weight-class label must come from the fight record.** It is currently hardcoded to "HEAVYWEIGHT BOUT" and will lie the moment a kickboxing or lightweight bout is featured. Read it from the fight's own `division` / `weightClass` field, and read the sport from `sport` so the tag colour and label match.
- Empty state: hide the card.

### 3. Upcoming Events
- **Not a manual selection.** This is the automatic list of every fight where `date >= today`, sorted soonest first.
- Admins add fights to the schedule; the section populates itself. No separate "add to upcoming" step.
- Each entry is a fight poster: event tag, fighters, date, venue, prize, entry CTA.
- Past fights drop off automatically (already specified in `FIX-LIST-AUG-2026.md` item 3).

## The fight record

One fight, entered once, with everything the three surfaces need:

| Field | Notes |
|---|---|
| `id` | |
| `sport` | mma / boxing / kickboxing / bareknuckle / wrestling — drives tag colour and scoring rules |
| `division` | e.g. "Heavyweight", "Welterweight" — **feeds the detail card label** |
| `eventName` | e.g. "UFC 323" |
| `fighterA`, `fighterB` | Names + linked fighter records |
| `date`, `venue` | Date drives both past-fight filtering and the countdown |
| `prizePool`, `entryFee` | |
| `posterImage` | Used in Upcoming Events |
| `scheduledRounds` | Drives the scorecard length |

Then three placement flags/pointers, set independently:
- `featuredThisWeek` — at most one fight true at a time
- `featuredFight` — at most one fight true at a time
- Upcoming Events needs **no flag** — it's a date query

**Setting one must never set another.** If the admin marks a fight as Featured This Week, its Featured Fight status is unchanged.

## Images per surface

Each surface needs its own uploads — the same fight looks different in each:

- Featured This Week → wide arena/background image
- Featured Fight → background image + one cutout per fighter
- Upcoming Events → vertical fight poster

Do not reuse one image across all three; the crops and aspect ratios differ. All fighter cutout uploads run through automatic background removal (see `README.md`).

## Acceptance criteria

- [ ] Assign a kickboxing bout to Featured This Week and a boxing bout to Featured Fight — both render correctly and independently
- [ ] The Featured Fight label reads the assigned bout's real division, not "HEAVYWEIGHT"
- [ ] Changing Featured This Week does not change Featured Fight
- [ ] Add a new fight to the schedule — it appears in Upcoming Events with no extra step
- [ ] A fight dated yesterday disappears from Upcoming Events without admin action
- [ ] Clear both featured assignments — the banner and detail card hide, and the page still reads cleanly
- [ ] The countdown on Featured This Week is computed from the fight date, not fixed text
