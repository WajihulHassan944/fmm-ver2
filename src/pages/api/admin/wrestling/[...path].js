const DEFAULT_API_BASE_URL = 'https://fantasymmadness-game-server-three.vercel.app';

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'private, no-store');
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ message: 'This endpoint supports wrestling reads only.' });
  }
  const path = Array.isArray(req.query.path) ? req.query.path : [];
  if (!path.length || path.some((part) => !part || part === '.' || part === '..' || part.includes('/'))) {
    return res.status(400).json({ message: 'A valid wrestling API path is required.' });
  }
  const authorization = String(req.headers.authorization || '');
  if (!authorization) return res.status(401).json({ message: 'Please sign in to the back office again.', code: 'ADMIN_AUTH_REQUIRED', shouldLogin: true });
  const query = new URLSearchParams();
  Object.entries(req.query).forEach(([key, value]) => {
    if (key === 'path') return;
    (Array.isArray(value) ? value : [value]).forEach((item) => {
      if (item !== undefined && item !== null) query.append(key, String(item));
    });
  });
  const base = String(process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE || DEFAULT_API_BASE_URL).trim().replace(/\/+$/, '');
  const suffix = query.size ? `?${query}` : '';
  try {
    const upstream = await fetch(`${base}/api/admin/wrestling/${path.map(encodeURIComponent).join('/')}${suffix}`, {
      headers: { Accept: 'application/json', Authorization: authorization },
      signal: AbortSignal.timeout(25000),
    });
    const contentType = upstream.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      return res.status(502).json({ message: 'The wrestling service is temporarily unavailable. Please retry loading.', code: 'WRESTLING_BACKEND_INVALID_RESPONSE' });
    }
    const payload = await upstream.json();
    return res.status(upstream.status).json(payload);
  } catch (error) {
    console.error('Wrestling admin read failed:', { name: error.name });
    return res.status(502).json({ message: 'The website could not reach the wrestling service. Please retry loading.', code: 'WRESTLING_PROXY_UNAVAILABLE' });
  }
}
