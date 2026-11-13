const DEFAULT_API_BASE_URL = 'https://fantasymmadness-game-server-three.vercel.app';
const apiBase = () => String(process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE || DEFAULT_API_BASE_URL).replace(/\/$/, '');

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ message: 'Method not allowed.' });
  }
  const authorization = String(req.headers.authorization || '');
  if (!authorization.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Admin authentication is required.', code: 'ADMIN_AUTH_REQUIRED' });
  }
  const id = String(req.query.id || '');
  if (!/^[a-f0-9]{24}$/i.test(id)) {
    return res.status(400).json({ message: 'Invalid affiliate ID.' });
  }
  try {
    const response = await fetch(`${apiBase()}/affiliates/${encodeURIComponent(id)}/verify`, {
      method: 'POST',
      headers: { Authorization: authorization, Accept: 'application/json', 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(15000),
    });
    const payload = await response.json().catch(() => ({ message: `Affiliate service returned HTTP ${response.status}.` }));
    return res.status(response.status).json(payload);
  } catch (error) {
    console.error('Affiliate approval proxy failed:', error?.message || error);
    return res.status(502).json({ message: 'The Back Office could not reach the affiliate verification service.' });
  }
}
