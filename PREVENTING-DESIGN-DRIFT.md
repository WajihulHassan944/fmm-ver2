# Preventing design drift during implementation

## Why the live site keeps not matching

When a design is handed over as prose ("gold accent," "rounded cards," "tight spacing"), the implementer — human or AI-assisted — has to *interpret* it. Every interpretation drifts a little. Enough small drifts and the result is recognisably different from the design even though nothing was deliberately changed.

AI coding assistants amplify this in a specific way: they are trained to produce plausible, conventional code. Given a description, they will reach for their own defaults — Inter instead of Anton, `font-weight: 500`, `border-radius: 8px`, generic spacing — because those are the statistically common answers. They are not copying your design; they are generating something that matches the *description* of your design. The output looks professional and is subtly wrong.

The fix is not to ask for more care. It is to remove the interpretation step.

## The three rules

### 1. The prototype file is the source of truth, not this documentation

`FantasyMMADNESS-standalone.html` is the spec. Where any document — including this one — disagrees with the prototype, the prototype wins.

Do not describe a screen to an AI assistant and ask it to build it. **Open the prototype, read the actual markup and values for that screen, and port those.** The file is plain readable code; the values are right there.

### 2. Import `design-tokens.json` — never retype values

Every colour, font, size, radius, spacing step and animation timing is in `design-tokens.json` as an exact value. Load it into the codebase as constants or CSS custom properties and reference it.

Specifically forbidden, because these are the exact drift patterns:
- Substituting a font. Anton and Rajdhani are loaded from Google Fonts. Not Inter, not Roboto, not "a similar condensed sans."
- Rounding the half-pixel sizes. `11.5px` and `9.5px` are tuned to the 390px viewport. `12px` is not the same.
- Using `font-weight: 400` or `500`. Rajdhani reads thin; the body weight here is `700` and headings run `800`–`900`.
- Replacing the glow elevation with a conventional drop shadow. The layered radial-gradient stadium glow is the signature of the whole design.
- Re-spacing "by eye" to look balanced at a different width. Scale proportionally from 390px.

### 3. Diff visually before every merge

Open the prototype and the implementation side by side at the same width and compare screen by screen. Not a code review — a visual comparison. If they don't match, it isn't done.

For the eight main screens (Home, Contests, Make Predictions, Leaderboard, Leagues, Watch Party, Profile, Cart), capture a screenshot of each from the prototype once and keep them in the repo as reference images. Then any drift shows up as an image diff rather than something someone has to notice.

## If an AI assistant is being used

That's fine — it's faster — but the prompt has to change shape. Instead of:

> "Build a fight card component with a gold accent and rounded corners"

give it the actual source:

> "Here is the exact markup and styling from the prototype for this component: [paste from FantasyMMADNESS-standalone.html]. Port this to our stack, preserving every colour, size, weight, radius and animation value exactly. Do not substitute fonts. Do not round any numeric value. Do not replace the glow shadows. If a value looks unusual, keep it — it is intentional."

And afterwards, check the diff for: font-family declarations, any `font-weight` below 700, rounded numeric values, `box-shadow` replaced with a conventional shadow, and any colour not present in `design-tokens.json`. Those five checks catch the overwhelming majority of AI drift.

## Escalation

If a value in the prototype genuinely cannot be reproduced in the target stack, **ask** rather than approximating. An asked question costs a message. An approximation ships and compounds.
