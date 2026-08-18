# Admin Fighter Image Upload Frontend Fix

## Scope

Frontend-only update for `/administration/fighters` after backend upload support was added.

## Changes

- Added fighter image file upload control to the fighter create/edit form.
- Upload sends multipart `FormData` to the existing admin combat fighter create/update APIs.
- Kept URL input as an optional fallback for already-hosted images.
- Added selected-image preview and remove-selected-image action.
- Added client-side validation for image type and 5MB max size.
- Updated `swarmRequest` to support `FormData` without forcing `Content-Type: application/json`.
- Added paginated fighter listing with Previous/Next controls.
- Reduced fighter list page size to 25 records for cleaner admin performance.
- Fixed fighter table overflow and clipped action buttons on `/administration/fighters`.
- Kept import, cleanup, edit, deactivate, restore, and filters intact.

## Main files changed

- `src/Components/Admin/CombatFightersAdmin.jsx`
- `src/Utils/swarmApi.js`
- `src/styles/client-end-user-fixes.css`

## Notes

Backend must include the fighter upload support endpoint update where `POST /api/admin/combat-fighters` and `PATCH /api/admin/combat-fighters/:id` accept image fields.
