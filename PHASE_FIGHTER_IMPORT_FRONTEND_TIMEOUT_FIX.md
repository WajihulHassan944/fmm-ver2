# Fighter Import Frontend Timeout Fix

## Issue

The backend endpoint `POST /api/admin/combat-fighters/import-from-fights` is now intentionally batched to stay under Vercel serverless limits. The previous frontend called the endpoint only once, which was not enough to complete the full import after the backend timeout fix.

## Frontend Update

The Combat Fighter Library admin page now supports the batched backend import flow.

### Updated page

- `/administration/fighters`

### Behavior

- Dry-run import uses one lightweight planning request.
- Actual import runs repeated safe backend batches.
- The UI shows batch progress while import continues.
- The import stops when backend returns `batch.hasMore=false`.
- Existing fight fallback fields remain untouched.

### Safe defaults

Actual import sends:

```json
{
  "dryRun": false,
  "batchSize": 8,
  "checkImages": true,
  "includeShadows": true,
  "linkMatches": true,
  "overwriteImages": false,
  "syncMatchImages": false,
  "maxCandidateChecksPerFighter": 2,
  "imageTimeoutMs": 1200,
  "remoteConcurrency": 3
}
```

Dry-run sends `checkImages=false` so the preview remains quick.
