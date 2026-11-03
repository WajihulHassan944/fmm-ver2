# Affiliate announcement email preview — isolated repair

The launch announcement footer now uses the owner-specified `contact@fantasymmadnesscom.com`. Other site addresses and email-provider settings are unchanged.

The existing email preview now includes a recipient selector, the selected recipient's personalized message, and their fight-share-kit poster with a full-size link. Saved custom fight artwork participates in a shared artwork-version cache key used by both this preview and the affiliate kit, so a newly saved image does not reuse the previous image's cached URL. Fight and affiliate IDs remain explicit; QR destinations, campaign text, entry/prize values and send payloads are unchanged.

Missing artwork and failed image loads are identified rather than replaced by another fight's image. The UI explicitly says that this bulk-email flow includes a share-kit link, not a poster attachment. The existing backend's separate approved-custom-poster attachment capability is not changed or selected by this repair.

Verification:

- Two actual Chromium cases pass using isolated local recipients, fight records, image responses and upload responses. Check exact footer, recipient-specific greetings/IDs, custom-upload cache refresh, image errors and missing artwork. All external browser requests blocked; zero email requests sent.
- Targeted lint: 0 errors, 3 existing warnings. Production build passes.
- Existing fight-registry regressions: 3 pass.
- Screenshot: `test-results/screenshots/affiliate-email-custom-poster-preview.png` (clearly labeled fixture artwork).

Production release authorized by the owner for this back-office fix only. Release branch: `release/backoffice-affiliate-email-preview-20261103`, based on main `6b8f083`. The application changes are limited to the email footer, preview component/styles, and shared poster image version key. Growth Engine integration commits are excluded. No backend settings, live affiliate records, email sends or payment processing are changed.

Release prerequisites repaired on the production baseline:

- Synchronized its lockfile with the existing `@vercel/blob` declaration so frozen installation succeeds.
- Applied non-forced updates within existing dependency ranges: Next.js 16.3.5 → 16.4.5, DOMPurify 3.4.15 → 3.4.17, source-map-js 1.2.1 → 1.2.2, sharp 0.35.4 → 0.35.5; pinned the compatible transitive Zod 4.6.7 patch. No major upgrade or Growth Engine configuration is included.
- Aliased the existing plain `useImageFallback` handler to `applyImageFallback` at its UpcomingFights import/call sites, eliminating the pre-existing false rules-of-hooks errors without changing behavior.

Final release-worktree checks: clean `npm ci --ignore-scripts`, full build, full lint (0 errors, 63 existing warnings), 2 back-office Chromium cases, and 3 fight-registry cases pass. Production audit: 0 high/critical/moderate, 1 existing LOW deepmerge advisory. Browser recipients, records and upload/image services were local fixtures; no emails were sent. The original testing workspaces and Growth Engine branches remain preserved.
