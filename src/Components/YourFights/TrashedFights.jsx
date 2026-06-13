import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchMatches } from '../../Redux/matchSlice';
import { useRouter } from 'next/router';

const TrashedFights = () => {
  const router = useRouter();
  
    const dispatch = useDispatch();
  const matches = useSelector((state) => state.matches.data);
  const matchStatus = useSelector((state) => state.matches.status);
  const [hoveredMatch, setHoveredMatch] = useState(null); 
  const [removedMatches, setRemovedMatches] = useState([]);
  const user = useSelector((state) => state.user); 
console.log(user);

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
  }, [user?._id]); // Run the effect when user._id changes



  if (!user || !user.firstName) {
    return <div>Loading...</div>;
  }


  const getRemainingTime = (matchDate, matchTime) => {
    const [year, month, day] = matchDate.split('T')[0].split('-');
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

  const handleRemoveMatch = async (matchId) => {
    try {
      const response = await fetch('https://fantasymmadness-game-server-three.vercel.app/remove-match-from-my-dashboard', {
        method: 'DELETE',
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
        alert('Match removed from trash successfully');
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
    <div className='userdashboard yourFightsWrapper'>
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
    
      <div className='fightwalletWrap' onClick={() => router.push('/checkout')}>
        <div className='totalPoints' data-aos="zoom-in">
        </div>
          
        <div className='fightWallet' data-aos="zoom-in">
        <h1><i className="fa fa-shopping-bag" aria-hidden="true"></i> Fight Wallet</h1>
        <h2>Tokens Remaining: <span>{user.tokens}</span></h2>
    </div>
</div>












<div className='fightsWrap'>


<div className='completedFights fightscontainer'>
  <h1 className='fightsheadingtwo'>YOUR TRASHED FIGHTS</h1>

  {matches.length > 0 ? (
    matches.filter(match => removedMatches.includes(match._id)).length > 0 ? (
      matches.map((match) => {
        if (removedMatches.includes(match._id)) { // Check if match._id is NOT in removedMatches
          const { diffHrs, diffMins, hasStarted } = getRemainingTime(match.matchDate, match.matchTime);

          return (
            <div className="fightItem" key={match._id}  onMouseEnter={() => setHoveredMatch(match._id)} onMouseLeave={() => setHoveredMatch(null)}>
              {hoveredMatch === match._id && (
                <button className="removeButton" onClick={(e) => {
                  e.stopPropagation(); // Prevent the parent div's onClick from firing
                  handleRemoveMatch(match._id);
                }}>
                  Remove from Trash
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
                  {match.matchCategory === "boxing" ? (
                    <>
                      <div className='transformedDivBox'>HP</div>
                      <div className='transformedDivBox'>BP</div>
                      <div className='transformedDivBox'>TP</div>
                      <div className='transformedDivBox'>RW</div>
                      <div className='transformedDivBox'>KO</div>
                      <div className='transformedDivBox'>{match.matchCategoryTwo ? match.matchCategoryTwo : match.matchCategory} {match.matchStatus}</div>
                    </>
                  ) : (
                    <>
                      <div className='transformedDivBox'>ST</div>
                      <div className='transformedDivBox'>KI</div>
                      <div className='transformedDivBox'>KN</div>
                      <div className='transformedDivBox'>RW</div>
                      <div className='transformedDivBox'>KO</div>
                      <div className='transformedDivBox'>{match.matchCategoryTwo ? match.matchCategoryTwo : match.matchCategory} {match.matchStatus}</div>
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











</div>
    </div>

  )
}


export default TrashedFights
