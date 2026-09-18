const DEFAULT_API_BASE_URL = 'https://fantasymmadness-game-server-three.vercel.app';

export const getAdminToken = (req) => {
  const match = String(req.headers.authorization || '').match(/^Bearer\s+(.+)$/i);
  return match?.[1]?.trim() || '';
};

export const requireAdmin = async (req, res) => {
  const token = getAdminToken(req);
  if (!token) {
    res.status(401).json({ message: 'Admin authentication is required.' });
    return '';
  }

  const baseUrl = String(process.env.NEXT_PUBLIC_API_BASE_URL || DEFAULT_API_BASE_URL).replace(/\/$/, '');
  try {
    const response = await fetch(`${baseUrl}/dashboard-counts`, {
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      signal: AbortSignal.timeout(10000),
    });
    if (!response.ok) {
      res.status(response.status === 401 || response.status === 403 ? response.status : 502).json({
        message: response.status === 401 || response.status === 403
          ? 'Your admin session is invalid or expired.'
          : 'The admin backend could not verify this request.',
      });
      return '';
    }
    return token;
  } catch {
    res.status(502).json({ message: 'The admin backend is unavailable.' });
    return '';
  }
};
