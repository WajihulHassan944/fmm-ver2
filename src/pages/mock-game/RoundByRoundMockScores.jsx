import React, { useEffect, useState } from 'react';
import MockLeaderboard from './MockLeaderboard';

const RoundByRoundMockScores = ({ predictions, matchCategory }) => {
  const [scores, setScores] = useState({ predictions: [] });

  useEffect(() => {
    if (predictions && predictions.length > 0) {
      setScores({ predictions });
    }
  }, [predictions]);


  let totalPoints = 0;
    
   const match = {
      matchCategory: matchCategory,
    "matchCategoryTwo": "Bare-knuckle",
    "matchName": "BKFC Fight",
    "matchFighterA": "Michael Venom Page",
    "matchFighterB": "Mike Perry",
    "matchDescription": "TWO Warriors",
    "matchBy": "admin",
    "matchStatus": "Finished",
    "matchReward": "NotRewarded",
    "matchVideoUrl": "abc",
    "matchDate": "2024-12-07T00:00:00.000Z",
    "matchTime": "11:00",
    "matchTokens": 10,
    "pot": 100,
    "matchType": "SHADOW",
    "maxRounds": 5,
 "MMAMatch": {
      "fighterOneStats": [
        {
          "roundNumber": 1,
          "ST": 51,
          "KI": 12,
          "KN": 2,
          "EL": 2,
          "RW": 100,
          "RL": 0,
          "KO": 0,
          "SP": 0,
          "_id": "67320a02d4c626674e400a11"
        },
        {
          "roundNumber": 2,
          "ST": 48,
          "KI": 11,
          "KN": 5,
          "EL": 2,
          "RW": 25,
          "RL": 0,
          "KO": 0,
          "SP": 0,
          "_id": "67320a2fd4c626674e400a17"
        },
        {
          "roundNumber": 3,
          "ST": 49,
          "KI": 13,
          "KN": 2,
          "EL": 5,
          "RW": 100,
          "RL": 0,
          "KO": 0,
          "SP": 0,
          "_id": "67320a5bd4c626674e400a1f"
        },
        {
          "roundNumber": 4,
          "ST": 46,
          "KI": 12,
          "KN": 2,
          "EL": 4,
          "RW": 100,
          "RL": 0,
          "KO": 0,
          "SP": 0,
          "_id": "67320a84d5d5c0aa8920791d"
        },
        {
          "roundNumber": 5,
          "ST": 52,
          "KI": 20,
          "KN": 2,
          "EL": 2,
          "RW": 100,
          "RL": 0,
          "KO": 0,
          "SP": 0,
          "_id": "67320ae8d5d5c0aa89207a8d"
        }
      ],
      "fighterTwoStats": [
        {
          "roundNumber": 1,
          "ST": 47,
          "KI": 16,
          "KN": 2,
          "EL": 2,
          "RW": 0,
          "RL": 25,
          "KO": 0,
          "SP": 500,
          "_id": "67320a02d4c626674e400a12"
        },
        {
          "roundNumber": 2,
          "ST": 47,
          "KI": 8,
          "KN": 1,
          "EL": 1,
          "RW": 0,
          "RL": 100,
          "KO": 0,
          "SP": 500,
          "_id": "67320a2fd4c626674e400a18"
        },
        {
          "roundNumber": 3,
          "ST": 52,
          "KI": 14,
          "KN": 3,
          "EL": 2,
          "RW": 0,
          "RL": 25,
          "KO": 0,
          "SP": 500,
          "_id": "67320a5bd4c626674e400a20"
        },
        {
          "roundNumber": 4,
          "ST": 46,
          "KI": 12,
          "KN": 3,
          "EL": 2,
          "RW": 0,
          "RL": 25,
          "KO": 0,
          "SP": 500,
          "_id": "67320a84d5d5c0aa8920791e"
        },
        {
          "roundNumber": 5,
          "ST": 54,
          "KI": 13,
          "KN": 6,
          "EL": 2,
          "RW": 0,
          "RL": 25,
          "KO": 0,
          "SP": 500,
          "_id": "67320ae8d5d5c0aa89207a8e"
        }
      ]
    },

    "BoxingMatch": {
      "fighterOneStats": [
        {
          "roundNumber": 1,
          "HP": 1,
          "BP": 1,
          "TP": 2,
          "RW": 100,
          "RL": 25,
          "KO": 500,
          "SP": 25,
          "_id": "67259feb8526979d6302b898"
        },
        {
          "roundNumber": 2,
          "HP": 1,
          "BP": 1,
          "TP": 2,
          "RW": 25,
          "RL": 100,
          "KO": 25,
          "SP": 500,
          "_id": "67264b4f56a66e689d5b5ebd"
        },
        {
          "roundNumber": 3,
          "HP": 19,
          "BP": 8,
          "TP": 27,
          "RW": 100,
          "RL": 25,
          "KO": 25,
          "SP": 500,
          "_id": "66e9866c00b18f08ae150849"
        }
      ],
      "fighterTwoStats": [
        {
          "roundNumber": 1,
          "HP": 1,
          "BP": 1,
          "TP": 2,
          "RW": 25,
          "RL": 25,
          "KO": 25,
          "SP": 25,
          "_id": "67259feb8526979d6302b899"
        },
        {
          "roundNumber": 2,
          "HP": 1,
          "BP": 1,
          "TP": 2,
          "RW": 100,
          "RL": 100,
          "KO": 500,
          "SP": 500,
          "_id": "67264b4f56a66e689d5b5ebe"
        },
        {
          "roundNumber": 3,
          "HP": 15,
          "BP": 11,
          "TP": 26,
          "RW": 25,
          "RL": 25,
          "KO": 500,
          "SP": 500,
          "_id": "66e9866c00b18f08ae15084a"
        }
      ]
    },
   };


    const calculateRoundPoints = (roundPrediction, fighterOneRound, fighterTwoRound) => {
        if (!fighterOneRound || !fighterTwoRound || !roundPrediction) {
            console.error('Fighter round data is missing in calculateRoundPoints',roundPrediction, fighterOneRound, fighterTwoRound);
            return 0;
        }
    
        let roundPoints = 0;
    
        // Helper function to add points based on prediction and fighter stats
        const addPoints = (prediction, stat, points) => {
            if (prediction !== null && prediction <= stat) {
                roundPoints += points;
            }
        };
    
        // For boxing
        if (match.matchCategory === 'boxing') {
            // Fighter One
            addPoints(roundPrediction.hpPrediction1, fighterOneRound.HP, roundPrediction.hpPrediction1);
            addPoints(roundPrediction.bpPrediction1, fighterOneRound.BP, roundPrediction.bpPrediction1);
            addPoints(roundPrediction.tpPrediction1, fighterOneRound.TP, roundPrediction.tpPrediction1);
            if (roundPrediction.rwPrediction1 !== null && roundPrediction.rwPrediction1 === fighterOneRound.RW) {
                roundPoints += roundPrediction.rwPrediction1;
            }
            if (roundPrediction.koPrediction1 !== null) {
                roundPoints += roundPrediction.koPrediction1 === fighterOneRound.KO ? fighterOneRound.KO : 0;
            }
    
            // Fighter Two
            addPoints(roundPrediction.hpPrediction2, fighterTwoRound.HP, roundPrediction.hpPrediction2);
            addPoints(roundPrediction.bpPrediction2, fighterTwoRound.BP, roundPrediction.bpPrediction2);
            addPoints(roundPrediction.tpPrediction2, fighterTwoRound.TP, roundPrediction.tpPrediction2);
            if (roundPrediction.rwPrediction2 !== null && roundPrediction.rwPrediction2 === fighterTwoRound.RW) {
                roundPoints += roundPrediction.rwPrediction2;
            }
            if (roundPrediction.koPrediction2 !== null) {
                roundPoints += roundPrediction.koPrediction2 === fighterTwoRound.KO ? fighterTwoRound.KO : 0;
            }
    
        }  else if (match.matchCategory === 'mma') {
            // For MMA
            // Fighter One
            addPoints(roundPrediction.hpPrediction1, fighterOneRound.ST, roundPrediction.hpPrediction1);
            addPoints(roundPrediction.bpPrediction1, fighterOneRound.KI, roundPrediction.bpPrediction1);
            addPoints(roundPrediction.tpPrediction1, fighterOneRound.KN, roundPrediction.tpPrediction1);
            if (roundPrediction.rwPrediction1 !== null && roundPrediction.rwPrediction1 === fighterOneRound.RW) {
                roundPoints += roundPrediction.rwPrediction1;
            }
            if (roundPrediction.koPrediction1 !== null) {
                roundPoints += roundPrediction.koPrediction1 === fighterOneRound.KO ? fighterOneRound.KO : 0;
            }
            if (roundPrediction.elPrediction1 !== null) {
                roundPoints += roundPrediction.elPrediction1 <= fighterOneRound.EL ? roundPrediction.elPrediction1 : 0;
            }
    
            // Fighter Two
            addPoints(roundPrediction.hpPrediction2, fighterTwoRound.ST, roundPrediction.hpPrediction2);
            addPoints(roundPrediction.bpPrediction2, fighterTwoRound.KI, roundPrediction.bpPrediction2);
            addPoints(roundPrediction.tpPrediction2, fighterTwoRound.KN, roundPrediction.tpPrediction2);
            if (roundPrediction.rwPrediction2 !== null && roundPrediction.rwPrediction2 === fighterTwoRound.RW) {
                roundPoints += roundPrediction.rwPrediction2;
            }
            if (roundPrediction.koPrediction2 !== null) {
                roundPoints += roundPrediction.koPrediction2 === fighterTwoRound.KO ? fighterTwoRound.KO : 0;
            }
            if (roundPrediction.elPrediction2 !== null) {
                roundPoints += roundPrediction.elPrediction2 <= fighterTwoRound.EL ? roundPrediction.elPrediction2 : 0;
            }
        }
    
    
        return roundPoints;
    };
        

    

    const calculatePoints = (userPrediction, fighterOneStats, fighterTwoStats) => {
        let totalScore = 0;
    
        userPrediction.forEach((roundPrediction, index) => {
            const fighterOneRound = fighterOneStats[index];
            const fighterTwoRound = fighterTwoStats[index];
    
            if (!fighterOneRound || !fighterTwoRound || !roundPrediction) return;
    
            // For Boxing
            if (match.matchCategory === 'boxing') {
                // Fighter One Predictions
                // Head Punches (HP)
                if (roundPrediction.hpPrediction1 !== null && roundPrediction.hpPrediction1 <= fighterOneRound.HP) {
                    totalScore += roundPrediction.hpPrediction1;
                }
    
                // Body Punches (BP)
                if (roundPrediction.bpPrediction1 !== null && roundPrediction.bpPrediction1 <= fighterOneRound.BP) {
                    totalScore += roundPrediction.bpPrediction1;
                }
    
                // Total Punches (TP)
                if (roundPrediction.tpPrediction1 !== null && roundPrediction.tpPrediction1 <= fighterOneRound.TP) {
                    totalScore += roundPrediction.tpPrediction1;
                }
    
                // Round Winner (RW)
                if (roundPrediction.rwPrediction1 !== null && roundPrediction.rwPrediction1 === fighterOneRound.RW) {
                    totalScore += roundPrediction.rwPrediction1;
                }
    
                // Knock Out (KO)
                if (roundPrediction.koPrediction1 !== null && roundPrediction.koPrediction1 === fighterOneRound.KO) {
                    totalScore += fighterOneRound.KO;
                }
    
                // Fighter Two Predictions
                // Head Punches (HP)
                if (roundPrediction.hpPrediction2 !== null && roundPrediction.hpPrediction2 <= fighterTwoRound.HP) {
                    totalScore += roundPrediction.hpPrediction2;
                }
    
                // Body Punches (BP)
                if (roundPrediction.bpPrediction2 !== null && roundPrediction.bpPrediction2 <= fighterTwoRound.BP) {
                    totalScore += roundPrediction.bpPrediction2;
                }
    
                // Total Punches (TP)
                if (roundPrediction.tpPrediction2 !== null && roundPrediction.tpPrediction2 <= fighterTwoRound.TP) {
                    totalScore += roundPrediction.tpPrediction2;
                }
    
                // Round Winner (RW)
                if (roundPrediction.rwPrediction2 !== null && roundPrediction.rwPrediction2 === fighterTwoRound.RW) {
                    totalScore += roundPrediction.rwPrediction2;
                }
    
                // Knock Out (KO)
                if (roundPrediction.koPrediction2 !== null && roundPrediction.koPrediction2 === fighterTwoRound.KO) {
                    totalScore += fighterTwoRound.KO;
                }
    
            } 
        });
    
        return totalScore;
    };
      
  const renderRoundResults = (predictions) => {
    const scoreLabels = match.matchCategory === 'boxing' 
        ? { hp: 'HP', bp: 'BP', tp: 'TP', rw: 'RW',rl:'RL', ko: 'KO', sp:'SP' }
        : { hp: 'ST', bp: 'KI', tp: 'KN', rw: 'RW',rl:'RL', ko: 'KO', sp:'SP' , el:'EL' };

    return predictions.map((round, index) => {
        // Check if any meaningful prediction is made for the current round
        const hasValidPredictions = round.hpPrediction1 !== null || round.bpPrediction1 !== null || 
                                    round.tpPrediction1 !== null || round.rwPrediction1 !== null || 
                                    round.koPrediction1 !== null || round.hpPrediction2 !== null || 
                                    round.bpPrediction2 !== null || round.tpPrediction2 !== null || 
                                    round.elPrediction1 !== null || round.elPrediction2 !== null || 
                                    round.rwPrediction2 !== null || round.koPrediction2 !== null;

        let roundPoints = 0;
        if (hasValidPredictions) {
            let fighterOneRound, fighterTwoRound;
    
            // Check match category and get the corresponding fighter stats
            if (match.matchCategory === 'boxing' && match.BoxingMatch) {
                fighterOneRound = match.BoxingMatch.fighterOneStats[index];
                fighterTwoRound = match.BoxingMatch.fighterTwoStats[index];
            } else if (match.matchCategory === 'mma' && match.MMAMatch) {
                fighterOneRound = match.MMAMatch.fighterOneStats[index];
                fighterTwoRound = match.MMAMatch.fighterTwoStats[index];
            }
    
            // Ensure fighter stats are available before calculating points
            if (fighterOneRound && fighterTwoRound) {
                roundPoints = calculateRoundPoints(round, fighterOneRound, fighterTwoRound);
                totalPoints += roundPoints;
            } else {
                console.error('Fighter round data is missing in calculateRoundPoints', round, fighterOneRound, fighterTwoRound);
            }
        }

        return (
            <div key={index} className='roundResultDiv'>
                <h1>Round {round.round} Complete</h1>
                <div className='line'></div>
                <div className='scoresWrapper'>
                    {/* Render prediction scores dynamically */}
                    <div className='scoresOfRound'>
                        <h2>{scoreLabels.hp}</h2>
                        <div className='scoreBox'>
                            <p>{round.hpPrediction1 !== null ? round.hpPrediction1 : '-'}</p>
                        </div>
                    </div>
                    <div className='scoresOfRound'>
                        <h2>{scoreLabels.hp}</h2>
                        <div className='scoreBox'>
                            <p>{round.hpPrediction2 !== null ? round.hpPrediction2 : '-'}</p>
                        </div>
                    </div>
                    <div className='scoresOfRound'>
                        <h2>{scoreLabels.bp}</h2>
                        <div className='scoreBox'>
                            <p>{round.bpPrediction1 !== null ? round.bpPrediction1 : '-'}</p>
                        </div>
                    </div>
                    <div className='scoresOfRound'>
                        <h2>{scoreLabels.bp}</h2>
                        <div className='scoreBox'>
                            <p>{round.bpPrediction2 !== null ? round.bpPrediction2 : '-'}</p>
                        </div>
                    </div>
                    <div className='scoresOfRound'>
                        <h2>{scoreLabels.tp}</h2>
                        <div className='scoreBox'>
                            <p>{round.tpPrediction1 !== null ? round.tpPrediction1 : '-'}</p>
                        </div>
                    </div>
                    <div className='scoresOfRound'>
                        <h2>{scoreLabels.tp}</h2>
                        <div className='scoreBox'>
                            <p>{round.tpPrediction2 !== null ? round.tpPrediction2 : '-'}</p>
                        </div>
                    </div>
                    {match.matchCategory === "mma" && (
    <>
        <div className='scoresOfRound'>
            <h2>{scoreLabels.el}</h2>
            <div className='scoreBox'>
                <p>{round.elPrediction1 !== null ? round.elPrediction1 : '-'}</p>
            </div>
        </div>
        <div className='scoresOfRound'>
            <h2>{scoreLabels.el}</h2>
            <div className='scoreBox'>
                <p>{round.elPrediction2 !== null ? round.elPrediction2 : '-'}</p>
            </div>
        </div>
    </>
)}

                   
                    <div className='scoresOfRound'>
                        <h2>{scoreLabels.rw}</h2>
                        <div className='scoreBox'>
                            <p>{round.rwPrediction1 !== null ? round.rwPrediction1 : '-'}</p>
                        </div>
                    </div>
                    <div className='scoresOfRound'>
                        <h2>{scoreLabels.rl}</h2>
                        <div className='scoreBox'>
                            <p>{round.rwPrediction2 !== null ? round.rwPrediction2 : '-'}</p>
                        </div>
                    </div>
                    <div className='scoresOfRound'>
                        <h2>{scoreLabels.ko}</h2>
                        <div className='scoreBox'>
                            <p>{round.koPrediction1 !== null ? round.koPrediction1 : '-'}</p>
                        </div>
                    </div>
                    <div className='scoresOfRound'>
                        <h2>{scoreLabels.sp}</h2>
                        <div className='scoreBox'>
                            <p>{round.koPrediction2 !== null ? round.koPrediction2 : '-'}</p>
                        </div>
                    </div>
                    <div className='scoresOfRound'>
                        <h3>Points<span className='toRemove'> total</span></h3>
                        <div className='scoreBoxSpecial'>
                            <p>{roundPoints}</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    });
};


    const userScore = scores;

    return (
        <div className='finishedFightUserBoard'>
            <div className='fightLeaderboard'>
                <div className='fightDetails global-leaderboard'>
                    <div className='homeThird'>
                        
                      
    
    
    <div className='leaderboardHeading'>
                            <h3 data-aos="zoom-in">Scores</h3>
                        </div>
                     <div id="pdfContent" style={{width:'100%'}}>
                        <div className='roundResultsWrapper'>
                            {userScore ? renderRoundResults(userScore.predictions) : <p>No data available.</p>}
                           
                        </div> </div>
                      <div className='winnerSibDivTwo'>
                                    <h1>Points Grand Total</h1>
                                    <h2>{totalPoints}</h2>
                                </div> 
 
<MockLeaderboard totalPoints={totalPoints} />



                    </div>  
                </div>
            </div>
        </div>
    );
};

export default RoundByRoundMockScores;
