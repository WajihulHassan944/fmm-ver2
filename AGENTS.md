# FANTASY MMADNESS currency branding

Permanent brand rule: all virtual currency is labeled **FM COINS** in uppercase across the website, mobile app, back office, and social captions. Use the shared `FMCoin` / `FMCoinAmount` components from `src/Components/Common/FMCoin.jsx`: a gold coin with FM on both sides. Do not introduce generic coin icons or dollar signs for virtual balances, entries, pots, or rewards.

Preserve underlying token field names, wallet arithmetic, API contracts, and identifiers. USD conversion inputs in the back office and actual cash checkout, merchandise, refunds, or cash-payment amounts remain USD; do not relabel dollars as coin balances.

Fight posters must remain coin-free. Caption text may use a gold coin emoji beside FM COINS amounts; never render coin graphics into the poster.

Respect reduced-motion preferences. Reuse the shared coin styling rather than defining another color or coin design.


# Permanent public-sharing link rules

- Affiliate profile links, affiliate dashboard links, user referral links, league invitations, and fight-sharing links must include a readable account or league name. Do not revert public share generators to ID-only URLs.
- Reuse `src/Utils/affiliatePublicLink.js` for name formatting and affiliate fight-sharing destinations. Handle unloaded accounts safely.
- Keep the persisted affiliate/user IDs in the tracking parameters or supported disambiguating suffixes. Never infer referral attribution from a displayed name alone.
- Resolve duplicate names safely; never select the first ambiguous account. Preserve compatibility with previously shared ID links.
- QR codes, downloaded QR images, and poster QR codes must encode the same personalized destination used by the corresponding share link.
- The user referral signup flow must preserve the original referring account ID. League and fight links must preserve their affiliate and fight IDs through signup and entry.
- Verification, password-reset, payment, authenticated API, and other security-sensitive links retain their required tokens and formats.
- Before changing public-sharing code, check name links, duplicate names, missing/unloaded names, existing ID links, referral attribution, and QR destination parity. Run the appropriate build before release.
