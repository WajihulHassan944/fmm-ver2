# Phone Homepage Visual Stability V10

Phone-only corrective pass based on the July 24 full-page capture.

- Kept one visible hamburger from the hero artwork and made its transparent hotspot open the existing drawer.
- Cropped the baked static statistics strip out of the hero so only live statistics appear.
- Resized and realigned the live wallet and profile controls.
- Replaced category images containing baked labels/counts with art-only category images; labels and counts now render once from live data.
- Removed duplicate Daily Reward text and rebuilt the Coins Wallet overlay around the real balance.
- Added robust phone-home footer suppression without relying only on `:has()`.
- Added print/PDF handling so the fixed bottom navigation is not repeated on every captured page.
- Desktop homepage components and desktop CSS were not changed.
