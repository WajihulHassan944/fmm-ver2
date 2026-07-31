import React from 'react';
import Link from 'next/link';
import {
  FaArrowRight,
  FaBolt,
  FaCalendarAlt,
  FaCoins,
  FaCrown,
  FaFistRaised,
  FaLock,
  FaTrophy,
  FaUsers,
} from 'react-icons/fa';
import {
  WRESTLING_STATUS_CLASS,
  WRESTLING_STATUS_COPY,
  formatTokenAmount,
  formatWrestlingCountdown,
  formatWrestlingDate,
  getWrestlerImage,
  getWrestlingMatchHref,
} from '@/Utils/proWrestling';

export const WrestlingStatusBadge = ({ status = 'DRAFT' }) => (
  <span className={`pw-status-badge ${WRESTLING_STATUS_CLASS[status] || ''}`}>
    {status === 'LIVE' && <i />}
    {WRESTLING_STATUS_COPY[status] || status}
  </span>
);

export const WrestlingModeNav = ({ active = 'contests' }) => {
  const items = [
    ['contests', '/pro-wrestling', 'Game mode'],
    ['wrestlers', '/pro-wrestling/wrestlers', 'Wrestlers'],
    ['rules', '/pro-wrestling/how-to-play', 'How to play'],
    ['leaderboards', '/pro-wrestling/leaderboard', 'Leaderboards'],
    ['history', '/pro-wrestling/history', 'My wrestling'],
  ];
  return (
    <nav className="pw-mode-nav" aria-label="Pro Wrestling game mode">
      <div className="theme-container pw-mode-nav-inner">
        {items.map(([key, href, label]) => (
          <Link key={key} href={href} className={active === key ? 'is-active' : ''}>{label}</Link>
        ))}
      </div>
    </nav>
  );
};

export const WrestlingHero = ({
  eyebrow = 'Pro Wrestling game mode',
  title,
  accent,
  description,
  actions = [],
  stats = [],
  background = '/images/pro-wrestling/wrestling-match-premium.webp',
  children,
  compact = false,
}) => (
  <section className={`pw-hero ${compact ? 'is-compact' : ''}`} style={{ '--pw-hero-image': `url(${background})` }}>
    <div className="pw-hero-grid" aria-hidden="true" />
    <div className="theme-container pw-hero-layout">
      <div className="pw-hero-copy">
        <p className="pw-eyebrow"><FaBolt /> {eyebrow}</p>
        <h1>{title} {accent && <span>{accent}</span>}</h1>
        {description && <p className="pw-hero-description">{description}</p>}
        {actions.length > 0 && (
          <div className="pw-hero-actions">
            {actions.map(({ href, label, secondary = false, icon: Icon = FaArrowRight }) => (
              <Link href={href} key={`${href}-${label}`} className={secondary ? 'pw-btn pw-btn-secondary' : 'pw-btn pw-btn-primary'}>
                {label} <Icon />
              </Link>
            ))}
          </div>
        )}
        {stats.length > 0 && (
          <div className="pw-hero-stats">
            {stats.map(({ value, label, icon: Icon = FaTrophy }) => (
              <article key={label}><Icon /><span><strong>{value}</strong><small>{label}</small></span></article>
            ))}
          </div>
        )}
      </div>
      {children && <aside className="pw-hero-visual">{children}</aside>}
    </div>
  </section>
);

export const WrestlingMatchCard = ({ match, actionLabel, actionHref, onAction, compact = false }) => {
  const href = actionHref || getWrestlingMatchHref(match);
  const locked = new Date(match?.lockAt).getTime() <= Date.now() || match?.status !== 'OPEN';
  return (
    <article className={`pw-match-card ${compact ? 'is-compact' : ''}`}>
      <div className="pw-match-card-media">
        {match?.bannerImage && <img className="pw-match-card-banner" src={match.bannerImage} alt="" />}
        <figure><img src={getWrestlerImage(match?.competitorA, 'A')} alt={match?.competitorA?.displayName || 'Wrestler A'} /><figcaption>{match?.competitorA?.displayName || 'Wrestler A'}</figcaption></figure>
        <div className="pw-match-card-vs"><small>{match?.promotionName || 'FMM Wrestling'}</small><strong>VS</strong><em>{match?.matchFormat?.replaceAll?.('_', ' ') || 'Singles'}</em></div>
        <figure><img src={getWrestlerImage(match?.competitorB, 'B')} alt={match?.competitorB?.displayName || 'Wrestler B'} /><figcaption>{match?.competitorB?.displayName || 'Wrestler B'}</figcaption></figure>
        <WrestlingStatusBadge status={match?.status} />
      </div>
      <div className="pw-match-card-copy">
        <p>{match?.eventName || 'Pro Wrestling event'}</p>
        <h3>{match?.matchTitle || `${match?.competitorA?.displayName || 'Wrestler A'} vs ${match?.competitorB?.displayName || 'Wrestler B'}`}</h3>
        <div className="pw-match-card-meta">
          <span><FaCalendarAlt /> {formatWrestlingDate(match?.matchDate)}</span>
          <span><FaUsers /> {formatTokenAmount(match?.participantCount)} players</span>
          <span><FaCoins /> {formatTokenAmount(match?.currentPot)} token pot</span>
        </div>
        <div className="pw-match-card-bottom">
          <span>{locked ? <FaLock /> : <FaBolt />} {locked ? WRESTLING_STATUS_COPY[match?.status] || 'Locked' : `Locks in ${formatWrestlingCountdown(match?.lockAt)}`}</span>
          {onAction ? (
            <button type="button" onClick={() => onAction(match)}>{actionLabel || 'Open contest'} <FaArrowRight /></button>
          ) : (
            <Link href={href}>{actionLabel || 'Open contest'} <FaArrowRight /></Link>
          )}
        </div>
      </div>
    </article>
  );
};

export const WrestlingEmptyState = ({ icon: Icon = FaFistRaised, title, description, action }) => (
  <div className="pw-empty-state">
    <Icon />
    <h3>{title}</h3>
    {description && <p>{description}</p>}
    {action && <Link href={action.href} className="pw-btn pw-btn-secondary">{action.label} <FaArrowRight /></Link>}
  </div>
);

export const WrestlingSectionHeading = ({ eyebrow, title, description, action }) => (
  <header className="pw-section-heading">
    <div><p>{eyebrow}</p><h2>{title}</h2>{description && <span>{description}</span>}</div>
    {action && <Link href={action.href}>{action.label} <FaArrowRight /></Link>}
  </header>
);

export const WrestlingChampionMark = () => (
  <div className="pw-champion-mark"><FaCrown /><span>Fantasy MMADNESS</span><strong>Pro Wrestling</strong></div>
);
