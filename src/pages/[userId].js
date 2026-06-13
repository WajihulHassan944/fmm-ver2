import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter } from 'next/router';
import useLeaderboardData from '@/CustomFunctions/useLeaderboardData';
import { fetchMatches } from '@/Redux/matchSlice';
import PublicFightLeaderboard from '@/Components/UserProfile/PublicFightLeaderboard';
const PublicProfile = () => {
    const dispatch = useDispatch();
    const matches = useSelector((state) => state.matches.data);
    const matchStatus = useSelector((state) => state.matches.status);
    const [completedMatchId, setCompletedMatchId] = useState(null);
  
    const [user, setUser] = useState({}); // Access user details from Redux store
  
    // Use your custom hook to get leaderboard data
    const { leaderboard } = useLeaderboardData(matches);
   
    const router = useRouter();
    const { userId } = router.query;
   
    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const response = await fetch('https://fantasymmadness-game-server-three.vercel.app/users');
                const data = await response.json();
                
                // Find the user by userId from the URL
                const foundUser = data.find((user) => user._id === userId);
                
                if (foundUser) {
                    setUser(foundUser); // Store the found user details in state
                }
            } catch (error) {
                console.error('Error fetching user data:', error);
            }
        };

        fetchUserData();
    }, [userId]);


    useEffect(() => {
      if (matchStatus === 'idle') {
        dispatch(fetchMatches());
      }
    }, [matchStatus, dispatch]);
  
    if (!user || !user.firstName) {
      return <div>Loading...</div>;
    }
  
  
    const handleCompletedMatchClick = (matchId) => {
      setCompletedMatchId(matchId);
    };
  const userFullName = `${user.firstName} ${user.lastName}`;
  // Check the match status and render the appropriate component
  if (completedMatchId) {
      return <PublicFightLeaderboard matchId={completedMatchId} name={userFullName} plan={user.currentPlan} profileUrl={user.profileUrl}  />;
   }
  
    const today = new Date();
    const upcomingMatches = matches.filter((match) => new Date(match.matchDate) > today);
  
    const getRemainingTime = (matchDate, matchTime) => {
      const [year, month, day] = matchDate?.split('T')[0].split('-');
      const [hours, minutes] = matchTime.split(':');
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
  
    return (
        <div className='publicProfileWrapper'>
      <div className='userdashboard yourFightsWrapper'>
        <div className='member-header'>
          <div className='member-header-image'>
            <img src={user.profileUrl} alt="Logo" />
          </div>
          <h3>Member Name: <span style={{color:'crimson'}}>{user.firstName} {user.lastName}</span></h3>
          <h3>Current plan: {user.currentPlan}</h3>
        </div>
      
        <div className='fightwalletWrap'>
          <div className='totalPoints'>
            <h1>Total Points : <span style={{color:"#38b90c"}}>{totalPoints}</span></h1>
          </div>
            
       
  </div>
  
  
  
  
  
  
  
  
  
  
  
  
  <div className='fightsWrap'>
  
  
  <div className='completedFights fightscontainer'>
    <h1 className='fightsheadingtwo'>{user.firstName}'s COMPLETED FIGHTS</h1>
  
    {completedMatches.length > 0 ? (
      completedMatches.map((match) => {
        const { diffHrs, diffMins, hasStarted } = getRemainingTime(match.matchDate, match.matchTime);
  
        return (
          <div className="fightItem" key={match._id}  onClick={() => handleCompletedMatchClick(match._id)}>
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
                <h1>{match.matchFighterA} -VS- {match.matchFighterB}</h1>
              </div>
              <div className="transformed-div-two">
                <div className='transformed-div-two-partOne'>
                  <h1>{new Date(`1970-01-01T${match.matchTime}:00`).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })} est</h1>
                </div>
                <div className='transformed-div-two-partTwo'>
                  <p style={{marginLeft:'-15px'}}>
                    {hasStarted
                      ? "Fight has started"
                      : `Begins in ${diffHrs} hours ${diffMins} mins`}
                  </p>
                </div>
              </div>
            </div>
            <div className='fightItemTwo'>
              <div className="transformed-three">
                <div className='transformedDivBox'>HP</div>
                <div className='transformedDivBox'>BP</div>
                <div className='transformedDivBox'>TP</div>
                <div className='transformedDivBox'>RW</div>
                <div className='transformedDivBox'>KO</div>
                <div className='transformedDivBox'>{match.matchCategoryTwo ? match.matchCategoryTwo : match.matchCategory}  {match.matchStatus} </div>
              </div>
              <div className="transformed-div-four">
                <h1>Players</h1>
                <p>{match.userPredictions.length}</p>
              </div>
            </div>
            <div className="transformed-five">
              <div className='transformedDivBox'>HP</div>
              <div className='transformedDivBox'>BP</div>
              <div className='transformedDivBox'>TP</div>
              <div className='transformedDivBox'>RW</div>
              <div className='transformedDivBox'>KO</div>
            </div>
          </div>
        );
      })
    ) : (
      <p className='noMatch'>No completed matches</p>
    )}
  </div>
  
  
  
  
  <div className='pendingFights fightscontainer'>
    <h1 className='fightsheadingthree'>{user.firstName}'s Upcoming Fights</h1>
  
    {upcomingMatches.length > 0 ? (
      // Filter matches where user predictions are not submitted
      upcomingMatches
        .filter((match) =>
          match.userPredictions &&
          !match.userPredictions.some(prediction =>
            prediction.userId === user._id && prediction.predictionStatus === 'submitted'
          )
        )
        .length > 0 ? (
          // Map over filtered matches
          upcomingMatches
            .filter((match) =>
              match.userPredictions &&
              !match.userPredictions.some(prediction =>
                prediction.userId === user._id && prediction.predictionStatus === 'submitted'
              )
            )
            .map((match) => {
              const { diffHrs, diffMins, hasStarted } = getRemainingTime(match.matchDate, match.matchTime);
  
              return (
                <div className="fightItem" key={match._id} >
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
                      <h1>{match.matchFighterA} -VS- {match.matchFighterB}</h1>
                    </div>
                    <div className="transformed-div-two">
                      <div className='transformed-div-two-partOne'>
                        <h1>{new Date(`1970-01-01T${match.matchTime}:00`).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })} est</h1>
                      </div>
                      <div className='transformed-div-two-partTwo'>
                        <p style={{ marginLeft: '-15px' }}>
                          {hasStarted
                            ? "Fight has started"
                            : `Begins in ${diffHrs} hours ${diffMins} mins`}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className='fightItemTwo'>
                    <div className="transformed-three">
                      <div className='transformedDivBox'>HP</div>
                      <div className='transformedDivBox'>BP</div>
                      <div className='transformedDivBox'>TP</div>
                      <div className='transformedDivBox'>RW</div>
                      <div className='transformedDivBox'>KO</div>
                      <div className='transformedDivBox'>{match.matchCategoryTwo ? match.matchCategoryTwo : match.matchCategory} {match.matchStatus} </div>
                    </div>
                    <div className="transformed-div-four">
                      <h1>Players</h1>
                      <p>{match.userPredictions.length}</p>
                    </div>
                  </div>
                  <div className="transformed-five">
                    <div className='transformedDivBox'>HP</div>
                    <div className='transformedDivBox'>BP</div>
                    <div className='transformedDivBox'>TP</div>
                    <div className='transformedDivBox'>RW</div>
                    <div className='transformedDivBox'>KO</div>
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
      </div>
  
    )
  }
  

export default PublicProfile
