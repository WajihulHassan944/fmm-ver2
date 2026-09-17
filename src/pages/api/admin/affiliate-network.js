const DEFAULT_API_BASE_URL = 'https://fantasymmadness-game-server-three.vercel.app';

const apiBase = () => String(process.env.NEXT_PUBLIC_API_BASE_URL || DEFAULT_API_BASE_URL).replace(/\/$/, '');

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ message: 'Method not allowed.' });
  }

  const authorization = String(req.headers.authorization || '');
  if (!authorization.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Admin authentication is required.', code: 'ADMIN_AUTH_REQUIRED', shouldLogin: true });
  }

  try {
    const response = await fetch(`${apiBase()}/affiliates`, {
      headers: { Accept: 'application/json', Authorization: authorization },
      signal: AbortSignal.timeout(15000),
    });
    const payload = await response.json().catch(() => ({ message: 'Affiliate service returned an unreadable response.' }));
    return res.status(response.status).json(payload);
  } catch (error) {
    console.error('Affiliate network proxy failed:', error);
    return res.status(502).json({ message: 'The Back Office could not reach the affiliate service. Retry in a moment.' });
  }
}
