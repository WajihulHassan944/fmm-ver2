# Frontend July Growth + Fight Data Quality Update

## Scope

Updated the frontend only. Backend and swarm repositories were not modified in this phase.

## Added

- July 10,000 signup growth admin experience.
- Fight data-quality admin experience.
- Combat fighter library review/create UI.
- Duplicate fight checker with safe dry-run/delete flow.
- Broken/missing image checker UI.
- Centralized frontend scoring constants for KO/SP/RW/RL.
- Cloudinary image optimization/fallback support in the shared optimized image component.

## Routes

- `/administration/july-growth`
- `/administration/fight-data-quality`

The existing `/administration/swarm` route also includes a new `July 10K Growth` tab.

## Safety

- No direct social publishing from frontend.
- No automatic duplicate deletion.
- No automatic fighter migration.
- No wallet, prediction, or score mutation from data-quality tools.
- Existing fight fields remain supported as fallbacks.
