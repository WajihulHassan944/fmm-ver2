import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import {
  FaBolt,
  FaBullhorn,
  FaCalendarAlt,
  FaChartLine,
  FaCheck,
  FaExclamationTriangle,
  FaFacebook,
  FaFileAlt,
  FaInstagram,
  FaPlay,
  FaRocket,
  FaShieldAlt,
  FaSyncAlt,
  FaTwitter,
  FaYoutube,
} from 'react-icons/fa';
import { formatJobTypeLabel, formatSwarmDate, swarmApi } from '@/Utils/swarmApi';

const DEFAULT_GROWTH_FORM = {
  title: 'Fantasy MMadness July 10,000 Signup Growth System',
  topic: 'Acquire quality users by turning every combat sports event into Content → Prediction → Signup → Return Visit. Create approval-first assets only.',
  sport: 'combat',
  signupGoal: 10000,
  mode: 'APPROVAL_REQUIRED',
};

const platformCards = [
  { key: 'instagramPosts', label: 'Instagram', icon: FaInstagram, fallback: 6 },
  { key: 'facebookPosts', label: 'Facebook', icon: FaFacebook, fallback: 5 },
  { key: 'xPosts', label: 'X posts', icon: FaTwitter, fallback: 15 },
  { key: 'youtubeVideos', label: 'YouTube videos', icon: FaYoutube, fallback: 2 },
  { key: 'shorts', label: 'Shorts', icon: FaPlay, fallback: 8 },
  { key: 'blogs', label: 'Blogs', icon: FaFileAlt, fallback: 4 },
  { key: 'notifications', label: 'Notifications', icon: FaBullhorn, fallback: 3 },
  { key: 'dailyAssetCap', label: 'Daily cap', icon: FaShieldAlt, fallback: 60 },
];

const safeArray = (value) => Array.isArray(value) ? value : [];

