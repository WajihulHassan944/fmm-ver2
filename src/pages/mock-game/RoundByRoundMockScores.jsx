import React, { useMemo } from 'react';
import { FaBolt, FaCheck, FaFlagCheckered, FaShieldAlt, FaTimes, FaTrophy } from 'react-icons/fa';
import MockLeaderboard from './MockLeaderboard';
import { SCORE_POINTS } from '@/Utils/scoringRules';

const OFFICIAL_SCORECARD = {
  Boxing: {
    fighterOne: [
      { HP: 18, BP: 9, TP: 27, RW: SCORE_POINTS.RW, KO: SCORE_POINTS.SP },
      { HP: 14, BP: 12, TP: 26, RW: SCORE_POINTS.RL, KO: SCORE_POINTS.SP },
      { HP: 19, BP: 8, TP: 27, RW: SCORE_POINTS.RW, KO: SCORE_POINTS.SP },
    ],
    fighterTwo: [
      { HP: 15, BP: 10, TP: 25, RW: SCORE_POINTS.RL, KO: SCORE_POINTS.SP },
      { HP: 17, BP: 13, TP: 30, RW: SCORE_POINTS.RW, KO: SCORE_POINTS.SP },
      { HP: 15, BP: 11, TP: 26, RW: SCORE_POINTS.RL, KO: SCORE_POINTS.KO },
    ],
  },
  MMA: {
    fighterOne: [
      { ST: 51, KI: 12, KN: 2, EL: 2, RW: SCORE_POINTS.RW, KO: SCORE_POINTS.SP },
      { ST: 48, KI: 11, KN: 5, EL: 2, RW: SCORE_POINTS.RL, KO: SCORE_POINTS.SP },
      { ST: 49, KI: 13, KN: 2, EL: 5, RW: SCORE_POINTS.RW, KO: SCORE_POINTS.SP },
    ],
    fighterTwo: [
      { ST: 47, KI: 16, KN: 2, EL: 2, RW: SCORE_POINTS.RL, KO: SCORE_POINTS.SP },
      { ST: 47, KI: 8, KN: 1, EL: 1, RW: SCORE_POINTS.RW, KO: SCORE_POINTS.SP },
      { ST: 52, KI: 14, KN: 3, EL: 2, RW: SCORE_POINTS.RL, KO: SCORE_POINTS.KO },
    ],
  },
};

const METRICS = {
  Boxing: [
    { prefix: 'hpPrediction', code: 'HP', label: 'Head punches' },
    { prefix: 'bpPrediction', code: 'BP', label: 'Body punches' },
    { prefix: 'tpPrediction', code: 'TP', label: 'Total punches' },
  ],
  MMA: [
    { prefix: 'stPrediction', code: 'ST', label: 'Strikes' },
    { prefix: 'kiPrediction', code: 'KI', label: 'Kicks' },
    { prefix: 'knPrediction', code: 'KN', label: 'Knockdowns' },
    { prefix: 'elPrediction', code: 'EL', label: 'Elbows' },
  ],
};

const asNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
};

const outcomeLabel = (value, type) => {
  if (type === 'winner') return value === SCORE_POINTS.RW ? 'Selected' : 'Not selected';
  if (type === 'finish') return value === SCORE_POINTS.KO ? 'KO selected' : 'No KO';
  return '—';
};

