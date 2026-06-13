import React, { useState } from 'react';
import RoundByRoundMockScores from './RoundByRoundMockScores';
import ReactPlayer from 'react-player/lazy';

const index = () => {
  const [isBoxing, setIsBoxing] = useState(false);
const [showPredictions, setShowPredictions] = useState(false);

  const [rounds, setRounds] = useState(
    Array.from({ length: 3 }, (_, i) => ({
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
  
  const [buttonText, setButtonText] = useState('Submit Predictions');


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
    console.log("My predictions", rounds);

    // Only include relevant prediction data
    const predictions = rounds.map(({ round,elPrediction1,elPrediction2, hpPrediction1, hpPrediction2, bpPrediction1, bpPrediction2, tpPrediction1, tpPrediction2, rwPrediction1, rwPrediction2, koPrediction1, koPrediction2 }) => ({
      round,
      hpPrediction1: Number(hpPrediction1),
      hpPrediction2: Number(hpPrediction2),
      bpPrediction1: Number(bpPrediction1),
      bpPrediction2: Number(bpPrediction2),
      tpPrediction1: Number(tpPrediction1),
      tpPrediction2: Number(tpPrediction2),
        elPrediction1: Number(elPrediction1),
        elPrediction2: Number(elPrediction2),
      rwPrediction1,
      rwPrediction2,
      koPrediction1,
      koPrediction2
    }));

    // Optionally log the formatted predictions
    console.log("Formatted predictions", { predictions });

    // Show the RoundByRoundMockScores component
    setShowPredictions(true);
  } catch (error) {
    alert('Failed to save predictions.');
  } finally {
    setButtonText('Submit Predictions');
  }
};


  const label1 = isBoxing ? 'HP' : 'ST';
  const label2 = isBoxing ? 'BP' : 'KI';
  const label3 = isBoxing ? 'TP' : 'KN';
  const label4 = isBoxing ? '' : 'EL'; // MMA has an extra 'EL' field

  return (
    <div className='fightCosting makePredictions makepredictionsmock'>
      <h1 className='mockpredheading'>Mock Predictions Game</h1>
       <div className="video-embed-wrapper" style={{marginBottom:'30px'}}>
                <div className="no-hover">
                  <ReactPlayer
                    url="https://youtu.be/C5wHWEzPrrs?si=1AZi6wDVvWrfI0QH"
                    playing
                    loop
                    controls={false}
                    width="100%"
                    height="100%"
                  />
                </div>
              </div>
              <div className="fight-type-selector">
      <label htmlFor="fight-type">Select Fight Type:</label>
      <select
        id="fight-type"
        value={isBoxing ? 'boxing' : 'mma'}
        onChange={(e) => setIsBoxing(e.target.value === 'boxing')}
      >
        <option value="boxing">Boxing</option>
        <option value="mma">MMA</option>
      </select>
    </div>
      <div className='fightDetailsContainer'>
        <h1 className='fightTypeInFightDetails'>
          Fight type: <span>{isBoxing ? 'Boxing' : 'MMA'}</span> - 
          <span className='makeGreen'> SHADOW </span> - 
          <span>MIKAEL MAYER </span> VS <span> ALYCIA BAUMGARDNER </span>
        </h1>

        <div className='fightersImagesInFightDetails'>
          <div className='flexColumn'>
            <div className='imgWrapFights'>
              <img src="https://res.cloudinary.com/dq2fwh1ui/image/upload/v1735641323/fighterAImages/med1i2a7dwply7ajxgr5.jpg" alt="matchFighterA" />
            </div>
            <h1 className='fightTypeInFightDetails'>MIKAEL MAYER</h1>
          </div>

          <h1>VS</h1>

          <div className='flexColumn'>
            <div className='imgWrapFights'>
              <img src="https://res.cloudinary.com/dq2fwh1ui/image/upload/v1735641323/fighterBImages/astbkbypvcwnkpcrfjd1.jpg" style={{border:'3px solid red'}} alt='logo'/>
            </div>
            <h1 className='fightTypeInFightDetails'>ALYCIA BAUMGARDNER</h1>
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
     {showPredictions && (
  <RoundByRoundMockScores matchCategory={isBoxing ? 'boxing' : 'mma'} predictions={rounds.map(({ round,elPrediction1,elPrediction2, hpPrediction1, hpPrediction2, bpPrediction1, bpPrediction2, tpPrediction1, tpPrediction2, rwPrediction1, rwPrediction2, koPrediction1, koPrediction2 }) => ({
    round,
    hpPrediction1: Number(hpPrediction1),
    hpPrediction2: Number(hpPrediction2),
    bpPrediction1: Number(bpPrediction1),
    bpPrediction2: Number(bpPrediction2),
    tpPrediction1: Number(tpPrediction1),
    tpPrediction2: Number(tpPrediction2),
      elPrediction1: Number(elPrediction1),
        elPrediction2: Number(elPrediction2),
    rwPrediction1,
    rwPrediction2,
    koPrediction1,
    koPrediction2
  }))} 
/>
)}

    </div>
  );
};
export default index;