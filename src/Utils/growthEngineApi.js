// Client for the existing isolated console. Normal administrator credentials
// are sent only to an explicitly configured SAME-ORIGIN session endpoint, never
// to the iframe or external engine. Backend exchange/verification belongs to Claude.
import { getAdminToken } from '@/Utils/authFetch';
import { sameOriginSessionPath } from '@/Utils/growthEngineEmbed.cjs';
export const GROWTH_ENGINE_URL = (process.env.NEXT_PUBLIC_GROWTH_ENGINE_URL || 'https://fantasymmadness-growth-isolated-tes.vercel.app').replace(/\/+$/, '');
export const GROWTH_CONSOLE_URL = `${GROWTH_ENGINE_URL}/api/growth/console`;
const TOKEN_KEY = 'fmmGrowthBridgeToken';
const EXPIRY_KEY = 'fmmGrowthBridgeExpiry';

// Keep the freshly verified Growth-only session usable when browser storage is
// denied or full. The ordinary administrator token never enters this cache.
let bridgeSession = null;
export const growthToken = {
  get() {
    if (bridgeSession === null) {
      try { bridgeSession = { token: window.sessionStorage.getItem(TOKEN_KEY) || '', expiresAt: Number(window.sessionStorage.getItem(EXPIRY_KEY)) || 0 }; }
      catch (_error) { bridgeSession = { token: '', expiresAt: 0 }; }
    }
    if (bridgeSession.expiresAt && bridgeSession.expiresAt <= Date.now()) this.set('');
    return bridgeSession.token;
  },
  set(value, expiresAt) {
    bridgeSession = { token: value || '', expiresAt: value && expiresAt ? Number(expiresAt) : 0 };
    try {
      if (value) window.sessionStorage.setItem(TOKEN_KEY, value); else window.sessionStorage.removeItem(TOKEN_KEY);
      if (value && expiresAt) window.sessionStorage.setItem(EXPIRY_KEY, String(expiresAt)); else window.sessionStorage.removeItem(EXPIRY_KEY);
    } catch (_error) { /* The current verified session remains in memory only. */ }
  },
};

export class GrowthEngineError extends Error {
  constructor(message, { status = 0, reason = '', unreachable = false } = {}) {
    super(message);
    this.status = status; this.reason = reason; this.unreachable = unreachable;
  }
}

export async function growthRequest(method, path, body, { signal } = {}) {
  const headers = { Accept: 'application/json' };
  const token = growthToken.get();
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  let response;
  try {
    response = await fetch(`${GROWTH_ENGINE_URL}/api/growth${path}`, { method, headers, body: body === undefined ? undefined : JSON.stringify(body), cache: 'no-store', credentials: 'omit', signal });
  } catch (_error) {
    if (_error.name === 'AbortError') throw _error;
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
  health: (options) => growthRequest('GET', '/health', undefined, options),
  login: async (password) => { const r = await growthRequest('POST', '/admin/login', { password }); growthToken.set(r.token); return r; },
  exchangeAdminSession: async ({ signal } = {}) => {
    const path = sameOriginSessionPath(process.env.NEXT_PUBLIC_FMM_GROWTH_SESSION_PATH);
    if (!path) throw new GrowthEngineError('The secure administrator connection is not configured.', { status: 503, reason: 'administrator_bridge_not_configured' });
    const token = getAdminToken();
    if (!token) throw new GrowthEngineError('Sign in to administration first.', { status: 401 });
    const response = await fetch(path, { method: 'POST', cache: 'no-store', credentials: 'same-origin', signal, redirect: 'error', headers: { Accept: 'application/json', Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: '{}' });
    const result = await response.json().catch(() => null);
    if (!response.ok) { growthToken.set(''); throw new GrowthEngineError('The administrator sign-in connection is not available.', { status: response.status, reason: result?.reason || '' }); }
    if (result?.ok !== true || typeof result.token !== 'string' || result.token.length < 16 || result.token === token || result.token.length > 4096 || result.engineOrigin !== new URL(GROWTH_ENGINE_URL).origin || !Number.isFinite(result.expiresAt) || result.expiresAt <= Date.now() || result.expiresAt > Date.now() + 12 * 3600000) { growthToken.set(''); throw new GrowthEngineError('The Growth Engine session was rejected.', { status: 401 }); }
    growthToken.set(result.token, result.expiresAt);
    return result;
  },
  // Administration logout: end the Growth Engine session on the server too.
  // 1) the Growth session revokes itself at the engine (it is the only credential sent there);
  // 2) the same-origin endpoint ends every Growth session of this administrator (website logout).
  // Both are fire-and-forget (keepalive) so logout is never delayed.
  logout: () => {
    const growth = growthToken.get();
    const path = sameOriginSessionPath(process.env.NEXT_PUBLIC_FMM_GROWTH_SESSION_PATH);
    const admin = path ? getAdminToken() : '';
    try { if (growth) fetch(`${GROWTH_ENGINE_URL}/api/growth/admin/logout`, { method: 'POST', keepalive: true, cache: 'no-store', credentials: 'omit', headers: { Authorization: `Bearer ${growth}` } }).catch(() => {}); } catch (_error) { /* ignore */ }
    try { if (admin) fetch(path, { method: 'DELETE', keepalive: true, cache: 'no-store', credentials: 'same-origin', redirect: 'error', headers: { Authorization: `Bearer ${admin}` } }).catch(() => {}); } catch (_error) { /* ignore */ }
    growthToken.set('');
    if (typeof window !== 'undefined') window.dispatchEvent(new Event('fmm-growth-logout'));
  },
  session: () => growthRequest('GET', '/admin/session'),
  status: () => growthRequest('GET', '/admin/status'),
  funnel: () => growthRequest('GET', '/admin/funnel'),
  pending: () => growthRequest('GET', '/admin/drafts?status=needs_owner_review&limit=10'),
  alerts: () => growthRequest('GET', '/admin/alerts'),
  social: () => growthRequest('GET', '/admin/social?status=scheduled'),
  approve: (id) => growthRequest('POST', `/admin/drafts/${encodeURIComponent(id)}/approve`),
  reject: (id, reason) => growthRequest('POST', `/admin/drafts/${encodeURIComponent(id)}/reject`, { reason }),
  setPaused: (paused) => growthRequest('POST', '/admin/social/pause', { paused }),
};
