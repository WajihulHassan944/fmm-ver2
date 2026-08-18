import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  FaCalendarAlt,
  FaChartLine,
  FaCheck,
  FaExclamationTriangle,
  FaFacebook,
  FaFileAlt,
  FaGlobe,
  FaInstagram,
  FaLink,
  FaMagic,
  FaNewspaper,
  FaRedo,
  FaRocket,
  FaSearch,
  FaSyncAlt,
  FaTwitter,
  FaUserPlus,
} from 'react-icons/fa';
import { seoAdminApi, getSeoItems, summarizeSeoPayload } from '@/Utils/seoAdminApi';
import { buildManualSourceEntity, formatSwarmDate, swarmApi } from '@/Utils/swarmApi';

const SEO_FORM_DEFAULT = {
  entityType: 'page',
  entityId: '',
  path: '/',
  canonicalUrl: '',
  metaTitle: '',
  metaDescription: '',
  keywords: '',
  status: 'draft',
};

const INTERNAL_LINK_DEFAULT = {
  path: '/',
  entityType: 'page',
  topic: 'fantasy mma, boxing, pro wrestling, active fights',
  limit: 8,
};

const growthActions = [
  { id: 'daily-seo', label: 'Daily SEO audit', helper: 'Missing metadata, weak pages, links, and page quality.', icon: FaSearch, run: (body) => swarmApi.runDailySeo(body) },
  { id: 'weekly-traffic', label: 'Weekly traffic report', helper: 'Keyword opportunities and growth priorities.', icon: FaChartLine, run: (body) => swarmApi.runWeeklySchedule(body) },
  { id: 'calendar-refresh', label: 'Fight schedule refresh', helper: 'Keep fight/event calendar opportunity queue fresh.', icon: FaCalendarAlt, run: (body) => swarmApi.runDailyCalendarRefresh(body) },
  { id: 'daily-social', label: 'Daily social drafts', helper: 'X, Instagram, Facebook draft queue for daily promotion.', icon: FaRocket, run: (body) => swarmApi.runDailySocial(body) },
  { id: 'growth-plan', label: '1000-user growth plan', helper: 'Acquisition plan focused on traffic and returning users.', icon: FaUserPlus, jobType: 'automation.growth-plan-1000-users' },
  { id: 'keyword-opportunity', label: 'Keyword opportunities', helper: 'Find MMA, boxing, wrestling long-tail topics.', icon: FaMagic, jobType: 'seo.keyword-opportunity' },
  { id: 'missing-meta', label: 'Missing metadata', helper: 'Find pages missing titles, descriptions, cards.', icon: FaFileAlt, jobType: 'seo.missing-metadata-detector' },
  { id: 'broken-links', label: 'Broken internal links', helper: 'Find broken or weak internal-link paths.', icon: FaLink, jobType: 'seo.broken-link-detector' },
  { id: 'low-quality', label: 'Low-quality pages', helper: 'Find thin pages and content gaps.', icon: FaExclamationTriangle, jobType: 'seo.low-quality-page-detector' },
  { id: 'duplicate-content', label: 'Duplicate content', helper: 'Identify duplicated or competing content.', icon: FaRedo, jobType: 'seo.duplicate-content-detector' },
  { id: 'content-freshness', label: 'Content freshness', helper: 'Find old blogs and pages that need refresh.', icon: FaNewspaper, jobType: 'seo.content-freshness-monitor' },
  { id: 'content-calendar', label: 'Content calendar', helper: 'Build daily blog/social topic queue.', icon: FaCalendarAlt, jobType: 'data.content-calendar' },
  { id: 'draft-queue', label: 'Draft queue generation', helper: 'Generate queued blog/content ideas.', icon: FaMagic, jobType: 'data.draft-queue-generation' },
  { id: 'competitor-gap', label: 'Competitor gap report', helper: 'Find content opportunities competitors cover.', icon: FaGlobe, jobType: 'data.competitor-gap-report' },
  { id: 'social-calendar', label: 'Social content calendar', helper: 'Plan multiple social posts per day.', icon: FaTwitter, jobType: 'social.content-calendar' },
];

const socialPlatforms = [
  { value: 'x', label: 'X/Twitter', icon: FaTwitter },
  { value: 'instagram', label: 'Instagram', icon: FaInstagram },
  { value: 'facebook', label: 'Facebook', icon: FaFacebook },
];

const statusClass = (value) => {
  const normalized = String(value || '').toLowerCase();
  if (['applied', 'approved', 'published', 'generated', 'succeeded', 'ready', 'active'].includes(normalized)) return 'is-success';
  if (['failed', 'error', 'rejected', 'missing', 'needs_attention'].includes(normalized)) return 'is-danger';
  return 'is-warning';
};

