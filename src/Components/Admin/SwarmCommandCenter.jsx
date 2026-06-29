import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  FaBolt,
  FaBullhorn,
  FaChartLine,
  FaCalendarAlt,
  FaCheck,
  FaCog,
  FaEnvelope,
  FaExclamationTriangle,
  FaFacebook,
  FaFileAlt,
  FaGlobe,
  FaHistory,
  FaInstagram,
  FaList,
  FaMagic,
  FaPaperPlane,
  FaPause,
  FaPlay,
  FaRedo,
  FaRobot,
  FaRocket,
  FaSearch,
  FaShieldAlt,
  FaSlidersH,
  FaSyncAlt,
  FaTimes,
  FaToggleOff,
  FaToggleOn,
  FaTwitter,
  FaUserPlus,
} from 'react-icons/fa';
import {
  buildManualSourceEntity,
  CAMPAIGN_SECTION_OPTIONS,
  formatJobTypeLabel,
  formatSwarmDate,
  getAutomationCatalogFromPayload,
  getAutomationDashboardFromPayload,
  getAutomationSettingsFromPayload,
  getItemsFromPayload,
  inferJobTypeGroup,
  isBlogLikeArtifact,
  isSeoArtifact,
  normalizeCampaignDisplay,
  QUICK_CAMPAIGN_PRESETS,
  swarmApi,
  SWARM_CAMPAIGN_TYPES,
  SWARM_GROUP_LABELS,
  SWARM_JOB_TYPES,
  SWARM_MODES,
  SWARM_SPORT_OPTIONS,
  SWARM_TRIGGER_OPTIONS,
  summarizeJobInput,
} from '@/Utils/swarmApi';
import AdminSeoGrowthCenter from './AdminSeoGrowthCenter';

const DEFAULT_FORM = {
  vertical: 'combat',
  sport: 'mma',
  jobType: 'content.article',
  mode: 'DRAFT_ONLY',
  priority: 50,
  topic: '',
  title: '',
  keywords: '',
  platforms: ['x', 'twitter'],
};

const DEFAULT_CAMPAIGN_FORM = {
  campaignType: 'fight_tonight_campaign',
  sport: 'mma',
  vertical: 'combat',
  mode: 'DRAFT_ONLY',
  title: '',
  topic: '',
  fightId: '',
  eventName: '',
  includeAll: true,
  sections: CAMPAIGN_SECTION_OPTIONS.map((item) => item.value),
  automationKeys: [],
};

const DEFAULT_EVENT_FORM = {
  trigger: 'fight_published',
  vertical: 'combat',
  sport: 'mma',
  mode: '',
  title: '',
  topic: '',
  runAsCampaign: true,
  jobTypes: [],
};

const platformOptions = ['x', 'twitter', 'facebook', 'instagram', 'linkedin', 'youtube', 'discord'];

const statusClass = (value) => {
  const normalized = String(value || '').toLowerCase();
  if (['succeeded', 'awaiting_review', 'approved', 'published', 'online', 'ready', 'submitted', 'active', 'queued', 'running'].includes(normalized)) return 'is-success';
  if (['failed', 'dead_letter', 'failed_to_submit', 'cancelled', 'rejected', 'needs attention', 'disabled', 'skipped', 'error'].includes(normalized)) return 'is-danger';
  return 'is-warning';
};

const compactJson = (value) => {
  try {
    return JSON.stringify(value || {}, null, 2);
  } catch (_error) {
    return String(value || '');
  }
};

const valueFromArrayOrObject = (value) => {
  if (Array.isArray(value)) return value;
  if (value && typeof value === 'object') return Object.values(value);
  return [];
};

const getArtifactPayload = (artifact) => artifact?.payload || artifact?.swarmArtifact?.payload || {};

const getArtifactTitle = (artifact) => {
  const payload = getArtifactPayload(artifact);
  return artifact?.title || payload.metaTitle || payload.header || payload.title || payload.seoTitle || payload.headline || artifact?.artifactId || 'Untitled artifact';
};

const getArtifactSummary = (artifact) => {
  const payload = getArtifactPayload(artifact);
  return artifact?.summary || payload.metaDescription || payload.description || payload.summary || payload.body || payload.content || payload.applicationPlan?.summary || 'No summary returned yet.';
};

const buildCatalogRows = (catalog) => {
  const remoteRows = Object.entries(catalog || {}).map(([jobType, item]) => {
    const local = SWARM_JOB_TYPES.find((entry) => entry.value === jobType);
    return {
      value: jobType,
      label: item?.label || local?.label || formatJobTypeLabel(jobType),
      group: item?.group || local?.group || inferJobTypeGroup(jobType, catalog),
      verticals: local?.verticals || ['combat', 'pro_wrestling'],
      description: item?.description || item?.notes || '',
      suggestedTriggers: item?.suggestedTriggers || item?.triggers || [],
      defaultMode: item?.defaultMode || 'DRAFT_ONLY',
      adminControls: item?.adminControls || [],
    };
  });

  if (remoteRows.length) return remoteRows.sort((a, b) => a.group.localeCompare(b.group) || a.label.localeCompare(b.label));
  return SWARM_JOB_TYPES.map((item) => ({ ...item, description: '', suggestedTriggers: [], defaultMode: 'DRAFT_ONLY', adminControls: [] }));
};

const normalizeDashboardCounts = (dashboard, health) => {
  const cache = health?.cache || {};
  const jobCounts = valueFromArrayOrObject(dashboard?.jobCounts).reduce((acc, item) => ({ ...acc, [item?._id || item?.status || 'unknown']: item?.count || 0 }), {});
  const artifactCounts = valueFromArrayOrObject(dashboard?.artifactCounts).reduce((acc, item) => ({ ...acc, [item?._id || item?.reviewStatus || 'unknown']: item?.count || 0 }), {});
  return {
    jobs: cache.jobs || Object.values(jobCounts).reduce((sum, count) => sum + Number(count || 0), 0),
    artifacts: cache.artifacts || Object.values(artifactCounts).reduce((sum, count) => sum + Number(count || 0), 0),
    awaitingReview: cache.awaitingReview || artifactCounts.AWAITING_REVIEW || artifactCounts.DRAFT || 0,
    failedJobs: cache.failedJobs || jobCounts.failed || jobCounts.dead_letter || 0,
    enabledAutomations: dashboard?.enabledAutomationCount || 0,
    totalAutomations: dashboard?.totalAutomationCount || SWARM_JOB_TYPES.length,
    campaigns: cache.campaigns || dashboard?.campaigns || 0,
    activeCampaigns: cache.activeCampaigns || dashboard?.activeCampaigns || 0,
  };
};

const campaignCopy = (campaignType) => SWARM_CAMPAIGN_TYPES.find((item) => item.value === campaignType)?.copy || 'Run a grouped automation campaign.';
const campaignLabel = (campaignType) => SWARM_CAMPAIGN_TYPES.find((item) => item.value === campaignType)?.label || String(campaignType || 'Campaign').replace(/_/g, ' ');

const inferVerticalFromSport = (sport) => (sport === 'pro_wrestling' ? 'pro_wrestling' : 'combat');

const buildPromptFallback = (title, topic, fallback) => topic || title || fallback || 'Run automation for the selected item.';

