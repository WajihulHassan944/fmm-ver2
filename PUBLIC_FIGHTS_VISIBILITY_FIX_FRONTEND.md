# Public Fights Visibility Frontend Fix

This update keeps public draft hiding in the frontend, but prevents optional legacy flags from hiding valid public fights.

## Fixed

- Frontend hides only explicit Draft fights.
- Public fight ordering still prioritizes featured/live/tonight/recent fights.
- Admin flows with `includeDrafts=true` remain unchanged.