const RoundByRoundMockScores = ({ predictions = [], matchCategory = 'Boxing', fight, activeView = 'scores' }) => {
  const category = String(matchCategory).toLowerCase() === 'mma' ? 'MMA' : 'Boxing';
  const metrics = METRICS[category];
  const official = OFFICIAL_SCORECARD[category];

  const scoredRounds = useMemo(() => predictions.map((round, index) => {
    const officialA = official.fighterOne[index] || {};
    const officialB = official.fighterTwo[index] || {};

    const scoreFighter = (side, officialStats) => {
      const metricRows = metrics.map((metric) => {
        const prediction = asNumber(round?.[`${metric.prefix}${side}`]);
        const actual = asNumber(officialStats?.[metric.code]);
        const earned = prediction > 0 && prediction <= actual ? prediction : 0;
        return { ...metric, prediction, actual, earned, hit: earned > 0 };
      });

      const winnerPrediction = asNumber(round?.[`rwPrediction${side}`]);
      const finishPrediction = asNumber(round?.[`koPrediction${side}`]);
      const winnerEarned = winnerPrediction > 0 && winnerPrediction === asNumber(officialStats?.RW) ? winnerPrediction : 0;
      const finishEarned = finishPrediction > 0 && finishPrediction === asNumber(officialStats?.KO) ? finishPrediction : 0;
      const total = metricRows.reduce((sum, metric) => sum + metric.earned, 0) + winnerEarned + finishEarned;

      return {
        metrics: metricRows,
        winnerPrediction,
        winnerActual: asNumber(officialStats?.RW),
        winnerEarned,
        finishPrediction,
        finishActual: asNumber(officialStats?.KO),
        finishEarned,
        total,
      };
    };

    const fighterA = scoreFighter(1, officialA);
    const fighterB = scoreFighter(2, officialB);

    return {
      round: round?.round || index + 1,
      fighterA,
      fighterB,
      points: fighterA.total + fighterB.total,
    };
  }), [metrics, official.fighterOne, official.fighterTwo, predictions]);

  const totalPoints = useMemo(
    () => scoredRounds.reduce((sum, round) => sum + round.points, 0),
    [scoredRounds],
  );

  const correctMetrics = useMemo(
    () => scoredRounds.reduce((total, round) => total
      + round.fighterA.metrics.filter((metric) => metric.hit).length
      + round.fighterB.metrics.filter((metric) => metric.hit).length,
    0),
    [scoredRounds],
  );

  const fighterOneName = fight?.fighterOne?.shortName || fight?.fighterOne?.name || 'Fighter A';
  const fighterTwoName = fight?.fighterTwo?.shortName || fight?.fighterTwo?.name || 'Fighter B';

  if (activeView === 'leaderboard') {
    return (
      <div className="mock-score-view mock-leaderboard-view">
        <div className="mock-score-recap-strip">
          <span><FaTrophy /><strong>{totalPoints.toLocaleString()}</strong><small>Your mock points</small></span>
          <span><FaCheck /><strong>{correctMetrics}</strong><small>Qualified metric calls</small></span>
          <span><FaFlagCheckered /><strong>{category}</strong><small>Simulation rules</small></span>
        </div>
        <MockLeaderboard totalPoints={totalPoints} />
      </div>
    );
  }

  return (
    <div className="mock-score-view mock-scorecard-view">
      <section className="mock-score-summary">
        <div>
          <p><FaBolt /> Final mock score</p>
          <strong>{totalPoints.toLocaleString()}</strong>
          <span>points</span>
        </div>
        <article><FaCheck /><span><strong>{correctMetrics}</strong><small>Qualified metric calls</small></span></article>
        <article><FaFlagCheckered /><span><strong>{scoredRounds.length}</strong><small>Rounds scored</small></span></article>
        <article><FaShieldAlt /><span><strong>Local</strong><small>No API or wallet activity</small></span></article>
      </section>

      <div className="mock-round-result-list">
        {scoredRounds.map((round) => (
          <article className="mock-round-result-card" key={round.round}>
            <header>
              <div><span>Official simulation result</span><h3>Round {round.round}</h3></div>
              <strong>{round.points.toLocaleString()} <small>PTS</small></strong>
            </header>

            <div className="mock-round-result-fighters">
              {[
                { side: 'A', name: fighterOneName, image: fight?.fighterOne?.image, score: round.fighterA },
                { side: 'B', name: fighterTwoName, image: fight?.fighterTwo?.image, score: round.fighterB },
              ].map((fighter) => (
                <section key={fighter.side}>
                  <div className="mock-round-result-fighter-heading">
                    {fighter.image && <img src={fighter.image} alt="" aria-hidden="true" />}
                    <span><small>Fighter {fighter.side}</small><h4>{fighter.name}</h4></span>
                    <strong>{fighter.score.total} <em>PTS</em></strong>
                  </div>

                  <div className="mock-round-result-table">
                    <div className="mock-round-result-table-head"><span>Metric</span><span>Pick</span><span>Official</span><span>Result</span></div>
                    {fighter.score.metrics.map((metric) => (
                      <div className="mock-round-result-row" key={metric.code}>
                        <span><b>{metric.label}</b><em>{metric.code}</em></span>
                        <strong>{metric.prediction || '—'}</strong>
                        <strong>{metric.actual}</strong>
                        <span className={metric.hit ? 'is-hit' : 'is-miss'}>{metric.hit ? <FaCheck /> : <FaTimes />}{metric.earned ? `+${metric.earned}` : '0'}</span>
                      </div>
                    ))}
                    <div className="mock-round-result-row is-outcome">
                      <span><b>Round winner</b><em>RW</em></span>
                      <strong>{outcomeLabel(fighter.score.winnerPrediction, 'winner')}</strong>
                      <strong>{fighter.score.winnerActual === SCORE_POINTS.RW ? 'Won round' : 'Lost round'}</strong>
                      <span className={fighter.score.winnerEarned ? 'is-hit' : 'is-miss'}>{fighter.score.winnerEarned ? <FaCheck /> : <FaTimes />}{fighter.score.winnerEarned ? `+${fighter.score.winnerEarned}` : '0'}</span>
                    </div>
                    <div className="mock-round-result-row is-outcome">
                      <span><b>Finish call</b><em>KO</em></span>
                      <strong>{outcomeLabel(fighter.score.finishPrediction, 'finish')}</strong>
                      <strong>{fighter.score.finishActual === SCORE_POINTS.KO ? 'KO finish' : 'No KO'}</strong>
                      <span className={fighter.score.finishEarned ? 'is-hit' : 'is-miss'}>{fighter.score.finishEarned ? <FaCheck /> : <FaTimes />}{fighter.score.finishEarned ? `+${fighter.score.finishEarned}` : '0'}</span>
                    </div>
                  </div>
                </section>
              ))}
            </div>
          </article>
        ))}
      </div>

      <footer className="mock-scorecard-footer">
        <FaTrophy />
        <div><strong>Scorecard complete</strong><p>Open the Leaderboard tab above to rank this score against the local mock field.</p></div>
      </footer>
    </div>
  );
};

export default RoundByRoundMockScores;
