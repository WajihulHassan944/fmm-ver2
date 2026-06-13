import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { getWinnerDetails } from '../../CustomFunctions/winnerUtils';

const AdminPredictions = ({ matchId, filter }) => {
  
  const [showRWPopup, setShowRWPopup] = useState(false);
  const [showKOPopup, setShowKOPopup] = useState(false);
  const [selectedRWValue, setSelectedRWValue] = useState(null);
  const [selectedKOValue, setSelectedKOValue] = useState(null);
  const [shadowMatches, setShadowMatches] = useState([]);
  const matches = useSelector((state) => state.matches.data);

  useEffect(() => {
    if (filter !== 'normal') {
      const fetchShadowMatch = async () => {
        try {
          const response = await fetch(`https://fantasymmadness-game-server-three.vercel.app/shadow`);
          const shadowData = await response.json();
          setShadowMatches(shadowData);
        } catch (error) {
          console.error('Error fetching shadow match data:', error);
        }
      };
      fetchShadowMatch();
    }
  }, [filter]);

  let match;
  if (filter === 'shadowTemplate') {
    match = shadowMatches.find((m) => m._id === matchId);
  } else {
    match = matches.find((m) => m._id === matchId);
  }

  
  const [round, setRound] = useState(1); // Start with round 1
  const [showVideoUrlPopup, setShowVideoUrlPopup] = useState(true); // Show popup on load
  const [videoUrl, setVideoUrl] = useState(''); // Store input value

  // Boxing stats
  const initialBoxingStats = {
    HP: 0,
    BP: 0,
    TP: 0,
    RW: 0,
    RL: 0,
    KO: 0,
    SP: 0,
  };

  // MMA stats
  const initialMMAStats = {
    ST: 0,
    KI: 0,
    KN: 0,
    EL: 0,
   RW: 0,
    RL: 0,
    KO: 0,
    SP: 0,
  };
  const [fighterOneStats, setFighterOneStats] = useState(initialBoxingStats); // Default initialization
  const [fighterTwoStats, setFighterTwoStats] = useState(initialBoxingStats); // Default initialization
  
  useEffect(() => {
    if (match) {
      const initialStats = match.matchCategory === 'boxing' ? initialBoxingStats : initialMMAStats;
      setFighterOneStats(initialStats);
      setFighterTwoStats(initialStats);
    }
  }, [match]);
    const [roundScores, setRoundScores] = useState([]);
  const computeFighterTwoStats = () => {
    if (match?.matchCategory === 'boxing') {
      return {
        ...fighterTwoStats,
        RL: fighterOneStats.RW === 100 ? 25 : 100,
        SP: fighterOneStats.KO === 500 ? 25 : 500,
        RW: fighterOneStats.RW === 100 ? 25 : 100,
        KO: fighterOneStats.KO === 500 ? 25 : 500,
      };
    } else {
      return {
        ...fighterTwoStats,
        RL: fighterOneStats.RW === 100 ? 25 : 100,
        SP: fighterOneStats.KO === 500 ? 25 : 500,
      };
    }
  };



  const handleRWSelect = (value) => {
    setSelectedRWValue(value);
    setFighterOneStats((prevStats) => {
      const newStats = { ...prevStats, RW: value };
      if (match.matchCategory === 'boxing') {
        newStats.RL = value === 100 ? 25 : 100;
      }
      return newStats;
    });
    setShowRWPopup(false);
  };

  const handleKOSelect = (value) => {
    setSelectedKOValue(value);
    setFighterOneStats((prevStats) => {
      const newStats = { ...prevStats, KO: value };
      if (match.matchCategory === 'boxing') {
        newStats.SP = value === 500 ? 25 : 500;
      }
      return newStats;
    });
    setShowKOPopup(false);
  };

  const Popup = ({ isVisible, onClose, onSelect, stat }) => {
    if (!isVisible) return null;

    return (
      <div className="popup">
        <h3>Select value for Fighter A</h3>
        {stat === 'RW' && (
          <>
            <button onClick={() => { onSelect(100); onClose(); }}>RW</button>
            <button onClick={() => { onSelect(25); onClose(); }}>RL</button>
          </>
        )}
        {stat === 'KO' && (
          <>
            <button onClick={() => { onSelect(500); onClose(); }}>KO</button>
            <button onClick={() => { onSelect(25); onClose(); }}>SP</button>
          </>
        )}
      </div>
    );
  };

  const handleButtonClick = (fighter, stat) => {
    if (stat === 'RW') {
      setShowRWPopup(true);
      return;
    }
    if (stat === 'KO') {
      setShowKOPopup(true);
      return;
    }
    if (stat === 'TP') {
      
      return;
    }

    // Logic for incrementing stats
    const updateStats = (stats, stat) => {
      const newStats = { ...stats, [stat]: stats[stat] + 1 };
      if (match.matchCategory === 'boxing' && (stat === 'HP' || stat === 'BP')) {
        newStats.TP = newStats.HP + newStats.BP;
      }
      return newStats;
    };

    if (fighter === 'one') {
      setFighterOneStats((prevStats) => updateStats(prevStats, stat));
    } else if (fighter === 'two') {
      setFighterTwoStats((prevStats) => updateStats(prevStats, stat));
    }
  };
  
  
  const handleSave = async () => {
    const payload = {
      fighterOneStats: { ...fighterOneStats, roundNumber: round },
      fighterTwoStats: { ...computeFighterTwoStats(), roundNumber: round },
    };
    console.log(payload);
  
    const saveRoundResultsPromise = new Promise(async (resolve, reject) => {
      try {
        const apiUrl = filter === 'normal'
          ? `https://fantasymmadness-game-server-three.vercel.app/match/addRoundResults/${matchId}`
          : `https://fantasymmadness-game-server-three.vercel.app/shadow/addShadowRoundResults/${matchId}`;
  
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });
  
        const result = await response.json();
  
        if (response.ok) {
          setRoundScores((prevScores) => {
            const newScores = [...prevScores];
            newScores[round - 1] = { fighterOneStats, fighterTwoStats };
            return newScores;
          });
  
          if (round < match.maxRounds) {
            setFighterOneStats(match.matchCategory === 'boxing' ? initialBoxingStats : initialMMAStats);
            setFighterTwoStats(match.matchCategory === 'boxing' ? initialBoxingStats : initialMMAStats);
            setRound(round + 1);
          }
          resolve(); // Resolve the promise on success
        } else {
          console.error('Error saving round results:', result.message);
          reject(new Error('Error saving round results.')); // Reject if response isn't ok
        }
      } catch (error) {
        console.error('Network error:', error);
        reject(new Error('Network error while saving round results.')); // Reject on network error
      }
    });
  
    // Use toast.promise to show pending, success, and error states
    toast.promise(saveRoundResultsPromise, {
      pending: `Saving results for Round ${round}...`,
      success: `Your prediction for Round ${round} has been submitted 👌`,
      error: {
        render({ data }) {
          // `data` contains the error object thrown in the promise reject
          return data.message || 'Failed to save round results';
        }
      }
    });
  };
  
  const handlePrev = () => {
    if (round > 1) {
      setRound((prevRound) => {
        const newRound = prevRound - 1;
        const prevScores = roundScores[newRound - 1];
        if (prevScores) {
          setFighterOneStats(prevScores.fighterOneStats);
          setFighterTwoStats(prevScores.fighterTwoStats);
        }
        return newRound;
      });
    }
  };

  const handleNext = () => {
    if (round < match.maxRounds) {
      setRound((prevRound) => {
        const newRound = prevRound + 1;
        const nextScores = roundScores[newRound - 1];
        if (nextScores) {
          setFighterOneStats(nextScores.fighterOneStats);
          setFighterTwoStats(nextScores.fighterTwoStats);
        } else {
          setFighterOneStats(match.matchCategory === 'boxing' ? initialBoxingStats : initialMMAStats);
          setFighterTwoStats(match.matchCategory === 'boxing' ? initialBoxingStats : initialMMAStats);
        }
        return newRound;
      });
    }
  };

  

  const handleFinishFight = async () => {
    const endpoint =
      filter === 'normal'
        ? `https://fantasymmadness-game-server-three.vercel.app/finishMatch/${matchId}`
        : `https://fantasymmadness-game-server-three.vercel.app/finishShadow/${matchId}`;

    const finishFightPromise = new Promise(async (resolve, reject) => {
      try {
        const response = await fetch(endpoint, {
          method: 'POST',
        });

        const result = await response.json();
        if (response.ok) {
          console.log('Match status updated to Finished:', result.match);
          resolve(); // Resolve the promise on success
        } else {
          console.error('Error finishing match:', result.message);
          reject(new Error('Error finishing match.')); // Reject on error response
        }
      } catch (error) {
        console.error('Network error:', error);
        reject(new Error('Network error while finishing the match.')); // Reject on network error
      }
    });

    // Use toast.promise to handle the pending, success, and error states
    toast.promise(finishFightPromise, {
      pending: 'Finishing the match...',
      success: 'The match has been finished 👌',
      error: {
        render({ data }) {
          return data.message || 'Failed to finish the match';
        }
      }
    }).then(async () => {
      // Reward the winner only if the filter is 'normal'
      if (filter === 'normal') {
        try {
          // Get the winner details
          const winnerDetails = await getWinnerDetails(matchId);
          
          // Get the pot value for the match
          const match = matches.find(m => m._id === matchId);
          const matchTokens = match?.pot;

          // Reward tokens to the winner
          if (winnerDetails && matchTokens) {
            const rewardResponse = await fetch(`https://fantasymmadness-game-server-three.vercel.app/api/reward-tokens/${winnerDetails.userId}`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                tokens: matchTokens,
                matchId: matchId,
              }),
            });

            const rewardData = await rewardResponse.json();
            if (rewardData.success) {
              toast.success('Tokens rewarded successfully!');
            } else {
              toast.error('Failed to reward tokens.');
            }
          }
        } catch (error) {
          console.error('Error rewarding tokens:', error);
          toast.error('Failed to reward tokens due to an error.');
        }
      }

      window.location.reload(); // Reload page after successful finish
    });
  };  
  
