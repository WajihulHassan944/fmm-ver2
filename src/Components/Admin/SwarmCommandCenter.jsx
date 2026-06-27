import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  FaBolt,
  FaCheck,
  FaExclamationTriangle,
  FaFileAlt,
  FaGlobe,
  FaPaperPlane,
  FaRedo,
  FaRobot,
  FaSearch,
  FaShieldAlt,
  FaSyncAlt,
  FaTimes,
} from 'react-icons/fa';
import {
  formatSwarmDate,
  isBlogLikeArtifact,
  summarizeJobInput,
  swarmApi,
  SWARM_JOB_TYPES,
  SWARM_MODES,
} from '@/Utils/swarmApi';

const DEFAULT_FORM = {
  vertical: 'combat',
  jobType: 'content.article',
  mode: 'DRAFT_ONLY',
  priority: 50,
  topic: '',
  title: '',
  keywords: '',
  platforms: ['x', 'facebook', 'instagram'],
};

const statusClass = (value) => {
  const normalized = String(value || '').toLowerCase();
  if (['succeeded', 'awaiting_review', 'approved', 'published', 'online', 'ready'].includes(normalized)) return 'is-success';
  if (['failed', 'dead_letter', 'failed_to_submit', 'cancelled', 'rejected', 'needs attention'].includes(normalized)) return 'is-danger';
  return 'is-warning';
};

const normalizeItems = (payload) => {
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.data?.items)) return payload.data.items;
  return [];
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

const compactJson = (value) => {
  try {
    return JSON.stringify(value || {}, null, 2);
  } catch (_error) {
    return String(value || '');
  }
};

const platformOptions = ['x', 'facebook', 'instagram', 'linkedin', 'youtube', 'discord'];

