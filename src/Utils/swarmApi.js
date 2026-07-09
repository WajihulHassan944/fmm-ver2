const DEFAULT_API_BASE_URL = 'https://fantasymmadness-game-server-three.vercel.app';

export const API_BASE_URL = String(process.env.NEXT_PUBLIC_API_BASE_URL || DEFAULT_API_BASE_URL).replace(/\/$/, '');

export const SWARM_MODES = [
  { value: 'DRY_RUN', label: 'Dry run' },
  { value: 'SHADOW', label: 'Shadow' },
  { value: 'DRAFT_ONLY', label: 'Draft only' },
  { value: 'APPROVAL_REQUIRED', label: 'Approval required' },
  { value: 'AUTOMATED', label: 'Automated' },
];

export const SWARM_SPORT_OPTIONS = [
  { value: 'mma', label: 'MMA' },
  { value: 'boxing', label: 'Boxing' },
  { value: 'kickboxing', label: 'Kickboxing' },
  { value: 'bare_knuckle', label: 'Bare Knuckle' },
  { value: 'combat', label: 'General Combat' },
  { value: 'pro_wrestling', label: 'Pro Wrestling' },
];

export const SWARM_CAMPAIGN_TYPES = [
  { value: 'fight_full_campaign', label: 'Fight full campaign', sport: 'mma', copy: 'Run all fight promotion agents for one fight.' },
  { value: 'fight_tonight_campaign', label: "Tonight's fight campaign", sport: 'mma', copy: 'Fast promotion pack for a fight happening tonight.' },
  { value: 'boxing_fight_campaign', label: 'Boxing fight campaign', sport: 'boxing', copy: 'Boxing-specific blog, SEO, social, newsletter, and homepage pack.' },
  { value: 'fight_result_campaign', label: 'Fight result campaign', sport: 'mma', copy: 'Recap, result social post, and leaderboard summary after results.' },
  { value: 'pro_wrestling_match_campaign', label: 'Pro-wrestling match campaign', sport: 'pro_wrestling', copy: 'Wrestling match preview or recap automation pack.' },
  { value: 'blog_promotion_campaign', label: 'Blog promotion campaign', sport: 'combat', copy: 'Promote an approved blog across SEO, social, image, and newsletter drafts.' },
  { value: 'contest_promotion_campaign', label: 'Contest promotion campaign', sport: 'combat', copy: 'Rules/explainer, reminders, and winner announcement support.' },
  { value: 'july_10000_signup_growth_system', label: 'July 10,000 signup growth system', sport: 'combat', copy: 'Daily event calendar, fight-card, Instagram, Facebook, X, YouTube, Shorts, blog/SEO, media, and retention draft agents.' },
  { value: 'custom_campaign', label: 'Custom campaign', sport: 'combat', copy: 'Choose exactly which agents should run together.' },
];

export const CAMPAIGN_SECTION_OPTIONS = [
  { value: 'content', label: 'Blog/content', helper: 'Preview, recap, fighter/wrestler profile, FAQ, landing copy.' },
  { value: 'seo', label: 'SEO package', helper: 'Metadata, schema, canonical checks, internal links, page audit.' },
  { value: 'social', label: 'Social posts', helper: 'Twitter/X drafts, captions, reminders, result announcements.' },
  { value: 'newsletter', label: 'Email/newsletter', helper: 'Email copy users can send out for the fight or blog.' },
  { value: 'homepage', label: 'Homepage feature', helper: 'Featured-card headline and CTA copy.' },
  { value: 'media', label: 'Image prompts', helper: 'Creative prompts for fight/blog visuals.' },
  { value: 'analytics', label: 'Traffic report', helper: 'Keyword and traffic opportunity suggestions.' },
];

