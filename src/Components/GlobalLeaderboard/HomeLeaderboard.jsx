import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import useLeaderboardData from '../../CustomFunctions/useLeaderboardData';
import Link from "next/link";
import { fetchMatches } from '../../Redux/matchSlice';

const HomeLeaderboard = () => {
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
      <div className='homeLeaderboardItem' key={user._id}>
        <div className='home-leaderboard-item-image'>
          <img src={user.profileUrl || "https://res.cloudinary.com/dqi6vk2vn/image/upload/v1744519663/home/dpwqg3n2k6xljperunif.png"} alt={user.firstName} />
        </div>
        <div className='home-leaderboard-userdata'>
        
          {matches.length > 0 && user.matchId ? (
            (() => {
              const match = matches.find(match => match._id === user.matchId);
              if (match) {
                const formattedDate = match.matchDate.split("T")[0]; // Splitting the date and time
                return (
                  <>
                    <h1 className='home-leaderboard-fighters'>{match.matchFighterA} VS {match.matchFighterB}</h1>
                    <h2 className='home-leaderboard-date'>Match: {match.matchName} &nbsp;&nbsp;{formattedDate}</h2>
                   
                  </>
                );
              } else {
                return <h1>No Match Found</h1>;
              }
            })()
          ) : (
            <h1>N/A</h1>
          )}
          <h1 className='home-leaderboard-names' style={{marginTop:'10px'}}>{user.firstName} <span className='toRemove'>{user.lastName}</span></h1>
          <h1 className='home-leaderboard-points'>Points {user.totalPoints}</h1>
          <h1 className='home-leaderboard-points'>#{index + 1}</h1>
  
          <div className='home-leaderboard-buttons'>
            <Link href="/auth?mode=login&role=player" ><button>Login</button></Link>
            <Link href="/auth?mode=signup&role=player" ><button>Sign Up Now!</button></Link>
            
          </div>
        </div>
      </div>
    ));
  };
  

  return (
    <div className='homeLeaderboard'>
    <div className='background-video'>
  <iframe
    src="https://www.youtube.com/embed/0WDWDKATpTA?autoplay=1&loop=1&playlist=0WDWDKATpTA&controls=0&modestbranding=1&rel=0&fs=0&mute=1"
    title="YouTube video player"
    frameBorder="0"
    allow="autoplay; encrypted-media; picture-in-picture"
    allowFullScreen
  ></iframe>
</div>

       <div className='globalss'>
        <h1 className='home-leaderboard-heading'>Global Leader Board</h1>
        <h2 className='home-leaderboard-subheading'>Players - <span>{playerCount}</span></h2>

    {refreshed && (
        <p className='refreshingLeaderboard'>Refreshing Leaderboard...</p>
    )}
       

        <div className='homeLeaderboardItemsWrap'>
          {renderLeaderboardItems()}
        </div>
        </div>
      </div>
  );
};


export default HomeLeaderboard
