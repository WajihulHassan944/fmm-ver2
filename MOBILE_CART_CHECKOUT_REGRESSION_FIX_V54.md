# Mobile Cart and Checkout Regression Fix — v54

## Restored from the client mobile-app v6 design

- Shopping-cart button in the mobile homepage top bar.
- Live cart quantity badge.
- FM coin cart screen inside the app shell.
- Coin-pack quantity increase, decrease, and remove controls.
- Cart subtotal, selected FM total, and secure-checkout CTA.
- Player-name field in the Join Free flow.
- Monthly and 30-day FM+ membership choices.
- Both homepage apparel actions: View All and Shop on Etsy.
- An accessible Join Free hit area over the client-supplied hero artwork.

## Production integration retained

- Cart contents are passed to the existing `/checkout` page.
- The backend remains authoritative for product prices and first-purchase doubling.
- Payment continues through the Kurv hosted checkout.
- No simulated payment success or client-side wallet credit was added.
- Apparel remains on Etsy and is not mixed into the FM coin cart.

## Phone checkout fixes

- Mobile-first layout for 320px, 393px, and 430px phone widths.
- Removed horizontal overflow and fixed long-title wrapping.
- Converted coin packs to compact mobile rows.
- Forced billing inputs and checkbox controls to remain inside the viewport.
- Stacked billing fields and order summary on phones.
- Hid the global desktop header on phone checkout so it cannot overlap the cart.
- Added safe-area padding for notched devices.

## Preserved behavior

- All v52 data/date/contest fixes remain included.
- All v53 desktop navigation and responsive-width fixes remain included.
- No backend update is required for this regression fix.

## Verification

- Production build completed successfully (124 routes).
- Targeted ESLint checks passed.
- Browser tests passed at 320px, 393px, and 430px with no horizontal overflow.
- Verified in-app cart navigation, quantity controls, query transfer, totals, and checkout CTA.
