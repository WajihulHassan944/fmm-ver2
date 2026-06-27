import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { FaArrowRight, FaBolt, FaExclamationTriangle, FaRobot, FaShieldAlt } from 'react-icons/fa';
import { swarmApi } from '@/Utils/swarmApi';

const SwarmStatusPanel = () => {
  const [state, setState] = useState({ loading: true, health: null, config: null, error: '' });

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const [config, health] = await Promise.allSettled([swarmApi.config(), swarmApi.health()]);
        if (!mounted) return;
        setState({
          loading: false,
          config: config.status === 'fulfilled' ? config.value : null,
          health: health.status === 'fulfilled' ? health.value : null,
          error: health.status === 'rejected' ? health.reason?.message || 'Swarm status unavailable.' : '',
        });
      } catch (error) {
        if (mounted) setState({ loading: false, health: null, config: null, error: error.message || 'Swarm status unavailable.' });
      }
    };
    load();
    return () => { mounted = false; };
  }, []);

  const status = useMemo(() => {
    if (state.loading) return { label: 'Checking', className: 'is-warning', icon: FaBolt };
    if (state.health?.swarmReachable) return { label: 'Online', className: 'is-success', icon: FaShieldAlt };
    if (state.config?.enabled || state.health?.enabled) return { label: 'Needs attention', className: 'is-danger', icon: FaExclamationTriangle };
    return { label: 'Installed / disabled', className: 'is-warning', icon: FaRobot };
  }, [state]);

  const StatusIcon = status.icon;
  const cache = state.health?.cache || {};

  return (
    <section className="admin-dashboard-panel admin-swarm-status-panel">
      <div className="admin-dashboard-panel-heading">
        <h2>Swarm automation</h2>
        <span>IONOS worker bridge</span>
      </div>

      <div className="admin-swarm-status-headline">
        <span className={`admin-status-badge ${status.className}`}><StatusIcon /> {status.label}</span>
        <p>
          {state.health?.message || state.error || 'Centralized MMA and pro-wrestling automation is connected through the backend gateway.'}
        </p>
      </div>

      <div className="admin-swarm-mini-grid">
        <article><small>Jobs</small><strong>{Number(cache.jobs || 0).toLocaleString()}</strong></article>
        <article><small>Artifacts</small><strong>{Number(cache.artifacts || 0).toLocaleString()}</strong></article>
        <article><small>Awaiting review</small><strong>{Number(cache.awaitingReview || 0).toLocaleString()}</strong></article>
        <article><small>Failed</small><strong>{Number(cache.failedJobs || 0).toLocaleString()}</strong></article>
      </div>

      <Link href="/administration/swarm" className="admin-action-secondary admin-swarm-panel-link">
        Open swarm command center <FaArrowRight />
      </Link>
    </section>
  );
};

export default SwarmStatusPanel;
