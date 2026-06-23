import React from 'react';
import {
  FaCalendarAlt,
  FaClock,
  FaMapMarkerAlt,
  FaPlay,
  FaTrophy,
  FaUsers,
} from 'react-icons/fa';
import {
  formatFightDate,
  getFightCategory,
  getFightDayParts,
  getFighterImage,
  getFightName,
  getFightPlayerCount,
  getFightPrize,
  getFightRounds,
  getFightStatus,
  getFightStatusLabel,
} from '@/Utils/fightExperience';

export const FeaturedFight = ({ match, index = 0, onAction, actionLabel }) => {
  if (!match) return null;
  const status = getFightStatus(match);
  const { day, month } = getFightDayParts(match);
  const defaultAction = status === 'past' ? 'View result' : status === 'live' ? 'Follow live' : 'Enter fight';

  return (
    <article className={`xp-featured-fight is-${status}`}>
      <div className="xp-featured-grid" aria-hidden="true" />
      <div className="xp-featured-fighters">
        <figure className="is-blue">
          <img src={getFighterImage(match, 'A', index)} alt={match.matchFighterA || 'Fighter A'} />
        </figure>
        <figure className="is-red">
          <img src={getFighterImage(match, 'B', index)} alt={match.matchFighterB || 'Fighter B'} />
        </figure>
      </div>
      <div className="xp-featured-date"><strong>{day}</strong><span>{month}</span></div>
      <div className="xp-featured-status"><i />{getFightStatusLabel(match)}</div>
      <div className="xp-featured-content">
        <p>{match.matchName || 'Fantasy MMAdness Fight Night'}</p>
        <h2>
          <span>{match.matchFighterA || 'Fighter A'}</span>
          <em>VS</em>
          <span>{match.matchFighterB || 'Fighter B'}</span>
        </h2>
        <div className="xp-featured-meta">
          <span><FaCalendarAlt /> {formatFightDate(match)}</span>
          <span><FaMapMarkerAlt /> {match.location || match.venue || 'Venue TBA'}</span>
          <span><FaClock /> {getFightCategory(match)} · {getFightRounds(match)}</span>
        </div>
      </div>
      <button type="button" className="theme-btn theme-btn-primary xp-featured-action" onClick={() => onAction?.(match)}>
        {actionLabel || defaultAction} <FaPlay aria-hidden="true" />
      </button>
    </article>
  );
};

export const FightVisualCard = ({ match, index = 0, onAction, compact = false, footerAction, actionLabel: suppliedActionLabel, actionIcon: ActionIcon }) => {
  if (!match) return null;
  const status = getFightStatus(match);
  const playerCount = getFightPlayerCount(match);
  const category = getFightCategory(match);
  const resultLabel = match?.winner || match?.winningFighter || match?.result || 'Result available';
  const actionLabel = suppliedActionLabel || (status === 'past' ? 'View result' : status === 'live' ? 'Follow live' : match?.matchTokens == null ? 'Enter free' : 'Enter fight');

  return (
    <article className={`xp-fight-card is-${status} ${compact ? 'is-compact' : ''}`}>
      <div className="xp-fight-card-media">
        <figure className="is-blue"><img src={getFighterImage(match, 'A', index)} alt={match?.matchFighterA || 'Fighter A'} loading="lazy" /></figure>
        <figure className="is-red"><img src={getFighterImage(match, 'B', index)} alt={match?.matchFighterB || 'Fighter B'} loading="lazy" /></figure>
        <span className="xp-fight-category">{category}</span>
        <span className="xp-fight-status"><i /> {getFightStatusLabel(match)}</span>
        <span className="xp-fight-vs">VS</span>
      </div>
      <div className="xp-fight-card-body">
        <p className="xp-card-kicker">{match?.matchName || match?.matchType || 'Fight card'}</p>
        <h3>{match?.matchFighterA || 'Fighter A'} <span>VS</span> {match?.matchFighterB || 'Fighter B'}</h3>
        <div className="xp-fight-card-details">
          <span><FaCalendarAlt /> {formatFightDate(match, { short: true })}</span>
          <span><FaClock /> {getFightRounds(match)}</span>
          <span><FaUsers /> {playerCount} {playerCount === 1 ? 'player' : 'players'}</span>
        </div>
        <div className="xp-fight-card-footer">
          <div>
            <strong>{status === 'past' ? resultLabel : getFightPrize(match)}</strong>
            <small>{status === 'past' ? 'Official result' : 'Prize pool'}</small>
          </div>
          <button type="button" className="xp-card-action" onClick={() => onAction?.(match)}>
            {ActionIcon ? <ActionIcon /> : status === 'past' ? <FaTrophy /> : <FaPlay />} {actionLabel}
          </button>
        </div>
        {footerAction}
      </div>
    </article>
  );
};

export const FightTimelineRow = ({ match, index = 0, onAction, actionLabel }) => {
  if (!match) return null;
  const { day, month } = getFightDayParts(match);
  const status = getFightStatus(match);

  return (
    <article className={`xp-fight-timeline-row is-${status}`}>
      <div className="xp-timeline-date"><strong>{day}</strong><span>{month}</span></div>
      <div className="xp-timeline-portraits">
        <img src={getFighterImage(match, 'A', index)} alt={match?.matchFighterA || ''} loading="lazy" />
        <img src={getFighterImage(match, 'B', index)} alt={match?.matchFighterB || ''} loading="lazy" />
      </div>
      <div className="xp-timeline-main">
        <span>{getFightCategory(match)} · {getFightStatusLabel(match)}</span>
        <h3>{getFightName(match)}</h3>
        <p>{formatFightDate(match)} · {getFightRounds(match)}</p>
      </div>
      <div className="xp-timeline-side">
        <strong>{status === 'past' ? match?.result || 'Final' : getFightPrize(match)}</strong>
        <button type="button" onClick={() => onAction?.(match)}>{actionLabel || (status === 'past' ? 'View result' : 'Open fight')} →</button>
      </div>
    </article>
  );
};
