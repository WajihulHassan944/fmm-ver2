# Compact frontend package

This archive contains the complete v58 frontend source while remaining under
20 MB.

Size reduction was achieved by consolidating both homepage implementations on
the `final-v35` runtime asset set and excluding duplicated prototype-source PNGs,
legacy logo copies, and audio files that are not referenced by application code
or stylesheets. Generated folders (`node_modules` and `.next`) are also excluded.

No routes, components, checkout functionality, API integration, or referenced
runtime images were removed.
