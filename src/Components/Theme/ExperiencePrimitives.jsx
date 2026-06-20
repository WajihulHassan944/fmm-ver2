import React from 'react';
import Link from 'next/link';
import { FaArrowRight, FaBolt, FaSearch } from 'react-icons/fa';
import { FMM_ASSET_BASE } from '@/Utils/fightExperience';

export const ExperienceHero = ({
  eyebrow,
  title,
  accent,
  description,
  actions = [],
  stats = [],
  children,
  className = '',
  backgroundImage,
}) => (
  <section
    className={`xp-hero ${className}`}
    style={backgroundImage ? { '--xp-hero-image': `url(${backgroundImage})` } : undefined}
  >
    <div className="xp-hero-grid-overlay" aria-hidden="true" />
    <div className="theme-container xp-hero-layout">
      <div className="xp-hero-copy">
        {eyebrow && <p className="xp-eyebrow"><FaBolt aria-hidden="true" /> {eyebrow}</p>}
        <h1>{title} {accent && <span>{accent}</span>}</h1>
        {description && <p className="xp-hero-description">{description}</p>}
        {actions.length > 0 && (
          <div className="xp-hero-actions">
            {actions.map(({ href, label, variant = 'primary', icon: Icon = FaArrowRight }) => (
              <Link key={`${href}-${label}`} href={href} className={`theme-btn theme-btn-${variant}`}>
                {label} <Icon aria-hidden="true" />
              </Link>
            ))}
          </div>
        )}
        {stats.length > 0 && (
          <div className="xp-hero-stats">
            {stats.map(({ value, label, icon: Icon }) => (
              <div key={label}>
                {Icon && <Icon aria-hidden="true" />}
                <span><strong>{value}</strong><small>{label}</small></span>
              </div>
            ))}
          </div>
        )}
      </div>
      {children && <div className="xp-hero-visual">{children}</div>}
    </div>
  </section>
);

export const ExperienceSectionHeading = ({ eyebrow, title, description, action }) => (
  <div className="xp-section-heading">
    <div>
      {eyebrow && <p className="xp-eyebrow">{eyebrow}</p>}
      <h2>{title}</h2>
      {description && <p>{description}</p>}
    </div>
    {action && (
      <Link href={action.href} className="xp-text-link">
        {action.label} <FaArrowRight aria-hidden="true" />
      </Link>
    )}
  </div>
);

export const ExperienceEmptyState = ({ title = 'Nothing to show yet', description, action }) => (
  <div className="xp-empty-state">
    <div className="xp-empty-orbit" aria-hidden="true"><FaSearch /></div>
    <h3>{title}</h3>
    {description && <p>{description}</p>}
    {action && <Link href={action.href} className="theme-btn theme-btn-secondary">{action.label}</Link>}
  </div>
);

export const FighterBackdrop = ({ left, right, leftAlt = '', rightAlt = '' }) => (
  <div className="xp-fighter-backdrop" aria-hidden={!leftAlt && !rightAlt}>
    <img className="xp-fighter-backdrop-left" src={left || `${FMM_ASSET_BASE}/fighter-jadden-addison.png`} alt={leftAlt} />
    <div className="xp-fighter-backdrop-vs">VS</div>
    <img className="xp-fighter-backdrop-right" src={right || `${FMM_ASSET_BASE}/fighter-zaveer-davis.png`} alt={rightAlt} />
  </div>
);
