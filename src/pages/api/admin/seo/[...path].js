const DEFAULT_API_BASE_URL = 'https://fantasymmadness-game-server-three.vercel.app';

const apiBase = () => String(process.env.NEXT_PUBLIC_API_BASE_URL || DEFAULT_API_BASE_URL).replace(/\/$/, '');

export default async function handler(req, res) {
  const path = Array.isArray(req.query.path) ? req.query.path : [];
  if (!path.length) return res.status(400).json({ message: 'An SEO API path is required.' });

  const query = new URLSearchParams();
  Object.entries(req.query).forEach(([key, value]) => {
    if (key === 'path') return;
    (Array.isArray(value) ? value : [value]).forEach((item) => {
      if (item !== undefined && item !== null) query.append(key, String(item));
    });
  });

  const suffix = query.toString() ? `?${query.toString()}` : '';
  const target = `${apiBase()}/api/admin/seo/${path.map(encodeURIComponent).join('/')}${suffix}`;
  const authorization = String(req.headers.authorization || '');

  try {
    const upstream = await fetch(target, {
      method: req.method,
      headers: {
        Accept: 'application/json',
        ...(authorization ? { Authorization: authorization } : {}),
        ...(!['GET', 'HEAD'].includes(req.method) ? { 'Content-Type': 'application/json' } : {}),
      },
      body: ['GET', 'HEAD'].includes(req.method) ? undefined : JSON.stringify(req.body || {}),
      signal: AbortSignal.timeout(30000),
    });

    const contentType = upstream.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      console.error('SEO proxy received a non-JSON response:', { status: upstream.status, target, contentType });
      return res.status(502).json({
        message: 'The SEO backend returned an invalid response. Please retry in a moment.',
        code: 'SEO_BACKEND_INVALID_RESPONSE',
      });
    }

    const payload = await upstream.json().catch(() => ({}));
    return res.status(upstream.status).json(payload);
  } catch (error) {
    console.error('SEO same-origin proxy failed:', error);
    return res.status(502).json({
      message: 'The website could not reach the SEO backend. Please retry in a moment.',
      code: 'SEO_PROXY_UNAVAILABLE',
    });
  }
}
