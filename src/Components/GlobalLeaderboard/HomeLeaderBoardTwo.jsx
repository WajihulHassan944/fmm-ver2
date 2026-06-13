'use client';

import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import useLeaderboardData from '../../CustomFunctions/useLeaderboardData';
import { fetchMatches } from '../../Redux/matchSlice';
import Image from 'next/image';

const HomeLeaderboardTwo = () => {
  const dispatch = useDispatch();
  const [refreshed, setRefreshed] = useState(false);
  const matches = useSelector((state) => state.matches.data);
  const matchStatus = useSelector((state) => state.matches.status);
  const { leaderboard, playerCount } = useLeaderboardData(matches);

  useEffect(() => {
    if (matchStatus === 'idle') {
      dispatch(fetchMatches());
    }
  }, [matchStatus, dispatch]);

  useEffect(() => {
    const interval = setInterval(() => {
      setRefreshed(true);
      setTimeout(() => setRefreshed(false), 3000);
    }, 180000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="lb2-bg-container">
      <div className="lb2-leaderboard">
        <h1 className="lb2-title">LEADERBOARD</h1>
        <div className="lb2-header-row">
          <span>POS</span>
          <span>NAME</span>
          <span>SCORE</span>
        </div>

        {leaderboard.length === 0 ? (
          <p className="lb2-empty">No leaderboard items available.</p>
        ) : (
          leaderboard.map((user, index) => {
            const isCurrentUser = index === 3; // 👈 mark 4th as current for now
            return (
              <div
                key={user._id}
                className={`lb2-row ${isCurrentUser ? 'lb2-highlight' : ''}`}
              >
                <span className="lb2-rank">{index + 1}</span>
                <span className="lb2-name">
                  <Image
                    src={
                      user.profileUrl ||
                      'https://res.cloudinary.com/dqi6vk2vn/image/upload/v1744519663/home/dpwqg3n2k6xljperunif.png'
                    }
                    width={40}
                    height={40}
                    alt="fighter"
                    className="lb2-img"
                  />
                  {user.firstName}
                </span>
                <span className="lb2-score">{user.totalPoints}</span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default HomeLeaderboardTwo;
