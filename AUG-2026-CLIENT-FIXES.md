# August 2026 client fixes

- `/leaderboard`, `/FantasyLeagues`, and `/watch-party` now use the production-connected prototype interface at desktop and phone widths, instead of leaving the legacy marketing page underneath.
- Watch Party includes a live fight clock, round indicator, tappable strike tracker, crowd reactions, Cage Cam chat, and animated stadium-light treatment. It starts with zero recorded strikes/messages and uses the published fight.
- Leaderboard and leagues show real API rows or a clear empty state—never fake player, rank, league, or reward numbers.
- `/contact` retains the complete name, email, subject, and message form. Internal “Experience standard” build notes and the generic route wrapper are removed.
- Homepage and contest actions open the selected fight at `/fight/{id}?play=1`. They no longer send paid-intent users to the demo or to a category list.
- Prediction forms start at zero. Pool, fee, entry count, date, venue, rounds, fighter names, and imagery come from the published fight. Missing commercial values are shown as pending/free/none rather than `$100,000`, `100 FM`, or `22,450`.
- Date-only rendering preserves an Aug 15 fight as Aug 15 across time zones.
- Fight posters and fighter images use fixed aspect boxes with `object-fit: cover`; missing fight art uses sport-neutral artwork rather than another named fight's poster.
- Homepage apparel images have fixed sizing and keep their Etsy-backed fallback behavior.
- The phone shell starts at the top edge with no extra black spacer above navigation.
- The new FM coin cart implements the three specified packs, quantity controls, first-purchase message, logged-in wallet matching, checkout-as-account-creation for logged-out buyers, AVS fields, consent gates, and idempotent Kurv handoff. Apparel remains outside the cart on Etsy.
- Canonical URLs use `https://www.fantasymmadness.com`; localhost canonicals and internal developer copy are not rendered.