const SwarmCommandCenter = () => {
  const messageRef = useRef(null);
  const [activeTab, setActiveTab] = useState('campaigns');
  const [form, setForm] = useState(DEFAULT_FORM);
  const [campaignForm, setCampaignForm] = useState(DEFAULT_CAMPAIGN_FORM);
  const [eventForm, setEventForm] = useState(DEFAULT_EVENT_FORM);
  const [filters, setFilters] = useState({ vertical: '', status: '', reviewStatus: '', group: '', search: '', sport: '' });
  const [config, setConfig] = useState(null);
  const [health, setHealth] = useState(null);
  const [catalogPayload, setCatalogPayload] = useState(null);
  const [settingsPayload, setSettingsPayload] = useState(null);
  const [dashboardPayload, setDashboardPayload] = useState(null);
  const [campaignPacks, setCampaignPacks] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [events, setEvents] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [artifacts, setArtifacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [actionId, setActionId] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' });
  const [recentSubmission, setRecentSubmission] = useState(null);
  const [expandedArtifactId, setExpandedArtifactId] = useState('');
  const [expandedEventId, setExpandedEventId] = useState('');
  const [expandedCampaignId, setExpandedCampaignId] = useState('');
  const [seoTargetByArtifact, setSeoTargetByArtifact] = useState({});
  const [autoRefresh, setAutoRefresh] = useState(true);

  const catalog = useMemo(() => getAutomationCatalogFromPayload(catalogPayload), [catalogPayload]);
  const settings = useMemo(() => getAutomationSettingsFromPayload(settingsPayload), [settingsPayload]);
  const dashboard = useMemo(() => getAutomationDashboardFromPayload(dashboardPayload), [dashboardPayload]);
  const catalogRows = useMemo(() => buildCatalogRows(catalog), [catalog]);
  const counts = useMemo(() => normalizeDashboardCounts(dashboard, health), [dashboard, health]);
  const displayedCampaigns = useMemo(() => campaigns.map(normalizeCampaignDisplay), [campaigns]);

  const availableJobTypes = useMemo(
    () => catalogRows.filter((item) => !Array.isArray(item.verticals) || item.verticals.length === 0 || item.verticals.includes(form.vertical)),
    [catalogRows, form.vertical],
  );

  const visibleAutomationRows = useMemo(() => {
    const search = filters.search.trim().toLowerCase();
    return catalogRows.filter((item) => {
      const control = settings?.automations?.[item.value] || {};
      const groupMatches = !filters.group || item.group === filters.group;
      const textMatches = !search || `${item.value} ${item.label} ${item.description}`.toLowerCase().includes(search);
      const verticalMatches = !filters.vertical || item.verticals.includes(filters.vertical) || control.vertical === filters.vertical;
      return groupMatches && textMatches && verticalMatches;
    });
  }, [catalogRows, filters.group, filters.search, filters.vertical, settings]);

  const online = Boolean(health?.swarmReachable);
  const globalSettings = settings?.global || {};

  const showMessage = useCallback((nextMessage, { scroll = true } = {}) => {
    setMessage(nextMessage);
    if (scroll && typeof window !== 'undefined') {
      window.setTimeout(() => {
        messageRef.current?.scrollIntoView?.({ behavior: 'smooth', block: 'center' });
      }, 50);
    }
  }, []);

  const handleError = useCallback((error, fallback) => {
    if (error?.shouldLogin) return;
    showMessage({ type: 'error', text: error?.message || fallback || 'Action failed.' });
  }, [showMessage]);

  const loadSwarm = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);
    try {
      const jobQuery = { limit: 20, fallbackCache: true };
      const artifactQuery = { limit: 20, fallbackCache: true };
      const campaignQuery = { limit: 20, fallbackCache: true };
      if (filters.vertical) {
        jobQuery.vertical = filters.vertical;
        artifactQuery.vertical = filters.vertical;
        campaignQuery.vertical = filters.vertical;
      }
      if (filters.status) jobQuery.status = filters.status;
      if (filters.reviewStatus) artifactQuery.reviewStatus = filters.reviewStatus;
      if (filters.sport) campaignQuery.sport = filters.sport;

      const [configResult, healthResult, jobsResult, artifactsResult, catalogResult, settingsResult, dashboardResult, eventsResult, campaignPacksResult, campaignsResult] = await Promise.allSettled([
        swarmApi.config(),
        swarmApi.health(),
        swarmApi.listJobs(jobQuery),
        swarmApi.listArtifacts(artifactQuery),
        swarmApi.catalog({ fallbackLocal: true }),
        swarmApi.settings({ fallbackLocal: true }),
        swarmApi.dashboard({ fallbackCache: true }),
        swarmApi.events({ limit: 14 }),
        swarmApi.campaignPacks({ fallbackLocal: true }),
        swarmApi.listCampaigns(campaignQuery),
      ]);

      setConfig(configResult.status === 'fulfilled' ? configResult.value : null);
      setHealth(healthResult.status === 'fulfilled' ? healthResult.value : null);
      setJobs(jobsResult.status === 'fulfilled' ? getItemsFromPayload(jobsResult.value) : []);
      setArtifacts(artifactsResult.status === 'fulfilled' ? getItemsFromPayload(artifactsResult.value) : []);
      setCatalogPayload(catalogResult.status === 'fulfilled' ? catalogResult.value : null);
      setSettingsPayload(settingsResult.status === 'fulfilled' ? settingsResult.value : null);
      setDashboardPayload(dashboardResult.status === 'fulfilled' ? dashboardResult.value : null);
      setEvents(eventsResult.status === 'fulfilled' ? getItemsFromPayload(eventsResult.value) : []);
      setCampaignPacks(campaignPacksResult.status === 'fulfilled' ? getItemsFromPayload(campaignPacksResult.value) : []);
      setCampaigns(campaignsResult.status === 'fulfilled' ? getItemsFromPayload(campaignsResult.value) : []);

      const rejected = [configResult, healthResult, jobsResult, artifactsResult, catalogResult, settingsResult, dashboardResult, eventsResult, campaignPacksResult, campaignsResult]
        .find((item) => item.status === 'rejected' && !item.reason?.shouldLogin);
      if (rejected) {
        showMessage({ type: 'warning', text: rejected.reason?.message || 'Some swarm automation data could not be loaded.' }, { scroll: !silent });
      } else if (!silent) {
        showMessage({ type: 'success', text: 'Swarm automation panel refreshed.' }, { scroll: false });
      }
    } catch (error) {
      handleError(error, 'Unable to load swarm automation panel.');
    } finally {
      if (!silent) setLoading(false);
    }
  }, [filters.reviewStatus, filters.sport, filters.status, filters.vertical, handleError, showMessage]);

  useEffect(() => {
    loadSwarm();
  }, [loadSwarm]);

  useEffect(() => {
    if (!autoRefresh) return undefined;
    const id = window.setInterval(() => loadSwarm({ silent: true }), 12000);
    return () => window.clearInterval(id);
  }, [autoRefresh, loadSwarm]);

  useEffect(() => {
    if (!availableJobTypes.some((item) => item.value === form.jobType)) {
      setForm((current) => ({ ...current, jobType: availableJobTypes[0]?.value || 'content.article' }));
    }
  }, [availableJobTypes, form.jobType]);

  const updateForm = (field, value) => setForm((current) => ({ ...current, [field]: value }));
  const updateCampaignForm = (field, value) => setCampaignForm((current) => ({ ...current, [field]: value }));
  const updateEventForm = (field, value) => setEventForm((current) => ({ ...current, [field]: value }));

  const toggleArray = (stateUpdater, field, value) => {
    stateUpdater((current) => {
      const currentSet = new Set(current[field] || []);
      if (currentSet.has(value)) currentSet.delete(value);
      else currentSet.add(value);
      return { ...current, [field]: Array.from(currentSet) };
    });
  };

  const togglePlatform = (platform) => toggleArray(setForm, 'platforms', platform);
  const toggleCampaignSection = (section) => toggleArray(setCampaignForm, 'sections', section);
  const toggleCampaignAutomationKey = (automationKey) => toggleArray(setCampaignForm, 'automationKeys', automationKey);
  const toggleEventJobType = (jobType) => toggleArray(setEventForm, 'jobTypes', jobType);

  const applyPresetToCampaign = (preset) => {
    setCampaignForm((current) => ({
      ...current,
      campaignType: preset.campaignType,
      sport: preset.sport,
      vertical: preset.vertical || inferVerticalFromSport(preset.sport),
      title: current.title || preset.title,
      includeAll: preset.includeAll !== false,
      sections: CAMPAIGN_SECTION_OPTIONS.map((item) => item.value),
    }));
    setActiveTab('campaigns');
    showMessage({ type: 'success', text: `${preset.label} selected. Add fight details/context and click Run campaign.` });
  };

  const saveSettingsPatch = async (body, successText) => {
    setSettingsSaving(true);
    showMessage({ type: '', text: '' }, { scroll: false });
    try {
      const result = await swarmApi.updateSettings(body);
      setSettingsPayload(result);
      showMessage({ type: 'success', text: successText || 'Automation settings saved.' });
      await loadSwarm({ silent: true });
    } catch (error) {
      handleError(error, 'Could not save automation settings.');
    } finally {
      setSettingsSaving(false);
    }
  };

  const updateGlobalSetting = (field, value) => {
    saveSettingsPatch({ global: { ...(settings?.global || {}), [field]: value }, reason: `admin-updated-global-${field}` });
  };

  const updateAutomationControl = (jobType, patch) => {
    const current = settings?.automations?.[jobType] || {};
    saveSettingsPatch({ automations: { [jobType]: { ...current, ...patch } }, reason: `admin-updated-${jobType}` }, `${formatJobTypeLabel(jobType, catalog)} settings updated.`);
  };

  const submitJob = async (event) => {
    event.preventDefault();
    const topic = form.topic.trim();
    const title = form.title.trim();
    if (!topic && !title) {
      showMessage({ type: 'error', text: 'Add a topic, prompt, or title before creating a swarm job.' });
      return;
    }

    setSubmitting(true);
    showMessage({ type: '', text: '' }, { scroll: false });
    try {
      const keywords = form.keywords.split(',').map((item) => item.trim()).filter(Boolean);
      const vertical = form.sport === 'pro_wrestling' ? 'pro_wrestling' : form.vertical;
      const payload = {
        vertical,
        jobType: form.jobType,
        mode: form.mode,
        priority: Number(form.priority) || 50,
        sourceEntity: buildManualSourceEntity({ title, topic, jobType: form.jobType, vertical, sport: form.sport }),
        input: {
          topic: topic || title,
          title: title || topic,
          prompt: topic || title,
          keywords,
          sport: form.sport,
          platforms: form.jobType.startsWith('social.') ? form.platforms : undefined,
          requestedOutput: form.jobType.startsWith('content.') ? 'blog-ready structured draft with SEO fields and sections' : undefined,
        },
        metadata: { submittedFrom: 'fantasymmadness-frontend-swarm-command-center', frontendMode: form.mode, sport: form.sport },
      };

      const result = await swarmApi.createJob(payload);
      setRecentSubmission({ type: 'job', id: result?.job?.jobId || result?.job?.id, title: title || topic, status: result?.job?.status || 'submitted', createdAt: new Date().toISOString() });
      setAutoRefresh(true);
      showMessage({ type: 'success', text: `Job submitted${result?.job?.jobId ? `: ${result.job.jobId}` : ''}. Latest jobs will refresh automatically.` });
      setForm((current) => ({ ...DEFAULT_FORM, sport: current.sport, vertical, jobType: current.jobType, mode: current.mode }));
      await loadSwarm({ silent: true });
    } catch (error) {
      handleError(error, 'Could not submit swarm job.');
    } finally {
      setSubmitting(false);
    }
  };

  const buildCampaignPayload = (override = {}) => {
    const title = String(override.title || campaignForm.title || '').trim();
    const topic = String(override.topic || campaignForm.topic || '').trim();
    const sport = override.sport || campaignForm.sport;
    const campaignType = override.campaignType || campaignForm.campaignType;
    const vertical = override.vertical || inferVerticalFromSport(sport);
    return {
      campaignType,
      vertical,
      sport,
      mode: override.mode || campaignForm.mode,
      includeAll: override.includeAll ?? campaignForm.includeAll,
      sections: override.sections || campaignForm.sections,
      automationKeys: override.automationKeys || campaignForm.automationKeys,
      sourceEntity: buildManualSourceEntity({
        title: title || campaignLabel(campaignType),
        topic,
        vertical,
        sport,
        campaignType,
      }),
      input: {
        title: title || campaignLabel(campaignType),
        topic: buildPromptFallback(title, topic, campaignCopy(campaignType)),
        prompt: buildPromptFallback(title, topic, campaignCopy(campaignType)),
        fightId: override.fightId || campaignForm.fightId || undefined,
        eventName: override.eventName || campaignForm.eventName || undefined,
        sport,
        campaignType,
        sections: override.sections || campaignForm.sections,
        adminInstruction: 'Generate all selected campaign artifacts as reviewable drafts for the website admin.',
      },
      metadata: { submittedFrom: 'frontend-campaign-center', adminUXIntent: 'all_agents_campaign', sport },
      reason: 'admin-created-campaign-from-frontend',
    };
  };

  const submitCampaign = async (event) => {
    event.preventDefault();
    const title = campaignForm.title.trim();
    const topic = campaignForm.topic.trim();
    if (!title && !topic) {
      showMessage({ type: 'error', text: 'Add a fight/event/blog title or short context before running a campaign.' });
      return;
    }

    setSubmitting(true);
    showMessage({ type: '', text: '' }, { scroll: false });
    try {
      const payload = buildCampaignPayload();
      let result;
      if (payload.campaignType === 'boxing_fight_campaign') result = await swarmApi.createBoxingCampaign(payload);
      else if (payload.campaignType === 'fight_tonight_campaign') result = await swarmApi.createTonightFightCampaign(payload);
      else if (payload.campaignType === 'fight_full_campaign') result = await swarmApi.createFullFightCampaign(payload);
      else result = await swarmApi.createCampaign(payload);

      const campaign = result?.campaign || result?.data?.campaign || result;
      const jobCount = result?.createdJobs?.length || campaign?.jobIds?.length || campaign?.counts?.jobs || 0;
      setRecentSubmission({ type: 'campaign', id: campaign?.campaignId || result?.backendCorrelationId, title: payload.input.title, status: campaign?.status || 'queued', count: jobCount, createdAt: new Date().toISOString() });
      setAutoRefresh(true);
      showMessage({ type: 'success', text: `Campaign submitted${campaign?.campaignId ? `: ${campaign.campaignId}` : ''}. ${jobCount ? `${jobCount} automation jobs created.` : 'Jobs will appear shortly.'}` });
      setCampaignForm((current) => ({ ...DEFAULT_CAMPAIGN_FORM, sport: current.sport, campaignType: current.campaignType, mode: current.mode }));
      await loadSwarm({ silent: true });
    } catch (error) {
      handleError(error, 'Could not run campaign.');
    } finally {
      setSubmitting(false);
    }
  };

  const runQuickCampaign = async (preset) => {
    setActionId(`campaign:${preset.id}`);
    try {
      const payload = buildCampaignPayload({
        campaignType: preset.campaignType,
        sport: preset.sport,
        vertical: preset.vertical,
        includeAll: true,
        title: campaignForm.title || preset.title,
        topic: campaignForm.topic || preset.copy,
      });
      let result;
      if (preset.campaignType === 'boxing_fight_campaign') result = await swarmApi.createBoxingCampaign(payload);
      else if (preset.campaignType === 'fight_tonight_campaign') result = await swarmApi.createTonightFightCampaign(payload);
      else if (preset.campaignType === 'fight_full_campaign') result = await swarmApi.createFullFightCampaign(payload);
      else result = await swarmApi.createCampaign(payload);
      const campaign = result?.campaign || result?.data?.campaign || result;
      const jobCount = result?.createdJobs?.length || campaign?.jobIds?.length || 0;
      setRecentSubmission({ type: 'campaign', id: campaign?.campaignId || result?.backendCorrelationId, title: payload.input.title, status: campaign?.status || 'queued', count: jobCount, createdAt: new Date().toISOString() });
      setAutoRefresh(true);
      showMessage({ type: 'success', text: `${preset.label} started. ${jobCount ? `${jobCount} jobs created.` : 'Refresh for job count.'}` });
      await loadSwarm({ silent: true });
    } catch (error) {
      handleError(error, `Could not start ${preset.label}.`);
    } finally {
      setActionId('');
    }
  };

  const submitAutomationEvent = async (event) => {
    event.preventDefault();
    const title = eventForm.title.trim();
    const topic = eventForm.topic.trim();
    setSubmitting(true);
    showMessage({ type: '', text: '' }, { scroll: false });
    try {
      const payload = {
        trigger: eventForm.trigger,
        vertical: inferVerticalFromSport(eventForm.sport) || eventForm.vertical,
        sport: eventForm.sport,
        mode: eventForm.mode || undefined,
        runAsCampaign: eventForm.runAsCampaign,
        campaignMode: eventForm.runAsCampaign,
        includeAll: eventForm.runAsCampaign,
        jobTypes: eventForm.jobTypes.length ? eventForm.jobTypes : undefined,
        sourceEntity: buildManualSourceEntity({ title, topic, vertical: eventForm.vertical, sport: eventForm.sport, trigger: eventForm.trigger }),
        input: { title: title || eventForm.trigger, topic: topic || title || eventForm.trigger, prompt: topic || title || eventForm.trigger, sport: eventForm.sport },
        metadata: { submittedFrom: 'frontend-automation-event-trigger', sport: eventForm.sport },
        reason: 'manual-trigger-from-admin-automation-panel',
      };
      const result = await swarmApi.triggerEvent(payload);
      const createdCount = result?.createdJobs?.length || result?.campaign?.jobIds?.length || 0;
      setRecentSubmission({ type: result?.campaignMode ? 'campaign' : 'event', id: result?.campaign?.campaignId || result?.event?.eventId || eventForm.trigger, title: title || eventForm.trigger, status: 'submitted', count: createdCount, createdAt: new Date().toISOString() });
      setAutoRefresh(true);
      showMessage({ type: 'success', text: `${eventForm.runAsCampaign ? 'Campaign event' : 'Automation event'} submitted. Created jobs: ${createdCount}.` });
      setEventForm((current) => ({ ...DEFAULT_EVENT_FORM, trigger: current.trigger, vertical: current.vertical, sport: current.sport, mode: current.mode, runAsCampaign: current.runAsCampaign }));
      await loadSwarm({ silent: true });
    } catch (error) {
      handleError(error, 'Could not trigger automation event.');
    } finally {
      setSubmitting(false);
    }
  };

  const runManualAutomation = async (jobType) => {
    const catalogItem = catalogRows.find((item) => item.value === jobType);
    const vertical = eventForm.vertical || (catalogItem?.verticals?.includes('combat') ? 'combat' : 'pro_wrestling');
    setActionId(`run:${jobType}`);
    showMessage({ type: '', text: '' }, { scroll: false });
    try {
      const result = await swarmApi.runAutomation(jobType, {
        vertical,
        sport: eventForm.sport,
        mode: settings?.automations?.[jobType]?.defaultMode || settings?.global?.defaultMode || 'DRAFT_ONLY',
        sourceEntity: buildManualSourceEntity({ title: catalogItem?.label, topic: catalogItem?.description, jobType, vertical, sport: eventForm.sport }),
        input: { title: catalogItem?.label || formatJobTypeLabel(jobType, catalog), topic: eventForm.topic || catalogItem?.description || catalogItem?.label || jobType, prompt: eventForm.topic || catalogItem?.description || catalogItem?.label || jobType, sport: eventForm.sport },
      });
      setRecentSubmission({ type: 'job', id: result?.job?.jobId, title: catalogItem?.label || jobType, status: result?.job?.status || 'submitted', createdAt: new Date().toISOString() });
      showMessage({ type: 'success', text: `Manual automation started${result?.job?.jobId ? `: ${result.job.jobId}` : ''}.` });
      await loadSwarm({ silent: true });
    } catch (error) {
      handleError(error, 'Could not run automation.');
    } finally {
      setActionId('');
    }
  };

  const runArtifactAction = async (artifact, action) => {
    const artifactId = artifact?.artifactId || artifact?.id;
    if (!artifactId) return;
    setActionId(`${action}:${artifactId}`);
    showMessage({ type: '', text: '' }, { scroll: false });
    try {
      if (action === 'approve') {
        const publish = isBlogLikeArtifact(artifact);
        await swarmApi.approveArtifact(artifactId, { publish, reason: publish ? 'Approved and published from frontend swarm automation panel.' : 'Approved from frontend swarm automation panel.' });
        showMessage({ type: 'success', text: publish ? 'Artifact approved and published to Blogs.' : 'Artifact approved.' });
      }
      if (action === 'approveOnly') {
        await swarmApi.approveArtifact(artifactId, { publish: false, reason: 'Approved without publishing from frontend swarm panel.' });
        showMessage({ type: 'success', text: 'Artifact approved without publishing.' });
      }
      if (action === 'applySeo') {
        await swarmApi.applySeoArtifact(artifactId, { targetBlogId: seoTargetByArtifact[artifactId] || undefined, applyToBlog: true, reason: 'SEO applied from frontend swarm panel.' });
        showMessage({ type: 'success', text: 'SEO artifact approved. If a target blog was available, SEO metadata was applied to that blog.' });
      }
      if (action === 'reject') {
        await swarmApi.rejectArtifact(artifactId, { reason: 'Rejected from frontend swarm automation panel.' });
        showMessage({ type: 'success', text: 'Artifact rejected.' });
      }
      if (action === 'regenerate') {
        await swarmApi.regenerateArtifact(artifactId, { reason: 'Regenerated from frontend swarm automation panel.' });
        showMessage({ type: 'success', text: 'Regeneration job submitted.' });
      }
      await loadSwarm({ silent: true });
    } catch (error) {
      handleError(error, 'Artifact action failed.');
    } finally {
      setActionId('');
    }
  };

  const runJobAction = async (job, action) => {
    const jobId = job?.jobId || job?.id;
    if (!jobId) return;
    setActionId(`${action}:${jobId}`);
    try {
      if (action === 'cancel') await swarmApi.cancelJob(jobId, 'Cancelled from frontend swarm panel.');
      if (action === 'retry') await swarmApi.retryJob(jobId, 'Retried from frontend swarm panel.');
      showMessage({ type: 'success', text: action === 'cancel' ? 'Job cancellation requested.' : 'Job retry requested.' });
      await loadSwarm({ silent: true });
    } catch (error) {
      handleError(error, 'Job action failed.');
    } finally {
      setActionId('');
    }
  };

  const runScheduleAction = async (action) => {
    const actionMap = {
      daily: { label: 'Full daily automation', call: swarmApi.runDailySchedule },
      weekly: { label: 'Weekly traffic opportunity report', call: swarmApi.runWeeklySchedule },
      seo: { label: 'Daily SEO audit', call: swarmApi.runDailySeo },
      social: { label: 'Multiple daily social drafts', call: swarmApi.runDailySocial },
      calendar: { label: 'Fight schedule calendar refresh', call: swarmApi.runDailyCalendarRefresh },
    };
    const selected = actionMap[action];
    if (!selected) return;
    setActionId(`schedule:${action}`);
    try {
      const result = await selected.call({
        mode: globalSettings.defaultMode || config?.defaultMode || 'DRAFT_ONLY',
        platforms: ['x', 'instagram', 'facebook'],
        source: 'frontend_daily_growth_controls',
        reason: `manual-${action}-run-from-swarm-command-center`,
      });
      const createdCount = result?.createdJobs?.length || result?.jobs?.length || result?.campaign?.jobIds?.length || result?.count || 0;
      setRecentSubmission({ type: 'schedule', id: action, title: selected.label, status: 'submitted', count: createdCount, createdAt: new Date().toISOString() });
      showMessage({ type: 'success', text: `${selected.label} submitted. ${createdCount ? `${createdCount} jobs created.` : 'Check jobs/artifacts shortly.'}` });
      await loadSwarm({ silent: true });
    } catch (error) {
      handleError(error, `Could not run ${selected.label}.`);
    } finally {
      setActionId('');
    }
  };

  const tabButtonClass = (tab) => `admin-swarm-tab${activeTab === tab ? ' is-active' : ''}`;
  const activePackCount = campaignPacks.length || SWARM_CAMPAIGN_TYPES.length;

  return (
    <div className="admin-swarm-workspace">
      <section className="admin-swarm-hero">
        <div>
          <p className="admin-page-eyebrow"><FaRobot /> Swarm command center</p>
          <h1>All agents. One fight. One campaign.</h1>
          <p>Run blogs, SEO, Twitter/X drafts, newsletters, homepage features, image prompts, reports, and traffic suggestions together. Everything still goes through backend approval and visible job tracking.</p>
        </div>
        <span className={`admin-status-badge ${online ? 'is-success' : config?.enabled ? 'is-danger' : 'is-warning'}`}>
          {online ? <FaShieldAlt /> : config?.enabled ? <FaExclamationTriangle /> : <FaBolt />}
          {online ? 'IONOS swarm online' : config?.enabled ? 'Gateway needs attention' : 'Gateway installed / disabled'}
        </span>
      </section>

      {message.text && (
        <div ref={messageRef} className={`admin-swarm-alert is-${message.type || 'info'}`} role="status">
          {message.type === 'error' ? <FaExclamationTriangle /> : <FaBolt />}
          <span>{message.text}</span>
        </div>
      )}

      {recentSubmission && (
        <section className="admin-swarm-latest-card" aria-label="Latest swarm activity">
          <div>
            <span>Latest submission</span>
            <strong>{recentSubmission.title || recentSubmission.id}</strong>
            <p>{recentSubmission.type} · {recentSubmission.id || 'pending id'} · {recentSubmission.count ? `${recentSubmission.count} jobs` : recentSubmission.status}</p>
          </div>
          <button type="button" className="admin-topbar-primary" onClick={() => { setActiveTab('jobs'); loadSwarm(); }}><FaHistory /> View progress</button>
        </section>
      )}

      <section className="admin-swarm-metrics" aria-label="Swarm metrics">
        <article><small>Total jobs</small><strong>{loading ? '—' : Number(counts.jobs || jobs.length || 0).toLocaleString()}</strong></article>
        <article><small>Campaigns</small><strong>{loading ? '—' : Number(counts.campaigns || displayedCampaigns.length || 0).toLocaleString()}</strong></article>
        <article><small>Artifacts</small><strong>{loading ? '—' : Number(counts.artifacts || artifacts.length || 0).toLocaleString()}</strong></article>
        <article><small>Awaiting review</small><strong>{loading ? '—' : Number(counts.awaitingReview || artifacts.filter((item) => ['DRAFT', 'AWAITING_REVIEW'].includes(item.reviewStatus)).length || 0).toLocaleString()}</strong></article>
      </section>

      <section className="admin-swarm-tabs" aria-label="Swarm sections">
        <button type="button" className={tabButtonClass('campaigns')} onClick={() => setActiveTab('campaigns')}><FaRocket /> All Agents campaigns</button>
        <button type="button" className={tabButtonClass('overview')} onClick={() => setActiveTab('overview')}><FaChartLine /> Overview</button>
        <button type="button" className={tabButtonClass('seoGrowth')} onClick={() => setActiveTab('seoGrowth')}><FaSearch /> SEO growth</button>
        <button type="button" className={tabButtonClass('create')} onClick={() => setActiveTab('create')}><FaPaperPlane /> Single job</button>
        <button type="button" className={tabButtonClass('automations')} onClick={() => setActiveTab('automations')}><FaSlidersH /> Automation controls</button>
        <button type="button" className={tabButtonClass('events')} onClick={() => setActiveTab('events')}><FaBolt /> Event triggers</button>
        <button type="button" className={tabButtonClass('artifacts')} onClick={() => setActiveTab('artifacts')}><FaFileAlt /> Review artifacts</button>
        <button type="button" className={tabButtonClass('jobs')} onClick={() => setActiveTab('jobs')}><FaHistory /> Jobs & logs</button>
      </section>

      {activeTab === 'campaigns' && (
        <section className="admin-swarm-layout admin-swarm-layout-wide">
          <form className="admin-swarm-panel admin-swarm-create" onSubmit={submitCampaign}>
            <header>
              <div>
                <span>All the above</span>
                <h2>Run full campaign</h2>
              </div>
              <button type="submit" disabled={submitting} className="admin-topbar-primary"><FaRocket /> {submitting ? 'Starting...' : 'Run campaign'}</button>
            </header>

            <div className="admin-swarm-preset-grid">
              {QUICK_CAMPAIGN_PRESETS.map((preset) => (
                <button key={preset.id} type="button" className="admin-swarm-preset-card" disabled={Boolean(actionId)} onClick={() => applyPresetToCampaign(preset)}>
                  <strong>{preset.label}</strong>
                  <span>{preset.copy}</span>
                </button>
              ))}
            </div>

            <div className="admin-swarm-form-grid">
              <label>
                <span>Campaign type</span>
                <select value={campaignForm.campaignType} onChange={(event) => updateCampaignForm('campaignType', event.target.value)}>
                  {SWARM_CAMPAIGN_TYPES.map((type) => <option key={type.value} value={type.value}>{type.label}</option>)}
                </select>
              </label>
              <label>
                <span>Sport</span>
                <select value={campaignForm.sport} onChange={(event) => {
                  const sport = event.target.value;
                  setCampaignForm((current) => ({ ...current, sport, vertical: inferVerticalFromSport(sport), campaignType: sport === 'boxing' ? 'boxing_fight_campaign' : sport === 'pro_wrestling' ? 'pro_wrestling_match_campaign' : current.campaignType }));
                }}>
                  {SWARM_SPORT_OPTIONS.map((sport) => <option key={sport.value} value={sport.value}>{sport.label}</option>)}
                </select>
              </label>
              <label>
                <span>Mode</span>
                <select value={campaignForm.mode} onChange={(event) => updateCampaignForm('mode', event.target.value)}>
                  {SWARM_MODES.map((mode) => <option key={mode.value} value={mode.value}>{mode.label}</option>)}
                </select>
              </label>
              <label>
                <span>Known fight/event ID</span>
                <input value={campaignForm.fightId} onChange={(event) => updateCampaignForm('fightId', event.target.value)} placeholder="Optional existing fight id" />
              </label>
            </div>

            <label className="admin-swarm-field-full">
              <span>Fight, event, blog, or campaign title</span>
              <input value={campaignForm.title} onChange={(event) => updateCampaignForm('title', event.target.value)} placeholder="Example: Boxing fight tonight free-to-play promo" />
            </label>

            <label className="admin-swarm-field-full">
              <span>Context for the agents</span>
              <textarea value={campaignForm.topic} onChange={(event) => updateCampaignForm('topic', event.target.value)} placeholder="Tell the swarm what fight is tonight, what should be promoted, prize/free-play angle, and any call-to-action." rows={5} />
            </label>

            <div className="admin-swarm-campaign-options">
              <div className="admin-swarm-campaign-option-head">
                <div><strong>Sections to generate</strong><span>{campaignForm.includeAll ? 'All selected sections run together.' : 'Choose exact sections/agents.'}</span></div>
                <label className="admin-swarm-switch"><input type="checkbox" checked={campaignForm.includeAll} onChange={(event) => updateCampaignForm('includeAll', event.target.checked)} /><span>All the above</span></label>
              </div>
              <div className="admin-swarm-checkbox-grid">
                {CAMPAIGN_SECTION_OPTIONS.map((section) => (
                  <label key={section.value} className={campaignForm.sections.includes(section.value) ? 'is-selected' : ''}>
                    <input type="checkbox" checked={campaignForm.sections.includes(section.value)} onChange={() => toggleCampaignSection(section.value)} />
                    <strong>{section.label}</strong>
                    <span>{section.helper}</span>
                  </label>
                ))}
              </div>
            </div>
          </form>

          <aside className="admin-swarm-panel admin-swarm-health">
            <header>
              <div>
                <span>Campaign status</span>
                <h2>Recent campaigns</h2>
              </div>
              <button type="button" className="admin-action-secondary" onClick={() => loadSwarm()} disabled={loading}><FaSyncAlt /> Refresh</button>
            </header>
            <div className="admin-swarm-campaign-list">
              {displayedCampaigns.length === 0 ? <p className="admin-swarm-note">No grouped campaigns yet. Run “All Agents” to create one.</p> : displayedCampaigns.slice(0, 8).map((campaign) => (
                <article key={campaign.id}>
                  <span className={`admin-status-badge ${statusClass(campaign.status)}`}>{campaign.status}</span>
                  <strong>{campaign.title}</strong>
                  <small>{campaignLabel(campaign.type)} · {campaign.sport} · {formatSwarmDate(campaign.createdAt)}</small>
                  <p>{Number(campaign.jobIds?.length || campaign.counts?.jobs || 0)} jobs attached</p>
                  <button type="button" className="admin-swarm-json-toggle" onClick={() => setExpandedCampaignId(expandedCampaignId === campaign.id ? '' : campaign.id)}>{expandedCampaignId === campaign.id ? 'Hide campaign' : 'View campaign'}</button>
                  {expandedCampaignId === campaign.id && <pre className="admin-swarm-json">{compactJson(campaigns.find((item) => (item.campaignId || item.id || item._id) === campaign.id) || campaign)}</pre>}
                </article>
              ))}
            </div>
            <small className="admin-swarm-note">Campaign packs loaded: {activePackCount}. “All the above” creates multiple jobs under one campaign so the client can see movement immediately.</small>
          </aside>
        </section>
      )}

      {activeTab === 'overview' && (
        <section className="admin-swarm-layout">
          <aside className="admin-swarm-panel admin-swarm-health">
            <header>
              <div><span>Gateway</span><h2>Health & controls</h2></div>
              <button type="button" className="admin-action-secondary" onClick={() => loadSwarm()} disabled={loading}><FaSyncAlt /> Refresh</button>
            </header>
            <div className="admin-swarm-health-list">
              <p><strong>Backend gateway</strong><span>{config ? 'Installed' : 'Not loaded'}</span></p>
              <p><strong>Swarm enabled</strong><span>{config?.enabled ? 'Yes' : 'No'}</span></p>
              <p><strong>IONOS reachable</strong><span>{online ? 'Yes' : 'No'}</span></p>
              <p><strong>Default mode</strong><span>{config?.defaultMode || globalSettings.defaultMode || '—'}</span></p>
              <p><strong>Global pause</strong><span>{globalSettings.paused ? 'Paused' : 'Active'}</span></p>
              <p><strong>Social publishing</strong><span>{config?.socialPublishEnabled && globalSettings.socialPublishEnabled ? 'Enabled' : 'Draft only'}</span></p>
            </div>
            <label className="admin-swarm-refresh-toggle"><input type="checkbox" checked={autoRefresh} onChange={(event) => setAutoRefresh(event.target.checked)} /><span>Auto refresh every 12 seconds</span></label>
            <small className="admin-swarm-note">Invalid or expired admin tokens now redirect to login instead of leaving this page stuck.</small>
          </aside>

          <section className="admin-swarm-panel">
            <header>
              <div><span>What the swarm does</span><h2>Client-ready automation</h2></div>
              <button type="button" className="admin-action-secondary" onClick={() => runManualAutomation('automation.traffic-growth-dashboard')} disabled={Boolean(actionId)}><FaChartLine /> Traffic report</button>
            </header>
            <div className="admin-swarm-dashboard-grid">
              <article><small>Automations</small><strong>{Number(counts.enabledAutomations || 0).toLocaleString()}/{Number(counts.totalAutomations || catalogRows.length || 0).toLocaleString()}</strong><span>Configured controls</span></article>
              <article><small>Failed jobs</small><strong>{Number(counts.failedJobs || 0).toLocaleString()}</strong><span>Needs retry/review</span></article>
              <article><small>Active campaigns</small><strong>{Number(counts.activeCampaigns || displayedCampaigns.filter((item) => !['published', 'failed', 'cancelled'].includes(String(item.status).toLowerCase())).length || 0).toLocaleString()}</strong><span>All-agent groups</span></article>
              <article><small>SEO mode</small><strong>Review</strong><span>Generated, approved, then applied</span></article>
            </div>
            <div className="admin-swarm-daily-controls">
              <header>
                <div><span>Daily growth engine</span><strong>SEO, calendar, and social every day</strong></div>
                <button type="button" className="admin-topbar-primary" disabled={Boolean(actionId)} onClick={() => runScheduleAction('daily')}><FaBolt /> Run full daily set</button>
              </header>
              <div className="admin-swarm-daily-grid">
                <button type="button" disabled={Boolean(actionId)} onClick={() => runScheduleAction('seo')}><FaSearch /><strong>Daily SEO</strong><span>Audit metadata, schema, links, and page opportunities.</span></button>
                <button type="button" disabled={Boolean(actionId)} onClick={() => runScheduleAction('calendar')}><FaCalendarAlt /><strong>Calendar refresh</strong><span>Refresh fight schedule opportunities for website/user dashboard.</span></button>
                <button type="button" disabled={Boolean(actionId)} onClick={() => runScheduleAction('social')}><FaBullhorn /><strong>Social drafts</strong><span>Create multiple daily drafts for X, Instagram, and Facebook.</span></button>
                <button type="button" disabled={Boolean(actionId)} onClick={() => runManualAutomation('automation.growth-plan-1000-users')}><FaUserPlus /><strong>1000-user plan</strong><span>Generate the next traffic and acquisition action plan.</span></button>
              </div>
              <div className="admin-swarm-social-platform-line">
                <span><FaTwitter /> X/Twitter drafts</span>
                <span><FaInstagram /> Instagram drafts</span>
                <span><FaFacebook /> Facebook drafts</span>
                <em>Publishing stays draft/review controlled until credentials and final approval are confirmed.</em>
              </div>
            </div>

            <div className="admin-swarm-seo-explainer">
              <article><FaSearch /><strong>SEO is managed by swarm</strong><p>The swarm generates SEO artifacts: metadata, schema, internal links, canonical checks, sitemap plans, and audit reports.</p></article>
              <article><FaCheck /><strong>SEO is applied safely</strong><p>Blog SEO can be applied after approval. Site-wide schema/sitemap/internal-link outputs remain application plans until a target workflow is selected.</p></article>
              <article><FaTwitter /><strong>Social stays controlled</strong><p>X, Instagram, and Facebook drafts are generated now. Real auto-posting stays disabled until the admin enables social publishing.</p></article>
            </div>
            <div className="admin-swarm-quick-actions">
              {QUICK_CAMPAIGN_PRESETS.slice(0, 4).map((preset) => (
                <button key={preset.id} type="button" onClick={() => runQuickCampaign(preset)} disabled={Boolean(actionId)} className="admin-action-secondary"><FaRocket /> {preset.label}</button>
              ))}
            </div>
          </section>
        </section>
      )}


      {activeTab === 'seoGrowth' && (
        <AdminSeoGrowthCenter />
      )}

      {activeTab === 'create' && (
        <section className="admin-swarm-layout">
          <form className="admin-swarm-panel admin-swarm-create" onSubmit={submitJob}>
            <header>
              <div><span>Generate one thing</span><h2>Create single job</h2></div>
              <button type="submit" disabled={submitting} className="admin-topbar-primary"><FaPaperPlane /> {submitting ? 'Submitting...' : 'Submit job'}</button>
            </header>
            <div className="admin-swarm-form-grid">
              <label><span>Sport</span><select value={form.sport} onChange={(event) => { const sport = event.target.value; setForm((current) => ({ ...current, sport, vertical: inferVerticalFromSport(sport) })); }}>{SWARM_SPORT_OPTIONS.map((sport) => <option key={sport.value} value={sport.value}>{sport.label}</option>)}</select></label>
              <label><span>Job type</span><select value={form.jobType} onChange={(event) => updateForm('jobType', event.target.value)}>{availableJobTypes.map((type) => <option key={type.value} value={type.value}>{type.label}</option>)}</select></label>
              <label><span>Mode</span><select value={form.mode} onChange={(event) => updateForm('mode', event.target.value)}>{SWARM_MODES.map((mode) => <option key={mode.value} value={mode.value}>{mode.label}</option>)}</select></label>
              <label><span>Priority</span><input type="number" min="0" max="100" value={form.priority} onChange={(event) => updateForm('priority', event.target.value)} /></label>
            </div>
            <label className="admin-swarm-field-full"><span>Title / short label</span><input value={form.title} onChange={(event) => updateForm('title', event.target.value)} placeholder="Example: Boxing fight tonight preview" /></label>
            <label className="admin-swarm-field-full"><span>Prompt / topic</span><textarea value={form.topic} onChange={(event) => updateForm('topic', event.target.value)} placeholder="Describe exactly what the swarm should create or analyze." rows={5} /></label>
            <label className="admin-swarm-field-full"><span>SEO keywords, comma separated</span><input value={form.keywords} onChange={(event) => updateForm('keywords', event.target.value)} placeholder="fantasy mma, boxing picks, fight night" /></label>
            {form.jobType.startsWith('social.') && <div className="admin-swarm-platforms"><span>Social platforms</span><div>{platformOptions.map((platform) => <label key={platform}><input type="checkbox" checked={form.platforms.includes(platform)} onChange={() => togglePlatform(platform)} /><span>{platform.toUpperCase()}</span></label>)}</div></div>}
          </form>

          <aside className="admin-swarm-panel admin-swarm-health">
            <header><div><span>Selected automation</span><h2>{formatJobTypeLabel(form.jobType, catalog)}</h2></div></header>
            <div className="admin-swarm-health-list">
              <p><strong>Sport</strong><span>{SWARM_SPORT_OPTIONS.find((item) => item.value === form.sport)?.label || form.sport}</span></p>
              <p><strong>Group</strong><span>{SWARM_GROUP_LABELS[inferJobTypeGroup(form.jobType, catalog)] || inferJobTypeGroup(form.jobType, catalog)}</span></p>
              <p><strong>Mode</strong><span>{form.mode}</span></p>
              <p><strong>Approval flow</strong><span>{form.mode === 'AUTOMATED' ? 'Auto where backend allows' : 'Review/draft safe'}</span></p>
            </div>
            <small className="admin-swarm-note">Use campaigns when the client wants “all the agents” to run together.</small>
          </aside>
        </section>
      )}

      {activeTab === 'automations' && (
        <section className="admin-swarm-panel admin-swarm-list-panel">
          <header>
            <div><span>Controls</span><h2>Automation settings</h2></div>
            <div className="admin-swarm-filters">
              <button type="button" className="admin-action-secondary" disabled={settingsSaving} onClick={() => updateGlobalSetting('paused', !globalSettings.paused)}>{globalSettings.paused ? <FaPlay /> : <FaPause />} {globalSettings.paused ? 'Resume all' : 'Pause all'}</button>
              <label><FaGlobe /><select value={filters.vertical} onChange={(event) => setFilters((current) => ({ ...current, vertical: event.target.value }))}><option value="">All verticals</option><option value="combat">Combat</option><option value="pro_wrestling">Pro wrestling</option></select></label>
              <label><FaList /><select value={filters.group} onChange={(event) => setFilters((current) => ({ ...current, group: event.target.value }))}><option value="">All groups</option>{Object.entries(SWARM_GROUP_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
              <label><FaSearch /><input value={filters.search} onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))} placeholder="Search automations" /></label>
            </div>
          </header>
          <div className="admin-swarm-global-controls">
            <label><span>Default mode</span><select value={globalSettings.defaultMode || 'DRAFT_ONLY'} onChange={(event) => updateGlobalSetting('defaultMode', event.target.value)} disabled={settingsSaving}>{SWARM_MODES.map((mode) => <option key={mode.value} value={mode.value}>{mode.label}</option>)}</select></label>
            <label><span>Daily scheduler</span><button type="button" className="admin-action-secondary" disabled={settingsSaving} onClick={() => updateGlobalSetting('dailySchedulerEnabled', !globalSettings.dailySchedulerEnabled)}>{globalSettings.dailySchedulerEnabled ? <FaToggleOn /> : <FaToggleOff />} {globalSettings.dailySchedulerEnabled ? 'Enabled' : 'Disabled'}</button></label>
            <label><span>Weekly scheduler</span><button type="button" className="admin-action-secondary" disabled={settingsSaving} onClick={() => updateGlobalSetting('weeklySchedulerEnabled', !globalSettings.weeklySchedulerEnabled)}>{globalSettings.weeklySchedulerEnabled ? <FaToggleOn /> : <FaToggleOff />} {globalSettings.weeklySchedulerEnabled ? 'Enabled' : 'Disabled'}</button></label>
            <label><span>Social publishing</span><button type="button" className="admin-action-secondary" disabled={settingsSaving} onClick={() => updateGlobalSetting('socialPublishEnabled', !globalSettings.socialPublishEnabled)}>{globalSettings.socialPublishEnabled ? <FaToggleOn /> : <FaToggleOff />} {globalSettings.socialPublishEnabled ? 'Enabled' : 'Draft only'}</button></label>
          </div>
          <div className="admin-swarm-automation-grid">
            {visibleAutomationRows.map((item) => {
              const control = settings?.automations?.[item.value] || {};
              const enabled = control.enabled !== false;
              return (
                <article key={item.value} className={`admin-swarm-automation-card ${enabled ? '' : 'is-disabled'}`}>
                  <div className="admin-swarm-automation-head"><span className={`admin-status-badge ${enabled ? 'is-success' : 'is-danger'}`}>{enabled ? <FaToggleOn /> : <FaToggleOff />} {enabled ? 'Enabled' : 'Disabled'}</span><small>{SWARM_GROUP_LABELS[item.group] || item.group}</small></div>
                  <h3>{item.label}</h3><p>{item.description || item.value}</p><code>{item.value}</code>
                  <div className="admin-swarm-control-row">
                    <button type="button" className="admin-action-secondary" disabled={settingsSaving} onClick={() => updateAutomationControl(item.value, { enabled: !enabled })}>{enabled ? 'Disable' : 'Enable'}</button>
                    <select value={control.defaultMode || item.defaultMode || 'DRAFT_ONLY'} disabled={settingsSaving} onChange={(event) => updateAutomationControl(item.value, { defaultMode: event.target.value })}>{SWARM_MODES.map((mode) => <option key={mode.value} value={mode.value}>{mode.label}</option>)}</select>
                    <button type="button" className="admin-action-secondary" disabled={settingsSaving} onClick={() => updateAutomationControl(item.value, { requiresApproval: control.requiresApproval === false })}>{control.requiresApproval === false ? 'No approval' : 'Requires approval'}</button>
                    <button type="button" className="admin-topbar-primary" disabled={Boolean(actionId)} onClick={() => runManualAutomation(item.value)}><FaPlay /> Run</button>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      )}

      {activeTab === 'events' && (
        <section className="admin-swarm-layout">
          <form className="admin-swarm-panel admin-swarm-create" onSubmit={submitAutomationEvent}>
            <header><div><span>Event hooks</span><h2>Trigger automation event</h2></div><button type="submit" disabled={submitting} className="admin-topbar-primary"><FaBolt /> {submitting ? 'Triggering...' : 'Trigger event'}</button></header>
            <div className="admin-swarm-form-grid">
              <label><span>Trigger</span><select value={eventForm.trigger} onChange={(event) => updateEventForm('trigger', event.target.value)}>{SWARM_TRIGGER_OPTIONS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>
              <label><span>Sport</span><select value={eventForm.sport} onChange={(event) => { const sport = event.target.value; setEventForm((current) => ({ ...current, sport, vertical: inferVerticalFromSport(sport) })); }}>{SWARM_SPORT_OPTIONS.map((sport) => <option key={sport.value} value={sport.value}>{sport.label}</option>)}</select></label>
              <label><span>Mode override</span><select value={eventForm.mode} onChange={(event) => updateEventForm('mode', event.target.value)}><option value="">Use automation setting</option>{SWARM_MODES.map((mode) => <option key={mode.value} value={mode.value}>{mode.label}</option>)}</select></label>
              <label className="admin-swarm-switch-row"><span>Run as campaign</span><button type="button" className="admin-action-secondary" onClick={() => updateEventForm('runAsCampaign', !eventForm.runAsCampaign)}>{eventForm.runAsCampaign ? <FaToggleOn /> : <FaToggleOff />} {eventForm.runAsCampaign ? 'All agents' : 'Selected jobs'}</button></label>
            </div>
            <label className="admin-swarm-field-full"><span>Title / source label</span><input value={eventForm.title} onChange={(event) => updateEventForm('title', event.target.value)} placeholder="Example: Boxing fight published tonight" /></label>
            <label className="admin-swarm-field-full"><span>Context / prompt</span><textarea value={eventForm.topic} onChange={(event) => updateEventForm('topic', event.target.value)} placeholder="Optional context for generated drafts and reports." rows={5} /></label>
            {!eventForm.runAsCampaign && <div className="admin-swarm-campaign-options"><div className="admin-swarm-campaign-option-head"><div><strong>Choose automations</strong><span>Pick more than one; leave empty to use trigger defaults.</span></div></div><div className="admin-swarm-checkbox-grid is-compact">{catalogRows.slice(0, 24).map((item) => <label key={item.value} className={eventForm.jobTypes.includes(item.value) ? 'is-selected' : ''}><input type="checkbox" checked={eventForm.jobTypes.includes(item.value)} onChange={() => toggleEventJobType(item.value)} /><strong>{item.label}</strong><span>{item.value}</span></label>)}</div></div>}
          </form>
          <aside className="admin-swarm-panel admin-swarm-health"><header><div><span>Recent events</span><h2>Automation logs</h2></div><button type="button" className="admin-action-secondary" onClick={() => loadSwarm()}><FaSyncAlt /> Refresh</button></header><div className="admin-swarm-events-list">{events.length === 0 ? <p className="admin-swarm-note">No backend automation events found yet.</p> : events.slice(0, 8).map((event) => <article key={event.eventId || event._id}><span className={`admin-status-badge ${statusClass(event.status)}`}>{event.status || 'unknown'}</span><strong>{event.trigger || 'automation_event'}</strong><small>{event.vertical || '—'} · {formatSwarmDate(event.createdAt)}</small><p>{Number(event.createdJobs?.length || 0)} jobs created · {Number(event.errors?.length || 0)} errors</p><button type="button" className="admin-swarm-json-toggle" onClick={() => setExpandedEventId(expandedEventId === event.eventId ? '' : event.eventId)}>{expandedEventId === event.eventId ? 'Hide event' : 'View event'}</button>{expandedEventId === event.eventId && <pre className="admin-swarm-json">{compactJson(event)}</pre>}</article>)}</div></aside>
        </section>
      )}

      {activeTab === 'artifacts' && (
        <section className="admin-swarm-panel admin-swarm-list-panel">
          <header>
            <div><span>Review queue</span><h2>Generated artifacts</h2></div>
            <div className="admin-swarm-filters"><label><FaGlobe /><select value={filters.vertical} onChange={(event) => setFilters((current) => ({ ...current, vertical: event.target.value }))}><option value="">All verticals</option><option value="combat">Combat</option><option value="pro_wrestling">Pro wrestling</option></select></label><label><FaSearch /><select value={filters.reviewStatus} onChange={(event) => setFilters((current) => ({ ...current, reviewStatus: event.target.value }))}><option value="">All review states</option><option value="AWAITING_REVIEW">Awaiting review</option><option value="DRAFT">Draft</option><option value="APPROVED">Approved</option><option value="PUBLISHED">Published</option><option value="REJECTED">Rejected</option></select></label><button type="button" className="admin-action-secondary" onClick={() => loadSwarm()}><FaSyncAlt /> Refresh</button></div>
          </header>
          {artifacts.length === 0 ? <div className="admin-swarm-empty"><FaFileAlt /><strong>No artifacts yet</strong><span>Create a campaign or trigger automation, then refresh after the worker completes it.</span></div> : <div className="admin-swarm-artifacts">{artifacts.map((artifact) => {
            const artifactId = artifact.artifactId || artifact.id;
            const payload = getArtifactPayload(artifact);
            const expanded = expandedArtifactId === artifactId;
            const blogLike = isBlogLikeArtifact(artifact);
            const seoLike = isSeoArtifact(artifact);
            return <article className="admin-swarm-artifact" key={artifactId}><div className="admin-swarm-artifact-main"><div><span className={`admin-status-badge ${statusClass(artifact.reviewStatus)}`}>{artifact.reviewStatus || 'AWAITING_REVIEW'}</span><small>{artifact.vertical} · {artifact.artifactType || artifact.jobType} {artifact.campaignId ? `· Campaign ${artifact.campaignId}` : ''}</small><h3>{getArtifactTitle(artifact)}</h3><p>{String(getArtifactSummary(artifact)).slice(0, 300)}</p>{seoLike && <div className="admin-swarm-seo-target"><label><span>Target blog ID for SEO apply</span><input value={seoTargetByArtifact[artifactId] || ''} onChange={(event) => setSeoTargetByArtifact((current) => ({ ...current, [artifactId]: event.target.value }))} placeholder="Optional blog id" /></label><small>Without a target blog, SEO stays approved as an application plan.</small></div>}</div><div className="admin-swarm-artifact-actions"><button type="button" onClick={() => runArtifactAction(artifact, 'approve')} disabled={Boolean(actionId)} className="admin-topbar-primary"><FaCheck /> {blogLike ? 'Approve & publish blog' : 'Approve'}</button>{seoLike && <button type="button" onClick={() => runArtifactAction(artifact, 'applySeo')} disabled={Boolean(actionId)} className="admin-action-secondary"><FaSearch /> Apply SEO</button>}{blogLike && <button type="button" onClick={() => runArtifactAction(artifact, 'approveOnly')} disabled={Boolean(actionId)} className="admin-action-secondary"><FaShieldAlt /> Approve only</button>}<button type="button" onClick={() => runArtifactAction(artifact, 'regenerate')} disabled={Boolean(actionId)} className="admin-action-secondary"><FaRedo /> Regenerate</button><button type="button" onClick={() => runArtifactAction(artifact, 'reject')} disabled={Boolean(actionId)} className="admin-action-secondary is-danger"><FaTimes /> Reject</button></div></div>{Array.isArray(payload.sections) && payload.sections.length > 0 && <div className="admin-swarm-section-preview">{payload.sections.slice(0, 3).map((section, index) => <section key={`${artifactId}-section-${index}`}><strong>{section.title || `Section ${index + 1}`}</strong><p>{String(section.content || section.body || '').slice(0, 220)}</p></section>)}</div>}{payload.applicationPlan && <div className="admin-swarm-application-plan"><FaCog /><div><strong>Application plan</strong><p>{payload.applicationPlan.summary || payload.applicationPlan.reason || 'Review this plan before applying it to the live site.'}</p></div></div>}<button type="button" className="admin-swarm-json-toggle" onClick={() => setExpandedArtifactId(expanded ? '' : artifactId)}>{expanded ? 'Hide payload' : 'View payload'}</button>{expanded && <pre className="admin-swarm-json">{compactJson(payload)}</pre>}</article>;
          })}</div>}
        </section>
      )}

      {activeTab === 'jobs' && (
        <section className="admin-swarm-panel admin-swarm-list-panel">
          <header><div><span>Runtime</span><h2>Recent jobs</h2></div><div className="admin-swarm-filters"><label><FaSearch /><select value={filters.status} onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))}><option value="">All job states</option><option value="queued">Queued</option><option value="running">Running</option><option value="awaiting_review">Awaiting review</option><option value="published">Published</option><option value="failed">Failed</option><option value="dead_letter">Dead letter</option></select></label><button type="button" className="admin-action-secondary" onClick={() => runManualAutomation('automation.failed-job-retry-report')} disabled={Boolean(actionId)}><FaRedo /> Retry report</button><button type="button" className="admin-action-secondary" onClick={() => runManualAutomation('automation.agent-performance-dashboard')} disabled={Boolean(actionId)}><FaChartLine /> Agent dashboard</button><button type="button" className="admin-action-secondary" onClick={() => loadSwarm()}><FaSyncAlt /> Refresh</button></div></header>
          <div className="admin-data-table-scroll"><table className="admin-data-table admin-swarm-table"><thead><tr><th>Job</th><th>Campaign</th><th>Sport</th><th>Type</th><th>Input</th><th>Status</th><th>Created</th><th>Action</th></tr></thead><tbody>{jobs.length === 0 ? <tr><td colSpan="8">No jobs found.</td></tr> : jobs.map((job) => <tr key={job.jobId || job.id}><td><strong>{job.jobId || job.id || '—'}</strong></td><td>{job.campaignId || job.metadata?.campaignId || '—'}</td><td>{job.input?.sport || job.metadata?.sport || '—'}</td><td>{formatJobTypeLabel(job.jobType, catalog)}</td><td>{summarizeJobInput(job.input)}</td><td><span className={`admin-status-badge ${statusClass(job.status)}`}>{job.status || 'unknown'}</span></td><td>{formatSwarmDate(job.createdAt)}</td><td><div className="admin-swarm-row-actions"><button type="button" onClick={() => runJobAction(job, 'retry')} disabled={!job.jobId || Boolean(actionId)}><FaRedo /> Retry</button><button type="button" onClick={() => runJobAction(job, 'cancel')} disabled={!job.jobId || Boolean(actionId)}><FaTimes /> Cancel</button></div></td></tr>)}</tbody></table></div>
        </section>
      )}
    </div>
  );
};

export default SwarmCommandCenter;