const SwarmCommandCenter = () => {
  const [form, setForm] = useState(DEFAULT_FORM);
  const [filters, setFilters] = useState({ vertical: '', status: '', reviewStatus: '' });
  const [config, setConfig] = useState(null);
  const [health, setHealth] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [artifacts, setArtifacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [actionId, setActionId] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' });
  const [expandedArtifactId, setExpandedArtifactId] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(false);

  const availableJobTypes = useMemo(
    () => SWARM_JOB_TYPES.filter((item) => item.verticals.includes(form.vertical)),
    [form.vertical],
  );

  useEffect(() => {
    if (!availableJobTypes.some((item) => item.value === form.jobType)) {
      setForm((current) => ({ ...current, jobType: availableJobTypes[0]?.value || 'content.article' }));
    }
  }, [availableJobTypes, form.jobType]);

  const loadSwarm = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);
    try {
      const jobQuery = { limit: 12, fallbackCache: true };
      const artifactQuery = { limit: 12, fallbackCache: true };
      if (filters.vertical) {
        jobQuery.vertical = filters.vertical;
        artifactQuery.vertical = filters.vertical;
      }
      if (filters.status) jobQuery.status = filters.status;
      if (filters.reviewStatus) artifactQuery.reviewStatus = filters.reviewStatus;

      const [configResult, healthResult, jobsResult, artifactsResult] = await Promise.allSettled([
        swarmApi.config(),
        swarmApi.health(),
        swarmApi.listJobs(jobQuery),
        swarmApi.listArtifacts(artifactQuery),
      ]);

      setConfig(configResult.status === 'fulfilled' ? configResult.value : null);
      setHealth(healthResult.status === 'fulfilled' ? healthResult.value : null);
      setJobs(jobsResult.status === 'fulfilled' ? normalizeItems(jobsResult.value) : []);
      setArtifacts(artifactsResult.status === 'fulfilled' ? normalizeItems(artifactsResult.value) : []);

      const rejected = [configResult, healthResult, jobsResult, artifactsResult].find((item) => item.status === 'rejected');
      if (rejected) {
        setMessage({ type: 'warning', text: rejected.reason?.message || 'Some swarm data could not be loaded.' });
      } else if (!silent) {
        setMessage({ type: 'success', text: 'Swarm panel refreshed.' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: error.message || 'Unable to load swarm panel.' });
    } finally {
      if (!silent) setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadSwarm();
  }, [loadSwarm]);

  useEffect(() => {
    if (!autoRefresh) return undefined;
    const id = window.setInterval(() => loadSwarm({ silent: true }), 20000);
    return () => window.clearInterval(id);
  }, [autoRefresh, loadSwarm]);

  const updateForm = (field, value) => setForm((current) => ({ ...current, [field]: value }));

  const togglePlatform = (platform) => {
    setForm((current) => {
      const currentSet = new Set(current.platforms || []);
      if (currentSet.has(platform)) currentSet.delete(platform);
      else currentSet.add(platform);
      return { ...current, platforms: Array.from(currentSet) };
    });
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
        input: {
          topic,
          title,
          prompt: topic,
          keywords,
          platforms: form.jobType === 'social.draft' ? form.platforms : undefined,
          requestedOutput: form.jobType.startsWith('content.') ? 'blog-ready structured draft with SEO fields and sections' : undefined,
        },
        metadata: {
          submittedFrom: 'fantasymmadness-frontend-swarm-command-center',
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

  const runArtifactAction = async (artifact, action) => {
    const artifactId = artifact?.artifactId;
    if (!artifactId) return;
    setActionId(`${action}:${artifactId}`);
    setMessage({ type: '', text: '' });
    try {
      if (action === 'approve') {
        const publish = isBlogLikeArtifact(artifact);
        await swarmApi.approveArtifact(artifactId, {
          publish,
          reason: publish ? 'Approved and published from frontend swarm panel.' : 'Approved from frontend swarm panel.',
        });
        setMessage({ type: 'success', text: publish ? 'Artifact approved and published to Blogs.' : 'Artifact approved.' });
      }
      if (action === 'approveOnly') {
        await swarmApi.approveArtifact(artifactId, { publish: false, reason: 'Approved without publishing from frontend swarm panel.' });
        setMessage({ type: 'success', text: 'Artifact approved without publishing.' });
      }
      if (action === 'reject') {
        await swarmApi.rejectArtifact(artifactId, { reason: 'Rejected from frontend swarm panel.' });
        setMessage({ type: 'success', text: 'Artifact rejected.' });
      }
      if (action === 'regenerate') {
        await swarmApi.regenerateArtifact(artifactId, { reason: 'Regenerated from frontend swarm panel.' });
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
    const jobId = job?.jobId;
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

  const cache = health?.cache || {};
  const online = Boolean(health?.swarmReachable);

  return (
    <div className="admin-swarm-workspace">
      <section className="admin-swarm-hero">
        <div>
          <p className="admin-page-eyebrow"><FaRobot /> Swarm command center</p>
          <h1>Centralized website automation</h1>
          <p>MMA/fight and pro-wrestling automation runs through the backend gateway, with all generated output reviewed here before it affects the live website.</p>
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
        <article><small>Total jobs</small><strong>{loading ? '—' : Number(cache.jobs || jobs.length || 0).toLocaleString()}</strong></article>
        <article><small>Artifacts</small><strong>{loading ? '—' : Number(cache.artifacts || artifacts.length || 0).toLocaleString()}</strong></article>
        <article><small>Awaiting review</small><strong>{loading ? '—' : Number(cache.awaitingReview || artifacts.filter((item) => ['DRAFT', 'AWAITING_REVIEW'].includes(item.reviewStatus)).length || 0).toLocaleString()}</strong></article>
        <article><small>Failed jobs</small><strong>{loading ? '—' : Number(cache.failedJobs || jobs.filter((item) => statusClass(item.status) === 'is-danger').length || 0).toLocaleString()}</strong></article>
      </section>

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

          {form.jobType === 'social.draft' && (
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
            <p><strong>Default mode</strong><span>{config?.defaultMode || '—'}</span></p>
            <p><strong>Auto publish</strong><span>{config?.autoPublishEnabled ? 'Enabled' : 'Disabled'}</span></p>
            <p><strong>Social publish</strong><span>{config?.socialPublishEnabled ? 'Enabled' : 'Draft only'}</span></p>
          </div>

          <label className="admin-swarm-refresh-toggle">
            <input type="checkbox" checked={autoRefresh} onChange={(event) => setAutoRefresh(event.target.checked)} />
            <span>Auto refresh every 20 seconds</span>
          </label>

          <small className="admin-swarm-note">Frontend never calls IONOS directly. All actions pass through the authenticated backend.</small>
        </aside>
      </section>

      <section className="admin-swarm-panel admin-swarm-list-panel">
        <header>
          <div>
            <span>Review queue</span>
            <h2>Generated artifacts</h2>
          </div>
          <div className="admin-swarm-filters">
            <label><FaGlobe /><select value={filters.vertical} onChange={(event) => setFilters((current) => ({ ...current, vertical: event.target.value }))}><option value="">All verticals</option><option value="combat">MMA / combat</option><option value="pro_wrestling">Pro wrestling</option></select></label>
            <label><FaSearch /><select value={filters.reviewStatus} onChange={(event) => setFilters((current) => ({ ...current, reviewStatus: event.target.value }))}><option value="">All review states</option><option value="AWAITING_REVIEW">Awaiting review</option><option value="DRAFT">Draft</option><option value="APPROVED">Approved</option><option value="PUBLISHED">Published</option><option value="REJECTED">Rejected</option></select></label>
          </div>
        </header>

        {artifacts.length === 0 ? (
          <div className="admin-swarm-empty"><FaFileAlt /><strong>No artifacts yet</strong><span>Create a job, then refresh after the worker completes it.</span></div>
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

      <section className="admin-swarm-panel admin-swarm-list-panel">
        <header>
          <div>
            <span>Runtime</span>
            <h2>Recent jobs</h2>
          </div>
          <div className="admin-swarm-filters">
            <label><FaSearch /><select value={filters.status} onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))}><option value="">All job states</option><option value="queued">Queued</option><option value="running">Running</option><option value="awaiting_review">Awaiting review</option><option value="published">Published</option><option value="failed">Failed</option><option value="dead_letter">Dead letter</option></select></label>
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
                  <td>{job.jobType || '—'}</td>
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
    </div>
  );
};

export default SwarmCommandCenter;