const displayTitle = (item) => item?.metaTitle || item?.title || item?.reportType || item?.path || item?.entityType || 'SEO item';

const AdminSeoGrowthCenter = () => {
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' });
  const [metadataPayload, setMetadataPayload] = useState(null);
  const [reportsPayload, setReportsPayload] = useState(null);
  const [roadmapPayload, setRoadmapPayload] = useState(null);
  const [linkPreview, setLinkPreview] = useState(null);
  const [seoForm, setSeoForm] = useState(SEO_FORM_DEFAULT);
  const [linkForm, setLinkForm] = useState(INTERNAL_LINK_DEFAULT);

  const metadataItems = useMemo(() => getSeoItems(metadataPayload), [metadataPayload]);
  const reportItems = useMemo(() => getSeoItems(reportsPayload), [reportsPayload]);
  const roadmapItems = useMemo(() => {
    const roadmap = roadmapPayload?.roadmap || roadmapPayload?.data?.roadmap;
    if (Array.isArray(roadmap)) return roadmap;
    if (roadmap && typeof roadmap === 'object') return Object.entries(roadmap).map(([key, value]) => ({ key, ...(value && typeof value === 'object' ? value : { label: String(value) }) }));
    return [];
  }, [roadmapPayload]);

  const metrics = useMemo(() => [
    { label: 'SEO metadata', value: metadataItems.length },
    { label: 'Swarm reports', value: reportItems.length },
    { label: 'Roadmap items', value: roadmapItems.length },
    { label: 'Social platforms', value: socialPlatforms.length },
  ], [metadataItems.length, reportItems.length, roadmapItems.length]);

  const loadData = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);
    try {
      const [metadata, reports, roadmap] = await Promise.allSettled([
        seoAdminApi.metadata({ limit: 20 }),
        seoAdminApi.swarmReports({ limit: 20 }),
        seoAdminApi.implementationRoadmap(),
      ]);
      if (metadata.status === 'fulfilled') setMetadataPayload(metadata.value);
      if (reports.status === 'fulfilled') setReportsPayload(reports.value);
      if (roadmap.status === 'fulfilled') setRoadmapPayload(roadmap.value);
      const firstError = [metadata, reports, roadmap].find((item) => item.status === 'rejected');
      if (firstError) setMessage({ type: 'warning', text: firstError.reason?.message || 'Some SEO growth data could not be loaded yet.' });
    } catch (error) {
      if (!error?.shouldLogin) setMessage({ type: 'error', text: error?.message || 'Could not load SEO growth center.' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const runGrowthAction = async (action) => {
    setActionId(action.id);
    setMessage({ type: '', text: '' });
    try {
      const body = {
        mode: 'DRAFT_ONLY',
        reason: `manual-${action.id}-from-seo-growth-center`,
        sourceEntity: buildManualSourceEntity({
          title: action.label,
          topic: action.helper,
          jobType: action.jobType || action.id,
          vertical: 'combat',
          sport: 'combat',
          trigger: 'manual',
        }),
        input: {
          title: action.label,
          topic: action.helper,
          sport: 'combat',
          platforms: socialPlatforms.map((item) => item.value),
          requestedOutput: 'admin-ready SEO, content, social, and growth artifact for review',
        },
      };
      const result = action.run ? await action.run(body) : await swarmApi.runAutomation(action.jobType, body);
      const count = result?.createdJobs?.length || result?.jobs?.length || result?.created || 1;
      setMessage({ type: 'success', text: `${action.label} submitted. Created jobs: ${count}.` });
      await loadData({ silent: true });
    } catch (error) {
      if (!error?.shouldLogin) setMessage({ type: 'error', text: error?.message || `Could not run ${action.label}.` });
    } finally {
      setActionId('');
    }
  };

  const updateSeoForm = (field, value) => setSeoForm((current) => ({ ...current, [field]: value }));
  const updateLinkForm = (field, value) => setLinkForm((current) => ({ ...current, [field]: value }));

  const saveMetadata = async (event) => {
    event.preventDefault();
    setActionId('save-metadata');
    setMessage({ type: '', text: '' });
    try {
      const payload = {
        ...seoForm,
        keywords: seoForm.keywords.split(',').map((item) => item.trim()).filter(Boolean),
        source: 'admin-seo-growth-center',
      };
      await seoAdminApi.saveMetadata(payload);
      setMessage({ type: 'success', text: 'SEO metadata saved for review/application.' });
      setSeoForm(SEO_FORM_DEFAULT);
      await loadData({ silent: true });
    } catch (error) {
      if (!error?.shouldLogin) setMessage({ type: 'error', text: error?.message || 'Could not save SEO metadata.' });
    } finally {
      setActionId('');
    }
  };

  const previewInternalLinks = async (event) => {
    event.preventDefault();
    setActionId('preview-links');
    setMessage({ type: '', text: '' });
    try {
      const result = await seoAdminApi.previewInternalLinks({
        ...linkForm,
        limit: Number(linkForm.limit || 8),
      });
      setLinkPreview(result);
      setMessage({ type: 'success', text: 'Internal-link preview generated.' });
    } catch (error) {
      if (!error?.shouldLogin) setMessage({ type: 'error', text: error?.message || 'Could not preview internal links.' });
    } finally {
      setActionId('');
    }
  };

  return (
    <section className="admin-seo-growth-center">
      <div className="admin-seo-growth-hero">
        <div>
          <p className="admin-page-eyebrow"><FaChartLine /> SEO growth control center</p>
          <h2>Turn swarm intelligence into traffic actions.</h2>
          <p>Review SEO reports, run growth agents, prepare metadata, preview internal links, and keep the 1000-new-users plan moving without giving automation direct control over live pages.</p>
        </div>
        <button type="button" className="admin-topbar-primary" onClick={() => loadData()} disabled={loading}><FaSyncAlt /> Refresh</button>
      </div>

      {message.text && <div className={`admin-swarm-alert is-${message.type || 'info'}`}><span>{message.text}</span></div>}

      <div className="admin-seo-growth-metrics">
        {metrics.map((metric) => <article key={metric.label}><small>{metric.label}</small><strong>{loading ? '—' : Number(metric.value || 0).toLocaleString()}</strong></article>)}
      </div>

      <div className="admin-seo-growth-layout">
        <section className="admin-swarm-panel admin-seo-growth-actions">
          <header><div><span>Run swarm growth agents</span><h2>SEO + traffic queue</h2></div></header>
          <div className="admin-seo-action-grid">
            {growthActions.map((action) => {
              const Icon = action.icon;
              return (
                <button key={action.id} type="button" onClick={() => runGrowthAction(action)} disabled={Boolean(actionId)}>
                  <Icon />
                  <strong>{action.label}</strong>
                  <span>{action.helper}</span>
                  {actionId === action.id && <em>Running…</em>}
                </button>
              );
            })}
          </div>
          <div className="admin-seo-platform-strip">
            {socialPlatforms.map(({ value, label, icon: Icon }) => <span key={value}><Icon /> {label}</span>)}
          </div>
        </section>

        <aside className="admin-swarm-panel admin-seo-growth-side">
          <header><div><span>Roadmap</span><h2>Implementation checklist</h2></div></header>
          <div className="admin-seo-roadmap-list">
            {roadmapItems.length === 0 ? <p className="admin-swarm-note">No roadmap data returned yet.</p> : roadmapItems.slice(0, 10).map((item, index) => (
              <article key={item.key || item.id || item.label || index}>
                <FaCheck />
                <div><strong>{item.label || item.title || item.key || `Roadmap item ${index + 1}`}</strong><span>{item.status || item.phase || item.priority || 'Ready for review'}</span></div>
              </article>
            ))}
          </div>
        </aside>
      </div>

      <div className="admin-seo-growth-layout">
        <form className="admin-swarm-panel admin-seo-metadata-form" onSubmit={saveMetadata}>
          <header><div><span>Applyable SEO</span><h2>Metadata queue</h2></div><button type="submit" className="admin-topbar-primary" disabled={actionId === 'save-metadata'}><FaCheck /> Save metadata</button></header>
          <div className="admin-swarm-form-grid">
            <label><span>Entity type</span><select value={seoForm.entityType} onChange={(event) => updateSeoForm('entityType', event.target.value)}><option value="page">Page</option><option value="blog">Blog</option><option value="fight">Fight</option><option value="fighter">Fighter</option><option value="wrestler">Wrestler</option></select></label>
            <label><span>Entity ID</span><input value={seoForm.entityId} onChange={(event) => updateSeoForm('entityId', event.target.value)} placeholder="Optional existing entity id" /></label>
            <label><span>Path</span><input value={seoForm.path} onChange={(event) => updateSeoForm('path', event.target.value)} placeholder="/fantasy-mma" /></label>
            <label><span>Status</span><select value={seoForm.status} onChange={(event) => updateSeoForm('status', event.target.value)}><option value="draft">Draft</option><option value="approved">Approved</option><option value="applied">Applied</option></select></label>
          </div>
          <label className="admin-swarm-field-full"><span>Canonical URL</span><input value={seoForm.canonicalUrl} onChange={(event) => updateSeoForm('canonicalUrl', event.target.value)} placeholder="https://www.fantasymmadness.com/fantasy-mma" /></label>
          <label className="admin-swarm-field-full"><span>Meta title</span><input value={seoForm.metaTitle} onChange={(event) => updateSeoForm('metaTitle', event.target.value)} placeholder="Fantasy MMA picks, fights, and prediction contests" /></label>
          <label className="admin-swarm-field-full"><span>Meta description</span><textarea value={seoForm.metaDescription} onChange={(event) => updateSeoForm('metaDescription', event.target.value)} rows={3} placeholder="Write a clear search description for this page." /></label>
          <label className="admin-swarm-field-full"><span>Keywords</span><input value={seoForm.keywords} onChange={(event) => updateSeoForm('keywords', event.target.value)} placeholder="fantasy mma, boxing picks, pro wrestling contests" /></label>
        </form>

        <aside className="admin-swarm-panel admin-seo-growth-side">
          <header><div><span>Stored metadata</span><h2>Recent SEO items</h2></div></header>
          <div className="admin-seo-report-list">
            {metadataItems.length === 0 ? <p className="admin-swarm-note">No stored metadata found yet.</p> : metadataItems.slice(0, 8).map((item) => (
              <article key={item._id || `${item.entityType}-${item.path}`}>
                <span className={`admin-status-badge ${statusClass(item.status)}`}>{item.status || 'draft'}</span>
                <strong>{displayTitle(item)}</strong>
                <small>{item.entityType || 'page'} · {item.path || item.entityId || '—'} · {formatSwarmDate(item.updatedAt || item.createdAt)}</small>
              </article>
            ))}
          </div>
        </aside>
      </div>

      <div className="admin-seo-growth-layout">
        <section className="admin-swarm-panel admin-seo-growth-side">
          <header><div><span>Swarm reports</span><h2>Latest audit output</h2></div><button type="button" className="admin-action-secondary" onClick={() => loadData()}><FaSyncAlt /> Refresh</button></header>
          <div className="admin-seo-report-list">
            {reportItems.length === 0 ? <p className="admin-swarm-note">Run Daily SEO or Weekly Traffic Report to populate this area.</p> : reportItems.slice(0, 10).map((report) => (
              <article key={report._id || report.reportId || report.createdAt}>
                <span className={`admin-status-badge ${statusClass(report.status)}`}>{report.status || 'generated'}</span>
                <strong>{displayTitle(report)}</strong>
                <small>{report.reportType || report.source || 'swarm'} · {formatSwarmDate(report.createdAt)}</small>
                <p>{String(summarizeSeoPayload(report.payload || report)).slice(0, 220)}</p>
              </article>
            ))}
          </div>
        </section>

        <form className="admin-swarm-panel admin-seo-metadata-form" onSubmit={previewInternalLinks}>
          <header><div><span>Internal links</span><h2>Preview link plan</h2></div><button type="submit" className="admin-topbar-primary" disabled={actionId === 'preview-links'}><FaLink /> Preview</button></header>
          <div className="admin-swarm-form-grid">
            <label><span>Path</span><input value={linkForm.path} onChange={(event) => updateLinkForm('path', event.target.value)} placeholder="/fantasy-boxing" /></label>
            <label><span>Entity type</span><select value={linkForm.entityType} onChange={(event) => updateLinkForm('entityType', event.target.value)}><option value="page">Page</option><option value="blog">Blog</option><option value="fight">Fight</option><option value="fighter">Fighter</option><option value="wrestler">Wrestler</option></select></label>
            <label><span>Topic</span><input value={linkForm.topic} onChange={(event) => updateLinkForm('topic', event.target.value)} placeholder="fantasy boxing, active fights" /></label>
            <label><span>Limit</span><input type="number" min="1" max="20" value={linkForm.limit} onChange={(event) => updateLinkForm('limit', event.target.value)} /></label>
          </div>
          <div className="admin-seo-link-preview">
            {!linkPreview ? <p className="admin-swarm-note">Generate a preview to see candidate internal links.</p> : (linkPreview.items || linkPreview.links || []).slice(0, 10).map((link, index) => (
              <article key={`${link.url || link.href || index}`}>
                <FaLink />
                <div><strong>{link.title || link.label || link.path || link.url || `Link ${index + 1}`}</strong><span>{link.url || link.href || link.path || '—'}</span></div>
              </article>
            ))}
          </div>
        </form>
      </div>
    </section>
  );
};

export default AdminSeoGrowthCenter;
