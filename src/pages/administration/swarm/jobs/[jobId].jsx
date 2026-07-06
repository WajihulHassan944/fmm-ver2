import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import {
  FaArrowLeft,
  FaClock,
  FaExternalLinkAlt,
  FaFileAlt,
  FaHistory,
  FaRobot,
  FaSyncAlt,
} from 'react-icons/fa';
import AdminPrivateRoute from '@/Components/PrivateRoute/PrivateRouteAdmin';
import {
  formatJobTypeLabel,
  formatSwarmDate,
  swarmApi,
  summarizeJobInput,
} from '@/Utils/swarmApi';

const compactJson = (value) => {
  try {
    return JSON.stringify(value || {}, null, 2);
  } catch (_error) {
    return String(value || '');
  }
};

const statusClass = (status = '') => {
  const normalized = String(status || '').toLowerCase();
  if (['published', 'approved', 'completed', 'success'].includes(normalized)) return 'is-success';
  if (['failed', 'dead_letter', 'rejected', 'cancelled'].includes(normalized)) return 'is-danger';
  if (['running', 'queued', 'awaiting_review', 'draft'].includes(normalized)) return 'is-warning';
  return '';
};

function SwarmJobSummaryPage() {
  const router = useRouter();
  const jobId = String(router.query?.jobId || '').trim();
  const campaignId = String(router.query?.campaignId || '').trim();
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedOutputId, setExpandedOutputId] = useState('');

  const loadSummary = useCallback(async ({ silent = false } = {}) => {
    if (!jobId) return;
    if (!silent) setLoading(true);
    setError('');
    try {
      const payload = await swarmApi.getJobSummary(jobId, { fallbackCache: true, campaignId });
      setSummary(payload);
    } catch (requestError) {
      if (!requestError?.shouldLogin) {
        setError(requestError.message || 'Could not load swarm job summary.');
      }
    } finally {
      if (!silent) setLoading(false);
    }
  }, [campaignId, jobId]);

  useEffect(() => {
    loadSummary();
  }, [loadSummary]);

  useEffect(() => {
    if (!jobId) return undefined;
    const timer = window.setInterval(() => loadSummary({ silent: true }), 5000);
    return () => window.clearInterval(timer);
  }, [jobId, loadSummary]);

  const job = summary?.job || null;
  const artifacts = Array.isArray(summary?.artifacts) ? summary.artifacts : [];
  const relatedJobs = Array.isArray(summary?.relatedJobs) ? summary.relatedJobs : [];
  const mainTitle = job ? formatJobTypeLabel(job.jobType) : 'Swarm job summary';

  const latestStatus = useMemo(() => {
    if (!job?.statusHistory?.length) return job?.status || 'pending';
    return job.statusHistory[job.statusHistory.length - 1]?.status || job.status || 'pending';
  }, [job]);

  return (
    <AdminPrivateRoute>
      <Head>
        <title>{mainTitle} | Fantasy MMADNESS Admin</title>
      </Head>

      <main className="admin-workspace admin-swarm-job-detail-page">
        <section className="admin-page-heading admin-page-heading-compact">
          <div>
            <span><FaRobot /> Live swarm job details</span>
            <h2>{mainTitle}</h2>
            <p>Track the job, status history, generated output, and related campaign items from one review page.</p>
          </div>
          <div className="admin-heading-actions">
            <Link href="/administration/swarm?tab=jobs" className="admin-action-secondary"><FaArrowLeft /> Back to Swarm</Link>
            <button type="button" className="admin-action-secondary" onClick={() => loadSummary()} disabled={loading}><FaSyncAlt className={loading ? 'xp-spin' : ''} /> Refresh</button>
          </div>
        </section>

        {error && <div className="admin-swarm-alert is-error">{error}</div>}
        {loading && !job ? <div className="admin-swarm-loading">Loading job summary...</div> : null}

        {job && (
          <>
            <section className="admin-inline-metrics admin-swarm-job-metrics">
              <article><span>Status</span><strong>{latestStatus}</strong><small>{formatSwarmDate(job.updatedAt || job.createdAt)}</small></article>
              <article><span>Job ID</span><strong>{job.jobId}</strong><small>{job.mode || 'DRAFT_ONLY'}</small></article>
              <article><span>Output</span><strong>{artifacts.length}</strong><small>{summary?.outputReady ? 'artifact ready' : 'waiting for output'}</small></article>
            </section>

            <section className="admin-swarm-detail-grid">
              <article className="admin-swarm-panel">
                <header><div><span>Job request</span><h3>{summarizeJobInput(job.input)}</h3></div><span className={`admin-status-badge ${statusClass(job.status)}`}>{job.status || 'queued'}</span></header>
                <dl className="admin-swarm-detail-list">
                  <div><dt>Type</dt><dd>{job.jobType}</dd></div>
                  <div><dt>Vertical</dt><dd>{job.vertical || 'combat'}</dd></div>
                  <div><dt>Sport</dt><dd>{job.sport || job.input?.sport || 'combat'}</dd></div>
                  <div><dt>Created</dt><dd>{formatSwarmDate(job.createdAt)}</dd></div>
                  <div><dt>Completed</dt><dd>{formatSwarmDate(job.completedAt)}</dd></div>
                </dl>
                <pre className="admin-swarm-json">{compactJson(job.input)}</pre>
              </article>

              <article className="admin-swarm-panel">
                <header><div><span><FaHistory /> Real-time progress</span><h3>Status history</h3></div></header>
                <div className="admin-swarm-timeline">
                  {(job.statusHistory?.length ? job.statusHistory : [{ status: job.status || 'queued', at: job.createdAt }]).map((item, index) => (
                    <div key={`${item.status}-${index}`}>
                      <i />
                      <strong>{item.status || 'queued'}</strong>
                      <span><FaClock /> {formatSwarmDate(item.at)}</span>
                      {item.reason && <small>{item.reason}</small>}
                    </div>
                  ))}
                </div>
              </article>
            </section>

            <section className="admin-swarm-panel admin-swarm-output-panel">
              <header>
                <div><span><FaFileAlt /> Generated output</span><h3>Artifacts and draft content</h3></div>
                <small>Auto-refreshes every 5 seconds while this page is open.</small>
              </header>

              {artifacts.length ? (
                <div className="admin-swarm-output-list">
                  {artifacts.map((artifact) => (
                    <article id={`artifact-${artifact.artifactId}`} key={artifact.artifactId || artifact.id}>
                      <div>
                        <span className={`admin-status-badge ${statusClass(artifact.reviewStatus)}`}>{artifact.reviewStatus || 'DRAFT'}</span>
                        <h4>{artifact.title || artifact.artifactType || 'Swarm output'}</h4>
                        <p>{artifact.summary || 'Generated output is ready for review.'}</p>
                      </div>
                      <div className="admin-swarm-output-actions">
                        <button type="button" onClick={() => setExpandedOutputId(expandedOutputId === artifact.artifactId ? '' : artifact.artifactId)}>
                          {expandedOutputId === artifact.artifactId ? 'Hide output' : 'View output'}
                        </button>
                        <Link href={`/administration/swarm?tab=artifacts&artifactId=${encodeURIComponent(artifact.artifactId || '')}`}>
                          Open in swarm <FaExternalLinkAlt />
                        </Link>
                      </div>
                      {expandedOutputId === artifact.artifactId && <pre className="admin-swarm-json">{compactJson(artifact.payload || artifact)}</pre>}
                    </article>
                  ))}
                </div>
              ) : (
                <div className="admin-empty-table"><FaRobot /><strong>Output is not ready yet</strong><span>Keep this page open; it refreshes automatically and will show the draft when the job completes.</span></div>
              )}
            </section>

            {relatedJobs.length > 1 && (
              <section className="admin-swarm-panel">
                <header><div><span>Campaign jobs</span><h3>Related automation jobs</h3></div></header>
                <div className="admin-swarm-related-jobs">
                  {relatedJobs.map((related) => (
                    <Link key={related.jobId || related.id} href={`/administration/swarm/jobs/${encodeURIComponent(related.jobId || related.id)}`}>
                      <strong>{formatJobTypeLabel(related.jobType)}</strong>
                      <span>{related.status || 'queued'}</span>
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </main>
    </AdminPrivateRoute>
  );
}

export default SwarmJobSummaryPage;
