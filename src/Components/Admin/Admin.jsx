import React, { useEffect, useMemo, useState } from 'react';
import { adminHeaders } from '@/Utils/authFetch';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import {
  FaArrowRight,
  FaBell,
  FaBullhorn,
  FaBolt,
  FaChartLine,
  FaClone,
  FaEye,
  FaFistRaised,
  FaPlus,
  FaQuestionCircle,
  FaRobot,
  FaShieldAlt,
  FaShoppingBag,
  FaTrophy,
  FaUserFriends,
  FaUsers,
} from 'react-icons/fa';
import SwarmStatusPanel from './SwarmStatusPanel';
import { buildPublicApiUrl } from '@/Utils/publicApi';

const VisitorsAnalytics = dynamic(() => import('./VisitorsAnalytics'), {
  ssr: false,
  loading: () => <p>Loading analytics...</p>,
});

const Admin = () => {
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [dashboardCounts, setDashboardCounts] = useState({
    affiliatesCount: 0,
    matchesCount: 0,
    usersCount: 0,
    shadowTemplatesCount: 0,
    totalClicks: 0,
    unreadNotificationsCount: 0,
    apparelOrdersCount: 0,
  });

  // Feature demand. Head-to-Head ships as a waitlist rather than a live
  // feature, so this is the readout that decides whether it gets built.
  const [featureDemand, setFeatureDemand] = useState({ totals: [], bands: {}, recent: [] });

  useEffect(() => {
    const fetchFeatureDemand = async () => {
      try {
        const response = await fetch(buildPublicApiUrl('/api/admin/waitlist'), { headers: adminHeaders() });
        if (!response.ok) return;
        const data = await response.json();
        setFeatureDemand({
          totals: Array.isArray(data?.totals) ? data.totals : [],
          bands: data?.bands || {},
          recent: Array.isArray(data?.recent) ? data.recent : [],
        });
      } catch (error) {
        console.error('Error fetching feature demand:', error);
      }
    };
    fetchFeatureDemand();
  }, []);

  useEffect(() => {
    const fetchDashboardCounts = async () => {
      try {
        const response = await fetch(buildPublicApiUrl('/dashboard-counts'), { headers: adminHeaders() });
        const data = await response.json();
        setDashboardCounts(data);
      } catch (error) {
        console.error('Error fetching dashboard counts:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardCounts();
  }, []);

  const handleResetStats = async () => {
    try {
      const response = await fetch(buildPublicApiUrl('/reset-stats'), {
        method: 'POST',
      });
      if (response.ok) {
        alert('Stats have been reset successfully.');
        setDashboardCounts((prev) => ({ ...prev, totalClicks: 0 }));
      } else {
        console.error('Failed to reset stats');
        alert('Failed to reset stats');
      }
    } catch (error) {
      console.error('Error resetting stats:', error);
      alert('Error resetting stats');
    }
  };

  const metrics = useMemo(() => [
    { label: 'Total matches', value: dashboardCounts.matchesCount, icon: FaFistRaised, href: '/administration/upcomingFights' },
    { label: 'Shadow templates', value: dashboardCounts.shadowTemplatesCount, icon: FaClone, href: '/administration/ShadowFightsLibrary' },
    { label: 'Registered users', value: dashboardCounts.usersCount, icon: FaUsers, href: '/administration/RegisteredUsers' },
    { label: 'Affiliates', value: dashboardCounts.affiliatesCount, icon: FaUserFriends, href: '/administration/AffiliateUsers' },
    { label: 'Notifications', value: dashboardCounts.unreadNotificationsCount, icon: FaBell, href: '/administration/notifications' },
    { label: 'Apparel orders', value: dashboardCounts.apparelOrdersCount, icon: FaShoppingBag, href: '/administration/apparel-orders' },
    { label: 'Tracked visitors', value: dashboardCounts.totalClicks, icon: FaEye, onClick: () => setShowAnalytics(true) },
  ], [dashboardCounts]);

  const operationRows = [
    { area: 'Fight operations', metric: `${dashboardCounts.matchesCount || 0} matches`, status: 'Active', statusClass: 'is-success', href: '/administration/upcomingFights', action: 'Open score center' },
    { area: 'Player accounts', metric: `${dashboardCounts.usersCount || 0} registered`, status: 'Monitored', statusClass: 'is-success', href: '/administration/RegisteredUsers', action: 'Manage users' },
    { area: 'Affiliate network', metric: `${dashboardCounts.affiliatesCount || 0} creators`, status: 'Review queue', statusClass: 'is-warning', href: '/administration/AffiliateUsers', action: 'Review affiliates' },
    { area: 'Apparel orders', metric: `${dashboardCounts.apparelOrdersCount || 0} orders`, status: dashboardCounts.apparelOrdersCount ? 'Needs review' : 'Clear', statusClass: dashboardCounts.apparelOrdersCount ? 'is-warning' : 'is-success', href: '/administration/apparel-orders', action: 'Open order queue' },
    { area: 'Community alerts', metric: `${dashboardCounts.unreadNotificationsCount || 0} unread`, status: dashboardCounts.unreadNotificationsCount ? 'Attention' : 'Clear', statusClass: dashboardCounts.unreadNotificationsCount ? 'is-danger' : 'is-success', href: '/administration/notifications', action: 'View notifications' },
    { area: 'Swarm automation', metric: 'MMA + pro wrestling', status: 'Gateway', statusClass: 'is-warning', href: '/administration/swarm', action: 'Open swarm panel' },
    { area: 'SEO growth center', metric: 'Reports + traffic', status: 'Ready', statusClass: 'is-success', href: '/administration/seo-growth', action: 'Open SEO center' },
  ];

  const quickActions = [
    { title: 'Homepage posters', copy: 'Promote fight posters and shadow-fight videos to the homepage mobile funnel.', href: '/administration/homepage-content', icon: FaBullhorn },
    { title: 'Create a match', copy: 'Build a new fight card and prediction setup.', href: '/administration/AddNewMatch', icon: FaPlus },
    { title: 'Submit scores', copy: 'Resolve live or completed fight outcomes.', href: '/administration/upcomingFights', icon: FaTrophy },
    { title: 'Review payouts', copy: 'Process affiliate payout requests.', href: '/administration/payouts', icon: FaShieldAlt },
    { title: 'Apparel orders', copy: 'View guest orders, shipping details, and fulfilment status.', href: '/administration/apparel-orders', icon: FaShoppingBag },
    { title: 'Publish content', copy: 'Create editorial and platform news.', href: '/administration/blogs/add-new-blog', icon: FaBolt },
    { title: 'Swarm automation', copy: 'Generate blogs, SEO drafts, social drafts, and review jobs.', href: '/administration/swarm', icon: FaRobot },
    { title: 'SEO growth center', copy: 'Review SEO reports, metadata, links, and growth tasks.', href: '/administration/seo-growth', icon: FaChartLine },
    { title: 'Manage FAQs', copy: 'Add, edit, publish, or remove support answers.', href: '/administration/faqs', icon: FaQuestionCircle },
  ];

  if (showAnalytics) {
    return (
      <div className="admin-dashboard-experience">
        <div className="admin-page-heading">
          <div>
            <p className="admin-page-eyebrow">Audience intelligence</p>
            <h1>Visitor analytics</h1>
            <p>Review tracked site activity and reset aggregate visitor statistics when required.</p>
          </div>
          <div className="admin-page-actions">
            <button type="button" className="admin-action-secondary" onClick={() => setShowAnalytics(false)}>Back to dashboard</button>
          </div>
        </div>
        <VisitorsAnalytics totalClicks={dashboardCounts.totalClicks} onResetStats={handleResetStats} />
      </div>
    );
  }

  return (
    <div className="admin-dashboard-experience">
      <section className="admin-dashboard-hero">
        <div className="admin-dashboard-hero-copy">
          <span>Fantasy MMAdness operations</span>
          <h1>Control every round from one corner.</h1>
          <p>Monitor the platform, move quickly between fight operations, and keep users, affiliates, content, and community workflows under control.</p>
        </div>
        <div className="admin-dashboard-live"><i aria-hidden="true" /><span>{isLoading ? 'Syncing platform data' : 'Command center online'}</span></div>
      </section>

      <section className="admin-metric-grid" aria-label="Platform totals">
        {metrics.map(({ label, value, icon: Icon, href, onClick }) => {
          const content = <><Icon aria-hidden="true" /><strong>{isLoading ? '—' : Number(value || 0).toLocaleString()}</strong><span>{label}</span></>;
          return href
            ? <Link className="admin-metric-card" href={href} key={label}>{content}</Link>
            : <button type="button" className="admin-metric-card" onClick={onClick} key={label}>{content}</button>;
        })}
      </section>

      <section className="admin-dashboard-grid">
        <div className="admin-dashboard-panel">
          <div className="admin-dashboard-panel-heading">
            <h2>Operations overview</h2>
            <span>Live platform snapshot</span>
          </div>
          <div className="admin-data-table-scroll">
            <table className="admin-data-table">
              <thead>
                <tr><th>Area</th><th>Current volume</th><th>Status</th><th>Action</th></tr>
              </thead>
              <tbody>
                {operationRows.map((row) => (
                  <tr key={row.area}>
                    <td><strong>{row.area}</strong></td>
                    <td>{row.metric}</td>
                    <td><span className={`admin-status-badge ${row.statusClass}`}>{row.status}</span></td>
                    <td><Link className="admin-action-secondary" href={row.href}>{row.action} <FaArrowRight /></Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="admin-dashboard-panel">
          <div className="admin-dashboard-panel-heading">
            <h2>Feature demand</h2>
            <span>Waitlist signups from the app</span>
          </div>
          {featureDemand.totals.length === 0 ? (
            <p style={{ fontSize: 13, opacity: 0.7, margin: 0 }}>
              No waitlist signups yet. Head-to-Head shows a “Notify me” button in the app — signups land here.
            </p>
          ) : (
            <>
              <div className="admin-data-table-scroll">
                <table className="admin-data-table">
                  <thead>
                    <tr><th>Feature</th><th>Interested</th><th>Signed-in players</th></tr>
                  </thead>
                  <tbody>
                    {featureDemand.totals.map((row) => (
                      <tr key={row._id}>
                        <td><strong>{String(row._id || '').replace(/-/g, ' ')}</strong></td>
                        <td>{Number(row.total || 0).toLocaleString()}</td>
                        <td>{Number(row.signedIn || 0).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {Object.keys(featureDemand.bands).length > 0 && (
                <p style={{ fontSize: 12, opacity: 0.75, marginTop: 12 }}>
                  Stake they say they would use:{' '}
                  {Object.entries(featureDemand.bands)
                    .sort((a, b) => b[1] - a[1])
                    .map(([band, count]) => `${band} FM (${count})`)
                    .join(' · ')}
                </p>
              )}
            </>
          )}
        </div>

        <SwarmStatusPanel />

        <aside className="admin-dashboard-panel">
          <div className="admin-dashboard-panel-heading">
            <h2>Quick actions</h2>
            <span>Most-used tools</span>
          </div>
          <div className="admin-quick-actions">
            {quickActions.map(({ title, copy, href, icon: Icon }) => (
              <Link className="admin-quick-action" href={href} key={title}>
                <span><Icon /></span>
                <div><strong>{title}</strong><small>{copy}</small></div>
                <FaArrowRight />
              </Link>
            ))}
            <button type="button" className="admin-quick-action" onClick={() => setShowAnalytics(true)}>
              <span><FaChartLine /></span>
              <div><strong>Visitor analytics</strong><small>Review tracked audience activity.</small></div>
              <FaArrowRight />
            </button>
          </div>
        </aside>
      </section>
    </div>
  );
};

export default Admin;