export const QUICK_CAMPAIGN_PRESETS = [
  {
    id: 'tonight-mma',
    label: "Promote Tonight's Fight",
    campaignType: 'fight_tonight_campaign',
    sport: 'mma',
    vertical: 'combat',
    includeAll: true,
    title: "Tonight's Fight Promo",
    copy: 'Use this for a fight happening now or tonight.',
  },
  {
    id: 'all-agents-mma',
    label: 'Run All Agents for MMA Fight',
    campaignType: 'fight_full_campaign',
    sport: 'mma',
    vertical: 'combat',
    includeAll: true,
    title: 'Full MMA Fight Campaign',
    copy: 'Blog, SEO, social, newsletter, homepage, media, traffic suggestions.',
  },
  {
    id: 'all-agents-boxing',
    label: 'Run All Agents for Boxing',
    campaignType: 'boxing_fight_campaign',
    sport: 'boxing',
    vertical: 'combat',
    includeAll: true,
    title: 'Full Boxing Fight Campaign',
    copy: 'Boxing-specific campaign language and promotion outputs.',
  },
  {
    id: 'all-agents-wrestling',
    label: 'Run All Agents for Pro Wrestling',
    campaignType: 'pro_wrestling_match_campaign',
    sport: 'pro_wrestling',
    vertical: 'pro_wrestling',
    includeAll: true,
    title: 'Full Pro-Wrestling Match Campaign',
    copy: 'Wrestling preview/recap, social, SEO, and content pack.',
  },
  {
    id: 'july-growth',
    label: 'July 10K Signup System',
    campaignType: 'july_10000_signup_growth_system',
    sport: 'combat',
    vertical: 'combat',
    includeAll: true,
    title: 'Fantasy MMadness July 10,000 Signup Growth System',
    copy: 'Run the safe daily growth pack for 30-60 approval-first content assets.',
  },
  {
    id: 'blog-promo',
    label: 'Promote Approved Blog',
    campaignType: 'blog_promotion_campaign',
    sport: 'combat',
    vertical: 'combat',
    includeAll: true,
    title: 'Blog Promotion Campaign',
    copy: 'Social draft, SEO audit, related links, image prompt, newsletter.',
  },
];

export const SWARM_TRIGGER_OPTIONS = [
  { value: 'manual', label: 'Manual' },
  { value: 'fight_published', label: 'Fight published' },
  { value: 'fight_result_updated', label: 'Fight result updated' },
  { value: 'upcoming_event', label: 'Upcoming event' },
  { value: 'fighter_added', label: 'Fighter added' },
  { value: 'fighter_updated', label: 'Fighter updated' },
  { value: 'fighter_record_changed', label: 'Fighter record changed' },
  { value: 'pro_wrestling_match_published', label: 'Pro-wrestling match published' },
  { value: 'pro_wrestling_result_updated', label: 'Pro-wrestling result updated' },
  { value: 'wrestler_added', label: 'Wrestler added' },
  { value: 'contest_created', label: 'Contest created' },
  { value: 'contest_closing_soon', label: 'Contest closing soon' },
  { value: 'contest_completed', label: 'Contest completed' },
  { value: 'blog_approved', label: 'Blog approved' },
  { value: 'daily_schedule', label: 'Daily schedule' },
  { value: 'weekly_schedule', label: 'Weekly schedule' },
  { value: 'july_growth_daily', label: 'July 10K daily growth run' },
];

export const SWARM_GROUP_LABELS = {
  content: 'Content automation',
  seo: 'SEO automation',
  social: 'Social automation',
  data: 'Data and traffic automation',
  analytics: 'Analytics and growth planning',
  media: 'Media and image briefs',
  notification: 'Community and retention',
  wrestling: 'Pro-wrestling automation',
  automation: 'System and dashboard automation',
  system: 'System health',
};

