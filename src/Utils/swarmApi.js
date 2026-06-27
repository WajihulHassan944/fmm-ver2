const DEFAULT_API_BASE_URL = 'https://fantasymmadness-game-server-three.vercel.app';

export const API_BASE_URL = String(process.env.NEXT_PUBLIC_API_BASE_URL || DEFAULT_API_BASE_URL).replace(/\/$/, '');

export const SWARM_JOB_TYPES = [
  { value: 'content.article', label: 'Blog article draft', verticals: ['combat', 'pro_wrestling'] },
  { value: 'content.match-preview', label: 'Match / fight preview', verticals: ['combat', 'pro_wrestling'] },
  { value: 'content.event-recap', label: 'Event recap', verticals: ['combat', 'pro_wrestling'] },
  { value: 'seo.audit', label: 'SEO audit / recommendations', verticals: ['combat', 'pro_wrestling'] },
  { value: 'social.draft', label: 'Social post drafts', verticals: ['combat', 'pro_wrestling'] },
  { value: 'data.external-candidate', label: 'External data candidate', verticals: ['combat', 'pro_wrestling'] },
  { value: 'wrestling.scorecard-suggestion', label: 'Wrestling scorecard suggestion', verticals: ['pro_wrestling'] },
  { value: 'wrestling.match-analysis', label: 'Wrestling match analysis', verticals: ['pro_wrestling'] },
  { value: 'wrestling.wrestler-profile', label: 'Wrestler profile draft', verticals: ['pro_wrestling'] },
];

export const SWARM_MODES = [
  { value: 'DRY_RUN', label: 'Dry run' },
  { value: 'SHADOW', label: 'Shadow' },
  { value: 'DRAFT_ONLY', label: 'Draft only' },
  { value: 'APPROVAL_REQUIRED', label: 'Approval required' },
  { value: 'AUTOMATED', label: 'Automated' },
];

export const getAdminToken = () => {
  if (typeof window === 'undefined') return '';
  return window.localStorage.getItem('adminAuthToken') || '';
};

const buildUrl = (path, query) => {
  const url = new URL(`${API_BASE_URL}${path}`);
  if (query && typeof query === 'object') {
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        url.searchParams.set(key, String(value));
      }
    });
  }
  return url.toString();
};

export async function swarmRequest(path, options = {}) {
  const { query, body, headers, ...fetchOptions } = options;
  const token = getAdminToken();
  const method = fetchOptions.method || (body ? 'POST' : 'GET');

  const response = await fetch(buildUrl(path, query), {
    ...fetchOptions,
    method,
    headers: {
      Accept: 'application/json',
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(headers || {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const contentType = response.headers.get('content-type') || '';
  const payload = contentType.includes('application/json') ? await response.json() : await response.text();

  if (!response.ok) {
    const message = typeof payload === 'object'
      ? payload.message || payload.code || payload.error?.message || `Request failed with HTTP ${response.status}`
      : payload || `Request failed with HTTP ${response.status}`;
    const error = new Error(message);
    error.status = response.status;
    error.payload = payload;
    throw error;
  }

  return payload;
}

export const swarmApi = {
  config: () => swarmRequest('/api/admin/swarm/config'),
  health: () => swarmRequest('/api/admin/swarm/health'),
  agents: () => swarmRequest('/api/admin/swarm/agents'),
  listJobs: (query = {}) => swarmRequest('/api/admin/swarm/jobs', { query }),
  createJob: (body) => swarmRequest('/api/admin/swarm/jobs', { method: 'POST', body }),
  cancelJob: (jobId, reason) => swarmRequest(`/api/admin/swarm/jobs/${encodeURIComponent(jobId)}/cancel`, { method: 'POST', body: { reason } }),
  retryJob: (jobId, reason) => swarmRequest(`/api/admin/swarm/jobs/${encodeURIComponent(jobId)}/retry`, { method: 'POST', body: { reason } }),
  listArtifacts: (query = {}) => swarmRequest('/api/admin/swarm/artifacts', { query }),
  getArtifact: (artifactId, query = {}) => swarmRequest(`/api/admin/swarm/artifacts/${encodeURIComponent(artifactId)}`, { query }),
  approveArtifact: (artifactId, body = {}) => swarmRequest(`/api/admin/swarm/artifacts/${encodeURIComponent(artifactId)}/approve`, { method: 'POST', body }),
  rejectArtifact: (artifactId, body = {}) => swarmRequest(`/api/admin/swarm/artifacts/${encodeURIComponent(artifactId)}/reject`, { method: 'POST', body }),
  regenerateArtifact: (artifactId, body = {}) => swarmRequest(`/api/admin/swarm/artifacts/${encodeURIComponent(artifactId)}/regenerate`, { method: 'POST', body }),
};

export const isBlogLikeArtifact = (artifact) => {
  const type = String(artifact?.artifactType || '');
  const jobType = String(artifact?.jobType || '');
  return type.startsWith('content.') || jobType.startsWith('content.');
};

export const formatSwarmDate = (value) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString();
};

export const summarizeJobInput = (input) => {
  if (!input || typeof input !== 'object') return '—';
  return input.topic || input.title || input.prompt || input.eventName || input.matchId || JSON.stringify(input).slice(0, 90);
};
