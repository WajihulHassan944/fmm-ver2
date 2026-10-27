import { adminHeaders } from '@/Utils/authFetch';
import { buildPublicApiUrl } from '@/Utils/publicApi';
import { prepareFightPosterUpload } from '@/Utils/prepareFightPosterUpload';

// Poster uploads that keep the owner's exact file.
// Small files go through the server unchanged; large files go straight to the
// image library with a server signature (the hosting request limit would
// otherwise force a shrunken copy). Only if that path is unavailable is a
// smaller copy uploaded, and the caller is told (exact: false).
const DIRECT_LIMIT = 3 * 1024 * 1024;
export const POSTER_TYPES = ['image/png', 'image/jpeg', 'image/webp'];

class SessionExpiredError extends Error {}
const readJson = async (response) => response.json().catch(() => ({}));
const checkSession = (response) => {
  if (response.status === 401 || response.status === 403) throw new SessionExpiredError('Your admin session has expired. Sign in again, then retry the upload.');
};

async function signedDirectUpload({ signPath, confirmPath, fightId, file }) {
  const signed = await fetch(buildPublicApiUrl(signPath), { method: 'POST', headers: adminHeaders({ 'Content-Type': 'application/json' }), body: JSON.stringify({ fightId }) });
  checkSession(signed);
  const ticket = await readJson(signed);
  if (!signed.ok || !ticket.uploadUrl) throw new Error(ticket.message || 'Direct upload unavailable.');
  const form = new FormData();
  Object.entries(ticket.fields || {}).forEach(([key, value]) => form.append(key, String(value)));
  form.append('file', file);
  const uploaded = await fetch(ticket.uploadUrl, { method: 'POST', body: form });
  const stored = await readJson(uploaded);
  if (!uploaded.ok || !stored.secure_url) throw new Error(stored?.error?.message || 'The image library did not accept the poster.');
  const confirmed = await fetch(buildPublicApiUrl(confirmPath), {
    method: 'POST',
    headers: adminHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ fightId, secure_url: stored.secure_url, public_id: stored.public_id, version: stored.version, signature: stored.signature, bytes: file.size }),
  });
  checkSession(confirmed);
  const saved = await readJson(confirmed);
  if (!confirmed.ok) throw new Error(saved.message || 'The poster could not be saved.');
  return saved;
}

function assertPosterFile(file) {
  if (!file || !POSTER_TYPES.includes(file.type) || file.size > 25 * 1024 * 1024) throw new Error('Choose a PNG, JPEG, or WebP image under 25 MB.');
}

// A poster for one campaign only: never replaces the fight's general poster.
export async function uploadAffiliatePosterSource(fightId, file) {
  assertPosterFile(file);
  if (file.size > DIRECT_LIMIT) {
    try {
      const saved = await signedDirectUpload({ signPath: '/api/admin/affiliate-posters/sources/direct-upload', confirmPath: '/api/admin/affiliate-posters/sources/confirm', fightId, file });
      if (saved.source?.id) return { ...saved.source, exact: true };
    } catch (error) { if (error instanceof SessionExpiredError) throw error; }
  }
  const prepared = file.size > DIRECT_LIMIT ? await prepareFightPosterUpload(file) : file;
  const form = new FormData();
  form.append('fightId', fightId);
  form.append('poster', prepared);
  const response = await fetch(buildPublicApiUrl('/api/admin/affiliate-posters/sources'), { method: 'POST', headers: adminHeaders(), body: form });
  checkSession(response);
  const result = await readJson(response);
  if (!response.ok || !result.source?.id) throw new Error(result.message || `The poster could not be uploaded (HTTP ${response.status}).`);
  return { ...result.source, exact: prepared === file };
}

// The fight's general poster (used by every affiliate kit).
export async function uploadFightPosterExact(fightId, file) {
  assertPosterFile(file);
  if (file.size > DIRECT_LIMIT) {
    try {
      const saved = await signedDirectUpload({ signPath: `/api/admin/fights/${encodeURIComponent(fightId)}/social-poster/direct-upload`, confirmPath: `/api/admin/fights/${encodeURIComponent(fightId)}/social-poster/confirm`, fightId, file });
      if (saved.poster) return { poster: saved.poster, exact: true };
    } catch (error) { if (error instanceof SessionExpiredError) throw error; }
  }
  const prepared = file.size > DIRECT_LIMIT ? await prepareFightPosterUpload(file) : file;
  const form = new FormData(); form.append('poster', prepared);
  const response = await fetch(buildPublicApiUrl(`/api/admin/fights/${encodeURIComponent(fightId)}/social-poster`), { method: 'POST', headers: adminHeaders(), body: form });
  checkSession(response);
  if (response.status === 413) throw new Error('The poster is too large for the server. Try a smaller image.');
  const result = await readJson(response);
  if (!response.ok || !result.poster) throw new Error(result.message || `Could not save the poster (HTTP ${response.status}).`);
  return { poster: result.poster, exact: prepared === file };
}