const CORE_JOB_TYPES = [
  ['content.article', 'Blog article draft', 'content', ['combat', 'pro_wrestling']],
  ['content.match-preview', 'Fight / match preview blog', 'content', ['combat']],
  ['content.event-recap', 'Fight result recap blog', 'content', ['combat']],
  ['content.event-preview', 'Upcoming event preview blog', 'content', ['combat']],
  ['content.fight-card-article', 'Fight-card article', 'content', ['combat']],
  ['content.fighter-profile', 'Fighter profile content', 'content', ['combat']],
  ['content.fighter-update-suggestion', 'Fighter update suggestion', 'content', ['combat']],
  ['content.wrestler-profile', 'Wrestler profile content', 'content', ['pro_wrestling']],
  ['content.pro-wrestling-match-preview', 'Pro-wrestling match preview', 'content', ['pro_wrestling']],
  ['content.pro-wrestling-match-recap', 'Pro-wrestling match recap', 'content', ['pro_wrestling']],
  ['content.rules-explainer', 'Contest rules / explainer', 'content', ['combat', 'pro_wrestling']],
  ['content.email-newsletter-draft', 'Email / newsletter draft', 'content', ['combat', 'pro_wrestling']],
  ['content.image-prompt', 'Image prompt generation', 'content', ['combat', 'pro_wrestling']],
  ['content.faq-generation', 'FAQ generation', 'content', ['combat', 'pro_wrestling']],
  ['content.how-to-play-suggestion', 'How-to-play content suggestion', 'content', ['combat', 'pro_wrestling']],
  ['content.landing-page-suggestion', 'Landing page suggestion', 'content', ['combat', 'pro_wrestling']],
  ['content.old-blog-refresh', 'Old blog refresh suggestion', 'content', ['combat', 'pro_wrestling']],
  ['content.blog-topic-suggestions', 'Blog topic suggestions', 'content', ['combat', 'pro_wrestling']],
  ['seo.audit', 'SEO audit / recommendations', 'seo', ['combat', 'pro_wrestling']],
  ['seo.metadata', 'SEO metadata', 'seo', ['combat', 'pro_wrestling']],
  ['seo.schema-markup', 'Schema markup', 'seo', ['combat', 'pro_wrestling']],
  ['seo.sitemap-refresh', 'Sitemap refresh plan', 'seo', ['combat', 'pro_wrestling']],
  ['seo.internal-links', 'Internal linking plan', 'seo', ['combat', 'pro_wrestling']],
  ['seo.related-post-linking', 'Related-post linking', 'seo', ['combat', 'pro_wrestling']],
  ['seo.daily-audit', 'Daily SEO audit', 'seo', ['combat', 'pro_wrestling']],
  ['seo.weekly-opportunity-report', 'Weekly traffic opportunity report', 'seo', ['combat', 'pro_wrestling']],
  ['seo.missing-pages-detector', 'Missing pages detector', 'seo', ['combat', 'pro_wrestling']],
  ['seo.low-quality-page-detector', 'Low-quality page detector', 'seo', ['combat', 'pro_wrestling']],
  ['seo.broken-link-detector', 'Broken internal link detector', 'seo', ['combat', 'pro_wrestling']],
  ['seo.missing-metadata-detector', 'Missing metadata detector', 'seo', ['combat', 'pro_wrestling']],
  ['seo.duplicate-content-detector', 'Duplicate content detector', 'seo', ['combat', 'pro_wrestling']],
  ['seo.keyword-opportunity', 'Keyword opportunity finder', 'seo', ['combat', 'pro_wrestling']],
  ['seo.canonical-check', 'Canonical URL checks', 'seo', ['combat', 'pro_wrestling']],
  ['seo.opengraph-twitter-card', 'OpenGraph / Twitter card', 'seo', ['combat', 'pro_wrestling']],
  ['seo.fight-event-structured-data', 'Fight/event structured data', 'seo', ['combat']],
  ['seo.wrestler-fighter-structured-data', 'Wrestler/fighter structured data', 'seo', ['combat', 'pro_wrestling']],
  ['seo.content-freshness-monitor', 'Content freshness monitor', 'seo', ['combat', 'pro_wrestling']],
  ['social.draft', 'Social post drafts', 'social', ['combat', 'pro_wrestling']],
  ['social.twitter-post', 'Twitter/X post draft', 'social', ['combat', 'pro_wrestling']],
  ['social.instagram-post', 'Instagram post draft', 'social', ['combat', 'pro_wrestling']],
  ['social.facebook-post', 'Facebook post draft', 'social', ['combat', 'pro_wrestling']],
  ['social.promotional-posts', 'Promotional social posts', 'social', ['combat', 'pro_wrestling']],
  ['social.result-post', 'Result social post', 'social', ['combat', 'pro_wrestling']],
  ['social.reminder-post', 'Reminder social post', 'social', ['combat', 'pro_wrestling']],
  ['social.winners-announcement', 'Winners announcement', 'social', ['combat', 'pro_wrestling']],
  ['social.youtube-caption', 'YouTube/social caption draft', 'social', ['combat', 'pro_wrestling']],
  ['social.discord-announcement', 'Discord announcement draft', 'social', ['combat', 'pro_wrestling']],
  ['social.content-calendar', 'Social content calendar', 'social', ['combat', 'pro_wrestling']],
  ['social.admin-notification', 'Admin notification draft', 'social', ['combat', 'pro_wrestling']],
  ['data.external-candidate', 'External data candidate', 'data', ['combat', 'pro_wrestling']],
  ['data.trending-mma-topic', 'Trending MMA topic finder', 'data', ['combat']],
  ['data.trending-pro-wrestling-topic', 'Trending pro-wrestling topic finder', 'data', ['pro_wrestling']],
  ['data.content-calendar', 'Content calendar', 'data', ['combat', 'pro_wrestling']],
  ['data.draft-queue-generation', 'Draft queue generation', 'data', ['combat', 'pro_wrestling']],
  ['data.competitor-gap-report', 'Competitor/content gap report', 'data', ['combat', 'pro_wrestling']],
  ['data.traffic-opportunity', 'Traffic opportunity report', 'data', ['combat', 'pro_wrestling']],
  ['data.homepage-featured-content', 'Homepage featured content plan', 'data', ['combat', 'pro_wrestling']],
  ['data.leaderboard-summary', 'Leaderboard summary', 'data', ['combat', 'pro_wrestling']],
  ['wrestling.scorecard-suggestion', 'Wrestling scorecard suggestion', 'wrestling', ['pro_wrestling']],
  ['wrestling.match-analysis', 'Wrestling match analysis', 'wrestling', ['pro_wrestling']],
  ['wrestling.wrestler-profile', 'Wrestler analysis profile', 'wrestling', ['pro_wrestling']],
  ['automation.settings-snapshot', 'Automation settings snapshot', 'automation', ['combat', 'pro_wrestling']],
  ['automation.logs-report', 'Automation logs report', 'automation', ['combat', 'pro_wrestling']],
  ['automation.failed-job-retry-report', 'Failed-job retry report', 'automation', ['combat', 'pro_wrestling']],
  ['automation.agent-performance-dashboard', 'Agent performance dashboard', 'automation', ['combat', 'pro_wrestling']],
  ['automation.traffic-growth-dashboard', 'Traffic growth dashboard', 'automation', ['combat', 'pro_wrestling']],
  ['automation.user-dashboard-fight-opportunities', 'User dashboard fight opportunities', 'automation', ['combat', 'pro_wrestling']],
  ['automation.growth-plan-1000-users', '1000-new-users growth plan', 'automation', ['combat', 'pro_wrestling']],
  ['analytics.july-10000-signup-growth-plan', 'July 10K signup growth plan', 'analytics', ['combat']],
  ['data.event-calendar-daily-update', 'Event calendar daily update', 'data', ['combat']],
  ['content.fight-card-daily-package', 'Fight-card daily package', 'content', ['combat']],
  ['content.blog-seo-daily-articles', 'Blog and SEO daily articles', 'content', ['combat']],
  ['social.instagram-growth-posts', 'Instagram growth posts', 'social', ['combat']],
  ['social.facebook-growth-posts', 'Facebook growth posts', 'social', ['combat']],
  ['social.x-growth-posts', 'X growth posts', 'social', ['combat']],
  ['social.youtube-growth-video-draft', 'YouTube growth video draft', 'social', ['combat']],
  ['social.short-form-video-pack', 'Short-form video pack', 'social', ['combat']],
  ['notification.community-retention-daily', 'Community retention daily', 'notification', ['combat']],
  ['media.branded-post-image-prompt', 'Branded post image prompt', 'media', ['combat']],
  ['data.fight-schedule-calendar-refresh', 'Fight schedule calendar refresh', 'data', ['combat', 'pro_wrestling']],
  ['system.health-check', 'System health check', 'system', ['combat', 'pro_wrestling']],
];

