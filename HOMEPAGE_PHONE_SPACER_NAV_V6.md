# Phone Homepage Spacer and Navigation Fix V6

- Removed the legacy `fmm-mobile-home` class from the static phone homepage so older 86–88px top-padding rules can no longer create a blank header spacer.
- Added direct mobile-home resets that hide the global home header without relying on `:has()` and force the hero to start at the top of the page.
- Kept one hamburger only: the approved artwork icon is now the visible control while a transparent, accessible hit area opens the existing mobile drawer.
- Replaced the baked notification control in the hero artwork with an aligned account icon; its hit area routes to account signup.
- Rebuilt the bottom navigation in semantic HTML/CSS rather than stretching the low-height static strip, preserving all seven destinations with a raised Make Predictions action.
