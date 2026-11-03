// Same-origin Growth Engine session endpoint (server side). See src/server/growthSessionBridge.cjs.
// POST: exchange the signed-in administrator's session for a short-lived Growth Engine session.
// DELETE: website logout — end every Growth Engine session of this administrator.
// Server-only settings are listed in src/server/growthSessionBridge.cjs (resolveBridgeConfig).
import { createGrowthSessionBridge } from '@/server/growthSessionBridge.cjs';

let bridge = null;
const getBridge = () => (bridge ||= createGrowthSessionBridge({
  env: process.env,
  // never logs tokens: event name and reason/admin email only
  log: (event, details) => console.info(`[growth-session] ${event}`, JSON.stringify(details)),
}));

const first = (v) => String(Array.isArray(v) ? v[0] : v || '').split(',')[0].trim();

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  const proto = first(req.headers['x-forwarded-proto']) || (req.socket?.encrypted ? 'https' : 'http');
  const host = first(req.headers['x-forwarded-host']) || first(req.headers.host);
  const selfOrigin = host ? `${proto}://${host}` : '';
  const ip = first(req.headers['x-forwarded-for']) || req.socket?.remoteAddress || 'unknown';
  try {
    const out = await getBridge().handle({ method: req.method, headers: req.headers, ip, selfOrigin });
    if (out.allow) res.setHeader('Allow', out.allow);
    return res.status(out.status).json(out.body);
  } catch (error) {
    console.error('[growth-session] failed:', error.message);
    return res.status(503).json({ ok: false, reason: 'growth_session_unavailable' });
  }
}

export const config = { api: { bodyParser: { sizeLimit: '2kb' } } };
