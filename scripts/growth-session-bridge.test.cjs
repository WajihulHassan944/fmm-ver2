'use strict';
// Unit tests for the same-origin Growth Engine session bridge (src/server/growthSessionBridge.cjs).
// No network: the live admin authority and the Growth Engine are stubbed; the real end-to-end run
// (real website backend + real engine + this website) is in the backend repository's CI.
const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('crypto');
const { createGrowthSessionBridge } = require('../src/server/growthSessionBridge.cjs');

const SITE = 'https://admin-preview.fantasymmadness.com';
const AUTH = 'https://fantasymmadness-game-server-three.vercel.app';
const ENGINE = 'https://fantasymmadness-growth-isolated-tes.vercel.app';
const keys = crypto.generateKeyPairSync('ed25519');
const privB64 = Buffer.from(keys.privateKey.export({ type: 'pkcs8', format: 'pem' })).toString('base64');
const ADMIN_SECRET = 'admin-secret-for-tests-only-0123456789abcdef';
const ID = '65f0c0ffee0000000000abcd';
const b64u = (v) => Buffer.from(typeof v === 'string' ? v : JSON.stringify(v)).toString('base64url');
const hs256 = (payload, secret = ADMIN_SECRET, header = { alg: 'HS256', typ: 'JWT' }) => { const h = b64u(header); const p = b64u(payload); return `${h}.${p}.${crypto.createHmac('sha256', secret).update(`${h}.${p}`).digest('base64url')}`; };
const nowS = () => Math.floor(Date.now() / 1000);
const adminToken = (over = {}) => hs256({ id: ID, email: 'Owner@FMM.test', iat: nowS() - 60, exp: nowS() + 3600, ...over });

function harness({ env = {}, authority = 404, engine } = {}) {
  const calls = [];
  const fetchImpl = async (url, opts = {}) => {
    calls.push({ url, opts });
    if (url.startsWith(AUTH)) { if (authority === 'down') throw new TypeError('fetch failed'); return { status: authority, json: async () => ({}) }; }
    if (url.startsWith(ENGINE)) {
      if (engine === 'down') throw new TypeError('fetch failed');
      const { assertion } = JSON.parse(opts.body);
      const [h, p, s] = assertion.split('.');
      const ok = crypto.verify(null, Buffer.from(`${h}.${p}`), keys.publicKey, Buffer.from(s, 'base64url'));
      const claims = JSON.parse(Buffer.from(p, 'base64url'));
      const result = engine ? engine({ ok, claims }) : { status: ok ? 200 : 401, body: ok ? (claims.purpose === 'session' ? { ok: true, token: 'growth-only-session-token-xyz', expiresAt: Date.now() + 1800000 } : { ok: true }) : { ok: false, reason: 'assertion_bad_signature' } };
      return { status: result.status, json: async () => result.body };
    }
    throw new Error(`unexpected request to ${url}`);
  };
  const bridge = createGrowthSessionBridge({ env: { GROWTH_SSO_SITE_PRIVATE_KEY: privB64, FMM_ADMIN_VERIFY_URL: AUTH, GROWTH_ENGINE_SERVER_URL: ENGINE, ...env }, fetchImpl });
  const call = (over = {}) => bridge.handle({ method: 'POST', ip: over.ip || '1.1.1.1', selfOrigin: SITE, headers: { origin: SITE, 'sec-fetch-site': 'same-origin', 'content-type': 'application/json', authorization: `Bearer ${over.token ?? adminToken()}`, ...(over.headers || {}) }, ...(over.method ? { method: over.method } : {}) });
  return { bridge, calls, call };
}

