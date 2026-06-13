import React from 'react';
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchMatches } from '../../Redux/matchSlice';
import FightCosting from './FightCosting'
import FightLeaderboard from '../GlobalLeaderboard/FightLeaderboard';
import PurchaseTokensIntimation from './PurchaseTokensIntimation';
import FinishedFightUserBoard from '../FinishedFightUserBoard/FinishedFightUserBoard';
import { toast } from 'react-toastify';
import { useRouter } from 'next/router';

const Dashboard = () => {
  const router = useRouter();

  const dispatch = useDispatch();
  const [isOpen, setIsOpen] = useState(false);
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const matches = useSelector((state) => state.matches.data);
  const matchStatus = useSelector((state) => state.matches.status);
  const [selectedMatchId, setSelectedMatchId] = useState(null); // State to store the selected match ID
  const [completedMatchId, setCompletedMatchId] = useState(null); // State to store the selected match ID
  const [hoveredMatch, setHoveredMatch] = useState(null); // Track hovered match ID
  const [upcomingMatches, setUpcomingMatches] = useState([]);
  const [removedMatches, setRemovedMatches] = useState([]);

  const user = useSelector((state) => state.user); // Access user details from Redux store


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
    if (matchStatus === 'idle') {
      dispatch(fetchMatches());
    }
  }, [matchStatus, dispatch]);
  

  useEffect(() => {
    const today = new Date();
    const currentTime = new Date();
  
    const fetchUpcomingMatches = async () => {
      try {
        // Filter matches based on matchType
        const filteredMatches = matches.map((match) => {
          const matchDateTime = new Date(`${match?.matchDate?.split('T')[0]}T${match.matchTime}:00`);
  
          if (match.matchType === "LIVE") {
            // No blur for LIVE matches within the valid date and time range
            if (matchDateTime >= today.setHours(0, 0, 0, 0) && currentTime < matchDateTime) {
              return { ...match, blurred: false };
            }
          } else if (match.matchType === "SHADOW") {
            // Check if affiliateId and shadowFightId exist
            if (match.affiliateId && match.shadowFightId) {
              if (match.matchShadowStatus === "active") {
                return { ...match, blurred: false };
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
  
  console.log(upcomingMatches);
    
  // Check if the user data is available before rendering
  if (!user || !user.firstName) {
    return <div>Loading...</div>;
  }

  
  const handleMatchClick = (matchId) => {
    setSelectedMatchId(matchId); // Set the selected match ID
  };


  const handleCompletedMatchClick = (matchId) => {
    setCompletedMatchId(matchId); // Set the selected match ID
  };

  if (selectedMatchId) {
    const selectedMatch = matches.find((match) => match._id === selectedMatchId);
    if (!selectedMatch) {
      return (
        <>
          <button onClick={() => setSelectedMatchId(null)}>← Back</button>
          <div>Selected match not found.</div>
        </>
      );
    }
  
    if (selectedMatch && user.tokens >= selectedMatch.matchTokens) {
      return (
        <>
         <i className="fa fa-arrow-circle-left dashboard-back-arrow dashboard-arrow-circle" aria-hidden="true" onClick={() => setSelectedMatchId(null)}></i>

   <FightCosting matchId={selectedMatchId} />
        </>
      );
    } else {
      return (
        <>
           <i className="fa fa-arrow-circle-left dashboard-arrow-circle" aria-hidden="true" onClick={() => setSelectedMatchId(null)}></i>

 <PurchaseTokensIntimation matchId={selectedMatchId} />
        </>
      );
    }
  }
 
  if (completedMatchId) {
    const matchCom = matches.find((match) => match._id === completedMatchId);
    if (!matchCom) {
      return (
        <>
          <button onClick={() => setCompletedMatchId(null)}>← Back</button>
          <div>Completed match not found.</div>
        </>
      );
    }
  
    if (matchCom && matchCom.matchStatus === "Ongoing") {
      return (
        <>
           <i className="fa fa-arrow-circle-left dashboard-arrow-circle" aria-hidden="true" onClick={() => setCompletedMatchId(null)}></i>
         <FightLeaderboard matchId={completedMatchId} />
        </>
      );
    } else {
      return (
        <>
          <i className="fa fa-arrow-circle-left dashboard-arrow-circle" aria-hidden="true" onClick={() => setCompletedMatchId(null)}></i>

      <FinishedFightUserBoard matchId={completedMatchId} />
        </>
      );
    }
  }
  




  function getRemainingTime(matchDate, matchTime) {
    const [year, month, day] = matchDate.split('T')[0].split('-');
    const [hours, minutes] = matchTime?.split(':');
  
    const matchDateTime = new Date(`${year}-${month}-${day}T${hours}:${minutes}`);
    
    // Get the current time
    const now = new Date();
    
    // Calculate the difference in milliseconds
    const diffMs = matchDateTime - now;
    
    // Convert the difference to hours and minutes
    const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    // Determine if the match has started
    const hasStarted = diffMs <= 0;
    
    return {
      diffHrs: hasStarted ? 0 : diffHrs,
      diffMins: hasStarted ? 0 : diffMins,
      hasStarted,
    };
  }
  const completedMatches = matches.filter((match) => {
    const hasSubmittedPrediction = match.userPredictions && 
      match.userPredictions.some(prediction => 
        prediction.userId && user._id && 
        prediction.userId.toString() === user._id.toString() && 
        prediction.predictionStatus === 'submitted'
      );
    return hasSubmittedPrediction;
  });
  
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
        window.location.reload();
        // Optionally, refresh or update the UI
      } else {
        alert(data.message);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };
  
  const openPopup = () => setIsOpen(true);
  const closePopup = () => {
    setIsOpen(false);
    setDescription("");
  };
  const handleSubmit = async () => {
    if (!description.trim()) {
      alert("Description cannot be empty!");
      return;
    }
  
    setIsSubmitting(true);
  
    const testimonialData = {
      author: user.firstName,
      description,
    };
  
    const userId = user._id;
  
    try {
      const response = await fetch("https://fantasymmadness-game-server-three.vercel.app/testimonials", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId, ...testimonialData }),
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to submit testimonial");
      }
  
      alert("Testimonial submitted successfully!");
      closePopup();
      window.location.reload();
    } catch (error) {
      console.error(error.message);
      alert("Failed to submit testimonial.");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className='userdashboard'>
     <i
        className="fa fa-arrow-circle-left dashboard-arrow-circle"
        aria-hidden="true"
        onClick={() => router.push(-1)} // Go back to the previous page
      ></i>
   
      <div className='member-header'>
        <div className='member-header-image'>
          <img src={user.profileUrl} alt={user.firstName} data-aos="zoom-in" />
        </div>
        <h3 data-aos="zoom-in"><span className='toRemove'>Member Name: </span>{user.firstName} {user.lastName}</h3>
              <h3 data-aos="zoom-in"><span className='toRemove'>Current </span>Plan: {user.currentPlan}</h3>
      </div>

      <div className='fightwalletWrap' onClick={() => router.push('/checkout')}>
        <div className='fightWallet' data-aos="zoom-in">
          <h1><i className="fa fa-shopping-bag" aria-hidden="true"></i> Fight Wallet</h1>
          <h2>Tokens Remaining: <span>{user.tokens}</span></h2>
        </div>
      </div>

      <div className='fightsWrap'>
      <div className='upcomingFights fightscontainer'>
  <h1 className='fightsheadingone'>UPCOMING / ACTIVE FIGHTS</h1>
  {upcomingMatches.length > 0 ? (
          // Filter the matches to exclude removed matches
          upcomingMatches.filter(match => !removedMatches.includes(match._id)).length > 0 ? (
            upcomingMatches.map((match) => (
              !removedMatches.includes(match._id) && ( // Check if match._id is NOT in removedMatches
                <div className='fightItem' key={match._id} onMouseEnter={() => setHoveredMatch(match._id)} onMouseLeave={() => setHoveredMatch(null)}>
                  {hoveredMatch === match._id && (
                    <button className="removeButton" onClick={() => handleRemoveMatch(match._id)}>
                      Remove from dashboard
                    </button>
                  )}
                  
                  {/* Handle timezone conversion for match date and time */}
                  <div className={`fightersImages ${match.blurred ? 'blurred' : ''}`}>
                    <div className='fighterOne'>
                      <img src={match.fighterAImage} alt={match.matchFighterA} />
                    </div>
                    <div className='fighterTwo'>
                      <img src={match.fighterBImage} alt={match.matchFighterB} />
                    </div>
                  </div>
                  
                  <div className='fightItemOne'>
                    <div className={`transformed-div ${match.blurred ? 'blurred' : ''}`}>
                      <h1 className='transformedFighterNames'>{match.matchFighterA} -VS- {match.matchFighterB}</h1>
                    </div>
                    <div className="transformed-div-two">
                      <div className='transformed-div-two-partOne'>
                        <h1>{match.matchCategoryTwo ? match.matchCategoryTwo : match.matchCategory}</h1>
                        {/* Convert match time to US timezone */}
                        </div>
                      <div className='transformed-div-two-partTwo'>
                        {/* Convert match date to US timezone */}
                        <p>
                        {match.matchDate?.split('T')[0]}
                        </p>
                        <h1>{match.matchType}</h1>
                      </div>
                    </div>
                  </div>
                  
                  <div className='fightItemTwo'>
                    <div className="transformed-div-three">
                      <p>{match.matchDescription}</p>
                    </div>
                    <div className="transformed-div-four">
                      <h1>Players</h1>
                      <p>{match.userPredictions.length}</p>
                    </div>
                  </div>    
                </div>
              )
            ))
          ) : (
            <p className='noMatch'>No fights</p> // Message when no fights are available
          )
        ) : (
          <p className='noMatch'>No upcoming matches</p>
        )}
</div>


<div className='completedFights fightscontainer'>
  <h1 className='fightsheadingtwo'>YOUR COMPLETED FIGHTS</h1>

  {completedMatches.length > 0 ? (
  completedMatches.filter(match => !removedMatches.includes(match._id)).length > 0 ? (
    completedMatches.map((match) => {
      if (!removedMatches.includes(match._id)) { // Check if match._id is NOT in removedMatches
        let diffHrs, diffMins, hasStarted;

        if (match.matchType === "LIVE") {
          const remainingTime = getRemainingTime(match.matchDate, match.matchTime);
          diffHrs = remainingTime.diffHrs;
          diffMins = remainingTime.diffMins;
          hasStarted = remainingTime.hasStarted;
        }

        return (           <div className="fightItem" key={match._id} onClick={() => handleCompletedMatchClick(match._id)} onMouseEnter={() => setHoveredMatch(match._id)} onMouseLeave={() => setHoveredMatch(null)}>
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
                    <h1>{new Date(`1970-01-01T${match.matchTime}:00`).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })} est</h1>
                  </div>
                  {match.matchType === "LIVE" ? (
  <div className='transformed-div-two-partTwo'>
    <p style={{ marginLeft: '-15px' }}>
      {hasStarted
        ? "Fight has started"
        : `Begins in ${diffHrs} H ${diffMins} M`}
    </p>
  </div>
) : (
  <div className='transformed-div-two-partTwo'>
    <p style={{ marginLeft: '-15px' }}>
      Shadow Fight
    </p>
  </div>

)}


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
                      <div className='transformedDivBox'>{match.matchCategoryTwo ? match.matchCategoryTwo : match.matchCategory}</div>
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
          let diffHrs, diffMins, hasStarted;

          if (match.matchType === "LIVE") {
            const remainingTime = getRemainingTime(match.matchDate, match.matchTime);
            diffHrs = remainingTime.diffHrs;
            diffMins = remainingTime.diffMins;
            hasStarted = remainingTime.hasStarted;
          }

          return (

              <div
                className='fightItem'
                key={match._id}
                onClick={() => {
                  if (match.matchType === "SHADOW" && match.blurred) {
                    toast.error("Affiliate criteria has not been met for this SHADOW match.");
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
                  <div className="transformed-div-two-partOne">
  <h1>
    {new Date(`1970-01-01T${match.matchTime}:00`).toLocaleTimeString([], { 
      hour: "2-digit", 
      minute: "2-digit", 
      hour12: true 
    })}{" "} 
    est &nbsp;&nbsp;
    {match.matchTokens === null && (
      <span className="blink-text" style={{ color: "green" }}>
        Free
      </span>
    )}
  </h1>
</div>
   {match.matchType === "LIVE" ? (
  <div className='transformed-div-two-partTwo'>
    <p style={{ marginLeft: '-15px' }}>
      {hasStarted
        ? "Fight has started"
        : `Begins in ${diffHrs} H ${diffMins} M`}
    </p>
  </div>
) : (
  <div className='transformed-div-two-partTwo'>
    <p style={{ marginLeft: '-15px' }}>
      Shadow Fight
    </p>
  </div>

)}
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

      {isOpen && (
        <div className="popup-overlay-dashboard">
          <div className="popup-dashboard">
            <h2>Submit Your Testimonial</h2>
            <textarea
              placeholder="Enter your testimonial..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            ></textarea>
            <div className="popup-actions-dashboard">
              <button onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting ? "Submitting..." : "Submit"}
              </button>
              <button onClick={closePopup}>Cancel</button>
            </div>
          </div>
        </div>
      )}
  {(!user.hasSubmittedTestimonial &&     <div className='shareYourExperience' onClick={openPopup}>
        <i className="fa fa-star"></i>
        <h1>Share your experience</h1>
      </div> )}
    </div>
  )
}

export default Dashboard;
