import { useRouter } from 'next/router';
import React, { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import {
  FaCheck,
  FaClock,
  FaCoins,
  FaFistRaised,
  FaShieldAlt,
  FaTrophy,
} from 'react-icons/fa';
import { FMM_ASSET_BASE, getFighterImage } from '@/Utils/fightExperience';
import { SCORE_POINTS } from '@/Utils/scoringRules';

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
  const match = Array.isArray(matches) ? matches.find((item) => item._id === matchId) : null;
  const roundCount = Math.max(Number(match?.maxRounds) || 3, 1);
  const isBoxing = String(match?.matchCategory || '').toLowerCase() === 'boxing';

  const [rounds, setRounds] = useState(() => Array.from({ length: roundCount }, (_, index) => buildRound(index + 1)));
  const [timeRemaining, setTimeRemaining] = useState({ diffHrs: 0, diffMins: 0, diffSecs: 0, hasStarted: false });
  const [buttonText, setButtonText] = useState('Submit Predictions');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setRounds((current) => {
      if (current.length === roundCount) return current;
      return Array.from({ length: roundCount }, (_, index) => current[index] || buildRound(index + 1));
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
      const diffMs = matchDateTime - new Date();
      const hasStarted = diffMs <= 0 || Number.isNaN(diffMs);

      setTimeRemaining({
        diffHrs: hasStarted ? 0 : Math.floor(diffMs / (1000 * 60 * 60)),
        diffMins: hasStarted ? 0 : Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60)),
        diffSecs: hasStarted ? 0 : Math.floor((diffMs % (1000 * 60)) / 1000),
        hasStarted,
      });
    };

    calculateTimeRemaining();
    const interval = window.setInterval(calculateTimeRemaining, 1000);
    return () => window.clearInterval(interval);
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
    setRounds((current) => current.map((round, index) => (
      index === roundIndex ? { ...round, [field]: value } : round
    )));
  };

  const selectRoundWinner = (roundIndex, side) => {
    setRounds((current) => current.map((round, index) => {
      if (index !== roundIndex) return round;
      const fighterAWins = side === 'A';
      return {
        ...round,
        rwPrediction1: fighterAWins ? SCORE_POINTS.RW : SCORE_POINTS.RL,
        rwPrediction2: fighterAWins ? SCORE_POINTS.RL : SCORE_POINTS.RW,
        rwText: fighterAWins ? 'RW' : 'RL',
        rlText: fighterAWins ? 'RL' : 'RW',
        rwBorder: fighterAWins ? '2px solid #2f9cff' : '2px solid rgba(255,255,255,.16)',
        rlBorder: fighterAWins ? '2px solid rgba(255,255,255,.16)' : '2px solid #ed1f31',
      };
    }));
  };

  const selectFinish = (roundIndex, side) => {
    setRounds((current) => current.map((round, index) => {
      if (index !== roundIndex) return round;
      const fighterAFinishes = side === 'A';
      return {
        ...round,
        koPrediction1: fighterAFinishes ? SCORE_POINTS.KO : SCORE_POINTS.SP,
        koPrediction2: fighterAFinishes ? SCORE_POINTS.SP : SCORE_POINTS.KO,
        koText: fighterAFinishes ? 'KO' : 'SP',
        spText: fighterAFinishes ? 'SP' : 'KO',
        koBorder: fighterAFinishes ? '2px solid #2f9cff' : '2px solid rgba(255,255,255,.16)',
        spBorder: fighterAFinishes ? '2px solid rgba(255,255,255,.16)' : '2px solid #ed1f31',
      };
    }));
  };

  const getWinnerSide = (round) => {
    if (Number(round.rwPrediction1) === SCORE_POINTS.RW) return 'A';
    if (Number(round.rwPrediction2) === SCORE_POINTS.RW) return 'B';
    return '';
  };

  const getFinishSide = (round) => {
    if (Number(round.koPrediction1) === SCORE_POINTS.KO) return 'A';
    if (Number(round.koPrediction2) === SCORE_POINTS.KO) return 'B';
    return '';
  };

  const handleFinish = async () => {
    if (submitting) return;
    setSubmitting(true);
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
      setSubmitting(false);
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
    <section className="xp-prediction-arena player-prediction-premium player-prediction-scorecard-v2">
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

        <div className="player-round-board-v2">
          {rounds.map((round, roundIndex) => {
            const winnerSide = getWinnerSide(round);
            const finishSide = getFinishSide(round);

            return (
              <article className="player-round-card-v2" key={round.round}>
                <header className="player-round-card-v2-header">
                  <div className="player-round-corner is-a">
                    <img src={fighterAImage} alt={match.matchFighterA} />
                    <span><small>Blue corner</small><strong>{match.matchFighterA}</strong></span>
                  </div>
                  <div className="player-round-number">
                    <small>Prediction card</small>
                    <strong>Round {round.round}</strong>
                    <span>{isBoxing ? 'Boxing' : 'Combat'} scoring</span>
                  </div>
                  <div className="player-round-corner is-b">
                    <span><small>Red corner</small><strong>{match.matchFighterB}</strong></span>
                    <img src={fighterBImage} alt={match.matchFighterB} />
                  </div>
                </header>

                <div className="player-round-score-table">
                  <div className="player-round-score-head">
                    <span>{match.matchFighterA}</span>
                    <strong>Predicted action</strong>
                    <span>{match.matchFighterB}</span>
                  </div>
                  {metricLabels.map((metric) => (
                    <div className={`player-round-score-row ${metric.featured ? 'is-featured' : ''}`} key={`${round.round}-${metric.code}`}>
                      <label className="is-a">
                        <input
                          type="number"
                          min="0"
                          inputMode="numeric"
                          value={round[metric.left]}
                          onChange={(event) => handlePredictionChange(event, roundIndex, metric.left)}
                          aria-label={`${metric.title} for ${match.matchFighterA}`}
                        />
                        <small>{match.matchFighterA}</small>
                      </label>
                      <div>
                        <img src={metricIcon} alt="" aria-hidden="true" />
                        <span><b>{metric.code}</b><strong>{metric.title}</strong></span>
                      </div>
                      <label className="is-b">
                        <input
                          type="number"
                          min="0"
                          inputMode="numeric"
                          value={round[metric.right]}
                          onChange={(event) => handlePredictionChange(event, roundIndex, metric.right)}
                          aria-label={`${metric.title} for ${match.matchFighterB}`}
                        />
                        <small>{match.matchFighterB}</small>
                      </label>
                    </div>
                  ))}
                </div>

                <div className="player-round-outcome-grid">
                  <section>
                    <header><span>Round result</span><strong>Pick the round winner</strong></header>
                    <div>
                      <button
                        type="button"
                        className={`is-a ${winnerSide === 'A' ? 'is-active' : ''}`}
                        onClick={() => selectRoundWinner(roundIndex, 'A')}
                        aria-pressed={winnerSide === 'A'}
                      >
                        <img src={fighterAImage} alt="" />
                        <span><small>{match.matchFighterA}</small><strong>{winnerSide === 'B' ? 'RL' : 'RW'}</strong><em>{winnerSide === 'A' ? 'Round winner' : winnerSide === 'B' ? 'Round loss' : 'Select corner'}</em></span>
                        {winnerSide === 'A' && <FaCheck />}
                      </button>
                      <button
                        type="button"
                        className={`is-b ${winnerSide === 'B' ? 'is-active' : ''}`}
                        onClick={() => selectRoundWinner(roundIndex, 'B')}
                        aria-pressed={winnerSide === 'B'}
                      >
                        <img src={fighterBImage} alt="" />
                        <span><small>{match.matchFighterB}</small><strong>{winnerSide === 'A' ? 'RL' : 'RW'}</strong><em>{winnerSide === 'B' ? 'Round winner' : winnerSide === 'A' ? 'Round loss' : 'Select corner'}</em></span>
                        {winnerSide === 'B' && <FaCheck />}
                      </button>
                    </div>
                  </section>

                  <section>
                    <header><span>Finish call</span><strong>Pick KO or score path</strong></header>
                    <div>
                      <button
                        type="button"
                        className={`is-a ${finishSide === 'A' ? 'is-active' : ''}`}
                        onClick={() => selectFinish(roundIndex, 'A')}
                        aria-pressed={finishSide === 'A'}
                      >
                        <img src={fighterAImage} alt="" />
                        <span><small>{match.matchFighterA}</small><strong>{finishSide === 'B' ? 'SP' : 'KO'}</strong><em>{finishSide === 'A' ? 'Knockout pick' : finishSide === 'B' ? 'Score path' : 'Select corner'}</em></span>
                        {finishSide === 'A' && <FaCheck />}
                      </button>
                      <button
                        type="button"
                        className={`is-b ${finishSide === 'B' ? 'is-active' : ''}`}
                        onClick={() => selectFinish(roundIndex, 'B')}
                        aria-pressed={finishSide === 'B'}
                      >
                        <img src={fighterBImage} alt="" />
                        <span><small>{match.matchFighterB}</small><strong>{finishSide === 'A' ? 'SP' : 'KO'}</strong><em>{finishSide === 'B' ? 'Knockout pick' : finishSide === 'A' ? 'Score path' : 'Select corner'}</em></span>
                        {finishSide === 'B' && <FaCheck />}
                      </button>
                    </div>
                  </section>
                </div>
              </article>
            );
          })}
        </div>

        <div className="xp-prediction-submit-panel">
          <div><FaShieldAlt /><span>Every existing score field, endpoint, and prediction-status update remains intact.</span></div>
          <button type="button" className="theme-btn theme-btn-primary" onClick={handleFinish} disabled={submitting}>
            <FaTrophy /> {buttonText}
          </button>
        </div>
      </div>
    </section>
  );
};

export default MakePredictions;