export const SWARM_JOB_TYPES = CORE_JOB_TYPES.map(([value, label, group, verticals]) => ({ value, label, group, verticals }));

export const getAdminToken = () => {
  if (typeof window === 'undefined') return '';
  return window.localStorage.getItem('adminAuthToken') || '';
};

export const clearAdminTokenAndRedirect = (message = 'Your admin session expired. Please login again.') => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem('adminAuthToken');
    window.sessionStorage.setItem('adminSessionMessage', message);
  } catch (_error) {
    // Ignore storage failures; redirect still matters.
  }
  if (!window.location.pathname.includes('/administration/login')) {
    window.location.assign('/administration/login?expired=1');
  }
};

const buildUrl = (path, query) => {
  const url = new URL(`${API_BASE_URL}${path}`);
  if (query && typeof query === 'object') {
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') url.searchParams.set(key, String(value));
    });
  }
  return url.toString();
};

export async function swarmRequest(path, options = {}) {
  const { query, body, headers, ...fetchOptions } = options;
  const token = getAdminToken();
  const method = fetchOptions.method || (body ? 'POST' : 'GET');
  const isFormDataBody = typeof FormData !== 'undefined' && body instanceof FormData;

  const response = await fetch(buildUrl(path, query), {
    ...fetchOptions,
    method,
    headers: {
      Accept: 'application/json',
      ...(body && !isFormDataBody ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(headers || {}),
    },
    body: body ? (isFormDataBody ? body : JSON.stringify(body)) : undefined,
  });

  const contentType = response.headers.get('content-type') || '';
  const payload = contentType.includes('application/json') ? await response.json() : await response.text();

  if (!response.ok) {
    const code = typeof payload === 'object' ? payload.code || payload.error?.code : '';
    const shouldLogin = response.status === 401 && (payload?.shouldLogin || code === 'ADMIN_TOKEN_INVALID_OR_EXPIRED' || code === 'ADMIN_TOKEN_REQUIRED');
    const message = typeof payload === 'object'
      ? payload.message || payload.code || payload.error?.message || `Request failed with HTTP ${response.status}`
      : payload || `Request failed with HTTP ${response.status}`;
    const error = new Error(message);
    error.status = response.status;
    error.payload = payload;
    if (shouldLogin) {
      error.shouldLogin = true;
      clearAdminTokenAndRedirect(message || 'Your admin session expired. Please login again.');
    }
    throw error;
  }

  return payload;
}

export const swarmApi = {
  config: () => swarmRequest('/api/admin/swarm/config'),
  health: () => swarmRequest('/api/admin/swarm/health'),
  agents: () => swarmRequest('/api/admin/swarm/agents'),
  jobTypes: (query = {}) => swarmRequest('/api/admin/swarm/job-types', { query }),
  catalog: (query = {}) => swarmRequest('/api/admin/swarm/catalog', { query }),
  settings: (query = {}) => swarmRequest('/api/admin/swarm/settings', { query }),
  updateSettings: (body = {}) => swarmRequest('/api/admin/swarm/settings', { method: 'PATCH', body }),
  dashboard: (query = {}) => swarmRequest('/api/admin/swarm/dashboard', { query }),
  runDailySchedule: (body = {}) => swarmRequest('/api/admin/swarm/schedules/daily/run', { method: 'POST', body }),
  runWeeklySchedule: (body = {}) => swarmRequest('/api/admin/swarm/schedules/weekly/run', { method: 'POST', body }),
  runDailySeo: (body = {}) => swarmRequest('/api/admin/swarm/schedules/daily/seo', { method: 'POST', body }),
  runDailySocial: (body = {}) => swarmRequest('/api/admin/swarm/schedules/daily/social', { method: 'POST', body }),
  runDailyCalendarRefresh: (body = {}) => swarmRequest('/api/admin/swarm/schedules/daily/calendar-refresh', { method: 'POST', body }),
  events: (query = {}) => swarmRequest('/api/admin/swarm/events', { query }),
  triggerEvent: (body = {}) => swarmRequest('/api/admin/swarm/events/trigger', { method: 'POST', body }),
  triggerNamedEvent: (trigger, body = {}) => swarmRequest(`/api/admin/swarm/events/${encodeURIComponent(trigger)}`, { method: 'POST', body }),
  runAutomation: (jobType, body = {}) => swarmRequest(`/api/admin/swarm/automations/${encodeURIComponent(jobType)}/run`, { method: 'POST', body }),
  campaignPacks: (query = {}) => swarmRequest('/api/admin/swarm/campaigns/packs', { query }),
  listCampaigns: (query = {}) => swarmRequest('/api/admin/swarm/campaigns', { query }),
  getCampaign: (campaignId, query = {}) => swarmRequest(`/api/admin/swarm/campaigns/${encodeURIComponent(campaignId)}`, { query }),
  createCampaign: (body = {}) => swarmRequest('/api/admin/swarm/campaigns', { method: 'POST', body }),
  createFightCampaign: (body = {}) => swarmRequest('/api/admin/swarm/campaigns/fight', { method: 'POST', body }),
  createFullFightCampaign: (body = {}) => swarmRequest('/api/admin/swarm/campaigns/fight/full', { method: 'POST', body }),
  createTonightFightCampaign: (body = {}) => swarmRequest('/api/admin/swarm/campaigns/fight/tonight', { method: 'POST', body }),
  createBoxingCampaign: (body = {}) => swarmRequest('/api/admin/swarm/campaigns/boxing', { method: 'POST', body }),
  createJulyGrowthCampaign: (body = {}) => swarmRequest('/api/admin/swarm/campaigns/july-growth', { method: 'POST', body }),
  julyGrowthConfig: () => swarmRequest('/api/admin/swarm/growth/july-10000/config'),
  julyGrowthDashboard: () => swarmRequest('/api/admin/swarm/growth/july-10000/dashboard'),
  runJulyGrowth: (body = {}) => swarmRequest('/api/admin/swarm/growth/july-10000/run', { method: 'POST', body }),
  runDailyJulyGrowth: (body = {}) => swarmRequest('/api/admin/swarm/schedules/daily/july-growth', { method: 'POST', body }),
  listJobs: (query = {}) => swarmRequest('/api/admin/swarm/jobs', { query }),
  getJob: (jobId, query = {}) => swarmRequest(`/api/admin/swarm/jobs/${encodeURIComponent(jobId)}`, { query }),
  getJobSummary: (jobId, query = {}) => swarmRequest(`/api/admin/swarm/jobs/${encodeURIComponent(jobId)}/summary`, { query }),
  createJob: (body) => swarmRequest('/api/admin/swarm/jobs', { method: 'POST', body }),
  cancelJob: (jobId, reason) => swarmRequest(`/api/admin/swarm/jobs/${encodeURIComponent(jobId)}/cancel`, { method: 'POST', body: { reason } }),
  retryJob: (jobId, reason) => swarmRequest(`/api/admin/swarm/jobs/${encodeURIComponent(jobId)}/retry`, { method: 'POST', body: { reason } }),
  listArtifacts: (query = {}) => swarmRequest('/api/admin/swarm/artifacts', { query }),
  getArtifact: (artifactId, query = {}) => swarmRequest(`/api/admin/swarm/artifacts/${encodeURIComponent(artifactId)}`, { query }),
  approveArtifact: (artifactId, body = {}) => swarmRequest(`/api/admin/swarm/artifacts/${encodeURIComponent(artifactId)}/approve`, { method: 'POST', body }),
  applySeoArtifact: (artifactId, body = {}) => swarmRequest(`/api/admin/swarm/artifacts/${encodeURIComponent(artifactId)}/apply-seo`, { method: 'POST', body }),
  rejectArtifact: (artifactId, body = {}) => swarmRequest(`/api/admin/swarm/artifacts/${encodeURIComponent(artifactId)}/reject`, { method: 'POST', body }),
  regenerateArtifact: (artifactId, body = {}) => swarmRequest(`/api/admin/swarm/artifacts/${encodeURIComponent(artifactId)}/regenerate`, { method: 'POST', body }),
};

export const isBlogLikeArtifact = (artifact) => {
  const type = String(artifact?.artifactType || '');
  const jobType = String(artifact?.jobType || '');
  return type.startsWith('content.') || jobType.startsWith('content.');
};

export const isSeoArtifact = (artifact) => {
  const type = String(artifact?.artifactType || '');
  const jobType = String(artifact?.jobType || '');
  return type.startsWith('seo.') || jobType.startsWith('seo.');
};

export const formatSwarmDate = (value) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString();
};

