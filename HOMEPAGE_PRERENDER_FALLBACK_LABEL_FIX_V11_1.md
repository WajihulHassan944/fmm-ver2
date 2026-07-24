# Homepage prerender fallback label fix v11.1

- Restored the `MOBILE_FALLBACK_SPORT_LABELS` constant used by mobile preview fights during server-side prerendering.
- Prevents `/home` export from throwing `ReferenceError: MOBILE_FALLBACK_SPORT_LABELS is not defined`.
- No homepage design, desktop layout, routes, or API behavior changed.
- JSX transpilation and unresolved-local-identifier checks passed.
