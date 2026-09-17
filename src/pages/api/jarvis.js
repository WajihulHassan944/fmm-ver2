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

const backendErrorMessage = (result) => {
  const payload = result?.payload;
  if (payload && typeof payload === 'object') {
    return cleanText(payload.message || payload.error || payload.detail || payload.reason, 1000);
  }
  if (typeof payload === 'string') return cleanText(payload, 1000);
  return '';
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
  create_swarm_job: {
    label: 'Create a Jarvis content job',
    request: (a) => ({ method: 'POST', path: '/api/admin/swarm/jobs', body: a }),
    describe: (a) => `Create a ${a.jobType || 'custom'} job${a.title ? `: ${a.title}` : ''}.`,
  },
  create_fight_campaign: {
    label: 'Run a full fight campaign',
    request: (a) => ({ method: 'POST', path: '/api/admin/swarm/campaigns/fight/full', body: a }),
    describe: (a) => `Run all selected promotional agents for fight ${a.fightId}${a.title ? ` (${a.title})` : ''}.`,
  },
  run_schedule: {
    label: 'Run an automation schedule',
    request: (a) => {
      const paths = {
        daily: '/api/admin/swarm/schedules/daily/run',
        weekly: '/api/admin/swarm/schedules/weekly/run',
        seo: '/api/admin/swarm/schedules/daily/seo',
        social: '/api/admin/swarm/schedules/daily/social',
        calendar: '/api/admin/swarm/schedules/daily/calendar-refresh',
        growth: '/api/admin/swarm/schedules/daily/july-growth',
      };
      return { method: 'POST', path: paths[a.schedule], body: a.options || {} };
    },
    validate: (a) => ['daily', 'weekly', 'seo', 'social', 'calendar', 'growth'].includes(a.schedule),
    describe: (a) => `Run the ${a.schedule} Jarvis automation schedule now.`,
  },
  manage_artifact: {
    label: 'Review a generated output',
    request: (a) => {
      const actions = {
        approve: 'approve', publish: 'approve', reject: 'reject',
        regenerate: 'regenerate', apply_seo: 'apply-seo', generate_banner: 'generate-blog-banner',
      };
      return {
        method: 'POST',
        path: `/api/admin/swarm/artifacts/${encodeURIComponent(a.artifactId)}/${actions[a.action]}`,
        body: { ...(a.options || {}), ...(a.action === 'publish' ? { publish: true } : {}) },
      };
    },
    validate: (a) => Boolean(a.artifactId) && ['approve', 'publish', 'reject', 'regenerate', 'apply_seo', 'generate_banner'].includes(a.action),
    describe: (a) => `${String(a.action || '').replace('_', ' ')} artifact ${a.artifactId}.`,
  },
  manage_swarm_job: {
    label: 'Manage a Jarvis job',
    request: (a) => ({
      method: 'POST',
      path: `/api/admin/swarm/jobs/${encodeURIComponent(a.jobId)}/${a.action}`,
      body: { reason: a.reason || `${a.action} requested through Jarvis` },
    }),
    validate: (a) => Boolean(a.jobId) && ['cancel', 'retry'].includes(a.action),
    describe: (a) => `${a.action} Jarvis job ${a.jobId}.`,
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
  {
    type: 'function', name: 'create_swarm_job', description: 'Propose creating one content, SEO, social, research, analytics, fight-data, or operations job in the existing Jarvis/Swarm system.',
    parameters: { type: 'object', properties: { jobType: { type: 'string' }, title: { type: 'string' }, topic: { type: 'string' }, sport: { type: 'string' }, fightId: { type: 'string' }, platforms: { type: 'array', items: { type: 'string' } }, keywords: { type: 'array', items: { type: 'string' } }, metadata: { type: 'object' } }, required: ['jobType', 'topic'] },
  },
  {
    type: 'function', name: 'create_fight_campaign', description: 'Propose running the complete existing multi-agent promotional campaign for one fight.',
    parameters: { type: 'object', properties: { fightId: { type: 'string' }, title: { type: 'string' }, topic: { type: 'string' }, sport: { type: 'string' }, platforms: { type: 'array', items: { type: 'string' } }, keywords: { type: 'array', items: { type: 'string' } }, includeAll: { type: 'boolean' }, jobTypes: { type: 'array', items: { type: 'string' } } }, required: ['fightId', 'topic'] },
  },
  {
    type: 'function', name: 'run_schedule', description: 'Propose running an existing daily, weekly, SEO, social, calendar-refresh, or growth automation now.',
    parameters: { type: 'object', properties: { schedule: { type: 'string', enum: ['daily', 'weekly', 'seo', 'social', 'calendar', 'growth'] }, options: { type: 'object' } }, required: ['schedule'] },
  },
  {
    type: 'function', name: 'manage_artifact', description: 'Propose approving, publishing, rejecting, regenerating, applying SEO from, or generating a banner for an existing Jarvis output.',
    parameters: { type: 'object', properties: { artifactId: { type: 'string' }, action: { type: 'string', enum: ['approve', 'publish', 'reject', 'regenerate', 'apply_seo', 'generate_banner'] }, options: { type: 'object' } }, required: ['artifactId', 'action'] },
  },
  {
    type: 'function', name: 'manage_swarm_job', description: 'Propose cancelling or retrying an existing Jarvis job.',
    parameters: { type: 'object', properties: { jobId: { type: 'string' }, action: { type: 'string', enum: ['cancel', 'retry'] }, reason: { type: 'string' } }, required: ['jobId', 'action'] },
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
    if (def.validate && !def.validate(action.args || {})) {
      return res.status(400).json({ message: 'That action is missing required information or uses an unsupported option.' });
    }
    try {
      const { method, path, body } = def.request(action.args || {});
      const result = await adminFetch(path, token, { method, body });
      if (!result.ok) {
        const detail = backendErrorMessage(result);
        return res.status(result.status || 500).json({
          message: detail || `The admin backend rejected this action (${result.status || 500}).`,
          backendStatus: result.status || 500,
          actionType: action.type,
        });
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
    // Authenticate independently of Swarm so Jarvis can still answer when the
    // automation gateway is offline. The legacy dashboard-counts route uses
    // the same admin-token middleware as the rest of the back office.
    const [healthResult, authResult] = await Promise.all([
      adminFetch('/api/admin/swarm/health', token).catch(() => ({ ok: false, status: 503, payload: null })),
      adminFetch('/dashboard-counts', token).catch(() => ({ ok: false, status: 503, payload: null })),
    ]);
    const authenticated = healthResult.ok || authResult.ok;
    if (!authenticated) {
      const denied = [healthResult.status, authResult.status].some((status) => status === 401 || status === 403);
      return res.status(denied ? 401 : 503).json({
        message: denied ? 'Your admin session is invalid or expired.' : 'The back-office service could not verify your admin session.',
      });
    }

    const contextPaths = [
      '/api/admin/swarm/dashboard?fallbackCache=true',
      '/api/admin/swarm/jobs?limit=12',
      '/api/admin/swarm/artifacts?limit=12',
      '/api/admin/swarm/campaigns?limit=8',
      '/api/admin/swarm/catalog?fallbackLocal=true',
    ];
    const contextResults = await Promise.all(contextPaths.map((path) => adminFetch(path, token).catch(() => ({ ok: false, payload: null }))));
    const snapshot = compactSnapshot(
      healthResult.ok ? healthResult.payload : { swarmReachable: false, note: 'Swarm is temporarily unavailable; Jarvis chat remains available.' },
      {
        admin: authResult.ok ? authResult.payload : null,
        dashboard: contextResults[0].ok ? contextResults[0].payload : null,
        jobs: contextResults[1].ok ? contextResults[1].payload : null,
        artifacts: contextResults[2].ok ? contextResults[2].payload : null,
        campaigns: contextResults[3].ok ? contextResults[3].payload : null,
        catalog: contextResults[4].ok ? contextResults[4].payload : null,
      },
    );
    const history = sanitizeConversation(req.body?.messages);

    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const response = await client.responses.create({
      model: process.env.OPENAI_JARVIS_MODEL || process.env.OPENAI_MODEL || 'gpt-5',
      store: false,
      tools: TOOLS,
      instructions: [
        'You are Jarvis, the Fantasy MMAdness back-office operations assistant.',
        'You are the central assistant for fights, scoring, economics, affiliates, promoters, marketing, content, SEO, social media, data quality, growth, and Swarm automation.',
        'You can propose the supplied operational actions, content jobs, full-fight campaigns, schedules, artifact reviews, and job controls.',
        'Calling a tool only proposes the action for the admin to review and explicitly approve — it never executes by itself. Always fill in every field you can from the conversation and the snapshot; ask the admin for anything required that is missing rather than guessing at IDs or amounts.',
        'For requests not covered by a supplied tool, answer with analysis and exact next steps. Never claim an action ran unless the approved execution response confirms it.',
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
        systemStatus: { jarvis: 'online', swarm: healthResult.ok ? 'online' : 'limited' },
      });
    }

    const reply = cleanText(response.output_text, 12000);
    if (!reply) return res.status(502).json({ message: 'Jarvis returned an empty response.' });
    return res.status(200).json({ reply, systemStatus: { jarvis: 'online', swarm: healthResult.ok ? 'online' : 'limited' } });
  } catch (error) {
    console.error('Jarvis API error:', error);
    return res.status(500).json({ message: 'Jarvis could not complete this request.' });
  }
}
