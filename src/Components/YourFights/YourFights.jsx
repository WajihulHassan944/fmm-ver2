import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchMatches } from '../../Redux/matchSlice';
import FightLeaderboard from '../GlobalLeaderboard/FightLeaderboard';
import FightCosting from '../Dashboard/FightCosting';
import useLeaderboardData from '../../CustomFunctions/useLeaderboardData'; // Import your custom hook
import { useRouter } from 'next/router';

const YourFights = () => {
  const dispatch = useDispatch();
  const matches = useSelector((state) => state.matches.data);
  const matchStatus = useSelector((state) => state.matches.status);
  const [selectedMatchId, setSelectedMatchId] = useState(null);
  const [completedMatchId, setCompletedMatchId] = useState(null);
  const [upcomingMatches, setUpcomingMatches] = useState([]);
  const [hoveredMatch, setHoveredMatch] = useState(null); // Track hovered match ID
  const [removedMatches, setRemovedMatches] = useState([]);
  const user = useSelector((state) => state.user); // Access user details from Redux store
  const router = useRouter();

  // Use your custom hook to get leaderboard data
  const { leaderboard } = useLeaderboardData(matches);

  useEffect(() => {
    if (matchStatus === 'idle') {
      dispatch(fetchMatches());
    }
  }, [matchStatus, dispatch]);



  useEffect(() => {
    const fetchRemovedMatches = async () => {
      try {
        const response = await fetch('https://fantasymmadness-game-server-three.vercel.app/users/removed-matches');
        const data = await response.json();
        
        // Filter the data for the current user's userId
        const userMatches = data.filter(item => item.userId === user._id);
        
        // Assuming you want to store the removedMatchesIds array for the matched user
        if (userMatches.length > 0) {
          setRemovedMatches(userMatches[0].removedMatchesIds);
        }
      } catch (error) {
        console.error('Error fetching removed matches:', error);
      }
    };

    fetchRemovedMatches();
  }, [user._id]); // Run the effect when user._id changes


  useEffect(() => {
    const today = new Date();
    const currentTime = new Date();
  
    const fetchUpcomingMatches = async () => {
      try {
        // Fetch all affiliates
        const affiliateResponse = await fetch("https://fantasymmadness-game-server-three.vercel.app/affiliates");
        const affiliates = await affiliateResponse.json();
  
        // Fetch all users
        const usersResponse = await fetch("https://fantasymmadness-game-server-three.vercel.app/users");
        const users = await usersResponse.json();
  
        // Filter matches based on matchType
        const filteredMatches = matches.map((match) => {
          const matchDateTime = new Date(`${match.matchDate?.split('T')[0]}T${match.matchTime}:00`);
  
          if (match.matchType === "LIVE") {
            // Only check date and time for LIVE matches
            if (matchDateTime >= today.setHours(0, 0, 0, 0) && currentTime < matchDateTime) {
              return { ...match, blurred: false }; // No blurring for LIVE matches
            }
          } else if (match.matchType === "SHADOW") {
            // Find the affiliate by affiliateId for SHADOW matches
            const affiliate = affiliates.find(a => a._id === match.affiliateId);
            if (affiliate) {
              const usersJoinedIds = affiliate.usersJoined.map(user => user.userId);
  
              // Filter users who meet token requirement
              const eligibleUsers = users.filter(user => usersJoinedIds.includes(user._id) && parseInt(user.tokens, 10) >= match.matchTokens);
              console.log(eligibleUsers.length);
  
              // Calculate the required number of users
              const requiredUsers = match.pot / match.matchTokens;
  
              // If eligible users are fewer than required, blur the match
              const isBlurred = eligibleUsers.length < requiredUsers;
  
              if (matchDateTime >= today.setHours(0, 0, 0, 0) && currentTime < matchDateTime) {
                return { ...match, blurred: isBlurred }; // Add blur condition for SHADOW matches
              }
            }
          }
          return null;
        }).filter(Boolean); // Filter out null values where no condition is met
  
        // Set filtered matches
        setUpcomingMatches(filteredMatches);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };
  
    fetchUpcomingMatches();
  }, [matches]);
  


  if (!user || !user.firstName) {
    return <div>Loading...</div>;
  }

  const handleMatchClick = (matchId) => {
    setSelectedMatchId(matchId);
  };

  const handleCompletedMatchClick = (matchId) => {
    setCompletedMatchId(matchId);
  };

  if (selectedMatchId) {
      return (
        <>
         <i className="fa fa-arrow-circle-left dashboard-back-arrow dashboard-arrow-circle" aria-hidden="true" onClick={() => setSelectedMatchId(null)}
 ></i>

   <FightCosting matchId={selectedMatchId} />
        </>
      );
    }
  
 
  if (completedMatchId) {
    
      return (
        <>
           <i className="fa fa-arrow-circle-left dashboard-arrow-circle" aria-hidden="true" onClick={() => setCompletedMatchId(null)}
      ></i>
         <FightLeaderboard matchId={completedMatchId} />
        </>
      );
    } 
  

  const getRemainingTime = (matchDate, matchTime) => {
    const [year, month, day] = matchDate?.split('T')[0].split('-');
    const [hours, minutes] = matchTime?.split(':');
    const matchDateTime = new Date(`${year}-${month}-${day}T${hours}:${minutes}`);
    const now = new Date();
    const diffMs = matchDateTime - now;
    const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    const hasStarted = diffMs <= 0;

    return {
      diffHrs: hasStarted ? 0 : diffHrs,
      diffMins: hasStarted ? 0 : diffMins,
      hasStarted,
    };
  };

  const completedMatches = matches.filter((match) => {
    const hasSubmittedPrediction = match.userPredictions && 
      match.userPredictions.some(prediction => 
        prediction.userId.toString() === user._id.toString() && prediction.predictionStatus === 'submitted'
      );
    return hasSubmittedPrediction;
  });

  // Find the current user's total points from the leaderboard
  const currentUserData = leaderboard.find(player => player._id === user._id);
  const totalPoints = currentUserData ? currentUserData.totalPoints : 0;



  const handleRemoveMatch = async (matchId) => {
    try {
      const response = await fetch('https://fantasymmadness-game-server-three.vercel.app/remove-match-from-my-dashboard', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user._id, // Assuming user._id is available
          matchId,
        }),
      });
  
      const data = await response.json();
      if (response.ok) {
        alert('Match removed from dashboard successfully');
        // Optionally, refresh or update the UI
        window.location.reload();
      } else {
        alert(data.message);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };
  

  return (
    <div className='userdashboard yourFightsWrapper premium-dashboard-list'>
    <i
        className="fa fa-arrow-circle-left dashboard-arrow-circle"
        aria-hidden="true"
        onClick={() => router.push(-1)} // Go back to the previous page
      ></i>
      <div className='member-header'>
        <div className='member-header-image'>
          <img src={user.profileUrl} alt="Logo" data-aos="zoom-in" />
        </div>
        <h3 data-aos="zoom-in"><span className='toRemove'>Member Name:</span> {user.firstName} {user.lastName}</h3>
        <h3 data-aos="zoom-in"><span className='toRemove'>Current </span>Plan: {user.currentPlan}</h3>
      </div>
    
      <div className='fightwalletWrap' >
        <div className='totalPoints' data-aos="zoom-in">
          <h1>Your Total Points : <span style={{color:"#38b90c"}}>{totalPoints}</span></h1>
        </div>
          
        <div className='fightWallet' data-aos="zoom-in" onClick={() => router.push('/checkout')}>
        <h1><i className="fa fa-shopping-bag" aria-hidden="true"></i> Fight Wallet</h1>
        <h2>Tokens Remaining: <span>{user.tokens}</span></h2>
    </div>
</div>












<div className='fightsWrap'>


<div className='completedFights fightscontainer'>
  <h1 className='fightsheadingtwo'>YOUR COMPLETED FIGHTS</h1>

  {completedMatches.length > 0 ? (
    completedMatches.filter(match => !removedMatches.includes(match._id)).length > 0 ? (
      completedMatches.map((match) => {
        if (!removedMatches.includes(match._id)) { // Check if match._id is NOT in removedMatches
          let diffHrs, diffMins, hasStarted;

if (match?.matchDate && match?.matchTime) {
  ({ diffHrs, diffMins, hasStarted } = getRemainingTime(match.matchDate, match.matchTime));
}

          return (
            <div className="fightItem" key={match._id} onClick={() => handleCompletedMatchClick(match._id)} onMouseEnter={() => setHoveredMatch(match._id)} onMouseLeave={() => setHoveredMatch(null)}>
              {hoveredMatch === match._id && (
                <button className="removeButton" onClick={(e) => {
                  e.stopPropagation(); // Prevent the parent div's onClick from firing
                  handleRemoveMatch(match._id);
                }}>
                  Remove from dashboard
                </button>
              )}
              <div className='fightersImages'>
                <div className='fighterOne'>
                  <img src={match.fighterAImage} alt="Fighter One" />
                </div>
                <div className='fighterTwo'>
                  <img src={match.fighterBImage} alt="Fighter Two" />
                </div>
              </div>
              <div className='fightItemOne'>
                <div className="transformed-div">
                  <h1 className='transformedFighterNames'>{match.matchFighterA} -VS- {match.matchFighterB}</h1>
                </div>
                <div className="transformed-div-two">
                  <div className='transformed-div-two-partOne'>
                {match.matchTime && (    <h1>{new Date(`1970-01-01T${match.matchTime}:00`).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })} est</h1>
              )}      </div>
             {match.matchDate && (     <div className='transformed-div-two-partTwo'>
                    <p style={{marginLeft:'-15px'}}>
                      {hasStarted
                        ? "Fight has started"
                        : `Begins in ${diffHrs} H ${diffMins} M`}
                    </p>
                  </div>)}
                </div>
              </div>
              <div className='fightItemTwo'>
                <div className="transformed-three">
                  {match.matchCategory === "boxing" ? (
                    <>
                      <div className='transformedDivBox'>HP</div>
                      <div className='transformedDivBox'>BP</div>
                      <div className='transformedDivBox'>TP</div>
                      <div className='transformedDivBox'>RW</div>
                      <div className='transformedDivBox'>KO</div>
                      <div className='transformedDivBox'>{match.matchCategoryTwo ? match.matchCategoryTwo : match.matchCategory} </div>
                    </>
                  ) : (
                    <>
                      <div className='transformedDivBox'>ST</div>
                      <div className='transformedDivBox'>KI</div>
                      <div className='transformedDivBox'>KN</div>
                      <div className='transformedDivBox'>RW</div>
                      <div className='transformedDivBox'>KO</div>
                      <div className='transformedDivBox'>{match.matchCategoryTwo ? match.matchCategoryTwo : match.matchCategory} </div>
                    </>
                  )}
                </div>
                <div className="transformed-div-four">
                  <h1>Players</h1>
                  <p>{match.userPredictions.length}</p>
                </div>
              </div>

              <div className="transformed-five">
                {match.matchCategory === "boxing" ? (
                  <>
                    <div className='transformedDivBox'>HP</div>
                    <div className='transformedDivBox'>BP</div>
                    <div className='transformedDivBox'>TP</div>
                    <div className='transformedDivBox'>RW</div>
                    <div className='transformedDivBox'>KO</div>
                  </>
                ) : (
                  <>
                    <div className='transformedDivBox'>ST</div>
                    <div className='transformedDivBox'>KI</div>
                    <div className='transformedDivBox'>KN</div>
                    <div className='transformedDivBox'>RW</div>
                    <div className='transformedDivBox'>KO</div>
                  </>
                )}
              </div>
            </div>
          );
        }
        return null; // If the match is removed, do not render it
      })
    ) : (
      <p className='noMatch'>No fights</p> // Message when no completed fights are available
    )
  ) : (
    <p className='noMatch'>No completed matches</p>
  )}
