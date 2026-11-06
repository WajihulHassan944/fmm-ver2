'use strict';
// First-party administrator -> Growth Engine session bridge (runs ONLY on the website's server).
//
// Browser -> SAME-ORIGIN POST /api/admin/growth-session with its usual administrator session.
// This server then:
//   1. refuses anything that is not a same-origin browser request (Origin must be this site;
//      Sec-Fetch-Site, when sent, must be same-origin) — CSRF protection — and rate-limits;
//   2. checks the administrator session's shape and age, then asks the live admin authority
//      (the live backend, which issued it) whether it accepts it right now: a read-only admin route
//      must answer 404 "not found", not 401. With JWT_SECRET_ADMIN set here, the signature is also
//      checked locally;
//   3. signs a one-time Ed25519 assertion (60 s, audience fmm-growth-engine, random nonce, this
//      site's origin, NO administrator token inside) with GROWTH_SSO_SITE_PRIVATE_KEY;
//   4. sends it server to server to the isolated Growth Engine, which verifies it with the public
//      key, consumes the nonce and issues a short-lived Growth-only session;
//   5. returns only { ok, token, expiresAt (ms), engineOrigin, admin:{email} }.
// DELETE (website logout) sends a signed "revoke" assertion: every Growth session of this
// administrator ends. The administrator token goes only to the live backend that issued it.
const crypto = require('crypto');

const PROBE_PATH = '/api/admin/matches/000000000000000000000000';
const MAX_ADMIN_TOKEN_AGE_S = 12 * 3600 + 300;
const ASSERTION_S = 60;
const DEFAULT_ADMIN_API = 'https://fantasymmadness-game-server-three.vercel.app';
const DEFAULT_ENGINE = 'https://fantasymmadness-growth-isolated-tes.vercel.app';
const b64u = (b) => Buffer.from(b).toString('base64url');

function parsePrivateKey(value) {
  const raw = String(value || '').trim();
  if (!raw) return null;
  const tries = [];
  if (raw.includes('BEGIN')) tries.push(() => crypto.createPrivateKey(raw.replace(/\\n/g, '\n')));
  tries.push(() => crypto.createPrivateKey(Buffer.from(raw, 'base64').toString('utf8')));
  tries.push(() => crypto.createPrivateKey({ key: Buffer.from(raw, 'base64'), format: 'der', type: 'pkcs8' }));
  for (const t of tries) { try { const k = t(); if (k.asymmetricKeyType === 'ed25519') return k; } catch { /* next */ } }
  return null;
}

function originOf(value, { allowLoopback }) {
  try {
    const u = new URL(String(value || ''));
    const loop = /^(127\.0\.0\.1|localhost)$/.test(u.hostname);
    if (u.username || u.password) return null;
    if (u.protocol === 'https:' || (allowLoopback && loop && u.protocol === 'http:')) return { origin: u.origin, host: u.hostname, loop };
  } catch { /* invalid */ }
  return null;
}

function resolveBridgeConfig(env = {}) {
  const errors = [];
  const allowLoopback = env.GROWTH_SSO_ALLOW_LOOPBACK === 'true';
  const privateKey = parsePrivateKey(env.GROWTH_SSO_SITE_PRIVATE_KEY);
  if (!privateKey) errors.push('GROWTH_SSO_SITE_PRIVATE_KEY (Ed25519, server-only) is not configured');
  const engine = originOf(env.GROWTH_ENGINE_SERVER_URL || env.NEXT_PUBLIC_GROWTH_ENGINE_URL || DEFAULT_ENGINE, { allowLoopback });
  if (!engine) errors.push('the Growth Engine address must be https');
  const adminApi = originOf(env.FMM_ADMIN_VERIFY_URL || env.NEXT_PUBLIC_API_BASE_URL || env.NEXT_PUBLIC_API_BASE || DEFAULT_ADMIN_API, { allowLoopback });
  const adminApiOk = adminApi && (adminApi.loop || /^fantasymmadness-game-server-three[a-z0-9-]*\.vercel\.app$/.test(adminApi.host) || /(^|\.)fantasymmadness\.com$/.test(adminApi.host));
  if (!adminApiOk) errors.push('FMM_ADMIN_VERIFY_URL must be the live FANTASY MMADNESS backend');
  const siteOrigins = String(env.GROWTH_SITE_ORIGINS || '').split(',').map((o) => originOf(o.trim(), { allowLoopback })?.origin).filter(Boolean);
  const allow = String(env.GROWTH_SSO_ALLOWED_ADMINS || '').split(',').map((x) => x.trim().toLowerCase()).filter(Boolean);
  return {
    enabled: env.GROWTH_SSO !== 'off' && errors.length === 0,
    errors, privateKey, engineOrigin: engine?.origin || null, adminApi: adminApiOk ? adminApi.origin : null,
    siteOrigins, allow, localSecret: String(env.JWT_SECRET_ADMIN || ''),
    keyId: privateKey ? crypto.createHash('sha256').update(crypto.createPublicKey(privateKey).export({ type: 'spki', format: 'der' })).digest('hex').slice(0, 16) : null,
  };
}

