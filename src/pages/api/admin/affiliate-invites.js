const DEFAULT_API_BASE_URL = 'https://fantasymmadness-game-server-three.vercel.app';

const apiBase = () => String(process.env.NEXT_PUBLIC_API_BASE_URL || DEFAULT_API_BASE_URL).replace(/\/$/, '');

export default async function handler(req, res) {
  if (!['GET', 'POST'].includes(req.method)) {
    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ message: 'Method not allowed.' });
  }

  const authorization = String(req.headers.authorization || '');
  if (!authorization.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Admin authentication is required.', code: 'ADMIN_AUTH_REQUIRED', shouldLogin: true });
  }

  try {
    const response = await fetch(`${apiBase()}/api/admin/affiliate-invites`, {
      method: req.method,
      headers: { Accept: 'application/json', Authorization: authorization, ...(req.method === 'POST' ? { 'Content-Type': 'application/json' } : {}) },
      body: req.method === 'POST' ? JSON.stringify(req.body || {}) : undefined,
      signal: AbortSignal.timeout(15000),
    });
    const payload = await response.json().catch(() => ({ message: 'Invitation service returned an unreadable response.' }));
    return res.status(response.status).json(payload);
  } catch (error) {
    console.error('Affiliate invitation proxy failed:', error);
    return res.status(502).json({ message: 'The Back Office could not reach the invitation service. Retry in a moment.' });
  }
}
