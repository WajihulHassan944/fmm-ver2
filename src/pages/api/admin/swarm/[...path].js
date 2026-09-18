const DEFAULT_API_BASE_URL = 'https://fantasymmadness-game-server-three.vercel.app';

const apiBase = () => String(process.env.NEXT_PUBLIC_API_BASE_URL || DEFAULT_API_BASE_URL).replace(/\/$/, '');

export default async function handler(req, res) {
  const path = Array.isArray(req.query.path) ? req.query.path : [];
  if (!path.length) return res.status(400).json({ message: 'A Swarm API path is required.' });

  const query = new URLSearchParams();
  Object.entries(req.query).forEach(([key, value]) => {
    if (key === 'path') return;
    (Array.isArray(value) ? value : [value]).forEach((item) => {
      if (item !== undefined && item !== null) query.append(key, String(item));
    });
  });

  const suffix = query.toString() ? `?${query.toString()}` : '';
  const target = `${apiBase()}/api/admin/swarm/${path.map(encodeURIComponent).join('/')}${suffix}`;
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
      signal: AbortSignal.timeout(55000),
    });
    const contentType = upstream.headers.get('content-type') || '';
    const payload = contentType.includes('application/json')
      ? await upstream.json().catch(() => ({}))
      : await upstream.text().catch(() => '');
    if (contentType) res.setHeader('Content-Type', contentType);
    return res.status(upstream.status).send(payload);
  } catch (error) {
    console.error('Swarm same-origin proxy failed:', error);
    return res.status(502).json({ message: 'The website could not reach the Swarm backend.', code: 'SWARM_PROXY_UNAVAILABLE' });
  }
}
