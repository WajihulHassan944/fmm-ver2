# Phase 3 Client Automation UX Update

This frontend update improves the admin swarm experience around the end-user feedback.

## Added

- Full Campaign / All Agents tab for "all the above" automation.
- Boxing campaign support as a clear admin option.
- Campaign builder with selectable automation sections.
- Visible latest activity after submitting jobs, events, or campaigns.
- Auto-refresh enabled by default for job/campaign movement.
- Campaign status list with grouped job counts.
- Improved session-expired handling for swarm admin calls.
- SEO artifact review note and Apply SEO action for supported approved metadata.
- Public homepage fight-night strip explaining MMA, Boxing, and Pro Wrestling contest discovery.
- Smarter public fight ordering: featured, live, tonight, and nearest active fights are prioritized.

## Notes

- The frontend still calls only the Vercel backend. It never calls the IONOS swarm directly.
- SEO is generated as reviewable swarm artifacts. Blog SEO can be applied through the backend when the artifact has a supported target.
- Social publishing remains controlled by backend/swarm safety flags.
