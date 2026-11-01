// Client for the isolated Growth Engine (staging). It is a separate service with
// its own owner password; it never uses the live admin session and never touches
// live payments or the production database.
export const GROWTH_ENGINE_URL = (process.env.NEXT_PUBLIC_GROWTH_ENGINE_URL || 'https://fantasymmadness-growth-isolated-tes.vercel.app').replace(/\/+$/, '');
export const GROWTH_CONSOLE_URL = `${GROWTH_ENGINE_URL}/api/growth/console`;
const TOKEN_KEY = 'fmmGrowthBridgeToken';

export const growthToken = {
  get() { try { return window.sessionStorage.getItem(TOKEN_KEY) || ''; } catch (_error) { return ''; } },
  set(value) { try { if (value) window.sessionStorage.setItem(TOKEN_KEY, value); else window.sessionStorage.removeItem(TOKEN_KEY); } catch (_error) { /* storage disabled */ } },
};

export class GrowthEngineError extends Error {
  constructor(message, { status = 0, reason = '', unreachable = false } = {}) {
    super(message);
    this.status = status; this.reason = reason; this.unreachable = unreachable;
  }
}

export async function growthRequest(method, path, body) {
  const headers = { Accept: 'application/json' };
  const token = growthToken.get();
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  let response;
  try {
    response = await fetch(`${GROWTH_ENGINE_URL}/api/growth${path}`, { method, headers, body: body === undefined ? undefined : JSON.stringify(body), cache: 'no-store', credentials: 'omit' });
  } catch (_error) {
    // Network/CORS failure: typically the staging site's Vercel sign-in protection.
    throw new GrowthEngineError('The Growth Engine could not be reached from this page.', { unreachable: true });
  }
  let json = null;
  try { json = await response.json(); } catch (_error) { json = null; }
  if (response.status === 401 && path !== '/admin/login') growthToken.set('');
  if (!response.ok) throw new GrowthEngineError(json?.message || json?.reason || `Request failed (${response.status})`, { status: response.status, reason: json?.reason || '' });
  return json || {};
}

export const growthEngineApi = {
  health: () => growthRequest('GET', '/health'),
  login: async (password) => { const r = await growthRequest('POST', '/admin/login', { password }); growthToken.set(r.token); return r; },
  logout: () => growthToken.set(''),
  status: () => growthRequest('GET', '/admin/status'),
  funnel: () => growthRequest('GET', '/admin/funnel'),
  pending: () => growthRequest('GET', '/admin/drafts?status=needs_owner_review&limit=10'),
  alerts: () => growthRequest('GET', '/admin/alerts'),
  social: () => growthRequest('GET', '/admin/social?status=scheduled'),
  approve: (id) => growthRequest('POST', `/admin/drafts/${encodeURIComponent(id)}/approve`),
  reject: (id, reason) => growthRequest('POST', `/admin/drafts/${encodeURIComponent(id)}/reject`, { reason }),
  setPaused: (paused) => growthRequest('POST', '/admin/social/pause', { paused }),
};
