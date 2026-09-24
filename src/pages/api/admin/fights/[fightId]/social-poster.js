import { DEFAULT_PUBLIC_API_BASE_URL } from '@/Utils/publicApi';

export const config = { api: { bodyParser: false } };

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ message: 'Method not allowed.' });
  }
  const authorization = String(req.headers.authorization || '');
  if (!authorization.startsWith('Bearer ')) return res.status(401).json({ message: 'Sign in to the Back Office to upload a poster.' });
  const fightId = String(req.query.fightId || '');
  if (!/^[a-f\d]{24}$/i.test(fightId)) return res.status(400).json({ message: 'Choose a saved fight before uploading its poster.' });
  try {
    const chunks = [];
    let size = 0;
    for await (const chunk of req) {
      size += chunk.length;
      if (size > 4 * 1024 * 1024) return res.status(413).json({ message: 'The prepared image is too large. Try a smaller poster.' });
      chunks.push(chunk);
    }
    const apiBase = String(process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE || DEFAULT_PUBLIC_API_BASE_URL).replace(/\/$/, '');
    const response = await fetch(`${apiBase}/api/admin/fights/${fightId}/social-poster`, {
      method: 'POST',
      headers: { Authorization: authorization, 'Content-Type': String(req.headers['content-type'] || '') },
      body: Buffer.concat(chunks),
      signal: AbortSignal.timeout(30000),
    });
    const payload = await response.json().catch(() => ({ message: 'The poster service returned an unreadable response.' }));
    return res.status(response.status).json(payload);
  } catch (error) {
    console.error('Fight poster upload proxy failed:', error);
    return res.status(502).json({ message: 'The poster service could not be reached. Please retry.' });
  }
}