const JulyGrowthCommandCenter = ({ onSubmitted }) => {
  const [form, setForm] = useState(DEFAULT_GROWTH_FORM);
  const [configPayload, setConfigPayload] = useState(null);
  const [dashboardPayload, setDashboardPayload] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState('');

  const config = configPayload?.config || dashboardPayload?.config || null;
  const counts = dashboardPayload?.counts || {};
  const outputTargets = config?.outputTargets || {};
  const safety = config?.safety || {};
  const latestJobs = safeArray(dashboardPayload?.latestJobs);
  const latestArtifacts = safeArray(dashboardPayload?.latestArtifacts);

  const youtubeCta = config?.requiredYouTubeEndingLine || 'Make your picks on Fantasy MMadness before the event starts.';
  const logoReady = Boolean(config?.brandLogo?.url);

  const loadGrowth = useCallback(async () => {
    setLoading(true);
    try {
      const [configResult, dashboardResult] = await Promise.allSettled([
        swarmApi.julyGrowthConfig(),
        swarmApi.julyGrowthDashboard(),
      ]);
      if (configResult.status === 'fulfilled') setConfigPayload(configResult.value);
      if (dashboardResult.status === 'fulfilled') setDashboardPayload(dashboardResult.value);
      if (configResult.status === 'rejected' && dashboardResult.status === 'rejected') {
        throw configResult.reason || dashboardResult.reason;
      }
    } catch (error) {
      toast.error(error.message || 'Could not load July growth dashboard.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadGrowth();
  }, [loadGrowth]);

  const updateForm = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  const buildPayload = () => ({
    title: form.title,
    topic: form.topic,
    sport: form.sport,
    signupGoal: Number(form.signupGoal) || 10000,
    mode: form.mode,
    input: {
      title: form.title,
      topic: form.topic,
      sport: form.sport,
      signupGoal: Number(form.signupGoal) || 10000,
      requiredYouTubeEndingLine: youtubeCta,
      brandLogo: config?.brandLogo || undefined,
    },
    reason: 'frontend-admin-july-growth-system',
  });

  const runDailyGrowth = async () => {
    setActionId('run-daily');
    try {
      const result = await swarmApi.runJulyGrowth(buildPayload());
      const count = result?.createdJobs?.length || result?.jobs?.length || 0;
      toast.success(`July growth daily run submitted. ${count ? `${count} jobs created.` : 'Check jobs shortly.'}`);
      onSubmitted?.({ type: 'july-growth', id: 'daily-run', title: form.title, status: 'submitted', count, createdAt: new Date().toISOString() });
      await loadGrowth();
    } catch (error) {
      toast.error(error.message || 'Could not submit July growth daily run.');
    } finally {
      setActionId('');
    }
  };

  const createGrowthCampaign = async () => {
    setActionId('campaign');
    try {
      const result = await swarmApi.createJulyGrowthCampaign(buildPayload());
      const count = result?.campaign?.jobIds?.length || result?.createdJobs?.length || result?.jobs?.length || 0;
      toast.success(`July growth campaign submitted. ${count ? `${count} jobs attached.` : 'Check campaign logs shortly.'}`);
      onSubmitted?.({ type: 'july-growth-campaign', id: result?.campaign?.campaignId || 'july-growth', title: form.title, status: 'submitted', count, createdAt: new Date().toISOString() });
      await loadGrowth();
    } catch (error) {
      toast.error(error.message || 'Could not create July growth campaign.');
    } finally {
      setActionId('');
    }
  };

  const schedule = useMemo(() => config?.schedule || {}, [config]);

  return (
    <section className="admin-july-growth-panel">
      <div className="admin-swarm-hero admin-july-growth-hero">
        <div>
          <p className="admin-page-eyebrow"><FaRocket /> July 10,000 signup growth system</p>
          <h1>YouTube trust engine + social attention engine.</h1>
          <p>Runs safe approval-first drafts for event calendar, fight cards, Instagram, Facebook, X, blogs/SEO, YouTube, Shorts, and retention reminders.</p>
        </div>
        <div className="admin-heading-actions">
          <button type="button" className="admin-action-secondary" onClick={loadGrowth} disabled={loading}><FaSyncAlt className={loading ? 'xp-spin' : ''} /> Refresh</button>
          <button type="button" className="admin-topbar-primary" onClick={runDailyGrowth} disabled={Boolean(actionId)}><FaBolt /> {actionId === 'run-daily' ? 'Submitting...' : 'Run daily pack'}</button>
        </div>
      </div>

      <div className="admin-swarm-metrics">
        <article><small>Signup goal</small><strong>{Number(config?.julySignupGoal || form.signupGoal || 10000).toLocaleString()}</strong></article>
        <article><small>Growth jobs</small><strong>{Number(counts.jobs || 0).toLocaleString()}</strong></article>
        <article><small>Artifacts</small><strong>{Number(counts.artifacts || 0).toLocaleString()}</strong></article>
        <article><small>Awaiting review</small><strong>{Number(counts.awaitingReview || 0).toLocaleString()}</strong></article>
      </div>

      <div className="admin-swarm-layout admin-swarm-layout-wide">
        <form className="admin-swarm-panel admin-swarm-create" onSubmit={(event) => { event.preventDefault(); createGrowthCampaign(); }}>
          <header>
            <div><span>Approval-first campaign</span><h2>Create July growth campaign</h2></div>
            <button type="submit" className="admin-topbar-primary" disabled={Boolean(actionId)}><FaRocket /> {actionId === 'campaign' ? 'Starting...' : 'Create campaign'}</button>
          </header>

          <div className="admin-swarm-form-grid">
            <label><span>Campaign title</span><input value={form.title} onChange={(event) => updateForm('title', event.target.value)} /></label>
            <label><span>Signup goal</span><input type="number" min="1" value={form.signupGoal} onChange={(event) => updateForm('signupGoal', event.target.value)} /></label>
            <label><span>Sport focus</span><select value={form.sport} onChange={(event) => updateForm('sport', event.target.value)}><option value="combat">All combat</option><option value="mma">MMA</option><option value="boxing">Boxing</option><option value="kickboxing">Kickboxing</option><option value="bare_knuckle">Bare-knuckle</option></select></label>
            <label><span>Mode</span><select value={form.mode} onChange={(event) => updateForm('mode', event.target.value)}><option value="APPROVAL_REQUIRED">Approval required</option><option value="DRAFT_ONLY">Draft only</option><option value="DRY_RUN">Dry run</option></select></label>
          </div>

          <label className="admin-swarm-field-full"><span>Agent context</span><textarea rows={6} value={form.topic} onChange={(event) => updateForm('topic', event.target.value)} /></label>

          <div className="admin-july-growth-rule-card">
            <FaYoutube />
            <div><strong>Required YouTube CTA</strong><p>Every YouTube draft must end with: “{youtubeCta}”</p></div>
          </div>

          <div className="admin-july-growth-rule-card">
            {logoReady ? <FaCheck /> : <FaExclamationTriangle />}
            <div><strong>Logo overlay</strong><p>{logoReady ? `Logo ready · ${config?.brandLogo?.corner || 'bottom-right'} · opacity ${config?.brandLogo?.opacity}` : 'BRAND_LOGO_URL is empty. Draft briefs will ask for a small logo overlay, but final logo URL should be added in .env.'}</p></div>
          </div>
        </form>

        <aside className="admin-swarm-panel admin-swarm-health">
          <header><div><span>Safety</span><h2>Publishing guardrails</h2></div></header>
          <div className="admin-swarm-health-list">
            <p><strong>Auto publish</strong><span>{safety.autoPublishEnabled ? 'Enabled' : 'Disabled'}</span></p>
            <p><strong>Social publishing</strong><span>{safety.socialPublishEnabled ? 'Enabled' : 'Draft only'}</span></p>
            <p><strong>YouTube upload</strong><span>{safety.youtubeUploadEnabled ? 'Enabled' : 'Disabled'}</span></p>
            <p><strong>Approval required</strong><span>{safety.approvalRequiredByDefault === false ? 'No' : 'Yes'}</span></p>
            <p><strong>Timezone</strong><span>{config?.timezone || 'America/New_York'}</span></p>
          </div>
          <small className="admin-swarm-note">This frontend does not publish directly. It submits backend/swarm jobs that remain in review unless the server is explicitly configured otherwise.</small>
        </aside>
      </div>

      <section className="admin-swarm-panel">
        <header><div><span>Daily output targets</span><h2>30-60 assets/day control map</h2></div></header>
        <div className="admin-july-target-grid">
          {platformCards.map((card) => {
            const Icon = card.icon;
            return <article key={card.key}><Icon /><small>{card.label}</small><strong>{Number(outputTargets[card.key] ?? card.fallback).toLocaleString()}</strong></article>;
          })}
        </div>
      </section>

      <section className="admin-swarm-layout admin-swarm-layout-wide">
        <section className="admin-swarm-panel">
          <header><div><span>Publishing schedule</span><h2>Daily cadence</h2></div></header>
          <div className="admin-july-schedule-list">
            {Object.entries(schedule).map(([key, value]) => <article key={key}><FaCalendarAlt /><strong>{value}</strong><span>{key.replace(/([A-Z])/g, ' $1').toLowerCase()}</span></article>)}
          </div>
        </section>

        <aside className="admin-swarm-panel admin-swarm-health">
          <header><div><span>Latest growth jobs</span><h2>Recent activity</h2></div></header>
          <div className="admin-swarm-events-list">
            {latestJobs.slice(0, 6).map((job) => <article key={job.jobId || job.id}><span className="admin-status-badge is-warning">{job.status || 'queued'}</span><strong>{formatJobTypeLabel(job.jobType)}</strong><small>{formatSwarmDate(job.createdAt)}</small><p>{job.input?.title || job.input?.topic || job.jobId}</p></article>)}
            {!latestJobs.length && <p className="admin-swarm-note">No July growth jobs yet.</p>}
          </div>
        </aside>
      </section>

      <section className="admin-swarm-panel admin-swarm-list-panel">
        <header><div><span>Latest artifacts</span><h2>Review queue preview</h2></div><button type="button" className="admin-action-secondary" onClick={loadGrowth}><FaSyncAlt /> Refresh</button></header>
        <div className="admin-data-table-scroll">
          <table className="admin-data-table admin-swarm-table"><thead><tr><th>Artifact</th><th>Type</th><th>Review</th><th>Created</th></tr></thead><tbody>{latestArtifacts.length ? latestArtifacts.map((artifact) => <tr key={artifact.artifactId || artifact.id}><td><strong>{artifact.title || artifact.artifactId || 'Untitled'}</strong></td><td>{artifact.artifactType || artifact.jobType || '—'}</td><td><span className="admin-status-badge is-warning">{artifact.reviewStatus || 'DRAFT'}</span></td><td>{formatSwarmDate(artifact.createdAt)}</td></tr>) : <tr><td colSpan="4">No July growth artifacts yet.</td></tr>}</tbody></table>
        </div>
      </section>
    </section>
  );
};

export default JulyGrowthCommandCenter;
