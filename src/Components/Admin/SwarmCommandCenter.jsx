import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  FaBolt,
  FaChartLine,
  FaCheck,
  FaCog,
  FaExclamationTriangle,
  FaFileAlt,
  FaGlobe,
  FaHistory,
  FaList,
  FaPaperPlane,
  FaPause,
  FaPlay,
  FaRedo,
  FaRobot,
  FaSearch,
  FaShieldAlt,
  FaSlidersH,
  FaSyncAlt,
  FaTimes,
  FaToggleOff,
  FaToggleOn,
} from 'react-icons/fa';
import {
  buildManualSourceEntity,
  formatJobTypeLabel,
  formatSwarmDate,
  getAutomationCatalogFromPayload,
  getAutomationDashboardFromPayload,
  getAutomationSettingsFromPayload,
  getItemsFromPayload,
  inferJobTypeGroup,
  isBlogLikeArtifact,
  summarizeJobInput,
  swarmApi,
  SWARM_GROUP_LABELS,
  SWARM_JOB_TYPES,
  SWARM_MODES,
  SWARM_TRIGGER_OPTIONS,
} from '@/Utils/swarmApi';

const DEFAULT_FORM = {
  vertical: 'combat',
  jobType: 'content.article',
  mode: 'DRAFT_ONLY',
  priority: 50,
  topic: '',
  title: '',
  keywords: '',
  platforms: ['x', 'twitter'],
};

const DEFAULT_EVENT_FORM = {
  trigger: 'fight_published',
  vertical: 'combat',
  mode: '',
  title: '',
  topic: '',
  jobTypes: '',
};

const platformOptions = ['x', 'twitter', 'facebook', 'instagram', 'linkedin', 'youtube', 'discord'];

const statusClass = (value) => {
  const normalized = String(value || '').toLowerCase();
  if (['succeeded', 'awaiting_review', 'approved', 'published', 'online', 'ready', 'submitted', 'active'].includes(normalized)) return 'is-success';
  if (['failed', 'dead_letter', 'failed_to_submit', 'cancelled', 'rejected', 'needs attention', 'disabled', 'skipped'].includes(normalized)) return 'is-danger';
  return 'is-warning';
};

const compactJson = (value) => {
  try {
    return JSON.stringify(value || {}, null, 2);
  } catch (_error) {
    return String(value || '');
  }
};

const getArtifactPayload = (artifact) => artifact?.payload || artifact?.swarmArtifact?.payload || {};

const getArtifactTitle = (artifact) => {
  const payload = getArtifactPayload(artifact);
  return artifact?.title || payload.metaTitle || payload.header || payload.title || payload.seoTitle || artifact?.artifactId || 'Untitled artifact';
};

const getArtifactSummary = (artifact) => {
  const payload = getArtifactPayload(artifact);
  return artifact?.summary || payload.metaDescription || payload.description || payload.summary || payload.body || payload.content || 'No summary returned yet.';
};

const valueFromArrayOrObject = (value) => {
  if (Array.isArray(value)) return value;
  if (value && typeof value === 'object') return Object.values(value);
  return [];
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
    failedAutomationEvents: cache.failedAutomationEvents || 0,
  };
};

