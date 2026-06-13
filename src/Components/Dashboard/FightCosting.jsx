import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux'; // Import useSelector to access Redux store
import MakePredictions from '../MakePredictions/MakePredictions'
import { useRouter } from 'next/router';


const FightCosting = ({ matchId }) => {
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
   
    try {
      const response = await fetch('https://fantasymmadness-game-server-three.vercel.app/api/deduct-tokens', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user._id, // Assuming user._id is available in your user state
          matchTokens: match.matchTokens, // Match token cost
        }),
      });
  
      const data = await response.json();
  
      if (response.ok) {
     
        setShowPredictions(true);
      } else {
        alert(data.message || 'Could not deduct tokens. Please try again.');
      }
    } catch (error) {
      console.error('Error in deducting tokens:', error);
      alert('An error occurred. Please try again later.');
    }
  };
    
  // Add back arrow for MakePredictions component
  if (showPredictions) {
    return (
      <>
        <i
          className="fa fa-arrow-circle-left dashboard-arrow-circle"
          aria-hidden="true"
          onClick={() => setShowPredictions(false)} // Go back to FightCosting
        ></i>
        <MakePredictions matchId={matchId} />
      </>
    );
  }

  return (
    <div className='fightCostingUpdated'>
      <div className='member-header'>
        <div className='member-header-image'>
          <img src={user.profileUrl || "https://res.cloudinary.com/dqi6vk2vn/image/upload/v1743079917/home/rtr4tmlkw82rmk1kywuc.webp"} alt="Logo" />
        </div>
        <h3><span className='toRemove'>Member Name: </span>{user.firstName} {user.lastName}</h3>
        <h3><span className='toRemove'>Current</span> Plan: {user.currentPlan} </h3>
      </div>

      <div className='fightwalletWrap' onClick={() => router.push('/checkout')}>
        <div className='fightWallet'>
          <h1><i className="fa fa-shopping-bag" aria-hidden="true"></i> Fight Wallet</h1>
          <h2>Tokens Remaining: <span>{user.tokens}</span></h2>
        </div>
      </div>

      <div className='fightDetailsContainerUpdated'>
      <h1 className='fightHeading'>
  {match.matchCategoryTwo ? `${match.matchCategoryTwo} Match` : `${match.matchCategory} Match`}
</h1>

          <h2 className='fightSubHeading'>Max: {match.maxRounds} rounds</h2>
         <div className='fightersImagesInFightDetailsUpdated'>
          <div className='imgWrapFightsUpdated'>
            <img src={match.fighterAImage} alt={match.matchFighterA} />
            <h1>{match.matchFighterA}</h1>
          </div>
         <img src="https://res.cloudinary.com/dqi6vk2vn/image/upload/v1743257824/home/kthrayi8bcbkvxcm7ilg.png" alt="vs" className='vsImg' />
          <div className='imgWrapFightsUpdated'>
            <img src={match.fighterBImage} alt={match.matchFighterB} />
            <h1>{match.matchFighterB}</h1>
          </div>
        </div>
      


        <h1 className="fightTypeInFightDetailsUpdated">

  <div className="fight-text">
    This Fight Costs {match.matchTokens} tokens to play <br />
    You have {user.tokens} tokens in your wallet
  </div>
  
</h1>



        <button className='fightDetailsBtn' onClick={() => handleMatchClick()}>Play?</button>
      </div>
   
    </div>
  );
};

export default FightCosting;