test('exchange: verified with the live admin authority, signed one-time assertion to the engine, only a Growth session comes back', async () => {
  const { call, calls } = harness();
  const token = adminToken();
  const r = await call({ token });
  assert.equal(r.status, 200, JSON.stringify(r.body));
  assert.deepEqual(Object.keys(r.body).sort(), ['admin', 'engineOrigin', 'expiresAt', 'method', 'ok', 'token']);
  assert.equal(r.body.engineOrigin, ENGINE); assert.equal(r.body.admin.email, 'owner@fmm.test'); assert.notEqual(r.body.token, token);
  // the administrator token went ONLY to the live admin authority, never to the engine
  const toAuthority = calls.filter((c) => c.url.startsWith(AUTH)); const toEngine = calls.filter((c) => c.url.startsWith(ENGINE));
  assert.equal(toAuthority.length, 1); assert.equal(toAuthority[0].opts.headers.Authorization, `Bearer ${token}`); assert.equal(toAuthority[0].opts.method, 'GET');
  assert.equal(toEngine.length, 1); assert.equal(JSON.stringify(toEngine[0]).includes(token), false, 'admin token reached the engine');
  assert.equal(JSON.stringify(toEngine[0]).includes(token.split('.')[2]), false);
  assert.equal(toEngine[0].opts.headers.Authorization, undefined); assert.equal(toEngine[0].opts.headers.Origin, undefined);
  const claims = JSON.parse(Buffer.from(JSON.parse(toEngine[0].opts.body).assertion.split('.')[1], 'base64url'));
  assert.equal(claims.aud, 'fmm-growth-engine'); assert.equal(claims.iss, 'fmm-admin-site'); assert.equal(claims.purpose, 'session'); assert.equal(claims.site, SITE);
  assert.equal(claims.sub, ID); assert.equal(claims.verifiedBy, 'live-admin-authority'); assert.ok(claims.exp - claims.iat <= 60); assert.ok(claims.jti.length >= 22);
});

test('CSRF / origin: only same-origin JSON POST (or DELETE) from this site', async () => {
  const { call } = harness();
  assert.equal((await call({ headers: { origin: undefined } })).status, 403);
  assert.equal((await call({ headers: { origin: 'https://evil.example' } })).body.reason, 'cross_origin_refused');
  assert.equal((await call({ headers: { 'sec-fetch-site': 'cross-site' } })).status, 403);
  assert.equal((await call({ headers: { 'content-type': 'text/plain' } })).status, 415);
  assert.equal((await call({ method: 'GET' })).status, 405);
  const pinned = harness({ env: { GROWTH_SITE_ORIGINS: 'https://www.fantasymmadness.com' } });
  assert.equal((await pinned.call()).status, 403, 'origin not on the configured list');
});

test('administrator session checks fail closed', async () => {
  const { call } = harness();
  const cases = [
    ['', 401, 'administrator_session_required'],
    ['not-a-jwt', 401, 'not_an_administrator_session'],
    [adminToken({ exp: nowS() - 5 }), 401, 'administrator_session_expired'],
    [adminToken({ iat: nowS() - 13 * 3600 }), 401, 'administrator_session_too_old'],
    [adminToken({ id: 'nope' }), 401, 'not_an_administrator_session'],
    [adminToken({ scope: 'player' }), 401, 'not_an_administrator_session'],
    [adminToken({ aud: 'fmm-growth-console' }), 401, 'not_an_administrator_session'],
    [hs256({ id: ID, email: 'a@b.c', iat: nowS(), exp: nowS() + 99 }, 'k', { alg: 'none' }), 401, 'not_an_administrator_session'],
  ];
  for (const [token, status, reason] of cases) { const r = await call({ token }); assert.deepEqual([r.status, r.body.reason], [status, reason], token); }
  assert.equal((await harness({ authority: 401 }).call()).body.reason, 'administrator_session_rejected');
  assert.equal((await harness({ authority: 403 }).call()).status, 401);
  assert.deepEqual([(await harness({ authority: 'down' }).call()).status, (await harness({ authority: 'down' }).call()).body.reason], [503, 'admin_authority_unreachable']);
  assert.equal((await harness({ authority: 200 }).call()).body.reason, 'admin_authority_unexpected_200');
  // local signature check when this site holds the admin secret
  const local = harness({ env: { JWT_SECRET_ADMIN: ADMIN_SECRET } });
  assert.equal((await local.call()).status, 200);
  const forged = await local.call({ token: hs256({ id: ID, email: 'a@b.c', iat: nowS(), exp: nowS() + 99 }, 'forged-secret') });
  assert.equal(forged.body.reason, 'administrator_session_rejected'); assert.equal(local.calls.filter((c) => c.url.startsWith(ENGINE)).length, 1, 'forged token never produced an assertion');
  assert.equal((await harness({ env: { GROWTH_SSO_ALLOWED_ADMINS: 'other@x.y' } }).call()).status, 403);
});

