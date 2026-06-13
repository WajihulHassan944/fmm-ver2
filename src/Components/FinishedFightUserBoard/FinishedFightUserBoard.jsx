import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { getWinnerDetails } from '../../CustomFunctions/winnerUtils';
import { useDispatch } from 'react-redux';
import { stopMusic, playMusic } from '../../Redux/musicSlice';
import { useRouter } from 'next/router';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const FinishedFightUserBoard = ({ matchId }) => {
     const router = useRouter();
    
    const [scores, setScores] = useState([]);
    const [scoresHigh, setScoresHigh] = useState([]);
    const [users, setUsers] = useState([]);
    const [winner, setWinner] = useState({
        firstName: '',
        lastName: '',
        profileUrl: '',
        totalPoints: 0,
        matchId: '' // Initialize matchId in the state
    });
    
    const user = useSelector((state) => state.user);
    const matches = useSelector((state) => state.matches.data);
    const match = matches.find((m) => m._id === matchId);
    let totalPoints = 0;
    const dispatch = useDispatch();

    useEffect(() => {
        dispatch(stopMusic());
        fetch('https://fantasymmadness-game-server-three.vercel.app/api/scores')
        .then(response => response.json())
        .then(data => {
          const userScores = data.filter(score => score.matchId === matchId && score.playerId === user._id);
          setScores(userScores);
      
          const highScores = data.filter(score => score.matchId === matchId);
          setScoresHigh(highScores);
        })
        .catch(error => console.error('Error fetching scores:', error));

        fetch('https://fantasymmadness-game-server-three.vercel.app/users')
            .then(response => response.json())
            .then(data => setUsers(data))
            .catch(error => console.error('Error fetching users:', error));
            return () => dispatch(playMusic());
    }, [matchId, user._id, dispatch]);

    useEffect(() => {
        const fetchWinnerDetails = async () => {
            const winnerDetails = await getWinnerDetails(matchId);
            if (winnerDetails) {
                setWinner(winnerDetails);
            }
        };

        fetchWinnerDetails();
    }, [matchId]);


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
    
        } else if (match.matchCategory === 'mma') {
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
    
            // For MMA
            } else if (match.matchCategory === 'mma') {
                // Fighter One Predictions
                // Strikes (ST)
                if (roundPrediction.hpPrediction1 !== null && roundPrediction.hpPrediction1 <= fighterOneRound.ST) {
                    totalScore += roundPrediction.hpPrediction1;
                }
    
                // Kicks (KI)
                if (roundPrediction.bpPrediction1 !== null && roundPrediction.bpPrediction1 <= fighterOneRound.KI) {
                    totalScore += roundPrediction.bpPrediction1;
                }
    
                // Knockdowns (KN)
                if (roundPrediction.tpPrediction1 !== null && roundPrediction.tpPrediction1 <= fighterOneRound.KN) {
                    totalScore += roundPrediction.tpPrediction1;
                }
    
                // Elbow Strikes (EL)
                if (roundPrediction.elPrediction1 !== null && roundPrediction.elPrediction1 <= fighterOneRound.EL) {
                    totalScore += roundPrediction.elPrediction1;
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
                // Strikes (ST)
                if (roundPrediction.hpPrediction2 !== null && roundPrediction.hpPrediction2 <= fighterTwoRound.ST) {
                    totalScore += roundPrediction.hpPrediction2;
                }
    
                // Kicks (KI)
                if (roundPrediction.bpPrediction2 !== null && roundPrediction.bpPrediction2 <= fighterTwoRound.KI) {
                    totalScore += roundPrediction.bpPrediction2;
                }
    
                // Knockdowns (KN)
                if (roundPrediction.tpPrediction2 !== null && roundPrediction.tpPrediction2 <= fighterTwoRound.KN) {
                    totalScore += roundPrediction.tpPrediction2;
                }
    
                // Elbow Strikes (EL)
                if (roundPrediction.elPrediction2 !== null && roundPrediction.elPrediction2 <= fighterTwoRound.EL) {
                    totalScore += roundPrediction.elPrediction2;
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
    
    const getYouTubeEmbedUrl = (url) => {
        const videoId = url.split('youtu.be/')[1]?.split('?')[0];
        return `https://www.youtube.com/embed/${videoId}`;
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


    const userScore = scores.length > 0 ? scores[0] : null;

    
const downloadPredictionPDF = async () => {
  const input = document.getElementById('pdfContent');
  if (!input) return;

  // Ensure it's fully rendered and visible
  input.style.maxHeight = 'none';

  // Use scrollHeight to dynamically set height
  const originalHeight = input.scrollHeight;

  const canvas = await html2canvas(input, {
    scale: 2,
    useCORS: true,
    allowTaint: true,
    scrollY: -window.scrollY,
    windowHeight: originalHeight,
  });

  const imgData = canvas.toDataURL('image/png');
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

  let heightLeft = pdfHeight;
  let position = 0;

  // Add first page
  pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
  heightLeft -= pdf.internal.pageSize.getHeight();

  // Add remaining pages if content exceeds one page
  while (heightLeft > 0) {
    position = heightLeft - pdfHeight;
    pdf.addPage();
    pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
    heightLeft -= pdf.internal.pageSize.getHeight();
  }

  pdf.save('My_Predictions_Report.pdf');
};


    return (
        <div className='finishedFightUserBoard'>
            <div className='fightLeaderboard'>
                <div className='fightDetails global-leaderboard'>
                    <div className='member-header'>
                        <div className='member-header-image'>
                            <img src={user.profileUrl} alt="Logo" data-aos="zoom-in" />
                        </div>
                        <h3 data-aos="zoom-in"><span className='toRemove'>Member Name - </span>{user.firstName} {user.lastName}</h3>
                        <h3 data-aos="zoom-in"><span className='toRemove'>Current </span>Plan: {user.currentPlan}</h3>
                    </div>
                    <div className='fightwalletWrap' >
                        <div className='totalPoints'>
                            <h1 data-aos="zoom-in" className='fightTypeInFightDetails'>
                                Fight type: <span>{match.matchCategoryTwo ? match.matchCategoryTwo : match.matchCategory}</span> - 
                                <span style={{color:"#38b90c"}}>{match.matchType} </span> - 
                                <span>{match.matchFighterA} </span> VS <span> {match.matchFighterB} </span>
                            </h1>
                            <h1 data-aos="zoom-in" style={{textAlign:'left'}}>POT: <span style={{color:"#38b90c"}}>{match.pot}</span> &nbsp;Players: <span style={{color:"#38b90c"}}>{match.userPredictions.length}</span></h1>
                        </div>
                        <div className='fightWallet' data-aos="zoom-in" onClick={() => router.push('/checkout')}>
                            <h1><i className="fa fa-shopping-bag" aria-hidden="true"></i> Fight Wallet</h1>
                            <h2>Tokens Remaining: <span>{user.tokens}</span></h2>
                        </div>
                    </div>
                    <div className='homeThird'>
                        <div className='fightersImagesInFightDetails' data-aos="zoom-in">
                            <div className='flexColumn'>
                                <div className='imgWrapFights' style={{border:'none'}}>
                                    <img src={match.fighterAImage} style={{border:'3px solid blue'}} alt={match.matchFighterA} />
                                </div>
                                <h1 className='fightTypeInFightDetails'>{match.matchFighterA}</h1>
                            </div>
                            <h1>VS</h1>
                            <div className='flexColumn'>
                                <div className='imgWrapFights' style={{border:'none'}}>
                                    <img src={match.fighterBImage} style={{border:'3px solid red'}} alt={match.matchFighterB} />
                                </div>
                                <h1 className='fightTypeInFightDetails'>{match.matchFighterB}</h1>
                            </div>
                        </div>   
                        <div className="videoWrapper">
      <iframe
        src={getYouTubeEmbedUrl(match.matchVideoUrl)}
        title="YouTube video player"
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      ></iframe>
    </div>
    
    
    <div className='leaderboardHeading'>
                            <h3 data-aos="zoom-in">FIGHT COMPLETED</h3>
                        </div>
                     <div id="pdfContent" style={{width:'100%'}}>
                        <div className='roundResultsWrapper'>
                            {userScore ? renderRoundResults(userScore.predictions) : <p>No data available.</p>}
                            <div className='winnerDiv'>
                            <div className='winnerSuDivbOne'>
            <div className='winnerImg'>
                <img src={winner.profileUrl} alt="Winner" />
            </div>
            <div className='winnerDetails'>
                <h1>Winner</h1>
                <h2>{winner.firstName}<span className='toRemove'> {winner.lastName}</span></h2>
            </div>
        </div>
                                <div className='winnerSibDivTwo'>
                                    <h1>Points Grand Total</h1>
                                    <h2>{totalPoints}</h2>
                                </div>
                            </div>
                        </div> </div>
                        <button onClick={downloadPredictionPDF} className="download-btn">
  Download Prediction Report
</button>
 
                    </div>  
                </div>
            </div>
        </div>
    );
};

export default FinishedFightUserBoard;
