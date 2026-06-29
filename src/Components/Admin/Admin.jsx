import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  FaArrowRight,
  FaBell,
  FaBolt,
  FaChartLine,
  FaClone,
  FaEye,
  FaFistRaised,
  FaPlus,
  FaQuestionCircle,
  FaRobot,
  FaShieldAlt,
  FaTrophy,
  FaUserFriends,
  FaUsers,
} from 'react-icons/fa';
import VisitorsAnalytics from './VisitorsAnalytics';
import SwarmStatusPanel from './SwarmStatusPanel';

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
  });

  useEffect(() => {
    const fetchDashboardCounts = async () => {
      try {
        const response = await fetch('https://fantasymmadness-game-server-three.vercel.app/dashboard-counts');
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
      const response = await fetch('https://fantasymmadness-game-server-three.vercel.app/reset-stats', {
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
    { label: 'Tracked visitors', value: dashboardCounts.totalClicks, icon: FaEye, onClick: () => setShowAnalytics(true) },
  ], [dashboardCounts]);

  const operationRows = [
    { area: 'Fight operations', metric: `${dashboardCounts.matchesCount || 0} matches`, status: 'Active', statusClass: 'is-success', href: '/administration/upcomingFights', action: 'Open score center' },
    { area: 'Player accounts', metric: `${dashboardCounts.usersCount || 0} registered`, status: 'Monitored', statusClass: 'is-success', href: '/administration/RegisteredUsers', action: 'Manage users' },
    { area: 'Affiliate network', metric: `${dashboardCounts.affiliatesCount || 0} creators`, status: 'Review queue', statusClass: 'is-warning', href: '/administration/AffiliateUsers', action: 'Review affiliates' },
    { area: 'Community alerts', metric: `${dashboardCounts.unreadNotificationsCount || 0} unread`, status: dashboardCounts.unreadNotificationsCount ? 'Attention' : 'Clear', statusClass: dashboardCounts.unreadNotificationsCount ? 'is-danger' : 'is-success', href: '/administration/notifications', action: 'View notifications' },
    { area: 'Swarm automation', metric: 'MMA + pro wrestling', status: 'Gateway', statusClass: 'is-warning', href: '/administration/swarm', action: 'Open swarm panel' },
    { area: 'SEO growth center', metric: 'Reports + traffic', status: 'Ready', statusClass: 'is-success', href: '/administration/seo-growth', action: 'Open SEO center' },
  ];

  const quickActions = [
    { title: 'Create a match', copy: 'Build a new fight card and prediction setup.', href: '/administration/AddNewMatch', icon: FaPlus },
    { title: 'Submit scores', copy: 'Resolve live or completed fight outcomes.', href: '/administration/upcomingFights', icon: FaTrophy },
    { title: 'Review payouts', copy: 'Process affiliate payout requests.', href: '/administration/payouts', icon: FaShieldAlt },
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
