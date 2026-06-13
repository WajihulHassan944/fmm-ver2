'use client';

import React, { useMemo } from 'react';

const MockLeaderboard = ({ totalPoints }) => {
  const otherPlayers = [
    { name: 'Ali Rehman', totalPoints: 250 },
    { name: 'Sofia Khan', totalPoints: 220 },
    { name: 'Zayan Malik', totalPoints: 180 },
  ];

  const currentUser = { name: 'Mock Player', totalPoints };

  const sortedLeaderboard = useMemo(() => {
    const combined = [...otherPlayers, currentUser];
    return combined
      .sort((a, b) => b.totalPoints - a.totalPoints)
      .map((player, index) => ({
        ...player,
        rank: index + 1,
        isCurrentUser: player.name === 'Mock Player',
      }));
  }, [totalPoints]);

  return (
    <div className="lb2-nobg-container">
      <div className="lb2-leaderboard">
        <h1 className="lb2-title">LEADERBOARD</h1>
        <div className="lb2-header-row">
          <span>POS</span>
          <span>NAME</span>
          <span>SCORE</span>
        </div>

        {sortedLeaderboard.map((user) => (
          <div
            key={user.rank}
            className={`lb2-row ${user.isCurrentUser ? 'lb2-highlight' : ''}`}
          >
            <span className="lb2-rank">{user.rank}</span>
            <span className="lb2-name">{user.name}</span>
            <span className="lb2-score">{user.totalPoints}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MockLeaderboard;
