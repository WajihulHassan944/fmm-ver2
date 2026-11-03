import React from 'react';
import Link from 'next/link';
import { FaRocket } from 'react-icons/fa';
import { GROWTH_SECTIONS } from '@/Utils/adminFeatures';

// Dashboard panel for the Growth Engine command center (replaces the old Swarm /
// Fan Acquisition status panel when the V2 switch is on). Static: no backend calls.
export default function GrowthEngineStatusPanel() {
  return (
    <aside className="admin-dashboard-panel" data-testid="growth-engine-panel">
      <div className="admin-dashboard-panel-heading">
        <h2><FaRocket aria-hidden="true" /> Growth Engine</h2>
        <span>Staging · nothing is sent or posted without your approval</span>
      </div>
      <p>Fight marketing, PR, affiliate recruitment, publishing, approvals, analytics and revenue attribution in one place.</p>
      <div className="admin-quick-actions">
        {GROWTH_SECTIONS.filter((s) => ['overview', 'approvals', 'publishing', 'analytics'].includes(s.slug)).map((s) => (
          <Link key={s.slug} className="admin-quick-action" href={s.slug === 'overview' ? '/administration/growth-engine' : `/administration/growth-engine/${s.slug}`}>
            <span><FaRocket /></span><div><strong>{s.label}</strong></div>
          </Link>
        ))}
      </div>
    </aside>
  );
}
