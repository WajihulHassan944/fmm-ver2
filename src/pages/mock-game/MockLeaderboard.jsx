'use client';

import React, { useMemo } from 'react';
import {
  FaBolt,
  FaChevronRight,
  FaCrown,
  FaMedal,
  FaShieldAlt,
  FaTrophy,
} from 'react-icons/fa';

const MockLeaderboard = ({ totalPoints }) => {
  const otherPlayers = [
    { name: 'Ali Rehman', totalPoints: 250, initials: 'AR' },
    { name: 'Sofia Khan', totalPoints: 220, initials: 'SK' },
    { name: 'Zayan Malik', totalPoints: 180, initials: 'ZM' },
  ];

  const currentUser = {
    name: 'Mock Player',
    totalPoints: Number.isFinite(Number(totalPoints)) ? Number(totalPoints) : 0,
    initials: 'MP',
  };

  const sortedLeaderboard = useMemo(() => {
    const combined = [...otherPlayers, currentUser];
    return combined
      .sort((playerA, playerB) => playerB.totalPoints - playerA.totalPoints)
      .map((player, index) => ({
        ...player,
        rank: index + 1,
        isCurrentUser: player.name === 'Mock Player',
      }));
  }, [currentUser.totalPoints]);

  const podium = sortedLeaderboard.slice(0, 3);
  const currentPosition = sortedLeaderboard.find((player) => player.isCurrentUser);
  const leaderScore = sortedLeaderboard[0]?.totalPoints || 0;
  const pointsToLead = Math.max(0, leaderScore - currentUser.totalPoints);

  return (
    <section className="mock-premium-leaderboard">
      <div className="mock-premium-leaderboard-bg" aria-hidden="true" />
      <header className="mock-premium-leaderboard-header">
        <div><p className="xp-eyebrow"><FaTrophy /> Practice arena standings</p><h2>Mock fight leaderboard</h2><p>Your local scorecard is ranked instantly against the training-room field.</p></div>
        <div className="mock-premium-user-rank"><span>Current rank</span><strong>#{currentPosition?.rank || '—'}</strong><small>{pointsToLead ? `${pointsToLead} points from the lead` : 'You own the top score'}</small></div>
      </header>

      <div className="mock-premium-podium" aria-label="Top three mock players">
        {[podium[1], podium[0], podium[2]].map((player, displayIndex) => {
          if (!player) return null;
          const place = player.rank;
          return (
            <article key={player.name} className={`is-place-${place} ${player.isCurrentUser ? 'is-current' : ''}`}>
              <div className="mock-premium-podium-crown">{place === 1 ? <FaCrown /> : <FaMedal />}</div>
              <span className="mock-premium-avatar">{player.initials}</span>
              <small>Rank {place}</small>
              <h3>{player.name}</h3>
              <strong>{player.totalPoints.toLocaleString()} <em>PTS</em></strong>
              <div className="mock-premium-podium-base"><span>{place}</span></div>
            </article>
          );
        })}
      </div>

      <div className="mock-premium-table-shell">
        <div className="mock-premium-table-head"><span>Rank</span><span>Predictor</span><span>Score</span><span>Momentum</span></div>
        {sortedLeaderboard.map((player) => {
          const progress = leaderScore ? Math.max(8, Math.round((player.totalPoints / leaderScore) * 100)) : 0;
          return (
            <div key={player.name} className={`mock-premium-table-row ${player.isCurrentUser ? 'is-current' : ''}`}>
              <span className="mock-premium-rank">{player.rank === 1 ? <FaCrown /> : `#${player.rank}`}</span>
              <span className="mock-premium-player"><i>{player.initials}</i><span><strong>{player.name}</strong><small>{player.isCurrentUser ? 'Your mock scorecard' : 'Training-room contender'}</small></span></span>
              <span className="mock-premium-score">{player.totalPoints.toLocaleString()} <small>PTS</small></span>
              <span className="mock-premium-progress"><i><b style={{ width: `${progress}%` }} /></i><em>{progress}%</em></span>
            </div>
          );
        })}
      </div>

      <footer className="mock-premium-leaderboard-footer">
        <span><FaShieldAlt /><strong>Practice only</strong><small>No wallet or production leaderboard data is changed.</small></span>
        <span><FaBolt /><strong>Instant ranking</strong><small>Your score updates from the existing local mock calculation.</small></span>
        <span><FaChevronRight /><strong>Run it again</strong><small>Adjust the round card above to chase the lead.</small></span>
      </footer>
    </section>
  );
};

export default MockLeaderboard;
