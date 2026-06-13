import React, { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../../Redux/authSlice';
import { logoutAffiliate } from '../../Redux/affiliateAuthSlice';
import Link from 'next/link';
import { toast } from 'react-toastify';
import { useRouter } from 'next/router';

const LOGO_URL = 'https://res.cloudinary.com/dqi6vk2vn/image/upload/v1743079917/home/rtr4tmlkw82rmk1kywuc.webp';

const fightLinks = [
  ['Upcoming Fights', '/upcomingfights'],
  ['Past Fights', '/past-fights'],
  ['Fight Calendar', '/calendar-of-fights'],
  ['Fight Blogs', '/blogs'],
  ['Fight News', '/fights-news'],
  ['Our Fighters', '/our-fighters'],
  ['Past Fight Videos', '/past-fights-records'],
  ['Fighter Tracker', '/fighter-performance-tracker'],
];

const publicLinks = [
  ['Home', '/home'],
  ['How to Play', '/guides'],
  ['Fantasy Leagues', '/FantasyLeagues'],
  ['Rewards', '/fights-rewards'],
  ['Community', '/community-forum'],
  ['Sponsors', '/Sponsors'],
];

const playerLinks = [
  ['Dashboard', '/UserDashboard'],
  ['Your Fights', '/YourFights'],
  ['Leaderboard', '/leaderboard'],
  ['Leagues', '/myLeagueRecords'],
  ['Profile', '/profile'],
  ['Community', '/community-forum'],
  ['Chatroom', '/fantasy-chatroom'],
];

const affiliateLinks = [
  ['Dashboard', '/AffiliateDashboard'],
  ['How it works', '/HowItWorks'],
  ['League', '/affiliate-league'],
  ['Promotions', '/past-promotions'],
  ['Profile', '/AffiliateProfile'],
  ['Insights', '/AffiliatePromotion'],
  ['Guides', '/affiliate-guides'],
  ['Chat', '/fantasy-chatroom'],
];

const sponsorLinks = [
  ['Dashboard', '/sponsor-dashboard'],
  ['Sponsors', '/Sponsors'],
  ['Community', '/community-forum'],
  ['Contact', '/contact'],
];

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
  const [authStatusSponsor, setAuthStatusSponsor] = useState(null);
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

  const shouldRenderScrollingText =
    !isAuthenticated &&
    !isAuthenticatedAffiliate &&
    !pathname?.includes('/administration') &&
    !authStatusSponsor &&
    !pathname?.toLowerCase().includes('affiliate') &&
    !pathname?.toLowerCase().includes('shadow');

  const headerStyles = shouldRenderScrollingText ? { top: '44px' } : { top: '0' };

  const isActive = (href) => {
    if (!href || href === '#') return false;
    if (href === '/') return asPath === '/';
    return asPath === href || asPath.startsWith(`${href}/`);
  };

  const userInitial = useMemo(() => {
    const displayName = user?.username || user?.firstName || user?.name || affiliate?.firstName || affiliate?.username || 'F';
    return displayName.charAt(0).toUpperCase();
  }, [affiliate?.firstName, affiliate?.username, user?.firstName, user?.name, user?.username]);

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

  const renderLink = ([label, href]) => (
    <Link key={href} href={href} className={`theme-nav-link ${isActive(href) ? 'is-open' : ''}`}>
      {label}
    </Link>
  );

  const renderDropdown = (label, links) => (
    <div className="theme-nav-dropdown" onMouseLeave={() => setActiveDropdown(null)}>
      <button
        type="button"
        className={`theme-nav-button ${activeDropdown === label ? 'is-open' : ''}`}
        onClick={() => setActiveDropdown((current) => (current === label ? null : label))}
        onMouseEnter={() => setActiveDropdown(label)}
      >
        {label} <span aria-hidden="true">▾</span>
      </button>
      {activeDropdown === label && (
        <div className="theme-nav-menu">
          {links.map(([linkLabel, href]) => (
            <Link key={`${label}-${href}`} href={href}>
              {linkLabel}
            </Link>
          ))}
        </div>
      )}
    </div>
  );

  const navContent = () => {
    if (isAuthenticatedAffiliate) return affiliateLinks.map(renderLink);
    if (authStatusSponsor) return sponsorLinks.map(renderLink);
    if (isAuthenticated) {
      return (
        <>
          {renderDropdown('Fights', [
            ['Upcoming Fights', '/upcomingfights'],
            ['Past Fights', '/past-fights'],
            ['Your Fights', '/YourFights'],
            ['Fight Calendar', '/calendar-of-fights'],
          ])}
          {renderDropdown('Forums', [
            ['Discussion Forum', '/community-forum'],
            ['Fantasy Chatroom', '/fantasy-chatroom'],
          ])}
          {playerLinks.map(renderLink)}
        </>
      );
    }
    return (
      <>
        {renderDropdown('Fights', fightLinks)}
        {publicLinks.map(renderLink)}
      </>
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
          <button type="button" className="theme-btn theme-btn-secondary" onClick={handleLogoutAffiliate}>Logout</button>
        </>
      );
    }
    if (authStatusSponsor) {
      return (
        <>
          <div className="theme-user-chip"><span>S</span><strong>Sponsor</strong></div>
          <button type="button" className="theme-btn theme-btn-secondary" onClick={handleLogoutSponsor}>Logout</button>
        </>
      );
    }
    if (isAuthenticated) {
      return (
        <>
          <div className="theme-user-chip"><span>{userInitial}</span><strong>{user?.username || user?.firstName || 'Player'}</strong></div>
          <button type="button" className="theme-btn theme-btn-secondary" onClick={handleLogout}>Logout</button>
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

  const mobileLinks = isAuthenticatedAffiliate
    ? affiliateLinks
    : authStatusSponsor
      ? sponsorLinks
      : isAuthenticated
        ? [...playerLinks, ['Upcoming Fights', '/upcomingfights'], ['Past Fights', '/past-fights']]
        : [...fightLinks, ...publicLinks];

  return (
    <>
      {shouldRenderScrollingText && (
        <Link href="/CreateAccount" className="theme-top-promo" aria-label="Create an account">
          <span>Signup, get $20 instantly</span>
          <span>20 fantasy tokens free</span>
          <span>Play now and win rewards</span>
        </Link>
      )}
      <header className="header theme-header" style={headerStyles}>
        <Link href="/home" className="theme-brand" aria-label="Fantasy MMAdness home">
          <img src={LOGO_URL} alt="Fantasy MMAdness" loading="lazy" />
          <span>Fantasy <strong>MMAdness</strong></span>
        </Link>
        <nav className="theme-nav" aria-label="Primary navigation">{navContent()}</nav>
        <div className="theme-header-actions">
          {renderAuthActions()}
          <button type="button" className="theme-mobile-toggle" aria-label="Toggle menu" aria-expanded={mobileOpen} onClick={() => setMobileOpen((current) => !current)}>
            <span /><span /><span />
          </button>
        </div>
        {mobileOpen && (
          <div className="theme-mobile-menu">
            {mobileLinks.map(([label, href]) => <Link key={`mobile-${href}`} href={href}>{label}</Link>)}
            {!isAuthenticated && !isAuthenticatedAffiliate && !authStatusSponsor && <><Link href="/login">Login</Link><Link href="/CreateAccount">Sign Up Free</Link></>}
            {isAuthenticated && <button type="button" onClick={handleLogout}>Logout</button>}
            {isAuthenticatedAffiliate && <button type="button" onClick={handleLogoutAffiliate}>Logout</button>}
            {authStatusSponsor && <button type="button" onClick={handleLogoutSponsor}>Logout</button>}
          </div>
        )}
      </header>
    </>
  );
};

export default Header;
