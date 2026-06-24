import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { getWinnerDetails } from '../../CustomFunctions/winnerUtils';
import { useDispatch } from 'react-redux';
import { stopMusic, playMusic } from '../../Redux/musicSlice';
import { useRouter } from 'next/router';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { FaCoins, FaDownload, FaFistRaised, FaMedal, FaPlay, FaTrophy, FaUsers } from 'react-icons/fa';
import { getFightCategory, getFighterImage } from '@/Utils/fightExperience';

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
    
    const getYouTubeEmbedUrl = (url = '') => {
        if (url.includes('youtu.be/')) return `https://www.youtube.com/embed/${url.split('youtu.be/')[1]?.split('?')[0] || ''}`;
        if (url.includes('watch?v=')) return `https://www.youtube.com/embed/${url.split('watch?v=')[1]?.split('&')[0] || ''}`;
        if (url.includes('/embed/')) return url;
        return '';
      };
      
  const renderRoundResults = (predictions) => {
    const isBoxing = match.matchCategory === 'boxing';
    const scoreLabels = isBoxing
      ? { hp: 'HP', bp: 'BP', tp: 'TP', rw: 'RW', rl: 'RL', ko: 'KO', sp: 'SP' }
      : { hp: 'ST', bp: 'KI', tp: 'KN', rw: 'RW', rl: 'RL', ko: 'KO', sp: 'SP', el: 'EL' };

    return predictions.map((round, index) => {
      const hasValidPredictions = round.hpPrediction1 !== null || round.bpPrediction1 !== null
        || round.tpPrediction1 !== null || round.rwPrediction1 !== null
        || round.koPrediction1 !== null || round.hpPrediction2 !== null
        || round.bpPrediction2 !== null || round.tpPrediction2 !== null
        || round.elPrediction1 !== null || round.elPrediction2 !== null
        || round.rwPrediction2 !== null || round.koPrediction2 !== null;

      let roundPoints = 0;
      if (hasValidPredictions) {
        let fighterOneRound;
        let fighterTwoRound;
        if (isBoxing && match.BoxingMatch) {
          fighterOneRound = match.BoxingMatch.fighterOneStats[index];
          fighterTwoRound = match.BoxingMatch.fighterTwoStats[index];
        } else if (!isBoxing && match.MMAMatch) {
          fighterOneRound = match.MMAMatch.fighterOneStats[index];
          fighterTwoRound = match.MMAMatch.fighterTwoStats[index];
        }
        if (fighterOneRound && fighterTwoRound) {
          roundPoints = calculateRoundPoints(round, fighterOneRound, fighterTwoRound);
          totalPoints += roundPoints;
        }
      }

      const metrics = [
        { code: scoreLabels.hp, title: isBoxing ? 'Head punches' : 'Significant strikes', left: round.hpPrediction1, right: round.hpPrediction2 },
        { code: scoreLabels.bp, title: isBoxing ? 'Body punches' : 'Kicks', left: round.bpPrediction1, right: round.bpPrediction2 },
        { code: scoreLabels.tp, title: isBoxing ? 'Total punches' : 'Knockdowns', left: round.tpPrediction1, right: round.tpPrediction2 },
        ...(!isBoxing ? [{ code: scoreLabels.el, title: 'Elbow strikes', left: round.elPrediction1, right: round.elPrediction2 }] : []),
        { code: `${scoreLabels.rw}/${scoreLabels.rl}`, title: 'Round result', left: round.rwPrediction1, right: round.rwPrediction2 },
        { code: `${scoreLabels.ko}/${scoreLabels.sp}`, title: 'Finish call', left: round.koPrediction1, right: round.koPrediction2 },
      ];

      return (
        <article key={index} className="player-result-round">
          <header>
            <div><span>Round</span><strong>{round.round || index + 1}</strong></div>
            <p>Prediction points <b>{roundPoints}</b></p>
          </header>
          <div className="player-result-round-fighters">
            <span>{match.matchFighterA}</span><em>Metric</em><span>{match.matchFighterB}</span>
          </div>
          <div className="player-result-metric-grid">
            {metrics.map((metric) => (
              <div key={`${index}-${metric.code}`}>
                <b>{metric.left !== null && metric.left !== '' ? metric.left : '—'}</b>
                <span><small>{metric.title}</small><strong>{metric.code}</strong></span>
                <b>{metric.right !== null && metric.right !== '' ? metric.right : '—'}</b>
              </div>
            ))}
          </div>
        </article>
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


    if (!match) {
      return <div className="player-dynamic-empty"><FaTrophy /><h2>Fight result unavailable</h2><p>The selected completed fight is not available.</p></div>;
    }

    const fighterAImage = getFighterImage(match, 'A', 0);
    const fighterBImage = getFighterImage(match, 'B', 1);
    const videoUrl = getYouTubeEmbedUrl(match.matchVideoUrl);
    const reportTotalPoints = userScore?.predictions?.reduce((sum, round, index) => {
      const fighterOneRound = match.matchCategory === 'boxing'
        ? match.BoxingMatch?.fighterOneStats?.[index]
        : match.MMAMatch?.fighterOneStats?.[index];
      const fighterTwoRound = match.matchCategory === 'boxing'
        ? match.BoxingMatch?.fighterTwoStats?.[index]
        : match.MMAMatch?.fighterTwoStats?.[index];
      return sum + (fighterOneRound && fighterTwoRound ? calculateRoundPoints(round, fighterOneRound, fighterTwoRound) : 0);
    }, 0) || 0;

    return (
      <section className="player-completed-result finishedFightUserBoard">
        <div className="player-completed-result-backdrop" aria-hidden="true" />
        <div className="theme-container player-completed-result-shell">
          <header className="player-completed-result-hero">
            <div>
              <p><FaTrophy /> Completed fight report</p>
              <h1>{match.matchFighterA} <span>vs</span> {match.matchFighterB}</h1>
              <div>
                <span><FaFistRaised /> {getFightCategory(match)}</span>
                <span><FaCoins /> Pot {match.pot || 0}</span>
                <span><FaUsers /> {Array.isArray(match.userPredictions) ? match.userPredictions.length : 0} players</span>
              </div>
            </div>
            <button type="button" onClick={() => router.push('/checkout')}>
              <FaCoins /><span><small>Fight wallet</small><strong>{user.tokens || 0}</strong><em>tokens remaining</em></span>
            </button>
          </header>

          <section className="player-completed-fight-card">
            <article className="is-blue"><img src={fighterAImage} alt={match.matchFighterA} /><span><small>Blue corner</small><strong>{match.matchFighterA}</strong></span></article>
            <div><b>FINAL</b><small>{match.maxRounds || '—'} rounds</small></div>
            <article className="is-red"><img src={fighterBImage} alt={match.matchFighterB} /><span><small>Red corner</small><strong>{match.matchFighterB}</strong></span></article>
          </section>

          {videoUrl && (
            <section className="player-completed-video">
              <div className="player-result-section-heading"><span><FaPlay /> Fight replay</span><h2>Review the posted fight video</h2></div>
              <iframe
                src={videoUrl}
                title="YouTube video player"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </section>
          )}

          <div id="pdfContent" className="player-completed-pdf-content">
            <section className="player-completed-winner-card">
              <div className="player-completed-winner-profile">
                <i><FaMedal /></i>
                <img src={winner.profileUrl || '/images/fmm-experience/avatar-placeholder.svg'} alt="Winner" />
                <span><small>Fight winner</small><strong>{winner.firstName || 'Pending'} {winner.lastName || ''}</strong></span>
              </div>
              <div><small>Your prediction total</small><strong>{reportTotalPoints}</strong><span>points</span></div>
            </section>

            <section className="player-completed-score-report">
              <div className="player-result-section-heading">
                <div><span><FaFistRaised /> Your scorecard</span><h2>Round-by-round prediction report</h2></div>
                <p>Every submitted field remains visible in the report.</p>
              </div>
              <div className="roundResultsWrapper">
                {userScore ? renderRoundResults(userScore.predictions) : <div className="player-dynamic-empty is-inline"><FaTrophy /><h3>No prediction report available</h3></div>}
              </div>
            </section>
          </div>

          <button onClick={downloadPredictionPDF} className="download-btn player-result-download">
            <FaDownload /> Download prediction report
          </button>
        </div>
      </section>
    );
};

export default FinishedFightUserBoard;
