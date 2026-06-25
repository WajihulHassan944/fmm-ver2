import React, { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../../Redux/authSlice';
import { logoutAffiliate } from '../../Redux/affiliateAuthSlice';
import Link from 'next/link';
import { toast } from 'react-toastify';
import { useRouter } from 'next/router';
import {
  FaBars,
  FaBullseye,
  FaCalendarAlt,
  FaChartLine,
  FaChevronDown,
  FaCoins,
  FaCrown,
  FaComments,
  FaCog,
  FaEllipsisH,
  FaFire,
  FaFistRaised,
  FaHandshake,
  FaHome,
  FaMedal,
  FaNewspaper,
  FaQuestionCircle,
  FaSignOutAlt,
  FaTimes,
  FaTrophy,
  FaUserCircle,
  FaUsers,
  FaVideo,
} from 'react-icons/fa';

const LOGO_URL = '/images/fmm-experience/fantasy-mmadness-logo.png';

const fightLinks = [
  { label: 'Upcoming Fights', href: '/upcomingfights', icon: FaFire },
  { label: 'Past Fights', href: '/past-fights', icon: FaMedal },
  { label: 'Fight Calendar', href: '/calendar-of-fights', icon: FaCalendarAlt },
  { label: 'Fight Blogs', href: '/blogs', icon: FaNewspaper },
  { label: 'Fight News', href: '/fights-news', icon: FaNewspaper },
  { label: 'Our Fighters', href: '/our-fighters', icon: FaUsers },
  { label: 'Past Fight Videos', href: '/past-fights-records', icon: FaVideo },
  { label: 'Fighter Tracker', href: '/fighter-performance-tracker', icon: FaChartLine },
  { label: 'Pro Wrestling', href: '/pro-wrestling', icon: FaCrown },
];

const contestLinks = [
  { label: 'Active Contests', href: '/upcomingfights', icon: FaBullseye },
  { label: 'Fantasy Leagues', href: '/FantasyLeagues', icon: FaTrophy },
  { label: 'Play For Free', href: '/playforfree', icon: FaCoins },
  { label: 'Rewards', href: '/fights-rewards', icon: FaMedal },
  { label: 'Pro Wrestling Contests', href: '/pro-wrestling', icon: FaCrown },
];

const companyLinks = [
  { label: 'Community', href: '/community-forum', icon: FaComments },
  { label: 'Sponsors', href: '/Sponsors', icon: FaHandshake },
  { label: 'Testimonials', href: '/testimonials', icon: FaTrophy },
  { label: 'Contact', href: '/contact', icon: FaQuestionCircle },
  { label: 'FAQs', href: '/faqs', icon: FaQuestionCircle },
];

const publicNav = [
  { label: 'Fights', href: '/upcomingfights', icon: FaFistRaised, children: fightLinks },
  { label: 'Contests', href: '/upcomingfights', icon: FaBullseye, children: contestLinks },
  { label: 'Pro Wrestling', href: '/pro-wrestling', icon: FaCrown },
  { label: 'Leaderboard', href: '/leaderboard', icon: FaTrophy },
  { label: 'Tokens', href: '/fights-rewards', icon: FaCoins },
  { label: 'How To Play', href: '/guides', icon: FaQuestionCircle },
  {
    label: 'Affiliates',
    href: '/affiliate-create-account',
    icon: FaUsers,
    children: [
      { label: 'Affiliate Program', href: '/affiliate-create-account', icon: FaUsers },
      { label: 'Affiliate Guides', href: '/affiliate-guides', icon: FaQuestionCircle },
      { label: 'Affiliate League', href: '/affiliate-league', icon: FaTrophy },
      { label: 'Past Promotions', href: '/past-promotions', icon: FaMedal },
    ],
  },
  { label: 'More', href: '#', icon: FaEllipsisH, children: companyLinks },
];

const playerNav = [
  {
    label: 'Fights',
    href: '/upcomingfights',
    icon: FaFistRaised,
    children: [
      { label: 'Upcoming Fights', href: '/upcomingfights', icon: FaFire },
      { label: 'Your Fights', href: '/YourFights', icon: FaBullseye },
      { label: 'Past Fights', href: '/past-fights', icon: FaMedal },
      { label: 'Fight Calendar', href: '/calendar-of-fights', icon: FaCalendarAlt },
    ],
  },
  { label: 'Contests', href: '/YourFights', icon: FaBullseye },
  { label: 'Pro Wrestling', href: '/pro-wrestling', icon: FaCrown },
  { label: 'Leaderboard', href: '/leaderboard', icon: FaTrophy },
  { label: 'Tokens', href: '/fights-rewards', icon: FaCoins },
  { label: 'Community', href: '/community-forum', icon: FaComments },
  {
    label: 'More',
    href: '#',
    icon: FaEllipsisH,
    children: [
      { label: 'Dashboard', href: '/UserDashboard', icon: FaHome },
      { label: 'Leagues', href: '/myLeagueRecords', icon: FaTrophy },
      { label: 'Profile', href: '/profile', icon: FaUserCircle },
      { label: 'Account Settings', href: '/account-settings', icon: FaCog },
      { label: 'Fantasy Chatroom', href: '/fantasy-chatroom', icon: FaComments },
    ],
  },
];

const affiliateNav = [
  { label: 'Dashboard', href: '/AffiliateDashboard', icon: FaHome },
  { label: 'Pro Wrestling', href: '/pro-wrestling', icon: FaCrown },
  { label: 'How It Works', href: '/HowItWorks', icon: FaQuestionCircle },
  { label: 'League', href: '/affiliate-league', icon: FaTrophy },
  { label: 'Promotions', href: '/past-promotions', icon: FaMedal },
  { label: 'Guides', href: '/affiliate-guides', icon: FaNewspaper },
  {
    label: 'More',
    href: '#',
    icon: FaEllipsisH,
    children: [
      { label: 'Profile', href: '/AffiliateProfile', icon: FaUserCircle },
      { label: 'Insights', href: '/AffiliatePromotion', icon: FaChartLine },
      { label: 'Chat', href: '/fantasy-chatroom', icon: FaComments },
    ],
  },
];

const sponsorNav = [
  { label: 'Dashboard', href: '/sponsor-dashboard', icon: FaHome },
  { label: 'Sponsors', href: '/Sponsors', icon: FaHandshake },
  { label: 'Community', href: '/community-forum', icon: FaComments },
  { label: 'Leaderboard', href: '/leaderboard', icon: FaTrophy },
  { label: 'Contact', href: '/contact', icon: FaQuestionCircle },
];

const flattenNav = (items) => items.flatMap((item) => (item.children?.length ? item.children : item));

const Header = () => {
  const router = useRouter();
  const dispatch = useDispatch();
  const pathname = router?.pathname || '';
  const asPath = router?.asPath || pathname;
  const auth = useSelector((state) => state.auth);
  const affiliateAuth = useSelector((state) => state.affiliateAuth);
  const affiliate = affiliateAuth?.userAffiliate;
  const user = auth?.user;
  const isAuthenticated = Boolean(auth?.isAuthenticated);
  const isAuthenticatedAffiliate = Boolean(affiliateAuth?.isAuthenticatedAffiliate);
  const [authStatusSponsor, setAuthStatusSponsor] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setAuthStatusSponsor(localStorage.getItem('isSponsorAuthenticated') === 'true');
    }
  }, []);

  useEffect(() => {
    setActiveDropdown(null);
    setMobileOpen(false);
  }, [asPath]);

  const isActive = (href) => {
    if (!href || href === '#') return false;
    return asPath === href || asPath.startsWith(`${href}/`);
  };

  const userInitial = useMemo(() => {
    const displayName = user?.username || user?.firstName || user?.name || affiliate?.firstName || affiliate?.username || 'F';
    return displayName.charAt(0).toUpperCase();
  }, [affiliate?.firstName, affiliate?.username, user?.firstName, user?.name, user?.username]);

  const currentNav = useMemo(() => {
    if (isAuthenticatedAffiliate) return affiliateNav;
    if (authStatusSponsor) return sponsorNav;
    if (isAuthenticated) return playerNav;
    return publicNav;
  }, [authStatusSponsor, isAuthenticated, isAuthenticatedAffiliate]);

  const dashboardHomeHref = useMemo(() => {
    if (isAuthenticatedAffiliate) return '/AffiliateDashboard';
    if (authStatusSponsor) return '/sponsor-dashboard';
    if (isAuthenticated) return '/UserDashboard';
    return '/home';
  }, [authStatusSponsor, isAuthenticated, isAuthenticatedAffiliate]);

  const handleLogout = () => {
    dispatch(logout());
    toast.success('Successfully logged out 👋');
    router.push('/');
  };

  const handleLogoutAffiliate = () => {
    dispatch(logoutAffiliate());
    toast.success('Successfully logged out 👋');
    router.push('/');
  };

  const handleLogoutSponsor = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('isSponsorAuthenticated');
      localStorage.removeItem('sponsorData');
    }
    setAuthStatusSponsor(false);
    toast.success('Successfully logged out 👋');
    router.push('/');
  };

  const renderIcon = (Icon) => (Icon ? <Icon aria-hidden="true" /> : null);

  const renderNavItem = (item) => {
    const Icon = item.icon;

    if (item.children?.length) {
      const dropdownOpen = activeDropdown === item.label;
      const childActive = item.children.some((child) => isActive(child.href));

      return (
        <div className="theme-nav-dropdown" key={item.label} onMouseLeave={() => setActiveDropdown(null)}>
          <button
            type="button"
            className={`theme-nav-button ${dropdownOpen || childActive ? 'is-open' : ''}`}
            onClick={() => setActiveDropdown((current) => (current === item.label ? null : item.label))}
            onMouseEnter={() => setActiveDropdown(item.label)}
          >
            {renderIcon(Icon)}
            <span>{item.label}</span>
            <FaChevronDown className="theme-chevron" aria-hidden="true" />
          </button>
          {dropdownOpen && (
            <div className="theme-nav-menu">
              {item.children.map((child) => {
                const ChildIcon = child.icon;
                return (
                  <Link key={`${item.label}-${child.href}-${child.label}`} href={child.href} className={isActive(child.href) ? 'is-active' : ''}>
                    {renderIcon(ChildIcon)}
                    <span>{child.label}</span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      );
    }

    return (
      <Link key={item.href} href={item.href} className={`theme-nav-link ${isActive(item.href) ? 'is-open' : ''}`}>
        {renderIcon(Icon)}
        <span>{item.label}</span>
      </Link>
    );
  };

  const renderAuthActions = () => {
    if (isAuthenticatedAffiliate) {
      return (
        <>
          <div className="theme-user-chip">
            {affiliate?.profileUrl ? <img src={affiliate.profileUrl} alt="Affiliate profile" loading="lazy" /> : <span>{userInitial}</span>}
            <strong>{affiliate?.firstName || 'Affiliate'}</strong>
          </div>
          <button type="button" className="theme-btn theme-btn-secondary theme-logout-btn" onClick={handleLogoutAffiliate}>
            <FaSignOutAlt aria-hidden="true" /> Logout
          </button>
        </>
      );
    }

    if (authStatusSponsor) {
      return (
        <>
          <div className="theme-user-chip"><span>S</span><strong>Sponsor</strong></div>
          <button type="button" className="theme-btn theme-btn-secondary theme-logout-btn" onClick={handleLogoutSponsor}>
            <FaSignOutAlt aria-hidden="true" /> Logout
          </button>
        </>
      );
    }

    if (isAuthenticated) {
      return (
        <>
          <div className="theme-user-chip"><span>{userInitial}</span><strong>{user?.username || user?.firstName || 'Player'}</strong></div>
          <button type="button" className="theme-btn theme-btn-secondary theme-logout-btn" onClick={handleLogout}>
            <FaSignOutAlt aria-hidden="true" /> Logout
          </button>
        </>
      );
    }

    return (
      <>
        <Link href="/login" className="theme-btn theme-btn-secondary">Login</Link>
        <Link href="/CreateAccount" className="theme-btn theme-btn-primary">Sign Up Free</Link>
      </>
    );
  };

  const mobileLinks = flattenNav(currentNav);

  return (
    <header className="header theme-header">
      <Link href={dashboardHomeHref} className="theme-brand" aria-label="Fantasy MMAdness home">
        <img src={LOGO_URL} alt="Fantasy MMAdness" loading="eager" />
      </Link>

      <nav className="theme-nav" aria-label="Primary navigation">
        {currentNav.map(renderNavItem)}
      </nav>

      <div className="theme-header-actions">
        {renderAuthActions()}
        <button
          type="button"
          className="theme-mobile-toggle"
          aria-label="Toggle menu"
          aria-expanded={mobileOpen}
          onClick={() => setMobileOpen((current) => !current)}
        >
          {mobileOpen ? <FaTimes aria-hidden="true" /> : <FaBars aria-hidden="true" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="theme-mobile-menu">
          <Link href={dashboardHomeHref}><FaHome aria-hidden="true" /> Home</Link>
          {mobileLinks.map((item) => {
            const Icon = item.icon;
            return (
              <Link key={`mobile-${item.href}-${item.label}`} href={item.href} className={isActive(item.href) ? 'is-active' : ''}>
                {renderIcon(Icon)}
                <span>{item.label}</span>
              </Link>
            );
          })}
          {!isAuthenticated && !isAuthenticatedAffiliate && !authStatusSponsor && (
            <div className="theme-mobile-auth">
              <Link href="/login">Login</Link>
              <Link href="/CreateAccount">Sign Up Free</Link>
            </div>
          )}
          {isAuthenticated && <button type="button" onClick={handleLogout}>Logout</button>}
          {isAuthenticatedAffiliate && <button type="button" onClick={handleLogoutAffiliate}>Logout</button>}
          {authStatusSponsor && <button type="button" onClick={handleLogoutSponsor}>Logout</button>}
        </div>
      )}
    </header>
  );
};

export default Header;
