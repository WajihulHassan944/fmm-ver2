# Admin Fighter Upload Frontend Fix

## Scope
Frontend-only update for `/administration/fighters` after backend support was added for fighter image uploads.

## Changes
- Added fighter image file upload in the create/edit fighter form.
- Kept image URL as an optional fallback for old/external URLs.
- Updated admin API request handling to support `FormData` without forcing JSON content type.
- Added live image preview for uploaded files.
- Added pagination controls to the fighter library table.
- Reduced table overflow risk on the fighter library page.
- Improved row action wrapping so Edit/Delete/Restore buttons remain visible.

## Backend compatibility
Uses existing endpoints:

- `POST /api/admin/combat-fighters`
- `PATCH /api/admin/combat-fighters/:id`

When a file is selected, the frontend sends multipart/form-data with the `image` field.
When no file is selected, the existing JSON flow still works.
