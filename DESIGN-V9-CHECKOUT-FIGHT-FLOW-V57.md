# Fantasy MMAdness frontend v57

This release applies the current mobile-app v9 handoff without removing the production-connected work from v56.

## Checkout

- Rebuilt FM Coin Checkout to match the approved compact cart: selected pack, quantity control, order summary, first-purchase doubling, final credited coin total, account-at-checkout notice, billing details, and secure-payment call to action.
- Removed payment-provider and hosted-checkout wording from the customer interface.
- Kept FM+ monthly and 30-day pass options, including the 25 FM streak-save entitlement.
- Added narrow-phone rules so cart rows, controls, fields, and totals remain within the viewport.

## Fight discovery and prediction flow

- Sport cards now filter and reveal that sport's upcoming events.
- Every event action opens its own backend fight ID and the correct Boxing, Bare Knuckle, MMA, Kickboxing, or Pro Wrestling scorecard.
- The Featured Fight button first presents a fighter A/B winner choice and carries that choice into the real scorecard.
- Featured This Week and Featured Fight are independent back-office placements and may show different contests.
- Fight feed deduplication now matches by both database ID and matchup identity, including when duplicate feeds disagree on a date.
- Fight and scorecard media use consistent contained sizing rather than stretching or cropping unpredictably.
- Draft scorecard inputs remain blank until the player enters values; pool, fee, entry, and AI data remain backend-sourced.

## Preserved v9 funnel and retention features

- START HERE → confirmation → MY ENTRIES → entry-aware Watch Party.
- Dynamic AI Scouting Report buttons and per-fight report data.
- 50 FM streak save, 25 FM for FM+ members, and 75 FM skip-the-wait.
- Returning-player WELCOME BACK hero with WATCH LIVE or MAKE A PICK.
- Apparel, all five sports, leaderboard, leagues, navigation, responsive desktop layout, and performance caching from v56 remain intact.

## Validation

- `npm run build` passes under Next.js 16.2.9 and generates all 124 routes.

