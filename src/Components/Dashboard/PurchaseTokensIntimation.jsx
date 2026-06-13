import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux'; // Import useSelector to access Redux store
import AddTokensToWallet from '../UserProfile/AddTokensToWallet';
import { useRouter } from 'next/router';

const PurchaseTokensIntimation = ({ matchId }) => {
  const router = useRouter();
 
  const user = useSelector((state) => state.user);
  const matches = useSelector((state) => state.matches.data);

  const match = matches.find((m) => m._id === matchId);

  const [timeRemaining, setTimeRemaining] = useState({
    diffHrs: 0,
    diffMins: 0,
    diffSecs: 0,
    hasStarted: false,
  });
  const [showPredictions, setShowPredictions] = useState(false);

  useEffect(() => {
    if (!match) return;

    const calculateTimeRemaining = () => {
      const matchDateTime = new Date(`${match.matchDate?.split('T')[0]}T${match.matchTime}`);
      const now = new Date();

      const diffMs = matchDateTime - now;

      const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
      const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      const diffSecs = Math.floor((diffMs % (1000 * 60)) / 1000);

      const hasStarted = diffMs <= 0;

      setTimeRemaining({
        diffHrs: hasStarted ? 0 : diffHrs,
        diffMins: hasStarted ? 0 : diffMins,
        diffSecs: hasStarted ? 0 : diffSecs,
        hasStarted,
      });
    };

    // Calculate the initial time remaining
    calculateTimeRemaining();

    // Update the time remaining every second
    const interval = setInterval(calculateTimeRemaining, 1000);

    // Cleanup interval on component unmount
    return () => clearInterval(interval);
  }, [match]);

  if (!match) {
    return <div>Match not found</div>;
  }



  const handleMatchClick = async () => {
    setShowPredictions(true);
  };


  // Add back arrow for AddTokensToWallet component
if (showPredictions) {
  return (
    <>
      <i
        className="fa fa-arrow-circle-left dashboard-arrow-circle"
        aria-hidden="true"
        onClick={() => setShowPredictions(false)} // Go back to FightCosting
      ></i>
      <AddTokensToWallet matchId={matchId} />
    </>
  );
}


  return (
    <div className='fightCosting'>
        
    <div className='member-header'>
      <div className='member-header-image'>
        <img src={user.profileUrl} alt="Logo" />
      </div>
    
      <h3><span className='toRemove'>Member Name:</span> {user.firstName} {user.lastName}</h3>
        <h3><span className='toRemove'>Current </span>Plan: {user.currentPlan} </h3>
      </div>

    <div className='fightwalletWrap' onClick={() => router.push('/checkout')}>
      <div className='fightWallet'>
      <h1><i className="fa fa-shopping-bag" aria-hidden="true"></i> Fight Wallet</h1>
      <h2>Tokens Remaining: <span>{user.tokens}</span></h2>
  </div>
</div>


<div className='fightDetailsContainer'>
    
<div className='fightersImagesInFightDetails'>
          <div className='imgWrapFights'>
            <img src={match.fighterAImage} alt={match.matchFighterA} />
          </div>
          <h1>VS</h1>
          <div className='imgWrapFights'>
            <img src={match.fighterBImage} alt={match.matchFighterB} />
          </div>
        </div>
        <h1 className='fightTypeInFightDetails'>
          <span>{match.matchFighterA}</span> &nbsp; &nbsp; &nbsp;&nbsp;&nbsp;&nbsp; <span>{match.matchFighterB}</span>
        </h1>

        <div className='beiginningTimeFight'>
          <h1>Will Begin in - </h1>
          <p style={{ color: "#38b90c" }}>
            {timeRemaining.hasStarted
              ? "Fight has started"
              : `${timeRemaining.diffHrs}:${timeRemaining.diffMins}:${timeRemaining.diffSecs}`}
          </p>
        </div>


          <h1 className='fightTypeInFightDetails'>
          This Fight Costs <span style={{color:'violet'}}> {match.matchTokens} tokens </span> to play
          </h1>

          <h1 className='fightTypeInFightDetails'>
          You have <span style={{color:'#ffc000'}}> {user.tokens} tokens </span> in your wallet <i className="fa fa-circle" style={{color:'yellow', fontSize:'30px'}}></i>
          </h1>

          <div className='fightDetailsPot'>
              <h1>Click below to purchase tokens to play</h1>
             
          </div>

          
          <button className='btn-grad' onClick={() => handleMatchClick()} style={{width:'250px'}}>
          <i className="fa fa-circle" style={{color:'yellow'}}></i> Purchase</button>
</div>
<p className='note'>You must make predictions atleast 10 minutes before the  fight starts or they will not be used when the fight starts</p>

  </div>
  )
}

export default PurchaseTokensIntimation