export const summarizeJobInput = (input) => {
  if (!input || typeof input !== 'object') return '—';
  return input.topic || input.title || input.prompt || input.eventName || input.matchId || input.blogId || input.campaignType || JSON.stringify(input).slice(0, 90);
};

export const formatJobTypeLabel = (jobType, catalog = null) => {
  if (!jobType) return '—';
  const catalogItem = catalog?.[jobType];
  const localItem = SWARM_JOB_TYPES.find((item) => item.value === jobType);
  if (catalogItem?.label) return catalogItem.label;
  if (localItem?.label) return localItem.label;
  return String(jobType).replace(/[-_.]+/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
};

export const inferJobTypeGroup = (jobType, catalog = null) => {
  if (catalog?.[jobType]?.group) return catalog[jobType].group;
  return SWARM_JOB_TYPES.find((item) => item.value === jobType)?.group || String(jobType || '').split('.')[0] || 'automation';
};

export const getAutomationCatalogFromPayload = (payload) => payload?.catalog || payload?.data?.catalog || {};
export const getAutomationSettingsFromPayload = (payload) => payload?.settings || payload?.data?.settings || {};
export const getAutomationDashboardFromPayload = (payload) => payload?.dashboard || payload?.data?.dashboard || payload || {};
export const getItemsFromPayload = (payload) => {
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.data?.items)) return payload.data.items;
  if (Array.isArray(payload?.events)) return payload.events;
  if (Array.isArray(payload?.backendEvents)) return payload.backendEvents;
  if (Array.isArray(payload?.campaigns)) return payload.campaigns;
  return [];
};

