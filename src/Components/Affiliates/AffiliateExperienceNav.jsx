import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { FaBullhorn, FaCog, FaCrown, FaHistory, FaIdBadge, FaInfoCircle, FaUsers } from 'react-icons/fa';

const ITEMS = [
  { href: '/AffiliateDashboard', label: 'Dashboard', icon: FaBullhorn },
  { href: '/affiliate-league', label: 'League', icon: FaUsers },
  { href: '/pro-wrestling', label: 'Pro Wrestling', icon: FaCrown },
  { href: '/past-promotions', label: 'Past promotions', icon: FaHistory },
  { href: '/AffiliateProfile', label: 'Creator profile', icon: FaIdBadge },
  { href: '/AffiliateAccountSettings', label: 'Account settings', icon: FaCog },
  { href: '/HowItWorks', label: 'How it works', icon: FaInfoCircle },
];

const AffiliateExperienceNav = () => {
  const router = useRouter();

  return (
    <nav className="affiliate-experience-nav" aria-label="Affiliate workspace">
      <div className="theme-container affiliate-experience-nav-inner">
        {ITEMS.map(({ href, label, icon: Icon }) => (
          <Link key={href} href={href} className={router.pathname === href ? 'is-active' : ''}>
            <Icon aria-hidden="true" />
            <span>{label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
};

export default AffiliateExperienceNav;
