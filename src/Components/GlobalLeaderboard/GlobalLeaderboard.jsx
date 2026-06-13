import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import useLeaderboardData from '../../CustomFunctions/useLeaderboardData';
import { useRouter } from 'next/router';

const GlobalLeaderboard = () => {
  const [refreshed, setRefreshed] = useState(false);
  const matches = useSelector((state) => state.matches.data);
  const { leaderboard, playerCount } = useLeaderboardData(matches);
  const userLoggedIn = useSelector((state) => state.user); // Access user details from Redux store
const router = useRouter();

  useEffect(() => {
    
    const refreshLeaderboard = () => {
      setRefreshed(true);
      setTimeout(() => setRefreshed(false), 3000); // Set refreshed to true for 3 seconds
    };

    // Refresh every 3 minutes
    const interval = setInterval(() => {
      refreshLeaderboard();
    }, 180000);

    // Cleanup the interval on component unmount
    return () => clearInterval(interval);
  }, []);

  const renderLeaderboardItems = () => {
    if (leaderboard.length === 0) {
      return <p className='noMatch'>No leaderboard items available at the moment.</p>;
    }

    return leaderboard.map((user, index) => (
      <div className='leaderboardItem' key={user._id} data-aos="zoom-in">
        <div className='leaderboard-item-image'>
          <img src={user.profileUrl || "https://res.cloudinary.com/dqi6vk2vn/image/upload/v1744519663/home/dpwqg3n2k6xljperunif.png"} alt={user.firstName} />
        </div>
        <h1>{user.firstName} <span className='toRemove'>{user.lastName}</span></h1>
        <h1 className='toRemove'>RW#</h1>
        <h1 className='toRemove'>KO#</h1>
        <h1>Points {user.totalPoints}</h1>
        <h1>#{index + 1}</h1>
      </div>
    ));
  };

  return (
    <div className='fightDetails global-leaderboard'>
      <i
        className="fa fa-arrow-circle-left dashboard-arrow-circle"
        aria-hidden="true"
        onClick={() => router.push(-1)} // Go back to the previous page
      ></i>

      <div className='member-header'>
        <div className='member-header-image'>
          <img src={userLoggedIn.profileUrl} alt="Logo" data-aos="zoom-in" />
        </div>
        <h3 data-aos="zoom-in"><span className='toRemove'>Member Name - </span>{userLoggedIn.firstName} {userLoggedIn.lastName}</h3>
        <h3 data-aos="zoom-in"><span className='toRemove'>Current </span>Plan: {userLoggedIn.currentPlan}</h3>
      </div>

      <div className='fightwalletWrap' onClick={() => router.push('/checkout')}>
        <div className='fightWallet' data-aos="zoom-in">
          <h1><i className="fa fa-shopping-bag" aria-hidden="true"></i> Fight Wallet</h1>
          <h2>Tokens Remaining: <span>{userLoggedIn.tokens}</span></h2>
        </div>
      </div>

      <div className='homeThird'>
        <h1 className='thirdHeadingOne' data-aos="zoom-in">Global Leader Board</h1>
        <h2 data-aos="zoom-in">Players - <span>{playerCount}</span></h2>

        <div className='leaderboardHeading'><h3>Leaderboard</h3></div>
        <div className='controls'>
          <h5 className='active control-relative'>All time</h5>
          <h5>Last week</h5>
          <h5>Last month</h5>
          {refreshed && (
            <div className='spinner'>
              <div className='spin-circle'></div>
            </div>
          )}
        </div>

        <div className='leaderboardItemsWrap'>
          {renderLeaderboardItems()}
        </div>
      </div>
    </div>
  );
};

export default GlobalLeaderboard;
