import { useRouter } from 'next/router';
import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

const MakePredictions = ({ matchId }) => {
   const router = useRouter();
  
  const user = useSelector((state) => state.user);
  const matches = useSelector((state) => state.matches.data);

  const match = matches.find((m) => m._id === matchId);
 
  const isBoxing = match?.matchCategory === 'boxing';

  const [rounds, setRounds] = useState(
    Array.from({ length: match.maxRounds }, (_, i) => ({
      round: i + 1,
      hpPrediction1: '',
      hpPrediction2: '',
      bpPrediction1: '',
      bpPrediction2: '',
      tpPrediction1: '',
      tpPrediction2: '',
      rwPrediction1: 0,
      rwPrediction2: 0,
      koPrediction1: 0,
      koPrediction2: 0,
      elPrediction1: '',
      elPrediction2: '',
      rwBorder: '2px solid #95a04d',
      rlBorder: '2px solid #95a04d',
      koBorder: '2px solid #95a04d',
      spBorder: '2px solid #95a04d',
      rwText: 'RW',
      rlText: 'RL',
      koText: 'KO',
      spText: 'SP'
    }))
  );
  

  const [timeRemaining, setTimeRemaining] = useState({
    diffHrs: 0,
    diffMins: 0,
    diffSecs: 0,
    hasStarted: false,
  });

  const [buttonText, setButtonText] = useState('Submit Predictions');

  
  useEffect(() => {
    // Hide the back arrow from the dashboard
    const dashboardArrow = document.querySelector('.dashboard-back-arrow');
    if (dashboardArrow) {
      dashboardArrow.style.display = 'none';
    }
  
    // Cleanup function to restore the arrow when FightCosting unmounts
    return () => {
      if (dashboardArrow) {
        dashboardArrow.style.display = 'block';
      }
    };
  }, []);
  

  
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

    calculateTimeRemaining();
    const interval = setInterval(calculateTimeRemaining, 1000);
    return () => clearInterval(interval);
  }, [match]);

  const handlePredictionChange = (e, roundIndex, field) => {
    const { value } = e.target;
    const updatedRounds = [...rounds];
    updatedRounds[roundIndex][field] = value;
  
    setRounds(updatedRounds);
  };


  const handleButtonClick = (roundIndex, buttonType) => {
    const updatedRounds = [...rounds];
    const currentRound = updatedRounds[roundIndex];
  
    if (buttonType === 'rw') {
      if (currentRound.rwText === 'RW') {
        currentRound.rwPrediction1 = 100;
        currentRound.rwPrediction2 = 25;
        currentRound.rwBorder = '2px solid #95a04d';
        currentRound.rlBorder = '2px solid #95a04d';
        currentRound.rwText = 'RL';
        currentRound.rlText = 'RW';
      } else {
        currentRound.rwPrediction1 = 25;
        currentRound.rwPrediction2 = 100;
        currentRound.rwBorder = '2px solid #95a04d';
        currentRound.rlBorder = '2px solid #95a04d';
        currentRound.rwText = 'RW';
        currentRound.rlText = 'RL';
      }
    } else if (buttonType === 'ko') {
      if (currentRound.koText === 'KO') {
        currentRound.koPrediction1 = 500;
        currentRound.koPrediction2 = 25;
        currentRound.koBorder = '2px solid #95a04d';
        currentRound.spBorder = '2px solid #95a04d';
        currentRound.koText = 'SP';
        currentRound.spText = 'KO';
      } else {
        currentRound.koPrediction1 = 25;
        currentRound.koPrediction2 = 500;
        currentRound.koBorder = '2px solid #95a04d';
        currentRound.spBorder = '2px solid #95a04d';
        currentRound.koText = 'KO';
        currentRound.spText = 'SP';
      }
    }
  
    setRounds(updatedRounds);
  };
      
  const handleFinish = async () => {
    setButtonText('Saving!');
    try {
      await fetch('https://fantasymmadness-game-server-three.vercel.app/api/scores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playerId: user._id,
          matchId: matchId,
          predictions: rounds,
          category: match.matchCategory,
        }),
      });

      await fetch(`https://fantasymmadness-game-server-three.vercel.app/api/matches/${matchId}/updatePredictionStatus`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user._id,
          predictionStatus: 'submitted',
        }),
      });

      window.location.reload();
    } catch (error) {
      console.error('Error saving predictions:', error);
      alert('Failed to save predictions.');
    } finally {
      setButtonText('Submit Predictions');
    }
  };

  if (!match) {
    return <div>Match not found</div>;
  }

  const label1 = isBoxing ? 'HP' : 'ST';
  const label2 = isBoxing ? 'BP' : 'KI';
  const label3 = isBoxing ? 'TP' : 'KN';
  const label4 = isBoxing ? '' : 'EL'; // MMA has an extra 'EL' field

  return (
    <div className='fightCosting makePredictions'>
      <div className='member-header'>
        <div className='member-header-image'>
          <img src={user.profileUrl} alt="Logo" />
        </div>
        <h3><span className='toRemove'>Member Name: </span>{user.firstName} {user.lastName}</h3>
        <h3><span className='toRemove'>Current</span> Plan: {user.currentPlan}</h3>
      </div>

      <div className='fightwalletWrap' onClick={() => router.push('/checkout')}>
        <div className='fightWallet'>
          <h1><i className="fa fa-shopping-bag" aria-hidden="true"></i> Fight Wallet</h1>
          <h2>Tokens Remaining: <span>{user.tokens}</span></h2>
        </div>
      </div>

      <div className='fightDetailsContainer'>
        <h1 className='fightTypeInFightDetails'>
          Fight type: <span>{match.matchCategoryTwo ? match.matchCategoryTwo : match.matchCategory}</span> - 
          <span className='makeGreen'> {match.matchType} </span> - 
          <span>{match.matchFighterA} </span> VS <span> {match.matchFighterB} </span>
        </h1>

        <div className='beiginningTimeFight'>
          <h1>Will Begin in - </h1>
          <p style={{color:"#38b90c"}}>
            {timeRemaining.hasStarted
              ? "Fight has started"
              : `${timeRemaining.diffHrs}:${timeRemaining.diffMins}:${timeRemaining.diffSecs}`}
          </p>
        </div>

        <div className='fightersImagesInFightDetails'>
          <div className='flexColumn'>
            <div className='imgWrapFights'>
              <img src={match.fighterAImage} alt={match.matchFighterA} />
            </div>
            <h1 className='fightTypeInFightDetails'>{match.matchFighterA}</h1>
          </div>

          <h1>VS</h1>

          <div className='flexColumn'>
            <div className='imgWrapFights'>
              <img src={match.fighterBImage} style={{border:'3px solid red'}} alt='logo'/>
            </div>
            <h1 className='fightTypeInFightDetails'>{match.matchFighterB}</h1>
          </div>
        </div>

        <div className='roundsWrapper'>
          {rounds.map((round, index) => (
            <div className='roundActual' key={index}>
              <div className='roundHeading'>
                <h1>Round {round.round}</h1>
              </div>
              <div className='roundInputWrap'>
                <div className='roundInput'>
                  <div className='roundInputDivOne'>
                    <i className="fa fa-caret-left" aria-hidden="true"></i>  
                    <input
                      type='number'
                      style={{border:'2px solid #2a8adb'}}
                      value={round.hpPrediction1}
                      onChange={(e) => handlePredictionChange(e, index, 'hpPrediction1')}
                    />
                  </div>
                  <div className='roundinput-image'>
                    <h2>{label1}</h2>
                    <div className='roundInputImgWrap'>
                      <img src="https://res.cloudinary.com/dqi6vk2vn/image/upload/v1743258002/home/cozzru3dapikvamnd44q.png" alt={`${label1} Icon`} />
                    </div>
                  </div>
                  <div className='roundInputDivOne'>
                    <input
                      type='number'
                      style={{border:'2px solid #e1130c'}}
                      value={round.hpPrediction2}
                      onChange={(e) => handlePredictionChange(e, index, 'hpPrediction2')}
                    />
                    <i className="fa fa-caret-right" aria-hidden="true"></i>
                  </div>
                </div>

                <div className='roundInput'>
                  <div className='roundInputDivOne'>
                    <i className="fa fa-caret-left" aria-hidden="true"></i>  
                    <input
                      type='number'
                      style={{border:'2px solid #2a8adb'}}
                      value={round.bpPrediction1}
                      onChange={(e) => handlePredictionChange(e, index, 'bpPrediction1')}
                    />
                  </div>
                  <div className='roundinput-image'>
                    <h2>{label2}</h2>
                    <div className='roundInputImgWrap'>
                      <img src="https://res.cloudinary.com/dqi6vk2vn/image/upload/v1743258002/home/cozzru3dapikvamnd44q.png" alt={`${label2} Icon`} />
                    </div>
                  </div>
                  <div className='roundInputDivOne'>
                    <input
                      type='number'
                      style={{border:'2px solid #e1130c'}}
                      value={round.bpPrediction2}
                      onChange={(e) => handlePredictionChange(e, index, 'bpPrediction2')}
                    />
                    <i className="fa fa-caret-right" aria-hidden="true"></i>
                  </div>
                </div>

                <div className='roundInput' style={{border:'2px dashed #ccc', borderRadius:'15px', width:'80%', padding:'5px'}}>
  <div className='roundInputDivOne'>
    <input
      type='number'
      style={{border:'2px solid #2a8adb', background:'#fff'}}
      value={round.tpPrediction1}
      onChange={(e) => handlePredictionChange(e, index, 'tpPrediction1')}
       
    />
  </div>
  <div className='roundinput-image'>
    <h2>{label3}</h2>
    <div className='roundInputImgWrap'>
      <img src="https://res.cloudinary.com/dqi6vk2vn/image/upload/v1743258002/home/cozzru3dapikvamnd44q.png" alt={`${label3} Icon`} />
    </div>
  </div>
  <div className='roundInputDivOne'>
    <input
      type='number'
      style={{border:'2px solid #e1130c', background:'#fff'}}
      value={round.tpPrediction2}
      onChange={(e) => handlePredictionChange(e, index, 'tpPrediction2')}
       
    />
  </div>
</div>


                {/* EL Field for MMA */}
                {!isBoxing && (
                  <div className='roundInput'>
                    <div className='roundInputDivOne'>
                      <i className="fa fa-caret-left" aria-hidden="true"></i>
                      <input
                        type='number'
                        style={{border:'2px solid #2a8adb'}}
                        value={round.elPrediction1}
                        onChange={(e) => handlePredictionChange(e, index, 'elPrediction1')}
                      />
                    </div>
                    <div className='roundinput-image'>
                      <h2>{label4}</h2>
                      <div className='roundInputImgWrap'>
                        <img src="https://res.cloudinary.com/dqi6vk2vn/image/upload/v1743258002/home/cozzru3dapikvamnd44q.png" alt={`${label4} Icon`} />
                      </div>
                    </div>
                    <div className='roundInputDivOne'>
                      <input
                        type='number'
                        style={{border:'2px solid #e1130c'}}
                        value={round.elPrediction2}
                        onChange={(e) => handlePredictionChange(e, index, 'elPrediction2')}
                      />
                      <i className="fa fa-caret-right" aria-hidden="true"></i>
                    </div>
                  </div>
                )}

                <div className='roundInput' style={{ paddingLeft: '40px', paddingRight: '37px' }}>
  <div className='roundInputDivOne'>
    <input
      type='button'
      style={{
        border: round.rwBorder,
        background: '#264fa4',
        textAlign: 'center',
        color: '#fff',
      }}
      value={round.rwText}
      onClick={() => handleButtonClick(index, 'rw')}
    />
  </div>

  <div className='roundinput-image'>
    <h2 style={{ marginTop: '8px' }}>- OR -</h2>
  </div>

  <div className='roundInputDivOne'>
    <input
      type='button'
      style={{
        border: round.rlBorder,
        background: '#8a1318',
        textAlign: 'center',
        color: '#fff'
      }}
      value={round.rlText}
      onClick={() => handleButtonClick(index, 'rw')}
    />
  </div>
</div>

<div className='roundInput' style={{ paddingLeft: '40px', paddingRight: '37px', marginTop: '10px' }}>
  <div className='roundInputDivOne'>
    <input
      type='button'
      style={{
        border: round.koBorder,
        background: '#264fa4',
        textAlign: 'center',
        color: '#fff',
        marginBottom: '5px'
      }}
      value={round.koText}
      onClick={() => handleButtonClick(index, 'ko')}
    />
  </div>

  <div className='roundinput-image'>
    <h2 style={{ marginTop: '8px' }}>- OR -</h2>
  </div>

  <div className='roundInputDivOne'>
    <input
      type='button'
      style={{
        border: round.spBorder,
        background: '#8a1318',
        textAlign: 'center',
        color: '#fff',
      }}
      value={round.spText}
      onClick={() => handleButtonClick(index, 'ko')}
    />
  </div>
</div>

              </div>
            </div>
          ))}
        </div>

        <button className='btn-grad' style={{width:'250px'}} onClick={handleFinish}>
          {buttonText}
        </button>
      </div>
    </div>
  );
};

export default MakePredictions;
