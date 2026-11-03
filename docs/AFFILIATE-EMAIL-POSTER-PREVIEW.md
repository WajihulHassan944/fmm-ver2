# Affiliate announcement email preview — isolated repair

The launch announcement footer now uses the owner-specified `contact@fantasymmadnesscom.com`. Other site addresses and email-provider settings are unchanged.

The existing email preview now includes a recipient selector, the selected recipient's personalized message, and their fight-share-kit poster with a full-size link. Saved custom fight artwork participates in a shared artwork-version cache key used by both this preview and the affiliate kit, so a newly saved image does not reuse the previous image's cached URL. Fight and affiliate IDs remain explicit; QR destinations, campaign text, entry/prize values and send payloads are unchanged.

Missing artwork and failed image loads are identified rather than replaced by another fight's image. The UI explicitly says that this bulk-email flow includes a share-kit link, not a poster attachment. The existing backend's separate approved-custom-poster attachment capability is not changed or selected by this repair.

Verification:

- Two actual Chromium cases pass using isolated local recipients, fight records, image responses and upload responses. Check exact footer, recipient-specific greetings/IDs, custom-upload cache refresh, image errors and missing artwork. All external browser requests blocked; zero email requests sent.
- Targeted lint: 0 errors, 3 existing warnings. Production build passes.
- Existing fight-registry regressions: 3 pass.
- Screenshot: `test-results/screenshots/affiliate-email-custom-poster-preview.png` (clearly labeled fixture artwork).

Branch: `fix/affiliate-email-poster-preview-isolated-20261103`. No production data, email, payment or live affiliate accounts changed. No merge or deployment.
