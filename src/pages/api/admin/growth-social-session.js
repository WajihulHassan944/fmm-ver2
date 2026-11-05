import { createSocialSessionBridge } from '@/server/growthSocialSessionBridge.cjs';

let bridge = null;
const getBridge = () => (bridge ||= createSocialSessionBridge(process.env));

const first = (v) => String(Array.isArray(v) ? v[0] : v || '').split(',')[0].trim();

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  const proto = first(req.headers['x-forwarded-proto']) || (req.socket?.encrypted ? 'https' : 'http');
  const host = first(req.headers['x-forwarded-host']) || first(req.headers.host);
  const selfOrigin = host ? `${proto}://${host}` : '';
  const ip = first(req.headers['x-forwarded-for']) || req.socket?.remoteAddress || 'unknown';
  try {
    const current = getBridge();
    if (!current) return res.status(503).json({ ok: false, reason: 'isolated_preview_sign_in_not_configured' });
    if (req.method === 'GET') return res.json({ ok: current.config.enabled, environment: 'preview', method: 'website_admin', backofficeIntegrated: process.env.NEXT_PUBLIC_FMM_GROWTH_ENGINE_ENABLED === 'true', keyId: current.config.keyId, engineOrigin: current.config.engineOrigin, siteOrigins: current.config.siteOrigins });
    const out = await current.handle({ method: req.method, headers: req.headers, ip, selfOrigin });
    if (out.allow) res.setHeader('Allow', out.allow);
    return res.status(out.status).json(out.body);
  } catch (error) {
    console.error('[growth-social-session] unavailable');
    return res.status(503).json({ ok: false, reason: 'growth_session_unavailable' });
  }
}

export const config = { api: { bodyParser: { sizeLimit: '2kb' } } };