export const buildManualSourceEntity = ({ title, topic, jobType, vertical, trigger, sport, campaignType, campaignId, fightId, matchId }) => {
  const scopedFightId = fightId || matchId || '';
  return {
    type: trigger ? 'manual_automation_event' : campaignType ? 'manual_campaign' : scopedFightId ? 'combat_fight' : 'manual_prompt',
    id: scopedFightId || undefined,
    fightId: scopedFightId || undefined,
    matchId: scopedFightId || undefined,
    label: title || topic || campaignType || jobType || 'Manual swarm request',
    vertical,
    trigger,
    sport,
    campaignType,
    campaignId,
    origin: 'frontend_admin_panel',
  };
};

export const normalizeCampaignDisplay = (campaign) => ({
  id: campaign?.campaignId || campaign?.id || campaign?._id,
  title: campaign?.title || campaign?.input?.title || campaign?.sourceEntity?.label || campaign?.campaignType || 'Untitled campaign',
  type: campaign?.campaignType || 'campaign',
  status: campaign?.status || 'queued',
  sport: campaign?.sport || campaign?.input?.sport || 'combat',
  vertical: campaign?.vertical || 'combat',
  counts: campaign?.counts || {},
  jobIds: campaign?.jobIds || [],
  createdAt: campaign?.createdAt,
});
