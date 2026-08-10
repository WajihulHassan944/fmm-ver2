# Stale marketing deployment cleanup note

The reported `fantasymmadness-ad.vercel.app` issue is a separate public deployment, not code inside the main Fantasy MMAdness frontend package.

To remove it from public discovery, the production owner should do one of the following in the Vercel account that owns that project:

1. Delete the stale Vercel project, or
2. Disable the deployment/domain, or
3. Add `X-Robots-Tag: noindex, nofollow` / robots noindex and redeploy that old project while Google drops it from search.

This frontend zip cannot directly take down a separate Vercel project or external indexed URL.
