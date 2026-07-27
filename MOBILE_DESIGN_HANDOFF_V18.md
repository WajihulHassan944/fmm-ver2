# Mobile design handoff v18

This update replaces the previous mixed phone homepage with a fully isolated implementation based on the latest client-supplied mobile design.

## Scope

- Phone homepage only (`max-width: 767px`).
- Desktop homepage and desktop styling are unchanged.
- Existing non-home mobile app screens remain available through the menu and bottom navigation hotspots.

## Changes

- Uses the latest supplied homepage design as the sole visual source of truth.
- Removes all legacy header, footer, homepage padding, and old mobile-home sections while this mobile experience is active.
- Fits the design to the complete dynamic phone viewport with no white margins or legacy content beneath it.
- Adds accessible clickable hotspots for the menu, wallet, notifications, Join Free, statistics, all five sports, featured fight, upcoming events, rewards, coins, leaderboard, apparel, blogs, affiliates, and bottom navigation.
- Keeps the real wallet balance rendered over the approved visual.
- Preserves vibration, short sound feedback, menu drawer behaviour, and the existing app screens.
- Adds restrained arena-light sweep and spark effects with reduced-motion support.
