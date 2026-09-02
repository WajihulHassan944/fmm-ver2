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

const adminFetch = async (path, token, { method = 'GET', body } = {}) => {
  const response = await fetch(`${apiBase()}${path}`, {
    method,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(12000),
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

// --------------------------------------------------------------------------
// Actions Jarvis is allowed to run. Each maps to a real, already-existing
// admin endpoint — the same ones the back-office UI itself calls — so
// approving an action here can never do anything an admin couldn't already
// do by hand. Nothing in this file executes on its own: the model can only
// PROPOSE one of these (returned to the browser for the admin to review),
// and it only actually runs when the browser calls back with execute:true
// AFTER the admin clicks Approve, using that admin's own bearer token.
// --------------------------------------------------------------------------
const ACTIONS = {
  score_fight: {
    label: 'Score a fight',
    request: (a) => ({ method: 'PUT', path: `/api/admin/matches/${encodeURIComponent(a.matchId)}/scoring`, body: a.scoring }),
    describe: (a) => `Submit official scoring for match ${a.matchId}: ${JSON.stringify(a.scoring)}`,
  },
  publish_fight: {
    label: 'Publish / promote a fight',
    request: (a) => ({ method: 'PATCH', path: `/api/admin/fights/${encodeURIComponent(a.fightId)}/homepage-promotion`, body: a.promotion || { promoted: true } }),
    describe: (a) => `${a.promotion?.promoted === false ? 'Remove' : 'Promote'} fight ${a.fightId} on the homepage: ${JSON.stringify(a.promotion || { promoted: true })}`,
  },
  delete_fights: {
    label: 'Delete fights',
    request: (a) => ({ method: 'POST', path: '/api/admin/fights/bulk-delete', body: { ids: a.fightIds } }),
    describe: (a) => `Permanently delete ${Array.isArray(a.fightIds) ? a.fightIds.length : 0} fight(s): ${JSON.stringify(a.fightIds)}`,
  },
  approve_payout: {
    label: 'Approve an affiliate payout',
    request: (a) => ({ method: 'POST', path: '/confirm-payment-affiliate', body: { affiliateId: a.affiliateId, amount: a.amount, payoutId: a.payoutId } }),
    describe: (a) => `Pay out $${a.amount} to affiliate ${a.affiliateId} (payout ${a.payoutId}) — debits their balance immediately.`,
  },
};

const TOOLS = [
  {
    type: 'function', name: 'score_fight', description: 'Propose submitting official round-by-round scoring for a match. Does not execute — only proposes for admin approval.',
    parameters: { type: 'object', properties: { matchId: { type: 'string' }, scoring: { type: 'object', description: 'The scoring payload fields the admin scoring form would submit (per-round stats, official winner, finish round/method, etc).' } }, required: ['matchId', 'scoring'] },
  },
  {
    type: 'function', name: 'publish_fight', description: 'Propose promoting or removing a fight from the homepage. Does not execute — only proposes for admin approval.',
    parameters: { type: 'object', properties: { fightId: { type: 'string' }, promotion: { type: 'object', description: 'Fields such as { promoted: true } or homepage slot/surface details.' } }, required: ['fightId'] },
  },
  {
    type: 'function', name: 'delete_fights', description: 'Propose permanently deleting one or more fights. Does not execute — only proposes for admin approval.',
    parameters: { type: 'object', properties: { fightIds: { type: 'array', items: { type: 'string' } } }, required: ['fightIds'] },
  },
  {
    type: 'function', name: 'approve_payout', description: 'Propose approving a pending affiliate payout request, debiting their balance. Does not execute — only proposes for admin approval.',
    parameters: { type: 'object', properties: { affiliateId: { type: 'string' }, payoutId: { type: 'string' }, amount: { type: 'number' } }, required: ['affiliateId', 'payoutId', 'amount'] },
  },
];

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ message: 'Only POST requests are allowed.' });
  }

  const token = getBearerToken(req);
  if (!token) return res.status(401).json({ message: 'Admin authentication is required.' });

  // ------------------------------------------------------------------------
  // Execute branch: the admin already saw the proposed action and clicked
  // Approve. No OpenAI call happens here — just forward to the real admin
  // endpoint with the admin's own token, exactly as the back office UI would.
  // ------------------------------------------------------------------------
  if (req.body?.execute) {
    const action = req.body?.action;
    const def = action && ACTIONS[action.type];
    if (!def) return res.status(400).json({ message: 'Unknown or missing action.' });
    try {
      const { method, path, body } = def.request(action.args || {});
      const result = await adminFetch(path, token, { method, body });
      if (!result.ok) {
        return res.status(result.status || 500).json({ message: result.payload?.message || 'The action was rejected by the admin backend.' });
      }
      return res.status(200).json({ ranAction: true, result: result.payload });
    } catch (error) {
      console.error('Jarvis action execution error:', error);
      return res.status(500).json({ message: 'The action could not be completed.' });
    }
  }

  if (!process.env.OPENAI_API_KEY) return res.status(503).json({ message: 'Jarvis is not configured on this environment.' });

  const rateKey = getRateKey(req, token);
  if (!withinRateLimit(rateKey)) {
    return res.status(429).json({ message: 'Jarvis request limit reached. Try again in a few minutes.' });
  }

  const message = cleanText(req.body?.message);
  if (!message) return res.status(400).json({ message: 'Message is required.' });

  try {
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
      tools: TOOLS,
      instructions: [
        'You are Jarvis, the Fantasy MMAdness back-office operations assistant.',
        'You can PROPOSE actions (score_fight, publish_fight, delete_fights, approve_payout) using the provided tools when the admin asks you to score, publish, delete, or pay out something.',
        'Calling a tool only proposes the action for the admin to review and explicitly approve — it never executes by itself. Always fill in every field you can from the conversation and the snapshot; ask the admin for anything required that is missing rather than guessing at IDs or amounts.',
        'For anything that is not one of those four action types, just answer with analysis and next steps — do not invent other tools.',
        'Treat the supplied back-office snapshot as current but possibly partial. Never invent missing fight records, metrics, payouts, statuses, or user data.',
        `Current read-only back-office snapshot: ${snapshot}`,
      ].join('\n'),
      input: [
        ...history.map((item) => ({ role: item.role, content: item.content })),
        { role: 'user', content: message },
      ],
    });

    const call = (response.output || []).find((item) => item.type === 'function_call');
    if (call && ACTIONS[call.name]) {
      let args = {};
      try { args = JSON.parse(call.arguments || '{}'); } catch { args = {}; }
      const def = ACTIONS[call.name];
      return res.status(200).json({
        reply: `Proposed: ${def.label}. Review and approve below, or tell me what to change.`,
        proposedAction: { type: call.name, label: def.label, args, description: def.describe(args) },
      });
    }

    const reply = cleanText(response.output_text, 12000);
    if (!reply) return res.status(502).json({ message: 'Jarvis returned an empty response.' });
    return res.status(200).json({ reply });
  } catch (error) {
    console.error('Jarvis API error:', error);
    return res.status(500).json({ message: 'Jarvis could not complete this request.' });
  }
}
