import React, { useEffect, useMemo, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useRouter } from 'next/router';
import Link from 'next/link';
import {
  FaAngleDown,
  FaBars,
  FaBell,
  FaBlog,
  FaBolt,
  FaCalendarAlt,
  FaChartBar,
  FaChevronLeft,
  FaChevronRight,
  FaComments,
  FaCrown,
  FaEnvelope,
  FaExternalLinkAlt,
  FaFistRaised,
  FaLayerGroup,
  FaMoneyCheckAlt,
  FaNewspaper,
  FaPlus,
  FaRobot,
  FaSearch,
  FaShieldAlt,
  FaSignOutAlt,
  FaTrophy,
  FaUserFriends,
  FaUsers,
  FaVideo,
  FaTimes,
} from 'react-icons/fa';
import { logoutAdmin } from '@/Redux/adminAuthSlice';
import OptimizedImage from '@/Components/Common/OptimizedImage';

const LOGO_URL = '/images/fmm-experience/fantasy-mmadness-logo.webp';

const navigationGroups = [
  {
    id: 'pro-wrestling',
    label: 'Pro Wrestling',
    icon: FaCrown,
    items: [
      { label: 'Wrestling registry', href: '/administration/pro-wrestling', icon: FaCrown, exact: true },
      { label: 'Create wrestling card', href: '/administration/pro-wrestling/new', icon: FaPlus },
      { label: 'Wrestler roster', href: '/administration/pro-wrestling/wrestlers', icon: FaUsers },
      { label: 'Rules & payouts', href: '/administration/pro-wrestling/rules', icon: FaTrophy },
      { label: 'Analytics, audit & ledger', href: '/administration/pro-wrestling/analytics', icon: FaShieldAlt },
    ],
  },
  {
    id: 'fight-operations',
    label: 'Fight operations',
    icon: FaFistRaised,
    items: [
      { label: 'Fight registry', href: '/administration/fights', icon: FaLayerGroup, matchPrefixes: ['/administration/PreviousMatches', '/administration/DeleteUpdateMatches', '/administration/upcomingFights'] },
      { label: 'Scoring rules', href: '/administration/scoring-rules', icon: FaTrophy },
      { label: 'Data quality', href: '/administration/fight-data-quality', icon: FaShieldAlt },
      { label: 'Create fight', href: '/administration/AddNewMatch', icon: FaPlus },
      { label: 'Fight calendar', href: '/administration/Calendar', icon: FaCalendarAlt },
      { label: 'Prediction scoring', href: '/administration/predictions', icon: FaChartBar },
      { label: 'Shadow fights', href: '/administration/ShadowFightsLibrary', icon: FaBolt },
      { label: 'Affiliate fights', href: '/administration/AffiliateMatches', icon: FaUserFriends },
      { label: 'Records & video', href: '/administration/adminRecords', icon: FaVideo },
    ],
  },
  {
    id: 'people-finance',
    label: 'People & finance',
    icon: FaUsers,
    items: [
      { label: 'Registered users', href: '/administration/RegisteredUsers', icon: FaUsers },
      { label: 'Affiliate users', href: '/administration/AffiliateUsers', icon: FaUserFriends },
      { label: 'Guest & suspended', href: '/administration/non-registered-users', icon: FaShieldAlt, matchPrefixes: ['/administration/suspended-accounts'] },
      { label: 'Payouts', href: '/administration/payouts', icon: FaMoneyCheckAlt },
      { label: 'Sponsors', href: '/administration/sponsors', icon: FaTrophy },
    ],
  },
  {
    id: 'content',
    label: 'Editorial',
    icon: FaNewspaper,
    items: [
      { label: 'Blogs', href: '/administration/blogs', icon: FaBlog, matchPrefixes: ['/administration/blogs/'] },
      { label: 'News', href: '/administration/news', icon: FaNewspaper },
      { label: 'FAQs', href: '/administration/faqs', icon: FaComments },
      { label: 'Email templates', href: '/administration/Email', icon: FaEnvelope },
    ],
  },
  {
    id: 'community',
    label: 'Community',
    icon: FaComments,
    items: [
      { label: 'Forum & chat', href: '/administration/Community', icon: FaComments, matchPrefixes: ['/administration/threads', '/administration/chatroom'] },
      { label: 'Notifications', href: '/administration/notifications', icon: FaBell },
    ],
  },
  {
    id: 'automation',
    label: 'Automation & social',
    icon: FaRobot,
    items: [
      { label: 'Swarm command center', href: '/administration/swarm', icon: FaRobot },
      { label: 'July 10K growth', href: '/administration/july-growth', icon: FaBolt },
      { label: 'SEO growth center', href: '/administration/seo-growth', icon: FaSearch },
      { label: 'Content assistants', href: '/administration/BlogsAiBot', icon: FaRobot, matchPrefixes: ['/administration/SocialAiBot'] },
      { label: 'Social publishing', href: '/administration/MakePost', icon: FaPlus, matchPrefixes: ['/administration/tweet', '/administration/tiktok'] },
      { label: 'Video archive', href: '/administration/YoutubeArchive', icon: FaVideo },
    ],
  },
];

const getActiveItem = (pathname) => {
  for (const group of navigationGroups) {
    const item = group.items.find((entry) => pathname === entry.href || (!entry.exact && pathname.startsWith(`${entry.href}/`)) || entry.matchPrefixes?.some((prefix) => pathname.startsWith(prefix)));
    if (item) return { group, item };
  }
  return { group: null, item: { label: 'Command center', href: '/administration' } };
};

