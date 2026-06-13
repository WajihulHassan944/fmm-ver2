import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

const ShowScores = ({ matchId, filter }) => {
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
    















    const isBoxing = match?.matchCategory === 'boxing';

    const [rounds, setRounds] = useState([]);

    useEffect(() => {
        if (match) {
            const stats = isBoxing
                ? {
                    fighterOneStats: match.BoxingMatch.fighterOneStats,
                    fighterTwoStats: match.BoxingMatch.fighterTwoStats
                }
                : {
                    fighterOneStats: match.MMAMatch.fighterOneStats,
                    fighterTwoStats: match.MMAMatch.fighterTwoStats
                };
    
            const roundData = stats.fighterOneStats.map((round, index) => {
                // Determine borders based on values for fighter one
                const rwBorder = round.RW === 100 ? '2px solid #95a04d' : '';
                const koBorder = round.KO === 500 ? '2px solid #95a04d' : '';
                const spBorder = round.SP === 500 ? '2px solid #95a04d' : '';
                
                return {
                    round: round.roundNumber,
                    hpPrediction1: round.HP || round.ST, // Boxing: HP, MMA: ST
                    bpPrediction1: round.BP || round.KI, // Boxing: BP, MMA: KI
                    tpPrediction1: round.TP || round.KN, // Boxing: TP, MMA: KN
                    elPrediction1: round.EL || 0,        // MMA: EL, Boxing: 0
                    hpPrediction2: stats.fighterTwoStats[index]?.HP || stats.fighterTwoStats[index]?.ST,
                    bpPrediction2: stats.fighterTwoStats[index]?.BP || stats.fighterTwoStats[index]?.KI,
                    tpPrediction2: stats.fighterTwoStats[index]?.TP || stats.fighterTwoStats[index]?.KN,
                    elPrediction2: stats.fighterTwoStats[index]?.EL || 0,
                    rwBorder,
                    rlBorder: round.RL === 100 ? '2px solid #95a04d' : '', // Example for RL, adjust as needed
                    koBorder,
                    spBorder,
                };
            });
            setRounds(roundData);
        }
    }, [match, isBoxing]);
    
    if (!match) {
        return <div>Match not found</div>;
    }

    const label1 = isBoxing ? 'HP' : 'ST';
    const label2 = isBoxing ? 'BP' : 'KI';
    const label3 = isBoxing ? 'TP' : 'KN';
    const label4 = isBoxing ? '' : 'EL'; // MMA has an extra 'EL' field

    return (
        <div className='fightCosting makePredictions' style={{width:'calc(100% - 230px)' , marginLeft:'230px' , paddingTop:'50px'}}>
            <div className='fightDetailsContainer'>
                <h1 className='fightTypeInFightDetails'>
                    Fight type: <span>{match.matchCategoryTwo ? match.matchCategoryTwo : match.matchCategory}</span> - 
                    <span className='makeGreen'> {match.matchType} </span> - 
                    <span>{match.matchFighterA} </span> VS <span> {match.matchFighterB} </span>
                </h1>

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
                            <img src={match.fighterBImage} style={{border:'3px solid red'}} alt='logo' />
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
                                            style={{border:'2px solid #2a8adb' , background:'#fff'}}
                                            value={round.hpPrediction1}
                                            disabled={true}
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
                                            style={{border:'2px solid #e1130c' , background:'#fff'}}
                                            value={round.hpPrediction2}
                                            disabled={true}
                                        />
                                        <i className="fa fa-caret-right" aria-hidden="true"></i>
                                    </div>
                                </div>

                                <div className='roundInput'>
                                    <div className='roundInputDivOne'>
                                        <i className="fa fa-caret-left" aria-hidden="true"></i>  
                                        <input
                                            type='number'
                                            style={{border:'2px solid #2a8adb' , background:'#fff'}}
                                            value={round.bpPrediction1}
                                            disabled={true}
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
                                            style={{border:'2px solid #e1130c' , background:'#fff'}}
                                            value={round.bpPrediction2}
                                            disabled={true}
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
                                            disabled={true}
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
                                            disabled={true}
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
                                                style={{border:'2px solid #2a8adb' , background:'#fff'}}
                                                value={round.elPrediction1}
                                                disabled={true}
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
                                                style={{border:'2px solid #e1130c' , background:'#fff'}}
                                                value={round.elPrediction2}
                                                disabled={true}
                                            />
                                            <i className="fa fa-caret-right" aria-hidden="true"></i>
                                        </div>
                                    </div>
                                )}

                                <div className='roundInput' style={{paddingLeft: '40px', paddingRight: '37px'}}>
    <div className='roundInputDivOne'>
        <input
            type='button'
            style={{
                border: round.rwBorder || '2px solid #95a04d', 
                background: '#264fa4', 
                textAlign: 'center', 
                color: '#fff', 
            }}
            value={round.rwBorder ? 'RW' : 'RL'}
            disabled={true}
        />
    </div>

    <div className='roundinput-image'>
        <h2 style={{marginTop: '8px'}}>- OR -</h2>
    </div>

    <div className='roundInputDivOne'>
        <input
            type='button'
            style={{
                border: round.rlBorder || '2px solid #95a04d', 
                background: '#8a1318', 
                textAlign: 'center', 
                color: '#fff'
            }}
            value={round.rlBorder ? 'RW' : 'RL'}
            disabled={true}
        />
    </div>
</div>


                                <div className='roundInput' style={{paddingLeft:'40px', paddingRight:'37px'}}>
    <div className='roundInputDivOne'>
        <input
            type='button'
            style={{
                border: round.koBorder || '2px solid #95a04d', 
                background: '#264fa4', 
                textAlign: 'center', 
                color: '#fff', 
                marginBottom: '5px'
            }}
            value={round.koBorder ? 'KO' : 'SP'}
            disabled={true}
        />
    </div>
    <div className='roundInputDivOne'>
        <input
            type='button'
            style={{
                border: round.spBorder || '2px solid #95a04d', 
                background: '#8a1318', 
                textAlign: 'center', 
                color: '#fff',
            }}
            value={round.spBorder ? 'KO' : 'SP'}
            disabled={true}
        />
    </div>
</div>



                                
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ShowScores;
