# Phase: Combat Fighter Library Frontend Update

## Completed

- Added `/administration/fighters` as the full combat fighter manager.
- Added admin navigation entry: Fight operations -> Fighter library.
- Added create/edit/deactivate/restore fighter UI.
- Added dry-run and actual automatic import actions to build the fighter library from existing fights.
- Updated fight creation to select Fighter A and Fighter B from the fighter library with image/name selector.
- Removed per-fight fighter image upload from the create-fight form; fighter images now come from reusable fighter records.
- Updated edit fight screen to link or change Fighter A / Fighter B from the fighter library while preserving legacy fallback fields.
- Updated `/administration/fights` to use the backend LIVE fights feed first, with legacy fallback if unavailable.
- Updated Shadow Fights Library to use the backend shadow-library feed first, with legacy fallback if unavailable.
- Updated admin fight tables/modal previews to prefer fighter-library images and fall back to old fight images.
- Linked Data Quality -> Fighter Library tab to the full fighter manager.

## Safety

- No frontend routes were removed.
- Existing match fields remain visible as legacy fallback in edit mode.
- Fighter delete is soft-delete/deactivate through backend; existing fights keep old names/images as fallback.
- Automatic import uses backend image checks and does not overwrite existing fight image fields.
