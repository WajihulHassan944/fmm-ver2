import { PUBLIC_API_BASE_URL } from '@/Utils/publicApi';

export const getStoredToken = (kind = 'player') => {
  if (typeof window === 'undefined') return '';
  return window.localStorage.getItem(kind === 'admin' ? 'adminAuthToken' : kind === 'affiliate' ? 'affiliateAuthToken' : 'authToken') || '';
};

export async function fullCardRequest(path, { method = 'GET', body, kind = 'public', headers = {} } = {}) {
  const token = kind === 'public' ? '' : getStoredToken(kind);
  const response = await fetch(`${PUBLIC_API_BASE_URL}${path}`, {
    method,
    headers: { ...(body ? { 'Content-Type': 'application/json' } : {}), ...(token ? { Authorization: `Bearer ${token}` } : {}), ...headers },
    body: body ? JSON.stringify(body) : undefined,
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.message || `Request failed (${response.status})`);
  return payload;
}

export const readImageFile = (file, maxBytes = 1_250_000) => new Promise((resolve, reject) => {
  if (!file) return resolve('');
  if (file.size > maxBytes) return reject(new Error('Use an image smaller than 1.25 MB.'));
  const reader = new FileReader();
  reader.onload = () => resolve(String(reader.result || ''));
  reader.onerror = () => reject(new Error('Could not read that image.'));
  reader.readAsDataURL(file);
});

export async function uploadFullCardImage(file) {
  if (!file) return '';
  const form = new FormData(); form.append('image', file);
  const response = await fetch(`${PUBLIC_API_BASE_URL}/api/affiliates/me/full-card-media`, { method: 'POST', headers: { Authorization: `Bearer ${getStoredToken('affiliate')}` }, body: form });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.message || 'Image upload failed.');
  return payload.url;
}
