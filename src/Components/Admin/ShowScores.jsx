import React, { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { FaChartBar, FaCheckCircle, FaFistRaised, FaTrophy } from 'react-icons/fa';

const API_BASE = 'https://fantasymmadness-game-server-three.vercel.app';
const FALLBACK_A = '/images/fmm-experience/fighter-action-red.jpg';
const FALLBACK_B = '/images/fmm-experience/fighter-action-blue.jpg';

const BOXING_FIELDS = [
  { key: 'HP', label: 'Head punches' },
  { key: 'BP', label: 'Body punches' },
  { key: 'TP', label: 'Total punches' },
  { key: 'RW', label: 'Rounds won' },
  { key: 'RL', label: 'Rounds lost' },
  { key: 'KO', label: 'Knockout' },
  { key: 'SP', label: 'Scoring points' },
];

const MMA_FIELDS = [
  { key: 'ST', label: 'Strikes' },
  { key: 'KI', label: 'Kicks' },
  { key: 'KN', label: 'Knockdowns' },
  { key: 'EL', label: 'Elbows' },
  { key: 'RW', label: 'Rounds won' },
  { key: 'RL', label: 'Rounds lost' },
  { key: 'KO', label: 'Knockout' },
  { key: 'SP', label: 'Scoring points' },
];

const numericValue = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const ShowScores = ({ matchId, filter }) => {
  const [shadowMatches, setShadowMatches] = useState([]);
  const [shadowLoading, setShadowLoading] = useState(filter !== 'normal');
  const matches = useSelector((state) => state.matches.data);

  useEffect(() => {
    if (filter === 'normal') return undefined;

    let active = true;
    const fetchShadowMatch = async () => {
      setShadowLoading(true);
      try {
        const response = await fetch(`${API_BASE}/shadow`);
        const shadowData = await response.json();
        if (active) setShadowMatches(Array.isArray(shadowData) ? shadowData : []);
      } catch (error) {
        console.error('Error fetching shadow match data:', error);
      } finally {
        if (active) setShadowLoading(false);
      }
    };

    fetchShadowMatch();
    return () => { active = false; };
  }, [filter]);

  const match = useMemo(() => {
    const source = filter === 'shadowTemplate' ? shadowMatches : (Array.isArray(matches) ? matches : []);
    return source.find((item) => String(item?._id || item?.id) === String(matchId));
  }, [filter, matchId, matches, shadowMatches]);

  const isBoxing = match?.matchCategory === 'boxing';
  const fields = isBoxing ? BOXING_FIELDS : MMA_FIELDS;

  const scoringData = useMemo(() => {
    if (!match) return { rounds: [], fighterOneTotals: {}, fighterTwoTotals: {} };

    const container = isBoxing ? match.BoxingMatch : match.MMAMatch;
    const fighterOneRows = Array.isArray(container?.fighterOneStats) ? container.fighterOneStats : [];
    const fighterTwoRows = Array.isArray(container?.fighterTwoStats) ? container.fighterTwoStats : [];
    const roundCount = Math.max(fighterOneRows.length, fighterTwoRows.length);

    const rounds = Array.from({ length: roundCount }, (_, index) => ({
      number: fighterOneRows[index]?.roundNumber || fighterTwoRows[index]?.roundNumber || index + 1,
      fighterOne: fighterOneRows[index] || {},
      fighterTwo: fighterTwoRows[index] || {},
    }));

    const total = (rows, key) => rows.reduce((sum, row) => sum + numericValue(row?.[key]), 0);
    return {
      rounds,
      fighterOneTotals: Object.fromEntries(fields.map(({ key }) => [key, total(fighterOneRows, key)])),
      fighterTwoTotals: Object.fromEntries(fields.map(({ key }) => [key, total(fighterTwoRows, key)])),
    };
  }, [fields, isBoxing, match]);

  if (!match) {
    return (
      <div className="admin-submitted-scores admin-submitted-scores-empty">
        <FaChartBar />
        <strong>{shadowLoading ? 'Loading submitted scores' : 'Match scores are not available'}</strong>
        <p>{shadowLoading ? 'Retrieving the selected shadow fight record.' : 'The selected fight could not be found in the current match records.'}</p>
      </div>
    );
  }

  return (
    <div className="admin-submitted-scores">
      <section className="admin-submitted-score-hero">
        <article className="is-red">
          <img src={match.fighterAImage || FALLBACK_A} alt={match.matchFighterA || 'Fighter A'} />
          <div><span>Red corner</span><strong>{match.matchFighterA || 'Fighter A'}</strong></div>
        </article>
        <div>
          <span>{match.matchCategoryTwo || match.matchCategory || 'Combat'}</span>
          <b>VS</b>
          <small>{match.matchType || match.matchStatus || 'Official result'}</small>
        </div>
        <article className="is-blue">
          <img src={match.fighterBImage || FALLBACK_B} alt={match.matchFighterB || 'Fighter B'} />
          <div><span>Blue corner</span><strong>{match.matchFighterB || 'Fighter B'}</strong></div>
        </article>
      </section>

      <section className="admin-score-summary-strip" aria-label="Submitted score summary">
        <article><FaFistRaised /><div><small>Fight</small><strong>{match.matchName || `${match.matchFighterA} vs ${match.matchFighterB}`}</strong></div></article>
        <article><FaChartBar /><div><small>Submitted rounds</small><strong>{scoringData.rounds.length}</strong></div></article>
        <article><FaCheckCircle /><div><small>Status</small><strong>{match.matchStatus || match.matchShadowStatus || 'Recorded'}</strong></div></article>
      </section>

      {scoringData.rounds.length ? (
        <div className="admin-submitted-rounds">
          {scoringData.rounds.map((round) => (
            <section className="admin-submitted-round-card" key={round.number}>
              <header>
                <div><span>Official scorecard</span><h3>Round {round.number}</h3></div>
                <FaTrophy aria-hidden="true" />
              </header>
              <div className="admin-submitted-score-table-scroll">
                <table className="admin-submitted-score-table">
                  <thead>
                    <tr>
                      <th>Scoring field</th>
                      <th>{match.matchFighterA || 'Fighter A'}</th>
                      <th>{match.matchFighterB || 'Fighter B'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {fields.map(({ key, label }) => (
                      <tr key={`${round.number}-${key}`}>
                        <td><strong>{label}</strong><span>{key}</span></td>
                        <td><b className="is-red">{numericValue(round.fighterOne?.[key])}</b></td>
                        <td><b className="is-blue">{numericValue(round.fighterTwo?.[key])}</b></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          ))}
        </div>
      ) : (
        <section className="admin-submitted-scores-empty">
          <FaChartBar />
          <strong>No submitted rounds</strong>
          <p>This fight record does not contain official round scores yet.</p>
        </section>
      )}

      {scoringData.rounds.length > 0 && (
        <section className="admin-score-totals-panel">
          <header><span>Fight totals</span><h3>All submitted rounds</h3></header>
          <div className="admin-submitted-score-table-scroll">
            <table className="admin-submitted-score-table is-total-table">
              <thead><tr><th>Scoring field</th><th>{match.matchFighterA || 'Fighter A'}</th><th>{match.matchFighterB || 'Fighter B'}</th></tr></thead>
              <tbody>
                {fields.map(({ key, label }) => (
                  <tr key={`total-${key}`}>
                    <td><strong>{label}</strong><span>{key}</span></td>
                    <td><b className="is-red">{scoringData.fighterOneTotals[key]}</b></td>
                    <td><b className="is-blue">{scoringData.fighterTwoTotals[key]}</b></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
};

export default ShowScores;
