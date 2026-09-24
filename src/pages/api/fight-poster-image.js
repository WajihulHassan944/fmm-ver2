// Serve existing fight photos through our own origin so a third-party image
// without CORS headers cannot taint the poster canvas.
export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();
  try {
    const source = new URL(String(req.query.url || ''));
    const allowed = new Set([
      'res.cloudinary.com',
      new URL(process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE || 'https://fantasymmadness-game-server-three.vercel.app').hostname,
      'fantasymmadness-game-server-three.vercel.app',
    ]);
    if (source.protocol !== 'https:' || !allowed.has(source.hostname) || source.port || source.username || source.password) {
      return res.status(400).json({ message: 'Unsupported fighter photo URL.' });
    }
    const response = await fetch(source.toString(), { redirect: 'error', signal: AbortSignal.timeout(9000) });
    const mime = (response.headers.get('content-type') || '').split(';')[0].toLowerCase();
    if (!response.ok || !['image/png', 'image/jpeg', 'image/webp', 'image/avif'].includes(mime)) {
      return res.status(502).json({ message: 'The fighter photo could not be loaded.' });
    }
    if (Number(response.headers.get('content-length')) > 8_000_000) return res.status(413).end();
    const bytes = await response.arrayBuffer();
    if (bytes.byteLength > 8_000_000) return res.status(413).end();
    res.setHeader('Content-Type', mime);
    res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=3600');
    return res.status(200).send(Buffer.from(bytes));
  } catch {
    return res.status(502).json({ message: 'The fighter photo could not be loaded.' });
  }
}
