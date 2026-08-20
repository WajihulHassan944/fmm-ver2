# Final Client Mobile v63

- `/` and `/home` now always render the single current homepage (`FinalHomeV35`) on phone and desktop. The older prototype Home can no longer be reached through Classic mode.
- Classic and Bold now share the same current homepage DOM/data; the switch is presentation-only.
- Home navigation from other interactive app tabs routes to `/` instead of opening the legacy prototype Home.
- First paint now waits only for the compact Home summary (18 fights); the 36-fight prediction feed and 16 promoted fights enrich in the background.
- Removed the deliberate 1.8s Pro Wrestling delay; it loads during the first idle opportunity (max ~500ms).
- Mobile hero uses the exact 853x700 handoff composition as a 165 KB WebP; desktop keeps the approved 1983x793 wide banner.
- Repeated arena artwork is served as an ~88 KB WebP.
- The exact client-provided 1536x1024 image is installed as `/images/social/fantasy-mmadness-link-cover-final.png` and used by default Open Graph/Twitter/share metadata.