const handleVideoUrlSubmit = async (e) => {
  e.preventDefault(); // Prevent default form behavior

  if (!videoUrl) {
    toast.error('Please enter a video URL.'); // Error toast for empty input
    return;
  }

  const updateVideoPromise = new Promise(async (resolve, reject) => {
    try {
      const apiUrl = filter === 'normal'
        ? 'https://fantasymmadness-game-server-three.vercel.app/updateMatchVideo'
        : 'https://fantasymmadness-game-server-three.vercel.app/updateShadowVideo';

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          matchId,
          matchVideoUrl: videoUrl,
        }),
      });

      const result = await response.json();
      if (response.ok) {
        setShowVideoUrlPopup(false); // Close the popup after successful submission
        resolve(); // Resolve the promise on success
      } else {
        console.error('Error updating video URL:', result.message);
        reject(new Error('Error updating video URL.')); // Reject with error message
      }
    } catch (error) {
      console.error('Network error:', error);
      reject(new Error('Network error while updating video URL.')); // Reject with network error
    }
  });

  // Use toast.promise to handle the pending, success, and error states
  toast.promise(updateVideoPromise, {
    pending: 'Saving video URL...',
    success: 'Video URL added successfully 👌',
    error: {
      render({ data }) {
        // `data` contains the error object thrown in the promise reject
        return data.message || 'Failed to update video URL';
      }
    }
  });
};
  
  if(!match){
    return <p>loading.</p>;
  }
  const handlePopupClose = () => {
    setShowVideoUrlPopup(false);
  };

  

  return (
    <div className='adminPredictions'>
{showVideoUrlPopup && (
  <div className="popupPredictions">
    <button 
      onClick={handlePopupClose} 
      style={{ position: 'absolute', top: '15px', right: '15px', cursor: 'pointer', fontSize: '23px', color: '#007bff', background: 'none', border: 'none' }}
    >
      &times;
    </button>
    <h3>Please add the match video URL</h3>
    <form onSubmit={handleVideoUrlSubmit}>
      <input
        type="text"
        value={videoUrl}
        onChange={(e) => setVideoUrl(e.target.value)}
        placeholder="Enter match video URL"
        required
      />
      <button type="submit">Submit</button>
    </form>
  </div>
)}


      <h1>{match.matchType} &nbsp; &nbsp; &nbsp;{match.matchName} &nbsp; - &nbsp; {match.matchCategoryTwo ? match.matchCategoryTwo : match.matchCategory} &nbsp;&nbsp;&nbsp; Round {round}</h1>
      <div className='adminPredictionsHeader'>
        <div className='imagesWrapperAdminPredictions'>
          <div className='imgToWrap'><img src={match.fighterAImage} alt="Fighter A" /></div>
          <div className='imgToWrap'><img src={match.fighterBImage} alt="Fighter B" /></div>
        </div>
        <h2>{match.matchFighterA} -VS- {match.matchFighterB} <span className='toRemove'>- Round {round}</span></h2>

        <button className='btn-grad finishFight' onClick={handleFinishFight}>Finish Fight</button>
      </div>

      <div className='actualPredictionsWrapper'>
        <Popup
          isVisible={showRWPopup}
          onClose={() => setShowRWPopup(false)}
          onSelect={handleRWSelect}
          stat="RW"
        />
        <Popup
          isVisible={showKOPopup}
          onClose={() => setShowKOPopup(false)}
          onSelect={handleKOSelect}
          stat="KO"
        />
        <div className='actualAdminPredictions'>
          <h1 className='subHeading2'>{match.matchFighterA}</h1>
          <div className='adminPredictionsButtonsWrapper'>
            {match.matchCategory === 'boxing' ? (
              ['HP', 'BP', 'TP', 'RW', 'KO'].map((stat, index) => (
                <div key={index} className='buttonBoxWrapp'>
                  <div
                    className={`ButtonBoxAdmin makeBackgroundBlue`}
                    onClick={() => handleButtonClick('one', stat)}
                  >
                    <h1>{stat}</h1>
                  </div>
                  <h1 className='outputBox'>{fighterOneStats[stat]}</h1>
                </div>
              ))
            ) : (
              ['ST', 'KI', 'KN', 'EL', 'RW', 'KO'].map((stat, index) => (
                <div key={index} className='buttonBoxWrapp'>
                  <div
                    className={`ButtonBoxAdmin makeBackgroundBlue`}
                    onClick={() => handleButtonClick('one', stat)}
                  >
                    <h1>{stat}</h1>
                  </div>
                  <h1 className='outputBox'>{fighterOneStats[stat]}</h1>
                </div>
              ))
            )}
          </div>
        </div>

        <div className='actualAdminPredictions'>
          <h1 className='subHeading2'>{match.matchFighterB}</h1>
          <div className='adminPredictionsButtonsWrapper'>
            {match.matchCategory === 'boxing' ? (
              ['HP', 'BP', 'TP', 'RL', 'SP'].map((stat, index) => (
                <div key={index} className='buttonBoxWrapp'>
                  <div
                    className={`ButtonBoxAdmin makeBackgroundRed`}
                    onClick={() => handleButtonClick('two', stat)}
                  >
                    <h1>{stat}</h1>
                  </div>
                  <h1 className='outputBox'>{stat === 'RL' ? computeFighterTwoStats().RL : stat === 'SP' ? computeFighterTwoStats().SP : fighterTwoStats[stat]}</h1>
                </div>
              ))
            ) : (
              ['ST', 'KI', 'KN', 'EL', 'RL', 'SP'].map((stat, index) => (
                <div key={index} className='buttonBoxWrapp'>
                  <div
                    className={`ButtonBoxAdmin makeBackgroundRed`}
                    onClick={() => handleButtonClick('two', stat)}
                  >
                    <h1>{stat}</h1>
                  </div>
                  <h1 className='outputBox'>{stat === 'RL' ? computeFighterTwoStats().RL : stat === 'SP' ? computeFighterTwoStats().SP : fighterTwoStats[stat]}</h1>
               
                </div>
              ))
            )}
          </div>
        </div>

        <div className='buttonPrevNextWrap'>
          <button
            className='btn-grad'
            onClick={handlePrev}
            disabled={round === 1}
          >
            Prev
          </button>

          <button
            className='btn-grad'
            onClick={handleNext}
            disabled={round === match.maxRounds}
          >
            Next
          </button>
          <button className='btn-grad' onClick={handleSave}>
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

export default AdminPredictions;
