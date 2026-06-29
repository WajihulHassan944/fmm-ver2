import React, { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { FaArrowLeft, FaCheckCircle, FaFilm, FaPlus, FaSave, FaTrophy } from 'react-icons/fa';
import { getWinnerDetails } from '../../CustomFunctions/winnerUtils';

const API_BASE = 'https://fantasymmadness-game-server-three.vercel.app';

const FIELD_LABELS = {
  HP: 'Head punches',
  BP: 'Body punches',
  TP: 'Total punches',
  RW: 'Rounds won',
  RL: 'Rounds lost',
  KO: 'Knockouts / stoppages',
  SP: 'Scoring points',
  ST: 'Strikes',
  KI: 'Kicks',
  KN: 'Knockdowns',
  EL: 'Elbows',
};

const BOXING_FIELDS = ['HP', 'BP', 'TP', 'RW', 'RL', 'KO', 'SP'];
const MMA_FIELDS = ['ST', 'KI', 'KN', 'EL', 'RW', 'RL', 'KO', 'SP'];
const emptyStats = (category) => Object.fromEntries((category === 'boxing' ? BOXING_FIELDS : MMA_FIELDS).map((key) => [key, '']));
const normalizeNumber = (value) => {
  if (value === '' || value === null || value === undefined) return 0;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const normalizeStatsForSubmit = (stats = {}) => Object.fromEntries(
  Object.entries(stats).map(([key, value]) => [key, normalizeNumber(value)])
);

const AdminPredictions = ({ matchId, filter, onBack }) => {
  const [showRWPopup, setShowRWPopup] = useState(false);
  const [showKOPopup, setShowKOPopup] = useState(false);
  const [shadowMatches, setShadowMatches] = useState([]);
  const matches = useSelector((state) => state.matches.data);
  const [round, setRound] = useState(1);
  const [showVideoUrlPopup, setShowVideoUrlPopup] = useState(true);
  const [videoUrl, setVideoUrl] = useState('');
  const [fighterOneStats, setFighterOneStats] = useState(emptyStats('boxing'));
  const [fighterTwoStats, setFighterTwoStats] = useState(emptyStats('boxing'));
  const [roundScores, setRoundScores] = useState([]);

  useEffect(() => {
    if (filter !== 'normal') {
      const fetchShadowMatch = async () => {
        try {
          const response = await fetch(`${API_BASE}/shadow`);
          const shadowData = await response.json();
          setShadowMatches(Array.isArray(shadowData) ? shadowData : []);
        } catch (error) {
          console.error('Error fetching shadow match data:', error);
        }
      };
      fetchShadowMatch();
    }
  }, [filter]);

  const match = useMemo(() => {
    if (filter === 'shadowTemplate') return shadowMatches.find((m) => m._id === matchId);
    return Array.isArray(matches) ? matches.find((m) => m._id === matchId) : null;
  }, [filter, matchId, matches, shadowMatches]);

  const category = match?.matchCategory === 'boxing' ? 'boxing' : 'mma';
  const statFields = category === 'boxing' ? BOXING_FIELDS : MMA_FIELDS;

  useEffect(() => {
    if (match) {
      const fresh = emptyStats(match.matchCategory === 'boxing' ? 'boxing' : 'mma');
      setFighterOneStats(fresh);
      setFighterTwoStats(fresh);
      setVideoUrl(match.matchVideoUrl || '');
    }
  }, [match]);

  const computeFighterTwoStats = () => ({ ...fighterTwoStats });

  const handleRWSelect = (value) => {
    setFighterOneStats((prevStats) => ({ ...prevStats, RW: value, ...(category === 'boxing' ? { RL: value === 100 ? 25 : 100 } : {}) }));
    setFighterTwoStats((prevStats) => ({ ...prevStats, RW: value === 100 ? 25 : 100, RL: value }));
    setShowRWPopup(false);
  };

  const handleKOSelect = (value) => {
    setFighterOneStats((prevStats) => ({ ...prevStats, KO: value, ...(category === 'boxing' ? { SP: value === 500 ? 25 : 500 } : {}) }));
    setFighterTwoStats((prevStats) => ({ ...prevStats, KO: value === 500 ? 25 : 500, SP: value }));
    setShowKOPopup(false);
  };

  const handleMetricInput = (fighter, stat, value) => {
    const setter = fighter === 'one' ? setFighterOneStats : setFighterTwoStats;
    setter((stats) => ({
      ...stats,
      // Total punches is intentionally manual. HP/BP never auto-update TP.
      [stat]: value === '' ? '' : String(Math.max(0, normalizeNumber(value))),
    }));
  };

  const handleButtonClick = (fighter, stat) => {
    if (fighter === 'one' && stat === 'RW') { setShowRWPopup(true); return; }
    if (fighter === 'one' && stat === 'KO') { setShowKOPopup(true); return; }
    const current = fighter === 'one' ? fighterOneStats : fighterTwoStats;
    handleMetricInput(fighter, stat, normalizeNumber(current[stat]) + 1);
  };

  const handleSave = async () => {
    const payload = {
      fighterOneStats: { ...normalizeStatsForSubmit(fighterOneStats), roundNumber: round },
      fighterTwoStats: { ...normalizeStatsForSubmit(computeFighterTwoStats()), roundNumber: round },
    };

    const saveRoundResultsPromise = new Promise(async (resolve, reject) => {
      try {
        const apiUrl = filter === 'normal'
          ? `${API_BASE}/match/addRoundResults/${matchId}`
          : `${API_BASE}/shadow/addShadowRoundResults/${matchId}`;

        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        const result = await response.json();
        if (response.ok) {
          setRoundScores((prevScores) => {
            const newScores = [...prevScores];
            newScores[round - 1] = {
              fighterOneStats: normalizeStatsForSubmit(fighterOneStats),
              fighterTwoStats: normalizeStatsForSubmit(computeFighterTwoStats()),
            };
            return newScores;
          });

          if (round < Number(match.maxRounds || 1)) {
            const fresh = emptyStats(category);
            setFighterOneStats(fresh);
            setFighterTwoStats(fresh);
            setRound(round + 1);
          }
          resolve();
        } else {
          console.error('Error saving round results:', result.message);
          reject(new Error('Error saving round results.'));
        }
      } catch (error) {
        console.error('Network error:', error);
        reject(new Error('Network error while saving round results.'));
      }
    });

    toast.promise(saveRoundResultsPromise, {
      pending: `Saving results for Round ${round}...`,
      success: `Your prediction for Round ${round} has been submitted 👌`,
      error: { render({ data }) { return data.message || 'Failed to save round results'; } },
    });
  };

  const handlePrev = () => {
    if (round > 1) {
      setRound((prevRound) => {
        const newRound = prevRound - 1;
        const prevScores = roundScores[newRound - 1];
        if (prevScores) {
          setFighterOneStats(prevScores.fighterOneStats);
          setFighterTwoStats(prevScores.fighterTwoStats);
        }
        return newRound;
      });
    }
  };

  const handleNext = () => {
    if (round < Number(match.maxRounds || 1)) {
      setRound((prevRound) => {
        const newRound = prevRound + 1;
        const nextScores = roundScores[newRound - 1];
        if (nextScores) {
          setFighterOneStats(nextScores.fighterOneStats);
          setFighterTwoStats(nextScores.fighterTwoStats);
        } else {
          const fresh = emptyStats(category);
          setFighterOneStats(fresh);
          setFighterTwoStats(fresh);
        }
        return newRound;
      });
    }
  };

  const handleFinishFight = async () => {
    const endpoint = filter === 'normal' ? `${API_BASE}/finishMatch/${matchId}` : `${API_BASE}/finishShadow/${matchId}`;

    const finishFightPromise = new Promise(async (resolve, reject) => {
      try {
        const response = await fetch(endpoint, { method: 'POST' });
        const result = await response.json();
        if (response.ok) {
          console.log('Match status updated to Finished:', result.match);
          resolve();
        } else {
          console.error('Error finishing match:', result.message);
          reject(new Error('Error finishing match.'));
        }
      } catch (error) {
        console.error('Network error:', error);
        reject(new Error('Network error while finishing the match.'));
      }
    });

    toast.promise(finishFightPromise, {
      pending: 'Finishing the match...',
      success: 'The match has been finished 👌',
      error: { render({ data }) { return data.message || 'Failed to finish the match'; } },
    }).then(async () => {
      if (filter === 'normal') {
        try {
          const winnerDetails = await getWinnerDetails(matchId);
          const matchTokens = match?.pot;
          if (winnerDetails && matchTokens) {
            const rewardResponse = await fetch(`${API_BASE}/api/reward-tokens/${winnerDetails.userId}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ tokens: matchTokens, matchId }),
            });
            const rewardData = await rewardResponse.json();
            if (rewardData.success) toast.success('Tokens rewarded successfully!');
            else toast.error('Failed to reward tokens.');
          }
        } catch (error) {
          console.error('Error rewarding tokens:', error);
          toast.error('Failed to reward tokens due to an error.');
        }
      }
      window.location.reload();
    });
  };

  const handleVideoUrlSubmit = async (e) => {
    e.preventDefault();
    if (!videoUrl) { toast.error('Please enter a video URL.'); return; }

    const updateVideoPromise = new Promise(async (resolve, reject) => {
      try {
        const apiUrl = filter === 'normal' ? `${API_BASE}/updateMatchVideo` : `${API_BASE}/updateShadowVideo`;
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ matchId, matchVideoUrl: videoUrl }),
        });
        const result = await response.json();
        if (response.ok) { setShowVideoUrlPopup(false); resolve(); }
        else { console.error('Error updating video URL:', result.message); reject(new Error('Error updating video URL.')); }
      } catch (error) {
        console.error('Network error:', error);
        reject(new Error('Network error while updating video URL.'));
      }
    });

    toast.promise(updateVideoPromise, {
      pending: 'Saving video URL...',
      success: 'Video URL added successfully 👌',
      error: { render({ data }) { return data.message || 'Failed to update video URL'; } },
    });
  };

  const Popup = ({ isVisible, onClose, onSelect, stat }) => {
    if (!isVisible) return null;
    return (
      <div className="admin-modal-backdrop admin-score-select-backdrop">
        <section className="admin-score-select-modal">
          <header><span>Quick assignment</span><h3>Select value for Fighter A</h3><button type="button" onClick={onClose}>×</button></header>
          <div>
            {stat === 'RW' && <><button type="button" onClick={() => { onSelect(100); onClose(); }}>RW · 100</button><button type="button" onClick={() => { onSelect(25); onClose(); }}>RL · 25</button></>}
            {stat === 'KO' && <><button type="button" onClick={() => { onSelect(500); onClose(); }}>KO · 500</button><button type="button" onClick={() => { onSelect(25); onClose(); }}>SP · 25</button></>}
          </div>
        </section>
      </div>
    );
  };

  const renderMetric = (fighter, stat) => {
    const stats = fighter === 'one' ? fighterOneStats : fighterTwoStats;
    const tone = fighter === 'one' ? 'red' : 'blue';
    return (
      <article className={`admin-score-metric is-${tone}`} key={`${fighter}-${stat}`}>
        <button type="button" className="admin-score-increment" onClick={() => handleButtonClick(fighter, stat)}>
          <strong>{FIELD_LABELS[stat]}</strong>
          <span>{stat}</span>
          <small>Tap to add +1</small>
        </button>
        <label>
          <span>{stat} value</span>
          <input
            type="number"
            min="0"
            inputMode="numeric"
            placeholder="0"
            value={stats[stat] ?? ''}
            onFocus={(event) => event.target.select()}
            onWheel={(event) => event.currentTarget.blur()}
            onChange={(event) => handleMetricInput(fighter, stat, event.target.value)}
          />
        </label>
      </article>
    );
  };

  if (!match) {
    return <div className="admin-workspace"><div className="admin-empty-table">Loading fight scoring workspace.</div></div>;
  }

  return (
    <div className="admin-workspace admin-score-center admin-predictions-redesign">
      {showVideoUrlPopup && (
        <div className="admin-modal-backdrop">
          <section className="admin-video-modal">
            <button type="button" className="admin-modal-close" onClick={() => setShowVideoUrlPopup(false)}>×</button>
            <header><FaFilm /><span>Fight video</span><h3>Please add the match video URL</h3><p>This uses the existing update video endpoint for this match.</p></header>
            <form onSubmit={handleVideoUrlSubmit}>
              <input type="text" value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} placeholder="Enter match video URL" required />
              <button type="submit" className="admin-primary-action">Submit</button>
            </form>
          </section>
        </div>
      )}

      <section className="admin-page-heading">
        <div>
          <span>Official score entry</span>
          <h2>{match.matchName}</h2>
          <p>{match.matchType} · {match.matchCategoryTwo || match.matchCategory} · Round {round} of {match.maxRounds || 1}. Enter any official stat value manually or use the quick buttons.</p>
        </div>
        <div className="admin-heading-actions">
          {onBack && <button type="button" className="admin-action-secondary" onClick={onBack}><FaArrowLeft /> Back</button>}
          <button className="admin-action-danger admin-finish-fight-action" type="button" onClick={handleFinishFight}><FaCheckCircle /> Finish Fight</button>
        </div>
      </section>

      <section className="admin-score-hero">
        <article><img src={match.fighterAImage} alt={match.matchFighterA} /><strong>{match.matchFighterA}</strong><span>Red corner</span></article>
        <div><small>Round {round}</small><b>VS</b><em>{match.maxRounds || 1} max rounds</em></div>
        <article><img src={match.fighterBImage} alt={match.matchFighterB} /><strong>{match.matchFighterB}</strong><span>Blue corner</span></article>
      </section>

      <Popup isVisible={showRWPopup} onClose={() => setShowRWPopup(false)} onSelect={handleRWSelect} stat="RW" />
      <Popup isVisible={showKOPopup} onClose={() => setShowKOPopup(false)} onSelect={handleKOSelect} stat="KO" />

      <section className="admin-score-entry-grid">
        <div className="admin-score-fighter-panel is-red">
          <header><span>Fighter A</span><h3>{match.matchFighterA}</h3><p>All official scoring fields are visible and editable.</p></header>
          <div>{statFields.map((stat) => renderMetric('one', stat))}</div>
        </div>
        <div className="admin-score-fighter-panel is-blue">
          <header><span>Fighter B</span><h3>{match.matchFighterB}</h3><p>Every value is available for manual input before saving.</p></header>
          <div>{statFields.map((stat) => renderMetric('two', stat))}</div>
        </div>
      </section>

      <section className="admin-score-actions-bar">
        <button className="admin-action-secondary" type="button" onClick={handlePrev} disabled={round === 1}>Prev</button>
        <button className="admin-action-secondary" type="button" onClick={handleNext} disabled={round === Number(match.maxRounds || 1)}>Next</button>
        <button className="admin-primary-action" type="button" onClick={handleSave}><FaSave /> Save</button>
        <button className="admin-action-secondary" type="button" onClick={() => { setFighterOneStats(emptyStats(category)); setFighterTwoStats(emptyStats(category)); }}><FaPlus /> Clear round</button>
        <span><FaTrophy /> {roundScores.filter(Boolean).length} saved rounds in this session</span>
      </section>
    </div>
  );
};

export default AdminPredictions;
