# Homepage Upcoming Events v34 Fix

Targeted fix for the Upcoming Events cards where the sport label stretched into a large red rectangle over the poster image.

Root cause: older homepage styles left `right` and `bottom` values on the event `figcaption`; newer styling added a red background without resetting those inherited offsets.

Fix: added `fmm-client-v34-upcoming-event-repair.css` and imported it last. The override resets the event label to a compact pill and restores poster image visibility without changing the already-approved featured/dashboard sections.