test('engine refusals and bad engine answers are not passed through as sessions', async () => {
  assert.equal((await harness({ engine: () => ({ status: 401, body: { ok: false, reason: 'assertion_replayed' } }) }).call()).body.reason, 'assertion_replayed');
  assert.equal((await harness({ engine: () => ({ status: 403, body: { ok: false, reason: 'admin_not_allowed_for_growth_engine' } }) }).call()).status, 403);
  assert.equal((await harness({ engine: 'down' }).call()).status, 503);
  const token = adminToken();
  assert.equal((await harness({ engine: () => ({ status: 200, body: { ok: true, token, expiresAt: Date.now() + 60000 } }) }).call({ token })).body.reason, 'growth_engine_bad_response', 'echo of the admin token refused');
  assert.equal((await harness({ engine: () => ({ status: 200, body: { ok: true, token: 'growth-only-session-token-xyz', expiresAt: Date.now() + 7200000 } }) }).call({ token: adminToken({ exp: nowS() + 600 }) })).body.reason, 'growth_engine_bad_response', 'outlives the admin session');
  assert.equal((await harness({ engine: () => ({ status: 200, body: { ok: true, token: 'growth-only-session-token-xyz', expiresAt: Date.now() - 1 } }) }).call()).body.reason, 'growth_engine_bad_response');
});

test('logout (DELETE): signed revoke assertion; an already-ended admin session needs nothing', async () => {
  const { call, calls } = harness();
  const r = await call({ method: 'DELETE', headers: { 'content-type': undefined } });
  assert.deepEqual(r.body, { ok: true, revoked: true });
  const sent = calls.find((c) => c.url === `${ENGINE}/api/growth/admin/sso/revoke`);
  assert.equal(JSON.parse(Buffer.from(JSON.parse(sent.opts.body).assertion.split('.')[1], 'base64url')).purpose, 'revoke');
  const ended = await call({ method: 'DELETE', token: adminToken({ exp: nowS() - 5 }) });
  assert.deepEqual(ended.body, { ok: true, revoked: false, reason: 'administrator_session_already_ended' });
  assert.equal((await call({ method: 'DELETE', headers: { origin: 'https://evil.example' } })).status, 403);
});

test('configuration: private key required, live authority must be an FMM host, rollback switch, rate limit', async () => {
  assert.equal((await harness({ env: { GROWTH_SSO_SITE_PRIVATE_KEY: '' } }).call()).body.reason, 'growth_session_bridge_not_configured');
  assert.equal((await harness({ env: { FMM_ADMIN_VERIFY_URL: 'https://evil.example' } }).call()).status, 503);
  assert.equal((await harness({ env: { GROWTH_SSO: 'off' } }).call()).status, 503);
  assert.equal(harness({ env: { GROWTH_ENGINE_SERVER_URL: 'http://127.0.0.1:4300' } }).bridge.config.enabled, false, 'plain http only with the loopback test switch');
  const { call } = harness(); let last;
  for (let i = 0; i < 21; i += 1) last = await call({ ip: '7.7.7.7', token: 'x' });
  assert.equal(last.status, 429);
});