</div>

<div className='pendingFights fightscontainer'>
  <h1 className='fightsheadingthree'>Your Pending Fights</h1>

  {upcomingMatches.length > 0 ? (
    // Filter matches where user predictions are not submitted and not removed
    upcomingMatches
      .filter(match =>
        match.userPredictions &&
        !match.userPredictions.some(prediction =>
          prediction.userId === user._id && prediction.predictionStatus === 'submitted'
        ) &&
        !removedMatches.includes(match._id) // Check if match._id is NOT in removedMatches
      )
      .length > 0 ? (
        // Map over filtered matches
        upcomingMatches
          .filter(match =>
            match.userPredictions &&
            !match.userPredictions.some(prediction =>
              prediction.userId === user._id && prediction.predictionStatus === 'submitted'
            ) &&
            !removedMatches.includes(match._id) // Check if match._id is NOT in removedMatches
          )
          .map((match) => {
            const { diffHrs, diffMins, hasStarted } = getRemainingTime(match.matchDate, match.matchTime);

            return (
              <div
                className='fightItem'
                key={match._id}
                onClick={() => {
                  if (match.matchType === "SHADOW" && match.blurred) {
                    alert("Affiliate criteria has not been met for this SHADOW match.");
                  } else {
                    handleMatchClick(match._id);
                  }
                }}
                onMouseEnter={() => setHoveredMatch(match._id)} 
                onMouseLeave={() => setHoveredMatch(null)}>
                {hoveredMatch === match._id && (
                  <button className="removeButton" onClick={(e) => {
                    e.stopPropagation(); // Prevent the parent div's onClick from firing
                    handleRemoveMatch(match._id);
                  }}>
                    Remove from dashboard
                  </button>
                )}
                <div className={`fightersImages ${match.blurred ? 'blurred' : ''}`}>
                  <div className='fighterOne'>
                    <img src={match.fighterAImage} alt="Fighter One" />
                  </div>
                  <div className='fighterTwo'>
                    <img src={match.fighterBImage} alt="Fighter Two" />
                  </div>
                </div>
                <div className='fightItemOne'>
                  <div className={`transformed-div ${match.blurred ? 'blurred' : ''}`}>
                    <h1 className='transformedFighterNames'>{match.matchFighterA} -VS- {match.matchFighterB}</h1>
                  </div>
                  <div className="transformed-div-two">
                    <div className='transformed-div-two-partOne'>
                      <h1>{new Date(`1970-01-01T${match.matchTime}:00`).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })} est</h1>
                    </div>
                    <div className='transformed-div-two-partTwo'>
                      <p style={{ marginLeft: '-15px' }}>
                        {hasStarted
                          ? "Fight has started"
                          : `Begins in ${diffHrs} H ${diffMins} M`}
                      </p>
                    </div>
                  </div>
                </div>
                <div className='fightItemTwo'>
                  <div className="transformed-three">
                    {match.matchCategory === "boxing" ? (
                      <>
                        <div className='transformedDivBox'>HP</div>
                        <div className='transformedDivBox'>BP</div>
                        <div className='transformedDivBox'>TP</div>
                        <div className='transformedDivBox'>RW</div>
                        <div className='transformedDivBox'>KO</div>
                        <div className='transformedDivBox'>{match.matchCategoryTwo ? match.matchCategoryTwo : match.matchCategory}</div>
                      </>
                    ) : (
                      <>
                        <div className='transformedDivBox'>ST</div>
                        <div className='transformedDivBox'>KI</div>
                        <div className='transformedDivBox'>KN</div>
                        <div className='transformedDivBox'>RW</div>
                        <div className='transformedDivBox'>KO</div>
                        <div className='transformedDivBox'>{match.matchCategoryTwo ? match.matchCategoryTwo : match.matchCategory} </div>
                      </>
                    )}
                  </div>
                  <div className="transformed-div-four">
                    <h1>Players</h1>
                    <p>{match.userPredictions.length}</p>
                  </div>
                </div>

                <div className="transformed-five">
                  {match.matchCategory === "boxing" ? (
                    <>
                      <div className='transformedDivBox'>HP</div>
                      <div className='transformedDivBox'>BP</div>
                      <div className='transformedDivBox'>TP</div>
                      <div className='transformedDivBox'>RW</div>
                      <div className='transformedDivBox'>KO</div>
                    </>
                  ) : (
                    <>
                      <div className='transformedDivBox'>ST</div>
                      <div className='transformedDivBox'>KI</div>
                      <div className='transformedDivBox'>KN</div>
                      <div className='transformedDivBox'>RW</div>
                      <div className='transformedDivBox'>KO</div>
                    </>
                  )}
                </div>

              </div>
            );
          })
      ) : (
        <p className='noMatch'>No pending matches</p>
      )
  ) : (
    <p className='noMatch'>No pending matches</p>
  )}
</div>












</div>
    </div>

  )
}

export default YourFights