const SwarmCommandCenter = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [form, setForm] = useState(DEFAULT_FORM);
  const [eventForm, setEventForm] = useState(DEFAULT_EVENT_FORM);
  const [filters, setFilters] = useState({ vertical: '', status: '', reviewStatus: '', group: '', search: '' });
  const [config, setConfig] = useState(null);
  const [health, setHealth] = useState(null);
  const [catalogPayload, setCatalogPayload] = useState(null);
  const [settingsPayload, setSettingsPayload] = useState(null);
  const [dashboardPayload, setDashboardPayload] = useState(null);
  const [events, setEvents] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [artifacts, setArtifacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [actionId, setActionId] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' });
  const [expandedArtifactId, setExpandedArtifactId] = useState('');
  const [expandedEventId, setExpandedEventId] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(false);

  const catalog = useMemo(() => getAutomationCatalogFromPayload(catalogPayload), [catalogPayload]);
  const settings = useMemo(() => getAutomationSettingsFromPayload(settingsPayload), [settingsPayload]);
  const dashboard = useMemo(() => getAutomationDashboardFromPayload(dashboardPayload), [dashboardPayload]);
  const catalogRows = useMemo(() => buildCatalogRows(catalog), [catalog]);
  const counts = useMemo(() => normalizeDashboardCounts(dashboard, health), [dashboard, health]);

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

  useEffect(() => {
    if (!availableJobTypes.some((item) => item.value === form.jobType)) {
      setForm((current) => ({ ...current, jobType: availableJobTypes[0]?.value || 'content.article' }));
    }
  }, [availableJobTypes, form.jobType]);

  const loadSwarm = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);
    try {
      const jobQuery = { limit: 15, fallbackCache: true };
      const artifactQuery = { limit: 15, fallbackCache: true };
      if (filters.vertical) {
        jobQuery.vertical = filters.vertical;
        artifactQuery.vertical = filters.vertical;
      }
      if (filters.status) jobQuery.status = filters.status;
      if (filters.reviewStatus) artifactQuery.reviewStatus = filters.reviewStatus;

      const [configResult, healthResult, jobsResult, artifactsResult, catalogResult, settingsResult, dashboardResult, eventsResult] = await Promise.allSettled([
        swarmApi.config(),
        swarmApi.health(),
        swarmApi.listJobs(jobQuery),
        swarmApi.listArtifacts(artifactQuery),
        swarmApi.catalog({ fallbackLocal: true }),
        swarmApi.settings({ fallbackLocal: true }),
        swarmApi.dashboard({ fallbackCache: true }),
        swarmApi.events({ limit: 12 }),
      ]);

      setConfig(configResult.status === 'fulfilled' ? configResult.value : null);
      setHealth(healthResult.status === 'fulfilled' ? healthResult.value : null);
      setJobs(jobsResult.status === 'fulfilled' ? getItemsFromPayload(jobsResult.value) : []);
      setArtifacts(artifactsResult.status === 'fulfilled' ? getItemsFromPayload(artifactsResult.value) : []);
      setCatalogPayload(catalogResult.status === 'fulfilled' ? catalogResult.value : null);
      setSettingsPayload(settingsResult.status === 'fulfilled' ? settingsResult.value : null);
      setDashboardPayload(dashboardResult.status === 'fulfilled' ? dashboardResult.value : null);
      setEvents(eventsResult.status === 'fulfilled' ? getItemsFromPayload(eventsResult.value) : []);

      const rejected = [configResult, healthResult, jobsResult, artifactsResult, catalogResult, settingsResult, dashboardResult, eventsResult].find((item) => item.status === 'rejected');
      if (rejected) {
        setMessage({ type: 'warning', text: rejected.reason?.message || 'Some swarm automation data could not be loaded.' });
      } else if (!silent) {
        setMessage({ type: 'success', text: 'Swarm automation panel refreshed.' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: error.message || 'Unable to load swarm automation panel.' });
    } finally {
      if (!silent) setLoading(false);
    }
  }, [filters.reviewStatus, filters.status, filters.vertical]);

  useEffect(() => {
    loadSwarm();
  }, [loadSwarm]);

  useEffect(() => {
    if (!autoRefresh) return undefined;
    const id = window.setInterval(() => loadSwarm({ silent: true }), 20000);
    return () => window.clearInterval(id);
  }, [autoRefresh, loadSwarm]);

  const updateForm = (field, value) => setForm((current) => ({ ...current, [field]: value }));
  const updateEventForm = (field, value) => setEventForm((current) => ({ ...current, [field]: value }));

  const togglePlatform = (platform) => {
    setForm((current) => {
      const currentSet = new Set(current.platforms || []);
      if (currentSet.has(platform)) currentSet.delete(platform);
      else currentSet.add(platform);
      return { ...current, platforms: Array.from(currentSet) };
    });
  };

  const saveSettingsPatch = async (body, successText) => {
    setSettingsSaving(true);
    setMessage({ type: '', text: '' });
    try {
      const result = await swarmApi.updateSettings(body);
      setSettingsPayload(result);
      setMessage({ type: 'success', text: successText || 'Automation settings saved.' });
      await loadSwarm({ silent: true });
    } catch (error) {
      setMessage({ type: 'error', text: error.message || 'Could not save automation settings.' });
    } finally {
      setSettingsSaving(false);
    }
  };

  const updateGlobalSetting = (field, value) => {
    saveSettingsPatch({ global: { ...(settings?.global || {}), [field]: value }, reason: `admin-updated-global-${field}` });
  };

  const updateAutomationControl = (jobType, patch) => {
    const current = settings?.automations?.[jobType] || {};
    saveSettingsPatch({
      automations: {
        [jobType]: {
          ...current,
          ...patch,
        },
      },
      reason: `admin-updated-${jobType}`,
    }, `${formatJobTypeLabel(jobType, catalog)} settings updated.`);
  };

  const submitJob = async (event) => {
    event.preventDefault();
    const topic = form.topic.trim();
    const title = form.title.trim();
    if (!topic && !title) {
      setMessage({ type: 'error', text: 'Add a topic, prompt, or title before creating a swarm job.' });
      return;
    }

    setSubmitting(true);
    setMessage({ type: '', text: '' });
    try {
      const keywords = form.keywords.split(',').map((item) => item.trim()).filter(Boolean);
      const payload = {
        vertical: form.vertical,
        jobType: form.jobType,
        mode: form.mode,
        priority: Number(form.priority) || 50,
        sourceEntity: buildManualSourceEntity({ title, topic, jobType: form.jobType, vertical: form.vertical }),
        input: {
          topic: topic || title,
          title: title || topic,
          prompt: topic || title,
          keywords,
          platforms: form.jobType.startsWith('social.') ? form.platforms : undefined,
          requestedOutput: form.jobType.startsWith('content.') ? 'blog-ready structured draft with SEO fields and sections' : undefined,
        },
        metadata: {
          submittedFrom: 'fantasymmadness-frontend-swarm-command-center',
          frontendMode: form.mode,
        },
      };

      const result = await swarmApi.createJob(payload);
      setMessage({ type: 'success', text: `Job submitted${result?.job?.jobId ? `: ${result.job.jobId}` : ''}. Refresh in a few seconds to see the output.` });
      setForm((current) => ({ ...DEFAULT_FORM, vertical: current.vertical, jobType: current.jobType, mode: current.mode }));
      await loadSwarm({ silent: true });
    } catch (error) {
      setMessage({ type: 'error', text: error.message || 'Could not submit swarm job.' });
    } finally {
      setSubmitting(false);
    }
  };

  const submitAutomationEvent = async (event) => {
    event.preventDefault();
    const title = eventForm.title.trim();
    const topic = eventForm.topic.trim();
    const jobTypes = eventForm.jobTypes.split(',').map((item) => item.trim()).filter(Boolean);
    setSubmitting(true);
    setMessage({ type: '', text: '' });
    try {
      const payload = {
        trigger: eventForm.trigger,
        vertical: eventForm.vertical,
        mode: eventForm.mode || undefined,
        jobTypes: jobTypes.length ? jobTypes : undefined,
        sourceEntity: buildManualSourceEntity({ title, topic, vertical: eventForm.vertical, trigger: eventForm.trigger }),
        input: {
          title: title || formatJobTypeLabel(eventForm.trigger),
          topic: topic || title || eventForm.trigger,
          prompt: topic || title || eventForm.trigger,
        },
        metadata: {
          submittedFrom: 'frontend-automation-event-trigger',
        },
        reason: 'manual-trigger-from-admin-automation-panel',
      };
      const result = await swarmApi.triggerEvent(payload);
      setMessage({ type: 'success', text: `Automation event submitted. Created jobs: ${result?.createdJobs?.length || 0}.` });
      setEventForm((current) => ({ ...DEFAULT_EVENT_FORM, trigger: current.trigger, vertical: current.vertical, mode: current.mode }));
      await loadSwarm({ silent: true });
    } catch (error) {
      setMessage({ type: 'error', text: error.message || 'Could not trigger automation event.' });
    } finally {
      setSubmitting(false);
    }
  };

  const runManualAutomation = async (jobType) => {
    const catalogItem = catalogRows.find((item) => item.value === jobType);
    const vertical = eventForm.vertical || (catalogItem?.verticals?.includes('combat') ? 'combat' : 'pro_wrestling');
    setActionId(`run:${jobType}`);
    setMessage({ type: '', text: '' });
    try {
      const result = await swarmApi.runAutomation(jobType, {
        vertical,
        mode: settings?.automations?.[jobType]?.defaultMode || settings?.global?.defaultMode || 'DRAFT_ONLY',
        sourceEntity: buildManualSourceEntity({ title: catalogItem?.label, topic: catalogItem?.description, jobType, vertical }),
        input: {
          title: catalogItem?.label || formatJobTypeLabel(jobType, catalog),
          topic: eventForm.topic || catalogItem?.description || catalogItem?.label || jobType,
          prompt: eventForm.topic || catalogItem?.description || catalogItem?.label || jobType,
        },
      });
      setMessage({ type: 'success', text: `Manual automation started${result?.job?.jobId ? `: ${result.job.jobId}` : ''}.` });
      await loadSwarm({ silent: true });
    } catch (error) {
      setMessage({ type: 'error', text: error.message || 'Could not run automation.' });
    } finally {
      setActionId('');
    }
  };

  const runArtifactAction = async (artifact, action) => {
    const artifactId = artifact?.artifactId || artifact?.id;
    if (!artifactId) return;
    setActionId(`${action}:${artifactId}`);
    setMessage({ type: '', text: '' });
    try {
      if (action === 'approve') {
        const publish = isBlogLikeArtifact(artifact);
        await swarmApi.approveArtifact(artifactId, {
          publish,
          reason: publish ? 'Approved and published from frontend swarm automation panel.' : 'Approved from frontend swarm automation panel.',
        });
        setMessage({ type: 'success', text: publish ? 'Artifact approved and published to Blogs.' : 'Artifact approved.' });
      }
      if (action === 'approveOnly') {
        await swarmApi.approveArtifact(artifactId, { publish: false, reason: 'Approved without publishing from frontend swarm panel.' });
        setMessage({ type: 'success', text: 'Artifact approved without publishing.' });
      }
      if (action === 'reject') {
        await swarmApi.rejectArtifact(artifactId, { reason: 'Rejected from frontend swarm automation panel.' });
        setMessage({ type: 'success', text: 'Artifact rejected.' });
      }
      if (action === 'regenerate') {
        await swarmApi.regenerateArtifact(artifactId, { reason: 'Regenerated from frontend swarm automation panel.' });
        setMessage({ type: 'success', text: 'Regeneration job submitted.' });
      }
      await loadSwarm({ silent: true });
    } catch (error) {
      setMessage({ type: 'error', text: error.message || 'Artifact action failed.' });
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
      setMessage({ type: 'success', text: action === 'cancel' ? 'Job cancellation requested.' : 'Job retry requested.' });
      await loadSwarm({ silent: true });
    } catch (error) {
      setMessage({ type: 'error', text: error.message || 'Job action failed.' });
    } finally {
      setActionId('');
    }
  };

  const online = Boolean(health?.swarmReachable);
  const globalSettings = settings?.global || {};
  const tabButtonClass = (tab) => `admin-swarm-tab${activeTab === tab ? ' is-active' : ''}`;

  return (
    <div className="admin-swarm-workspace">
      <section className="admin-swarm-hero">
        <div>
          <p className="admin-page-eyebrow"><FaRobot /> Swarm command center</p>
          <h1>Centralized website automation</h1>
          <p>MMA/fight and pro-wrestling automation runs through the backend gateway. Admins can control triggers, modes, reviews, social drafts, SEO tasks, content jobs, logs, and generated artifacts from one panel.</p>
        </div>
        <span className={`admin-status-badge ${online ? 'is-success' : config?.enabled ? 'is-danger' : 'is-warning'}`}>
          {online ? <FaShieldAlt /> : config?.enabled ? <FaExclamationTriangle /> : <FaBolt />}
          {online ? 'IONOS swarm online' : config?.enabled ? 'Gateway needs attention' : 'Gateway installed / disabled'}
        </span>
      </section>

      {message.text && (
        <div className={`admin-swarm-alert is-${message.type || 'info'}`} role="status">
          {message.type === 'error' ? <FaExclamationTriangle /> : <FaBolt />}
          <span>{message.text}</span>
        </div>
      )}

      <section className="admin-swarm-metrics" aria-label="Swarm metrics">
        <article><small>Total jobs</small><strong>{loading ? '—' : Number(counts.jobs || jobs.length || 0).toLocaleString()}</strong></article>
        <article><small>Artifacts</small><strong>{loading ? '—' : Number(counts.artifacts || artifacts.length || 0).toLocaleString()}</strong></article>
        <article><small>Enabled automations</small><strong>{loading ? '—' : `${Number(counts.enabledAutomations || 0).toLocaleString()}/${Number(counts.totalAutomations || catalogRows.length || 0).toLocaleString()}`}</strong></article>
        <article><small>Awaiting review</small><strong>{loading ? '—' : Number(counts.awaitingReview || artifacts.filter((item) => ['DRAFT', 'AWAITING_REVIEW'].includes(item.reviewStatus)).length || 0).toLocaleString()}</strong></article>
      </section>

      <section className="admin-swarm-tabs" aria-label="Swarm sections">
        <button type="button" className={tabButtonClass('overview')} onClick={() => setActiveTab('overview')}><FaChartLine /> Overview</button>
        <button type="button" className={tabButtonClass('create')} onClick={() => setActiveTab('create')}><FaPaperPlane /> Create job</button>
        <button type="button" className={tabButtonClass('automations')} onClick={() => setActiveTab('automations')}><FaSlidersH /> Automation controls</button>
        <button type="button" className={tabButtonClass('events')} onClick={() => setActiveTab('events')}><FaBolt /> Event triggers</button>
        <button type="button" className={tabButtonClass('artifacts')} onClick={() => setActiveTab('artifacts')}><FaFileAlt /> Review artifacts</button>
        <button type="button" className={tabButtonClass('jobs')} onClick={() => setActiveTab('jobs')}><FaHistory /> Jobs & logs</button>
      </section>

      {activeTab === 'overview' && (
        <section className="admin-swarm-layout">
          <aside className="admin-swarm-panel admin-swarm-health">
            <header>
              <div>
                <span>Gateway</span>
                <h2>Health & controls</h2>
              </div>
              <button type="button" className="admin-action-secondary" onClick={() => loadSwarm()} disabled={loading}>
                <FaSyncAlt /> Refresh
              </button>
            </header>

            <div className="admin-swarm-health-list">
              <p><strong>Backend gateway</strong><span>{config ? 'Installed' : 'Not loaded'}</span></p>
              <p><strong>Swarm enabled</strong><span>{config?.enabled ? 'Yes' : 'No'}</span></p>
              <p><strong>IONOS reachable</strong><span>{online ? 'Yes' : 'No'}</span></p>
              <p><strong>Default mode</strong><span>{config?.defaultMode || globalSettings.defaultMode || '—'}</span></p>
              <p><strong>Global pause</strong><span>{globalSettings.paused ? 'Paused' : 'Active'}</span></p>
              <p><strong>Auto publish</strong><span>{config?.autoPublishEnabled && globalSettings.autoPublishEnabled ? 'Enabled' : 'Disabled'}</span></p>
              <p><strong>Social publish</strong><span>{config?.socialPublishEnabled && globalSettings.socialPublishEnabled ? 'Enabled' : 'Draft only'}</span></p>
            </div>

            <label className="admin-swarm-refresh-toggle">
              <input type="checkbox" checked={autoRefresh} onChange={(event) => setAutoRefresh(event.target.checked)} />
              <span>Auto refresh every 20 seconds</span>
            </label>

            <small className="admin-swarm-note">Frontend never calls IONOS directly. All actions pass through the authenticated backend.</small>
          </aside>

          <section className="admin-swarm-panel">
            <header>
              <div>
                <span>Automation brain</span>
                <h2>Dashboard snapshot</h2>
              </div>
              <button type="button" className="admin-action-secondary" onClick={() => runManualAutomation('automation.settings-snapshot')} disabled={Boolean(actionId)}>
                <FaCog /> Snapshot
              </button>
            </header>
            <div className="admin-swarm-dashboard-grid">
              <article><small>Failed jobs</small><strong>{Number(counts.failedJobs || 0).toLocaleString()}</strong><span>Needs retry/review</span></article>
              <article><small>Automation events</small><strong>{Number(events.length || 0).toLocaleString()}</strong><span>Recent backend triggers</span></article>
              <article><small>Daily scheduler</small><strong>{globalSettings.dailySchedulerEnabled ? 'On' : 'Off'}</strong><span>SEO/topic checks</span></article>
              <article><small>Weekly scheduler</small><strong>{globalSettings.weeklySchedulerEnabled ? 'On' : 'Off'}</strong><span>Opportunity reports</span></article>
            </div>
            <div className="admin-swarm-quick-actions">
              <button type="button" onClick={() => setActiveTab('automations')} className="admin-action-secondary"><FaSlidersH /> Configure automations</button>
              <button type="button" onClick={() => setActiveTab('events')} className="admin-action-secondary"><FaBolt /> Trigger event</button>
              <button type="button" onClick={() => setActiveTab('artifacts')} className="admin-action-secondary"><FaFileAlt /> Review artifacts</button>
            </div>
          </section>
        </section>
      )}

      {activeTab === 'create' && (
        <section className="admin-swarm-layout">
          <form className="admin-swarm-panel admin-swarm-create" onSubmit={submitJob}>
            <header>
              <div>
                <span>Generate</span>
                <h2>Create swarm job</h2>
              </div>
              <button type="submit" disabled={submitting} className="admin-topbar-primary">
                <FaPaperPlane /> {submitting ? 'Submitting...' : 'Submit job'}
              </button>
            </header>

            <div className="admin-swarm-form-grid">
              <label>
                <span>Vertical</span>
                <select value={form.vertical} onChange={(event) => updateForm('vertical', event.target.value)}>
                  <option value="combat">MMA / combat</option>
                  <option value="pro_wrestling">Pro wrestling</option>
                </select>
              </label>
              <label>
                <span>Job type</span>
                <select value={form.jobType} onChange={(event) => updateForm('jobType', event.target.value)}>
                  {availableJobTypes.map((type) => <option key={type.value} value={type.value}>{type.label}</option>)}
                </select>
              </label>
              <label>
                <span>Mode</span>
                <select value={form.mode} onChange={(event) => updateForm('mode', event.target.value)}>
                  {SWARM_MODES.map((mode) => <option key={mode.value} value={mode.value}>{mode.label}</option>)}
                </select>
              </label>
              <label>
                <span>Priority</span>
                <input type="number" min="0" max="100" value={form.priority} onChange={(event) => updateForm('priority', event.target.value)} />
              </label>
            </div>

            <label className="admin-swarm-field-full">
              <span>Title / short label</span>
              <input value={form.title} onChange={(event) => updateForm('title', event.target.value)} placeholder="Example: UFC 310 fight preview, WrestleMania card recap" />
            </label>

            <label className="admin-swarm-field-full">
              <span>Prompt / topic</span>
              <textarea value={form.topic} onChange={(event) => updateForm('topic', event.target.value)} placeholder="Describe exactly what the swarm should create or analyze." rows={5} />
            </label>

            <label className="admin-swarm-field-full">
              <span>SEO keywords, comma separated</span>
              <input value={form.keywords} onChange={(event) => updateForm('keywords', event.target.value)} placeholder="fantasy mma, fight picks, pro wrestling predictions" />
            </label>

            {form.jobType.startsWith('social.') && (
              <div className="admin-swarm-platforms">
                <span>Social platforms</span>
                <div>
                  {platformOptions.map((platform) => (
                    <label key={platform}>
                      <input type="checkbox" checked={form.platforms.includes(platform)} onChange={() => togglePlatform(platform)} />
                      <span>{platform.toUpperCase()}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </form>

          <aside className="admin-swarm-panel admin-swarm-health">
            <header>
              <div>
                <span>Selected automation</span>
                <h2>{formatJobTypeLabel(form.jobType, catalog)}</h2>
              </div>
            </header>
            <div className="admin-swarm-health-list">
              <p><strong>Group</strong><span>{SWARM_GROUP_LABELS[inferJobTypeGroup(form.jobType, catalog)] || inferJobTypeGroup(form.jobType, catalog)}</span></p>
              <p><strong>Mode</strong><span>{form.mode}</span></p>
              <p><strong>Approval flow</strong><span>{form.mode === 'AUTOMATED' ? 'Auto where backend allows' : 'Review/draft safe'}</span></p>
              <p><strong>Twitter/X</strong><span>{form.jobType.startsWith('social.') ? 'Draft now; publish only when enabled' : 'Available as follow-up'}</span></p>
            </div>
            <small className="admin-swarm-note">Manual jobs include a default source entity, so free-form prompts work without selecting an existing fight or blog.</small>
          </aside>
        </section>
      )}

      {activeTab === 'automations' && (
        <section className="admin-swarm-panel admin-swarm-list-panel">
          <header>
            <div>
              <span>Controls</span>
              <h2>Automation settings</h2>
            </div>
            <div className="admin-swarm-filters">
              <button type="button" className="admin-action-secondary" disabled={settingsSaving} onClick={() => updateGlobalSetting('paused', !globalSettings.paused)}>
                {globalSettings.paused ? <FaPlay /> : <FaPause />} {globalSettings.paused ? 'Resume all' : 'Pause all'}
              </button>
              <label><FaGlobe /><select value={filters.vertical} onChange={(event) => setFilters((current) => ({ ...current, vertical: event.target.value }))}><option value="">All verticals</option><option value="combat">MMA / combat</option><option value="pro_wrestling">Pro wrestling</option></select></label>
              <label><FaList /><select value={filters.group} onChange={(event) => setFilters((current) => ({ ...current, group: event.target.value }))}><option value="">All groups</option>{Object.entries(SWARM_GROUP_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
              <label><FaSearch /><input value={filters.search} onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))} placeholder="Search automations" /></label>
            </div>
          </header>

          <div className="admin-swarm-global-controls">
            <label>
              <span>Default mode</span>
              <select value={globalSettings.defaultMode || 'DRAFT_ONLY'} onChange={(event) => updateGlobalSetting('defaultMode', event.target.value)} disabled={settingsSaving}>
                {SWARM_MODES.map((mode) => <option key={mode.value} value={mode.value}>{mode.label}</option>)}
              </select>
            </label>
            <label>
              <span>Daily scheduler</span>
              <button type="button" className="admin-action-secondary" disabled={settingsSaving} onClick={() => updateGlobalSetting('dailySchedulerEnabled', !globalSettings.dailySchedulerEnabled)}>{globalSettings.dailySchedulerEnabled ? <FaToggleOn /> : <FaToggleOff />} {globalSettings.dailySchedulerEnabled ? 'Enabled' : 'Disabled'}</button>
            </label>
            <label>
              <span>Weekly scheduler</span>
              <button type="button" className="admin-action-secondary" disabled={settingsSaving} onClick={() => updateGlobalSetting('weeklySchedulerEnabled', !globalSettings.weeklySchedulerEnabled)}>{globalSettings.weeklySchedulerEnabled ? <FaToggleOn /> : <FaToggleOff />} {globalSettings.weeklySchedulerEnabled ? 'Enabled' : 'Disabled'}</button>
            </label>
            <label>
              <span>Social publishing</span>
              <button type="button" className="admin-action-secondary" disabled={settingsSaving} onClick={() => updateGlobalSetting('socialPublishEnabled', !globalSettings.socialPublishEnabled)}>{globalSettings.socialPublishEnabled ? <FaToggleOn /> : <FaToggleOff />} {globalSettings.socialPublishEnabled ? 'Enabled' : 'Draft only'}</button>
            </label>
          </div>

          <div className="admin-swarm-automation-grid">
            {visibleAutomationRows.map((item) => {
              const control = settings?.automations?.[item.value] || {};
              const enabled = control.enabled !== false;
              return (
                <article key={item.value} className={`admin-swarm-automation-card ${enabled ? '' : 'is-disabled'}`}>
                  <div className="admin-swarm-automation-head">
                    <span className={`admin-status-badge ${enabled ? 'is-success' : 'is-danger'}`}>{enabled ? <FaToggleOn /> : <FaToggleOff />} {enabled ? 'Enabled' : 'Disabled'}</span>
                    <small>{SWARM_GROUP_LABELS[item.group] || item.group}</small>
                  </div>
                  <h3>{item.label}</h3>
                  <p>{item.description || item.value}</p>
                  <code>{item.value}</code>
                  <div className="admin-swarm-control-row">
                    <button type="button" className="admin-action-secondary" disabled={settingsSaving} onClick={() => updateAutomationControl(item.value, { enabled: !enabled })}>{enabled ? 'Disable' : 'Enable'}</button>
                    <select value={control.defaultMode || item.defaultMode || 'DRAFT_ONLY'} disabled={settingsSaving} onChange={(event) => updateAutomationControl(item.value, { defaultMode: event.target.value })}>
                      {SWARM_MODES.map((mode) => <option key={mode.value} value={mode.value}>{mode.label}</option>)}
                    </select>
                    <button type="button" className="admin-action-secondary" disabled={settingsSaving} onClick={() => updateAutomationControl(item.value, { requiresApproval: control.requiresApproval === false })}>{control.requiresApproval === false ? 'No approval' : 'Requires approval'}</button>
                    <button type="button" className="admin-topbar-primary" disabled={Boolean(actionId)} onClick={() => runManualAutomation(item.value)}><FaPlay /> Run</button>
                  </div>
                  {Array.isArray(control.triggers) && control.triggers.length > 0 && <small className="admin-swarm-trigger-list">Triggers: {control.triggers.join(', ')}</small>}
                </article>
              );
            })}
          </div>
        </section>
      )}

      {activeTab === 'events' && (
        <section className="admin-swarm-layout">
          <form className="admin-swarm-panel admin-swarm-create" onSubmit={submitAutomationEvent}>
            <header>
              <div>
                <span>Event hooks</span>
                <h2>Trigger automation event</h2>
              </div>
              <button type="submit" disabled={submitting} className="admin-topbar-primary"><FaBolt /> {submitting ? 'Triggering...' : 'Trigger event'}</button>
            </header>
            <div className="admin-swarm-form-grid">
              <label>
                <span>Trigger</span>
                <select value={eventForm.trigger} onChange={(event) => updateEventForm('trigger', event.target.value)}>
                  {SWARM_TRIGGER_OPTIONS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                </select>
              </label>
              <label>
                <span>Vertical</span>
                <select value={eventForm.vertical} onChange={(event) => updateEventForm('vertical', event.target.value)}>
                  <option value="combat">MMA / combat</option>
                  <option value="pro_wrestling">Pro wrestling</option>
                </select>
              </label>
              <label>
                <span>Mode override</span>
                <select value={eventForm.mode} onChange={(event) => updateEventForm('mode', event.target.value)}>
                  <option value="">Use automation setting</option>
                  {SWARM_MODES.map((mode) => <option key={mode.value} value={mode.value}>{mode.label}</option>)}
                </select>
              </label>
              <label>
                <span>Specific job types</span>
                <input value={eventForm.jobTypes} onChange={(event) => updateEventForm('jobTypes', event.target.value)} placeholder="Optional comma list" />
              </label>
            </div>
            <label className="admin-swarm-field-full">
              <span>Title / source label</span>
              <input value={eventForm.title} onChange={(event) => updateEventForm('title', event.target.value)} placeholder="Example: UFC 310 published, Blog approved, Contest completed" />
            </label>
            <label className="admin-swarm-field-full">
              <span>Context / prompt</span>
              <textarea value={eventForm.topic} onChange={(event) => updateEventForm('topic', event.target.value)} placeholder="Optional context for generated drafts and reports." rows={5} />
            </label>
          </form>

          <aside className="admin-swarm-panel admin-swarm-health">
            <header>
              <div>
                <span>Recent events</span>
                <h2>Automation logs</h2>
              </div>
              <button type="button" className="admin-action-secondary" onClick={() => loadSwarm()}><FaSyncAlt /> Refresh</button>
            </header>
            <div className="admin-swarm-events-list">
              {events.length === 0 ? <p className="admin-swarm-note">No backend automation events found yet.</p> : events.slice(0, 8).map((event) => (
                <article key={event.eventId || event._id}>
                  <span className={`admin-status-badge ${statusClass(event.status)}`}>{event.status || 'unknown'}</span>
                  <strong>{event.trigger || 'automation_event'}</strong>
                  <small>{event.vertical || '—'} · {formatSwarmDate(event.createdAt)}</small>
                  <p>{Number(event.createdJobs?.length || 0)} jobs created · {Number(event.errors?.length || 0)} errors</p>
                  <button type="button" className="admin-swarm-json-toggle" onClick={() => setExpandedEventId(expandedEventId === event.eventId ? '' : event.eventId)}>{expandedEventId === event.eventId ? 'Hide event' : 'View event'}</button>
                  {expandedEventId === event.eventId && <pre className="admin-swarm-json">{compactJson(event)}</pre>}
                </article>
              ))}
            </div>
          </aside>
        </section>
      )}

      {activeTab === 'artifacts' && (
        <section className="admin-swarm-panel admin-swarm-list-panel">
          <header>
            <div>
              <span>Review queue</span>
              <h2>Generated artifacts</h2>
            </div>
            <div className="admin-swarm-filters">
              <label><FaGlobe /><select value={filters.vertical} onChange={(event) => setFilters((current) => ({ ...current, vertical: event.target.value }))}><option value="">All verticals</option><option value="combat">MMA / combat</option><option value="pro_wrestling">Pro wrestling</option></select></label>
              <label><FaSearch /><select value={filters.reviewStatus} onChange={(event) => setFilters((current) => ({ ...current, reviewStatus: event.target.value }))}><option value="">All review states</option><option value="AWAITING_REVIEW">Awaiting review</option><option value="DRAFT">Draft</option><option value="APPROVED">Approved</option><option value="PUBLISHED">Published</option><option value="REJECTED">Rejected</option></select></label>
              <button type="button" className="admin-action-secondary" onClick={() => loadSwarm()}><FaSyncAlt /> Refresh</button>
            </div>
          </header>

          {artifacts.length === 0 ? (
            <div className="admin-swarm-empty"><FaFileAlt /><strong>No artifacts yet</strong><span>Create a job or trigger automation, then refresh after the worker completes it.</span></div>
          ) : (
            <div className="admin-swarm-artifacts">
              {artifacts.map((artifact) => {
                const artifactId = artifact.artifactId || artifact.id;
                const payload = getArtifactPayload(artifact);
                const expanded = expandedArtifactId === artifactId;
                const blogLike = isBlogLikeArtifact(artifact);
                return (
                  <article className="admin-swarm-artifact" key={artifactId}>
                    <div className="admin-swarm-artifact-main">
                      <div>
                        <span className={`admin-status-badge ${statusClass(artifact.reviewStatus)}`}>{artifact.reviewStatus || 'AWAITING_REVIEW'}</span>
                        <small>{artifact.vertical} · {artifact.artifactType || artifact.jobType}</small>
                        <h3>{getArtifactTitle(artifact)}</h3>
                        <p>{String(getArtifactSummary(artifact)).slice(0, 280)}</p>
                      </div>
                      <div className="admin-swarm-artifact-actions">
                        <button type="button" onClick={() => runArtifactAction(artifact, 'approve')} disabled={Boolean(actionId)} className="admin-topbar-primary">
                          <FaCheck /> {blogLike ? 'Approve & publish blog' : 'Approve'}
                        </button>
                        {blogLike && (
                          <button type="button" onClick={() => runArtifactAction(artifact, 'approveOnly')} disabled={Boolean(actionId)} className="admin-action-secondary">
                            <FaShieldAlt /> Approve only
                          </button>
                        )}
                        <button type="button" onClick={() => runArtifactAction(artifact, 'regenerate')} disabled={Boolean(actionId)} className="admin-action-secondary"><FaRedo /> Regenerate</button>
                        <button type="button" onClick={() => runArtifactAction(artifact, 'reject')} disabled={Boolean(actionId)} className="admin-action-secondary is-danger"><FaTimes /> Reject</button>
                      </div>
                    </div>

                    {Array.isArray(payload.sections) && payload.sections.length > 0 && (
                      <div className="admin-swarm-section-preview">
                        {payload.sections.slice(0, 3).map((section, index) => (
                          <section key={`${artifactId}-section-${index}`}>
                            <strong>{section.title || `Section ${index + 1}`}</strong>
                            <p>{String(section.content || section.body || '').slice(0, 220)}</p>
                          </section>
                        ))}
                      </div>
                    )}

                    <button type="button" className="admin-swarm-json-toggle" onClick={() => setExpandedArtifactId(expanded ? '' : artifactId)}>
                      {expanded ? 'Hide payload' : 'View payload'}
                    </button>
                    {expanded && <pre className="admin-swarm-json">{compactJson(payload)}</pre>}
                  </article>
                );
              })}
            </div>
          )}
        </section>
      )}

      {activeTab === 'jobs' && (
        <section className="admin-swarm-panel admin-swarm-list-panel">
          <header>
            <div>
              <span>Runtime</span>
              <h2>Recent jobs</h2>
            </div>
            <div className="admin-swarm-filters">
              <label><FaSearch /><select value={filters.status} onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))}><option value="">All job states</option><option value="queued">Queued</option><option value="running">Running</option><option value="awaiting_review">Awaiting review</option><option value="published">Published</option><option value="failed">Failed</option><option value="dead_letter">Dead letter</option></select></label>
              <button type="button" className="admin-action-secondary" onClick={() => runManualAutomation('automation.failed-job-retry-report')} disabled={Boolean(actionId)}><FaRedo /> Retry report</button>
              <button type="button" className="admin-action-secondary" onClick={() => runManualAutomation('automation.agent-performance-dashboard')} disabled={Boolean(actionId)}><FaChartLine /> Agent dashboard</button>
            </div>
          </header>

          <div className="admin-data-table-scroll">
            <table className="admin-data-table admin-swarm-table">
              <thead>
                <tr><th>Job</th><th>Vertical</th><th>Type</th><th>Input</th><th>Status</th><th>Created</th><th>Action</th></tr>
              </thead>
              <tbody>
                {jobs.length === 0 ? (
                  <tr><td colSpan="7">No jobs found.</td></tr>
                ) : jobs.map((job) => (
                  <tr key={job.jobId || job.id}>
                    <td><strong>{job.jobId || job.id || '—'}</strong></td>
                    <td>{job.vertical || '—'}</td>
                    <td>{formatJobTypeLabel(job.jobType, catalog)}</td>
                    <td>{summarizeJobInput(job.input)}</td>
                    <td><span className={`admin-status-badge ${statusClass(job.status)}`}>{job.status || 'unknown'}</span></td>
                    <td>{formatSwarmDate(job.createdAt)}</td>
                    <td>
                      <div className="admin-swarm-row-actions">
                        <button type="button" onClick={() => runJobAction(job, 'retry')} disabled={!job.jobId || Boolean(actionId)}><FaRedo /> Retry</button>
                        <button type="button" onClick={() => runJobAction(job, 'cancel')} disabled={!job.jobId || Boolean(actionId)}><FaTimes /> Cancel</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
};

export default SwarmCommandCenter;