const AdminHeader = () => {
  const dispatch = useDispatch();
  const router = useRouter();
  const pathname = router.pathname || '/administration';
  const active = useMemo(() => getActiveItem(pathname), [pathname]);
  const isWrestlingRoute = pathname.startsWith('/administration/pro-wrestling');
  const [menuOpen, setMenuOpen] = useState(false);
  const [compact, setCompact] = useState(false);
  const [query, setQuery] = useState('');
  const [openGroups, setOpenGroups] = useState(() => ({ [active.group?.id || 'fight-operations']: true }));

  useEffect(() => {
    const stored = typeof window !== 'undefined' && window.localStorage.getItem('fmm-admin-nav-compact') === 'true';
    setCompact(Boolean(stored));
  }, []);

  useEffect(() => {
    document.body.classList.toggle('admin-nav-compact', compact);
    if (typeof window !== 'undefined') window.localStorage.setItem('fmm-admin-nav-compact', String(compact));
    return () => document.body.classList.remove('admin-nav-compact');
  }, [compact]);

  useEffect(() => {
    setMenuOpen(false);
    if (active.group) setOpenGroups((current) => ({ ...current, [active.group.id]: true }));
  }, [active.group, pathname]);

  const handleLogout = (event) => {
    event?.preventDefault();
    dispatch(logoutAdmin());
    router.push('/administration/login');
  };

  const filteredGroups = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return navigationGroups;
    return navigationGroups
      .map((group) => ({ ...group, items: group.items.filter((item) => item.label.toLowerCase().includes(normalized)) }))
      .filter((group) => group.items.length);
  }, [query]);

  return (
    <>
      <button className="admin-mobile-trigger" type="button" onClick={() => setMenuOpen((current) => !current)} aria-label="Toggle administration navigation">
        {menuOpen ? <FaTimes /> : <FaBars />}
      </button>

      <aside className={`admin-command-nav ${menuOpen ? 'is-open' : ''} ${compact ? 'is-compact' : ''}`} aria-label="Administration navigation">
        <div className="admin-command-brand">
          <Link href="/administration" aria-label="Administration dashboard">
            <OptimizedImage src={LOGO_URL} alt="Fantasy MMAdness" width={168} height={76} sizes="168px" />
            <span><strong>FMM</strong><small>Command center</small></span>
          </Link>
          <button type="button" onClick={() => setCompact((current) => !current)} aria-label={compact ? 'Expand navigation' : 'Compact navigation'}>
            {compact ? <FaChevronRight /> : <FaChevronLeft />}
          </button>
        </div>

        <Link href="/administration" className={`admin-overview-link ${pathname === '/administration' ? 'is-active' : ''}`} title="Command center">
          <FaChartBar /><span>Command center</span>
        </Link>

        <label className="admin-command-search">
          <FaSearch aria-hidden="true" />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Find a tool" aria-label="Find an administration tool" />
        </label>

        <nav className="admin-command-groups">
          {filteredGroups.map((group) => {
            const GroupIcon = group.icon;
            const isOpen = compact || Boolean(openGroups[group.id]) || Boolean(query);
            const hasActive = active.group?.id === group.id;
            return (
              <section className={`admin-command-group ${hasActive ? 'has-active' : ''}`} key={group.id}>
                <button
                  type="button"
                  className="admin-command-group-toggle"
                  onClick={() => setOpenGroups((current) => ({ ...current, [group.id]: !current[group.id] }))}
                  aria-expanded={isOpen}
                  title={group.label}
                >
                  <GroupIcon aria-hidden="true" />
                  <span>{group.label}</span>
                  <FaAngleDown className={isOpen ? 'is-rotated' : ''} aria-hidden="true" />
                </button>
                {isOpen && (
                  <div className="admin-command-group-items">
                    {group.items.map((item) => {
                      const Icon = item.icon;
                      const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`) || item.matchPrefixes?.some((prefix) => pathname.startsWith(prefix));
                      return (
                        <Link key={item.href} href={item.href} className={`admin-command-link ${isActive ? 'is-active' : ''}`} title={item.label}>
                          <Icon aria-hidden="true" /><span>{item.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </section>
            );
          })}
        </nav>

        <div className="admin-command-footer">
          <Link href="/home" target="_blank" rel="noreferrer"><FaExternalLinkAlt /><span>View website</span></Link>
          <button type="button" onClick={handleLogout}><FaSignOutAlt /><span>Logout</span></button>
        </div>
      </aside>

      {compact && (
        <button
          type="button"
          className="admin-compact-expand-trigger"
          onClick={() => setCompact(false)}
          aria-label="Expand administration navigation"
          title="Expand navigation"
        >
          <FaChevronRight aria-hidden="true" />
          <span>Expand menu</span>
        </button>
      )}

      {menuOpen && <button type="button" className="admin-command-backdrop" aria-label="Close navigation" onClick={() => setMenuOpen(false)} />}

      <header className="admin-command-topbar">
        <div>
          <span>Administration / {active.group?.label || 'Overview'}</span>
          <h1>{active.item.label}</h1>
        </div>
        <div className="admin-command-topbar-actions">
          <Link href={isWrestlingRoute ? '/administration/pro-wrestling/new' : '/administration/AddNewMatch'} className="admin-topbar-primary"><FaPlus /> {isWrestlingRoute ? 'New wrestling card' : 'New match'}</Link>
          <Link href="/home" target="_blank" rel="noreferrer" className="admin-topbar-secondary"><FaExternalLinkAlt /> View site</Link>
          <button type="button" onClick={handleLogout} className="admin-topbar-icon" aria-label="Logout"><FaSignOutAlt /></button>
        </div>
      </header>
    </>
  );
};

export default AdminHeader;
