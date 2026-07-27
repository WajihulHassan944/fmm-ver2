# Phone Mobile App Handoff V14

Implemented the attached Fantasy MMADness mobile-app design handoff natively in the existing Next.js frontend for the phone homepage only.

## Main updates

- Rebuilt the phone homepage as a native mobile-app shell with a fixed top wallet/menu bar, independently scrolling content area, fixed five-tab bottom navigation, menu drawer, and sound toggle.
- Added the handoff's classic homepage flow: cinematic hero, activity ticker, live statistics, combat-sport selector, featured fight, upcoming events carousel, fight command centre, community predictions, Watch Party/Leagues shortcuts, free demo CTA, Fight IQ progression, daily rewards, wallet, leaderboard, streak, apparel, blogs, affiliates, and coin chest CTA.
- Preserved live fight, poster, fighter, countdown, player, prize, wallet, prediction, and leaderboard data from the existing APIs.
- Added automatic community/event cycling and dynamic sport-card fighter image cycling with safe local artwork fallbacks.
- Imported the handoff arena, Watch Party, ring-corner, affiliate, and reward-chest assets into `public/images/mobile-app-v14`.
- Added the requested Anton/Rajdhani typography and the handoff's glow, ticker, light-beam, live-pulse, chest, CTA-shine, and reduced-motion behaviours.
- Restricted the implementation to `max-width: 767px`; the desktop homepage is unchanged.

## Validation

- JSX/JavaScript syntax validated with the TypeScript compiler.
- New CSS parsed successfully with PostCSS.
- Required local assets verified.
