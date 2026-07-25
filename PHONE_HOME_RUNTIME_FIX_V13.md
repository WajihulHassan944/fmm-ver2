# Phone Homepage Runtime Fix V13

- Restored the missing `getMobileEventLabel` helper used by the real-time Featured Fight overlays.
- Event labels now resolve safely from promotion, event, organisation, league, category, and sport metadata.
- Removed the unused manual hero-image preload that generated a browser warning on the phone homepage.
- De-duplicated profile requests for the same auth token.
- Expired or forbidden stored user tokens are cleared after a 401/403 response to prevent repeated failed profile requests.
- No phone-homepage visuals, desktop homepage UI, routes, or real-time fight-data behaviour were changed.