function decodeJwt(token) {
  const parts = String(token).split('.');
  if (parts.length !== 3) return null;
  try { return { header: JSON.parse(Buffer.from(parts[0], 'base64url').toString('utf8')), payload: JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8')), parts }; } catch { return null; }
}
function verifyHs256(token, secret) {
  const d = decodeJwt(token);
  if (!d || d.header.alg !== 'HS256') return false;
  const expected = crypto.createHmac('sha256', secret).update(`${d.parts[0]}.${d.parts[1]}`).digest();
  const got = Buffer.from(d.parts[2], 'base64url');
  return got.length === expected.length && crypto.timingSafeEqual(got, expected);
}

function createGrowthSessionBridge({ env = process.env, fetchImpl = globalThis.fetch, clock = () => new Date(), log = () => {} } = {}) {
  const config = resolveBridgeConfig(env);
  const rateLimit = Math.max(1, Number(env.GROWTH_SESSION_RATE_LIMIT_PER_MIN) || 20); // per address per minute
  const hits = new Map();
  const limited = (ip) => {
    const t = Date.now(); const list = (hits.get(ip) || []).filter((x) => x > t - 60000); list.push(t); hits.set(ip, list);
    if (hits.size > 5000) hits.clear();
    return list.length > rateLimit;
  };
  const refuse = (status, reason, message) => ({ status, body: { ok: false, reason, message } });

  function signAssertion(claims) {
    const header = b64u(JSON.stringify({ alg: 'EdDSA', typ: 'fmm-admin-assertion+jwt', kid: config.keyId }));
    const body = b64u(JSON.stringify(claims));
    return `${header}.${body}.${b64u(crypto.sign(null, Buffer.from(`${header}.${body}`), config.privateKey))}`;
  }

  // -> { ok, admin } or { ok:false, status, reason }
  async function verifyAdmin(adminToken, nowS) {
    const token = String(adminToken || '');
    if (!token || token.length > 4096) return { ok: false, status: 401, reason: 'administrator_session_required' };
    const d = decodeJwt(token);
    if (!d || d.header.alg !== 'HS256' || !d.payload || typeof d.payload !== 'object') return { ok: false, status: 401, reason: 'not_an_administrator_session' };
    const p = d.payload;
    if (p.aud || p.role || p.scope) return { ok: false, status: 401, reason: 'not_an_administrator_session' };
    if (!/^[a-f0-9]{24}$/i.test(String(p.id || '')) || !/^[^@\s]+@[^@\s]+$/.test(String(p.email || ''))) return { ok: false, status: 401, reason: 'not_an_administrator_session' };
    if (!Number.isInteger(p.exp) || p.exp <= nowS + 30) return { ok: false, status: 401, reason: 'administrator_session_expired' };
    if (!Number.isInteger(p.iat) || p.iat > nowS + 60 || nowS - p.iat > MAX_ADMIN_TOKEN_AGE_S) return { ok: false, status: 401, reason: 'administrator_session_too_old' };
    if (config.localSecret && !verifyHs256(token, config.localSecret)) return { ok: false, status: 401, reason: 'administrator_session_rejected' };
    let probe;
    try {
      probe = await fetchImpl(`${config.adminApi}${PROBE_PATH}`, { method: 'GET', headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' }, redirect: 'error', signal: AbortSignal.timeout(8000) });
    } catch { return { ok: false, status: 503, reason: 'admin_authority_unreachable' }; }
    if (probe.status === 401 || probe.status === 403) return { ok: false, status: 401, reason: 'administrator_session_rejected' };
    if (probe.status !== 404) return { ok: false, status: 503, reason: `admin_authority_unexpected_${probe.status}` };
    // A generic platform/router 404 does not establish administrator authority.
    let proof; try { proof = await probe.json(); } catch { proof = null; }
    if (proof?.message !== 'Fight not found.') return { ok: false, status: 503, reason: 'admin_authority_invalid_proof' };
    const email = String(p.email).trim().toLowerCase(); const adminId = String(p.id).toLowerCase();
    if (config.allow.length && !config.allow.includes(email) && !config.allow.includes(adminId)) return { ok: false, status: 403, reason: 'admin_not_allowed_for_growth_engine' };
    return { ok: true, admin: { email, adminId, exp: p.exp, signatureVerifiedLocally: Boolean(config.localSecret) } };
  }

  async function toEngine(path, assertion) {
    let r;
    try {
      r = await fetchImpl(`${config.engineOrigin}/api/growth${path}`, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify({ assertion }), redirect: 'error', signal: AbortSignal.timeout(10000) });
    } catch { return { status: 0, json: null }; }
    let json = null; try { json = await r.json(); } catch { json = null; }
    return { status: r.status, json };
  }

  // req: { method, headers (lower-case keys), ip, selfOrigin }
  async function handle(req) {
    const method = String(req.method || '').toUpperCase();
    if (!['POST', 'DELETE'].includes(method)) return { ...refuse(405, 'method_not_allowed'), allow: 'POST, DELETE' };
    if (!config.enabled) return refuse(503, 'growth_session_bridge_not_configured', 'The Growth Engine administrator connection is not configured.');
    const h = req.headers || {};
    // CSRF / origin: only this website's own pages may call (the admin token is a bearer header, never a cookie)
    const allowedOrigins = config.siteOrigins.length ? config.siteOrigins : [req.selfOrigin].filter(Boolean);
    if (!h.origin || !allowedOrigins.includes(h.origin) || (req.selfOrigin && h.origin !== req.selfOrigin)) return refuse(403, 'cross_origin_refused');
    if (h['sec-fetch-site'] && h['sec-fetch-site'] !== 'same-origin') return refuse(403, 'cross_origin_refused');
    if (method === 'POST' && !/^application\/json\b/i.test(String(h['content-type'] || ''))) return refuse(415, 'json_required');
    if (limited(String(req.ip || 'unknown'))) return refuse(429, 'too_many_attempts', 'Too many attempts. Wait a minute and try again.');
    const adminToken = String(h.authorization || '').replace(/^Bearer\s+/i, '');
    const now = clock(); const nowS = Math.floor(now.getTime() / 1000);
    const v = await verifyAdmin(adminToken, nowS);
    if (!v.ok) {
      if (method === 'DELETE' && v.status === 401) return { status: 200, body: { ok: true, revoked: false, reason: 'administrator_session_already_ended' } }; // Growth sessions never outlive it
      log('growth_session_denied', { reason: v.reason });
      return refuse(v.status, v.reason, v.status === 503 ? 'The website could not confirm your administrator session right now. Try again.' : 'Sign in to administration again.');
    }
    const claims = { iss: 'fmm-admin-site', aud: 'fmm-growth-engine', purpose: method === 'POST' ? 'session' : 'revoke', sub: v.admin.adminId, email: v.admin.email, site: h.origin,
      jti: b64u(crypto.randomBytes(24)), iat: nowS, exp: nowS + ASSERTION_S, adminExp: v.admin.exp, verifiedBy: 'live-admin-authority' };
    const out = await toEngine(method === 'POST' ? '/admin/sso/assertion' : '/admin/sso/revoke', signAssertion(claims));
    if (method === 'DELETE') {
      if (out.status === 200) return { status: 200, body: { ok: true, revoked: true } };
      return refuse(out.status === 0 ? 503 : 502, out.json?.reason || 'growth_engine_unavailable');
    }
    if (out.status !== 200) {
      log('growth_session_engine_refused', { status: out.status, reason: out.json?.reason });
      if (out.status === 401 || out.status === 403) return refuse(out.status, out.json?.reason || 'growth_engine_refused', 'The Growth Engine did not accept this administrator.');
      return refuse(503, out.json?.reason || 'growth_engine_unavailable', 'The Growth Engine is unavailable right now. Try again.');
    }
    const j = out.json || {};
    const maxExp = Math.min(now.getTime() + 12 * 3600000, v.admin.exp * 1000);
    if (j.ok !== true || typeof j.token !== 'string' || j.token.length < 16 || j.token.length > 4096 || j.token === adminToken || !Number.isFinite(j.expiresAt) || j.expiresAt <= now.getTime() || j.expiresAt > maxExp + 1000) return refuse(502, 'growth_engine_bad_response');
    log('growth_session_issued', { admin: v.admin.email });
    return { status: 200, body: { ok: true, token: j.token, expiresAt: j.expiresAt, engineOrigin: config.engineOrigin, admin: { email: v.admin.email }, method: 'website_admin' } };
  }

  return { handle, config };
}

module.exports = { createGrowthSessionBridge, resolveBridgeConfig, parsePrivateKey, PROBE_PATH };
