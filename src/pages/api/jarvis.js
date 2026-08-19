import crypto from 'crypto';
import OpenAI from 'openai';

const DEFAULT_API_BASE_URL = 'https://fantasymmadness-game-server-three.vercel.app';
const WINDOW_MS = 10 * 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 20;
const MAX_MESSAGES = 14;
const MAX_MESSAGE_CHARS = 4000;
const rateWindows = new Map();

const cleanText = (value, max = MAX_MESSAGE_CHARS) => String(value || '').trim().slice(0, max);

const getBearerToken = (req) => {
  const header = String(req.headers.authorization || '');
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match?.[1]?.trim() || '';
};

const getRateKey = (req, token) => crypto
  .createHash('sha256')
  .update(`${token}:${req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown'}`)
  .digest('hex');

const withinRateLimit = (key) => {
  const now = Date.now();
  const current = rateWindows.get(key);
  if (!current || now - current.startedAt >= WINDOW_MS) {
    rateWindows.set(key, { startedAt: now, count: 1 });
    return true;
  }
  if (current.count >= MAX_REQUESTS_PER_WINDOW) return false;
  current.count += 1;
  return true;
};

const apiBase = () => String(process.env.NEXT_PUBLIC_API_BASE_URL || DEFAULT_API_BASE_URL).replace(/\/$/, '');

const adminFetch = async (path, token) => {
  const response = await fetch(`${apiBase()}${path}`, {
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
    signal: AbortSignal.timeout(8000),
  });
  const contentType = response.headers.get('content-type') || '';
  const payload = contentType.includes('application/json')
    ? await response.json().catch(() => ({}))
    : await response.text().catch(() => '');
  return { ok: response.ok, status: response.status, payload };
};

const sanitizeConversation = (messages) => (Array.isArray(messages) ? messages : [])
  .slice(-MAX_MESSAGES)
  .map((item) => ({
    role: item?.role === 'assistant' ? 'assistant' : 'user',
    content: cleanText(item?.content),
  }))
  .filter((item) => item.content);

const compactSnapshot = (health, dashboard) => {
  const raw = JSON.stringify({ health, dashboard });
  return raw.length > 12000 ? `${raw.slice(0, 12000)}…` : raw;
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ message: 'Only POST requests are allowed.' });
  }

  const token = getBearerToken(req);
  if (!token) return res.status(401).json({ message: 'Admin authentication is required.' });
  if (!process.env.OPENAI_API_KEY) return res.status(503).json({ message: 'Jarvis is not configured on this environment.' });

  const rateKey = getRateKey(req, token);
  if (!withinRateLimit(rateKey)) {
    return res.status(429).json({ message: 'Jarvis request limit reached. Try again in a few minutes.' });
  }

  const message = cleanText(req.body?.message);
  if (!message) return res.status(400).json({ message: 'Message is required.' });

  try {
    // Verify the browser's admin token against the same protected backend used by
    // the Swarm command center. This prevents the server-side AI key from being
    // exposed through a public, unauthenticated API route.
    const healthResult = await adminFetch('/api/admin/swarm/health', token);
    if (!healthResult.ok) {
      return res.status(healthResult.status === 401 || healthResult.status === 403 ? 401 : 503).json({
        message: healthResult.status === 401 || healthResult.status === 403
          ? 'Your admin session is invalid or expired.'
          : 'Could not verify the admin session with the operations backend.',
      });
    }

    const dashboardResult = await adminFetch('/api/admin/swarm/dashboard', token).catch(() => ({ ok: false, payload: null }));
    const snapshot = compactSnapshot(healthResult.payload, dashboardResult.ok ? dashboardResult.payload : null);
    const history = sanitizeConversation(req.body?.messages);

    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const response = await client.responses.create({
      model: process.env.OPENAI_JARVIS_MODEL || process.env.OPENAI_MODEL || 'gpt-5',
      store: false,
      instructions: [
        'You are Jarvis, the read-only Fantasy MMAdness back-office operations assistant.',
        'Help administrators reason about combat-fight operations, scoring, fight data quality, homepage promotion, contests, leagues, editorial content, social campaigns, SEO, affiliates, and Swarm automation.',
        'Treat the supplied back-office snapshot as current but possibly partial. Never invent missing fight records, metrics, payouts, statuses, or user data.',
        'Do not claim that you executed, published, deleted, scored, paid, or mutated anything. You only provide analysis and next-step instructions; actual changes must happen through explicit admin workflows.',
        'Prefer concise operational answers with concrete next steps. Call out uncertainty or missing data explicitly.',
        `Current read-only back-office snapshot: ${snapshot}`,
      ].join('\n'),
      input: [
        ...history.map((item) => ({ role: item.role, content: item.content })),
        { role: 'user', content: message },
      ],
    });

    const reply = cleanText(response.output_text, 12000);
    if (!reply) return res.status(502).json({ message: 'Jarvis returned an empty response.' });
    return res.status(200).json({ reply });
  } catch (error) {
    console.error('Jarvis API error:', error);
    return res.status(500).json({ message: 'Jarvis could not complete this request.' });
  }
}
