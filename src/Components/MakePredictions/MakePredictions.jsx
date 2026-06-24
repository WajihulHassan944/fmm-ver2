
import { useRouter } from 'next/router';
import React, { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { FaClock, FaCoins, FaFistRaised, FaShieldAlt, FaTrophy } from 'react-icons/fa';
import { FMM_ASSET_BASE, getFighterImage } from '@/Utils/fightExperience';

const buildRound = (round) => ({
  round,
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
  spText: 'SP',
});

const metricIcon = `${FMM_ASSET_BASE}/fight-slashes.svg`;

const MakePredictions = ({ matchId }) => {
  const router = useRouter();
  const user = useSelector((state) => state.user);
  const matches = useSelector((state) => state.matches.data);
  const match = Array.isArray(matches) ? matches.find((m) => m._id === matchId) : null;
  const roundCount = Math.max(Number(match?.maxRounds) || 3, 1);
  const isBoxing = String(match?.matchCategory || '').toLowerCase() === 'boxing';

  const [rounds, setRounds] = useState(() => Array.from({ length: roundCount }, (_, i) => buildRound(i + 1)));
  const [timeRemaining, setTimeRemaining] = useState({ diffHrs: 0, diffMins: 0, diffSecs: 0, hasStarted: false });
  const [buttonText, setButtonText] = useState('Submit Predictions');

  useEffect(() => {
    setRounds((current) => {
      if (current.length === roundCount) return current;
      return Array.from({ length: roundCount }, (_, i) => current[i] || buildRound(i + 1));
    });
  }, [roundCount]);

  useEffect(() => {
    const dashboardArrow = document.querySelector('.dashboard-back-arrow');
    if (dashboardArrow) dashboardArrow.style.display = 'none';
    return () => {
      if (dashboardArrow) dashboardArrow.style.display = 'block';
    };
  }, []);

  useEffect(() => {
    if (!match) return undefined;

    const calculateTimeRemaining = () => {
      const matchDateTime = new Date(`${match.matchDate?.split('T')[0]}T${match.matchTime || '00:00'}`);
      const now = new Date();
      const diffMs = matchDateTime - now;
      const hasStarted = diffMs <= 0 || Number.isNaN(diffMs);

      setTimeRemaining({
        diffHrs: hasStarted ? 0 : Math.floor(diffMs / (1000 * 60 * 60)),
        diffMins: hasStarted ? 0 : Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60)),
        diffSecs: hasStarted ? 0 : Math.floor((diffMs % (1000 * 60)) / 1000),
        hasStarted,
      });
    };

    calculateTimeRemaining();
    const interval = setInterval(calculateTimeRemaining, 1000);
    return () => clearInterval(interval);
  }, [match]);

  const metricLabels = useMemo(() => {
    if (isBoxing) {
      return [
        { code: 'HP', title: 'Head punches', left: 'hpPrediction1', right: 'hpPrediction2' },
        { code: 'BP', title: 'Body punches', left: 'bpPrediction1', right: 'bpPrediction2' },
        { code: 'TP', title: 'Total punches', left: 'tpPrediction1', right: 'tpPrediction2', featured: true },
      ];
    }
    return [
      { code: 'ST', title: 'Significant strikes', left: 'hpPrediction1', right: 'hpPrediction2' },
      { code: 'KI', title: 'Kicks', left: 'bpPrediction1', right: 'bpPrediction2' },
      { code: 'KN', title: 'Knockdowns', left: 'tpPrediction1', right: 'tpPrediction2', featured: true },
      { code: 'EL', title: 'Elbows', left: 'elPrediction1', right: 'elPrediction2' },
    ];
  }, [isBoxing]);

  const handlePredictionChange = (event, roundIndex, field) => {
    const { value } = event.target;
    setRounds((current) => {
      const updated = [...current];
      updated[roundIndex] = { ...updated[roundIndex], [field]: value };
      return updated;
    });
  };

  const handleButtonClick = (roundIndex, buttonType) => {
    setRounds((current) => {
      const updated = [...current];
      const currentRound = { ...updated[roundIndex] };

      if (buttonType === 'rw') {
        if (currentRound.rwText === 'RW') {
          currentRound.rwPrediction1 = 100;
          currentRound.rwPrediction2 = 25;
          currentRound.rwText = 'RL';
          currentRound.rlText = 'RW';
        } else {
          currentRound.rwPrediction1 = 25;
          currentRound.rwPrediction2 = 100;
          currentRound.rwText = 'RW';
          currentRound.rlText = 'RL';
        }
        currentRound.rwBorder = '2px solid #95a04d';
        currentRound.rlBorder = '2px solid #95a04d';
      } else if (buttonType === 'ko') {
        if (currentRound.koText === 'KO') {
          currentRound.koPrediction1 = 500;
          currentRound.koPrediction2 = 25;
          currentRound.koText = 'SP';
          currentRound.spText = 'KO';
        } else {
          currentRound.koPrediction1 = 25;
          currentRound.koPrediction2 = 500;
          currentRound.koText = 'KO';
          currentRound.spText = 'SP';
        }
        currentRound.koBorder = '2px solid #95a04d';
        currentRound.spBorder = '2px solid #95a04d';
      }

      updated[roundIndex] = currentRound;
      return updated;
    });
  };

  const handleFinish = async () => {
    setButtonText('Saving!');
    try {
      await fetch('https://fantasymmadness-game-server-three.vercel.app/api/scores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playerId: user._id,
          matchId,
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
    return (
      <section className="xp-prediction-arena is-empty">
        <div className="theme-container"><div className="xp-empty-card">Match not found</div></div>
      </section>
    );
  }

  const fighterAImage = getFighterImage(match, 'A', 0);
  const fighterBImage = getFighterImage(match, 'B', 1);

  return (
    <section className="xp-prediction-arena player-prediction-premium">
      <div className="theme-container">
        <div className="xp-prediction-hero">
          <div className="xp-prediction-hero-copy">
            <span><FaFistRaised /> Prediction scorecard</span>
            <h1>{match.matchFighterA} <em>vs</em> {match.matchFighterB}</h1>
            <p>{match.matchCategoryTwo || match.matchCategory} · {match.matchType} · {roundCount} rounds</p>
            <div className="xp-prediction-countdown"><FaClock /> {timeRemaining.hasStarted ? 'Fight has started' : `${timeRemaining.diffHrs}h ${timeRemaining.diffMins}m ${timeRemaining.diffSecs}s until lock`}</div>
          </div>
          <button className="xp-prediction-wallet" type="button" onClick={() => router.push('/checkout')}>
            <FaCoins />
            <span>Fight wallet</span>
            <strong>{user.tokens || 0}</strong>
            <small>tokens remaining</small>
          </button>
        </div>

        <div className="xp-prediction-fighters">
          <article>
            <img src={fighterAImage} alt={match.matchFighterA} />
            <div><span>Blue corner</span><strong>{match.matchFighterA}</strong></div>
          </article>
          <div className="xp-prediction-vs">VS</div>
          <article>
            <img src={fighterBImage} alt={match.matchFighterB} />
            <div><span>Red corner</span><strong>{match.matchFighterB}</strong></div>
          </article>
        </div>

        <div className="xp-prediction-member-strip">
          <img src={user.profileUrl || '/images/fmm-experience/avatar-placeholder.svg'} alt={user.firstName || 'Member'} />
          <div><span>Member</span><strong>{user.firstName} {user.lastName}</strong></div>
          <div><span>Plan</span><strong>{user.currentPlan || 'Player'}</strong></div>
          <div><span>Prediction type</span><strong>{isBoxing ? 'Boxing metrics' : 'MMA metrics'}</strong></div>
        </div>

        <div className="player-prediction-flow-strip" aria-label="Prediction workflow">
          <span><b>1</b><strong>Review the card</strong><small>Confirm fighters and rules</small></span>
          <i aria-hidden="true" />
          <span><b>2</b><strong>Call every round</strong><small>Enter all available metrics</small></span>
          <i aria-hidden="true" />
          <span><b>3</b><strong>Submit picks</strong><small>Lock the existing score payload</small></span>
        </div>

        <div className="xp-round-board">
          {rounds.map((round, index) => (
            <article className="xp-round-card" key={round.round}>
              <header>
                <span>Round</span>
                <strong>{round.round}</strong>
              </header>

              <div className="xp-round-metrics">
                {metricLabels.map((metric) => (
                  <div className={`xp-round-metric ${metric.featured ? 'is-featured' : ''}`} key={`${round.round}-${metric.code}`}>
                    <label>
                      <span>{metric.title}</span>
                      <strong>{metric.code}</strong>
                    </label>
                    <div className="xp-metric-input-row">
                      <input type="number" value={round[metric.left]} onChange={(event) => handlePredictionChange(event, index, metric.left)} aria-label={`${metric.title} for ${match.matchFighterA}`} />
                      <img src={metricIcon} alt="" aria-hidden="true" />
                      <input type="number" value={round[metric.right]} onChange={(event) => handlePredictionChange(event, index, metric.right)} aria-label={`${metric.title} for ${match.matchFighterB}`} />
                    </div>
                  </div>
                ))}
              </div>

              <div className="xp-round-buttons">
                <button type="button" className="is-blue" style={{ border: round.rwBorder }} onClick={() => handleButtonClick(index, 'rw')}>{round.rwText}<small>Round result</small></button>
                <span>or</span>
                <button type="button" className="is-red" style={{ border: round.rlBorder }} onClick={() => handleButtonClick(index, 'rw')}>{round.rlText}<small>Round result</small></button>
                <button type="button" className="is-blue" style={{ border: round.koBorder }} onClick={() => handleButtonClick(index, 'ko')}>{round.koText}<small>Finish call</small></button>
                <span>or</span>
                <button type="button" className="is-red" style={{ border: round.spBorder }} onClick={() => handleButtonClick(index, 'ko')}>{round.spText}<small>Finish call</small></button>
              </div>
            </article>
          ))}
        </div>

        <div className="xp-prediction-submit-panel">
          <div><FaShieldAlt /><span>Existing score submission endpoints are unchanged.</span></div>
          <button type="button" className="theme-btn theme-btn-primary" onClick={handleFinish}><FaTrophy /> {buttonText}</button>
        </div>
      </div>
    </section>
  );
};

export default MakePredictions;
