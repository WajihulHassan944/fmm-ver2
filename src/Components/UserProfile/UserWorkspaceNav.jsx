import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import {
  FaCoins,
  FaFistRaised,
  FaIdBadge,
  FaTachometerAlt,
  FaTrophy,
  FaUserCog,
} from 'react-icons/fa';

const NAV_ITEMS = [
  { href: '/UserDashboard', label: 'Dashboard', icon: FaTachometerAlt },
  { href: '/YourFights', label: 'My fights', icon: FaFistRaised },
  { href: '/myLeagueRecords', label: 'My leagues', icon: FaTrophy },
  { href: '/profile', label: 'Player profile', icon: FaIdBadge },
  { href: '/account-settings', label: 'Account settings', icon: FaUserCog },
  { href: '/checkout', label: 'Fight wallet', icon: FaCoins },
];

const UserWorkspaceNav = ({ className = '' }) => {
  const router = useRouter();

  return (
    <nav className={`player-workspace-nav ${className}`.trim()} aria-label="Player workspace">
      <div className="theme-container player-workspace-nav-inner">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const isActive = router.pathname === href;
          return (
            <Link key={href} href={href} className={isActive ? 'is-active' : ''}>
              <Icon aria-hidden="true" />
              <span>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default UserWorkspaceNav;
