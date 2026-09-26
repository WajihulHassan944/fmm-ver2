import { useRouter } from 'next/router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import {
  FaCheck,
  FaClock,
  FaCoins,
  FaFistRaised,
  FaShieldAlt,
  FaTrophy,
} from 'react-icons/fa';
import { getFighterImage, getFighterName } from '@/Utils/fightExperience';
import { buildPublicApiUrl } from '@/Utils/publicApi';
import { SCORE_POINTS } from '@/Utils/scoringRules';

const buildRound = (round) => ({
  round,
  hpPrediction1: '',
  hpPrediction2: '',
  bpPrediction1: '',
  bpPrediction2: '',
  tpPrediction1: '',
  tpPrediction2: '',
  kiPrediction1: '',
  kiPrediction2: '',
  knPrediction1: '',
  knPrediction2: '',
  rwPrediction1: 0,
  rwPrediction2: 0,
  koPrediction1: 0,
  koPrediction2: 0,
  elPrediction1: '',
  elPrediction2: '',
  pmPrediction1: '',
  pmPrediction2: '',
  fmPrediction1: '',
  fmPrediction2: '',
  rwBorder: '2px solid #95a04d',
  rlBorder: '2px solid #95a04d',
  koBorder: '2px solid #95a04d',
  spBorder: '2px solid #95a04d',
  rwText: 'RW',
  rlText: 'RL',
  koText: 'KO',
  spText: 'SP',
});

const MakePredictions = ({ matchId, matchOverride = null, onSubmitted }) => {
  const router = useRouter();
  const user = useSelector((state) => state.user);
  const matches = useSelector((state) => state.matches.data);
  const match = matchOverride || (Array.isArray(matches) ? matches.find((item) => String(item?._id || item?.id || item?.matchId) === String(matchId)) : null);
  const rawSport = String(match?.matchCategoryTwo || match?.matchCategory || match?.sport || '').toLowerCase();
  const sport = rawSport.includes('bare') || rawSport.includes('bkfc') ? 'bareknuckle'
    : rawSport.includes('kick') ? 'kickboxing'
      : rawSport.includes('wrest') ? 'wrestling'
        : rawSport.includes('box') ? 'boxing' : 'mma';
  const isBoxing = sport === 'boxing' || sport === 'bareknuckle';
  const isWrestling = sport === 'wrestling';
  const roundCount = isWrestling ? 1 : Math.max(Number(match?.maxRounds) || (sport === 'boxing' ? 12 : 5), 1);
  const featuredWinner = ['a', 'b'].includes(String(router.query?.pick || '').toLowerCase()) ? String(router.query.pick).toLowerCase() : '';

  const [rounds, setRounds] = useState(() => Array.from({ length: roundCount }, (_, index) => buildRound(index + 1)));
  const [timeRemaining, setTimeRemaining] = useState({ diffHrs: 0, diffMins: 0, diffSecs: 0, hasStarted: false });
  const [buttonText, setButtonText] = useState('Submit Predictions');
  const [submitting, setSubmitting] = useState(false);
  const [confirmation, setConfirmation] = useState(null);
  const [submitError, setSubmitError] = useState('');
  const quickPickApplied = useRef('');
  // Stable per submit attempt so a double-tap or retry cannot double-charge.
  const idempotencyKeyRef = useRef('');
  const draftKey = `fmm-scorecard:${user?._id || user?.id || 'guest'}:${matchId}`;
  const [draftLoaded, setDraftLoaded] = useState(false);
  const [eligibility, setEligibility] = useState(null);
  const [eligibilityBusy, setEligibilityBusy] = useState(false);
  const [eligibilityError, setEligibilityError] = useState('');
  const [residenceState, setResidenceState] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const entryFee = Math.max(0, Number(match?.matchTokens) || 0);
  const returnToFight = `/fight/${matchId}?play=1${router.query.ref ? `&ref=${encodeURIComponent(String(router.query.ref))}` : ''}${featuredWinner ? `&pick=${featuredWinner}` : ''}`;
  const checkoutUrl = `/checkout?product=fm-coins&returnTo=${encodeURIComponent(returnToFight)}`;

  useEffect(() => {
    try {
      const saved = JSON.parse(sessionStorage.getItem(draftKey) || 'null');
      if (Array.isArray(saved?.rounds) && saved.rounds.length === roundCount) {
        setRounds(saved.rounds);
        idempotencyKeyRef.current = saved.idempotencyKey || '';
        quickPickApplied.current = featuredWinner;
      }
    } catch (_) { /* Browsers may disable session storage. */ }
    setDraftLoaded(true);
  }, [draftKey, roundCount, featuredWinner]);

  useEffect(() => {
    if (!draftLoaded || confirmation) return;
    try { sessionStorage.setItem(draftKey, JSON.stringify({ rounds, idempotencyKey: idempotencyKeyRef.current })); }
    catch (_) { /* The current page still retains the picks. */ }
  }, [draftKey, draftLoaded, rounds, confirmation]);

  useEffect(() => {
    if (!entryFee) return;
    const token = localStorage.getItem('authToken');
    if (!token) return;
    let active = true;
    fetch(buildPublicApiUrl('/api/users/me/eligibility'), { headers: { Authorization: `Bearer ${token}` } })
      .then(async (response) => { if (!response.ok) throw new Error('Could not check entry eligibility.'); return response.json(); })
      .then((data) => { if (active) { setEligibility(data); setResidenceState(data.residenceState || ''); } })
      .catch((error) => { if (active) setEligibilityError(error.message); });
    return () => { active = false; };
  }, [entryFee]);

  const saveEligibility = async (event) => {
    event.preventDefault();
    setEligibilityBusy(true);
    setEligibilityError('');
    try {
      const response = await fetch(buildPublicApiUrl('/api/users/me/eligibility'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('authToken') || ''}` },
        body: JSON.stringify({ residenceState, ...(dateOfBirth ? { dateOfBirth } : {}) }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Could not save your details.');
      setEligibility({ ...data, hasDateOfBirth: Boolean(dateOfBirth || eligibility?.hasDateOfBirth), residenceState });
    } catch (error) { setEligibilityError(error.message); }
    finally { setEligibilityBusy(false); }
  };

  useEffect(() => {
    setRounds((current) => {
      if (current.length === roundCount) return current;
      return Array.from({ length: roundCount }, (_, index) => current[index] || buildRound(index + 1));
    });
  }, [roundCount]);

  useEffect(() => {
    if (!draftLoaded || !featuredWinner || quickPickApplied.current === featuredWinner) return;
    quickPickApplied.current = featuredWinner;
    const fighterAWins = featuredWinner === 'a';
    setRounds((current) => current.map((round) => ({
      ...round,
      rwPrediction1: fighterAWins ? SCORE_POINTS.RW : SCORE_POINTS.RL,
      rwPrediction2: fighterAWins ? SCORE_POINTS.RL : SCORE_POINTS.RW,
      rwText: fighterAWins ? 'RW' : 'RL',
      rlText: fighterAWins ? 'RL' : 'RW',
      rwBorder: fighterAWins ? '2px solid #2f9cff' : '2px solid rgba(255,255,255,.16)',
      rlBorder: fighterAWins ? '2px solid rgba(255,255,255,.16)' : '2px solid #ed1f31',
    })));
  }, [featuredWinner, draftLoaded]);

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
    if (isWrestling) {
      return [
        { code: 'HP', title: 'Head punches', left: 'hpPrediction1', right: 'hpPrediction2' },
        { code: 'BP', title: 'Body punches', left: 'bpPrediction1', right: 'bpPrediction2' },
        { code: 'KI', title: 'Kicks', left: 'kiPrediction1', right: 'kiPrediction2' },
        { code: 'PM', title: 'Power moves', left: 'pmPrediction1', right: 'pmPrediction2' },
        { code: 'FM', title: 'Finishers', left: 'fmPrediction1', right: 'fmPrediction2', featured: true },
      ];
    }
    if (isBoxing) {
      return [
        { code: 'HP', title: 'Head punches', left: 'hpPrediction1', right: 'hpPrediction2' },
        { code: 'BP', title: 'Body punches', left: 'bpPrediction1', right: 'bpPrediction2' },
        { code: 'TP', title: 'Total punches', left: 'tpPrediction1', right: 'tpPrediction2', featured: true },
      ];
    }

    return [
      { code: 'HP', title: 'Head punches', left: 'hpPrediction1', right: 'hpPrediction2' },
      { code: 'BP', title: 'Body punches', left: 'bpPrediction1', right: 'bpPrediction2' },
      { code: 'KI', title: 'Kicks', left: 'kiPrediction1', right: 'kiPrediction2' },
      { code: 'KN', title: 'Knees', left: 'knPrediction1', right: 'knPrediction2', featured: true },
      { code: 'EL', title: 'Elbows', left: 'elPrediction1', right: 'elPrediction2' },
    ];
  }, [isBoxing, isWrestling]);

  const handlePredictionChange = (event, roundIndex, field) => {
    const { value } = event.target;
    idempotencyKeyRef.current = '';
    setRounds((current) => current.map((round, index) => (
      index === roundIndex ? { ...round, [field]: value } : round
    )));
  };

  const selectRoundWinner = (roundIndex, side) => {
    idempotencyKeyRef.current = '';
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
    idempotencyKeyRef.current = '';
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
    if (entryFee && !eligibility?.eligible) {
      setSubmitError(eligibility?.message || eligibilityError || 'Confirm your state and date of birth before entering.');
      return;
    }
    if (!rounds.some((round) => getWinnerSide(round))) {
      alert(isWrestling ? 'Pick the match winner before submitting.' : 'Pick at least one round winner before submitting.');
      return;
    }
    setSubmitting(true);
    setButtonText('Saving!');
    setSubmitError('');

    try {
      const authToken = typeof window !== 'undefined' ? localStorage.getItem('authToken') : '';
      if (!authToken) {
        alert('Please sign in again to submit your predictions.');
        setSubmitting(false);
        setButtonText('Submit Predictions');
        return;
      }

      // Single atomic call: charges the entry fee and saves the prediction together.
      // The server reads the fee from the fight record — we never send a price.
      // The idempotency key is stable per (fight, attempt) so a double-tap or a
      // network retry cannot charge twice.
      if (!idempotencyKeyRef.current) {
        idempotencyKeyRef.current = typeof window !== 'undefined' && window.crypto?.randomUUID
          ? window.crypto.randomUUID()
          : `fmm-entry-${matchId}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      }

      const entryResponse = await fetch(buildPublicApiUrl(`/api/fights/${matchId}/entries`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
          'Idempotency-Key': idempotencyKeyRef.current,
        },
        body: JSON.stringify({
          predictions: rounds,
          category: match.matchCategory,
          ...(typeof router.query.ref === 'string' ? { referralAffiliateId: router.query.ref } : {}),
        }),
      });

      const entryPayload = await entryResponse.json().catch(() => ({}));

      if (!entryResponse.ok) {
        if (entryPayload?.code === 'INSUFFICIENT_FUNDS') {
          const shortfall = Number(entryPayload.shortfall || 0);
          setSubmitError(`You need ${shortfall} more FM coins. Your picks are saved here; add coins and return to submit.`);
          return;
        }
        if (entryPayload?.code === 'FIGHT_LOCKED') {
          alert('Entry for this fight has closed.');
          setSubmitting(false);
          setButtonText('Entry closed');
          return;
        }
        if (entryPayload?.code === 'ALREADY_ENTERED' || entryPayload?.alreadyEntered) {
          setSubmitError('This fight already has an entry for your account. Check My Entries before trying again.');
          setSubmitting(false);
          return;
        }
        if (['STATE_UNVERIFIED', 'AGE_UNVERIFIED', 'STATE_BLOCKED', 'UNDERAGE', 'FREE_PLAY_ONLY', 'SELF_EXCLUDED'].includes(entryPayload?.code)) {
          setEligibility({ ...eligibility, eligible: false, reason: entryPayload.code, message: entryPayload.message });
          setSubmitError(entryPayload.message);
          return;
        }
        throw new Error(entryPayload?.message || `Entry failed with status ${entryResponse.status}`);
      }

      const winnerVotes = rounds.reduce((counts, round) => {
        const side = getWinnerSide(round);
        if (side) counts[side] += 1;
        return counts;
      }, { A: 0, B: 0 });
      setConfirmation({
        pickName: winnerVotes.B > winnerVotes.A ? getFighterName(match, 'B') : winnerVotes.A > winnerVotes.B ? getFighterName(match, 'A') : 'Round-by-round card submitted',
      });
      try { sessionStorage.removeItem(draftKey); } catch (_) { /* Submission succeeded. */ }
    } catch (error) {
      console.error('Error saving predictions:', error);
      setSubmitError(error?.message || 'Could not submit predictions. Your picks are still here; please try again.');
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

  if (confirmation) {
    const rawSport = String(match.matchCategoryTwo || match.matchCategory || 'mma').toLowerCase();
    const sport = rawSport.includes('bare') ? 'bareknuckle' : rawSport.includes('kick') ? 'kickboxing' : rawSport.includes('wrest') ? 'wrestling' : rawSport.includes('box') ? 'boxing' : 'mma';
    const sports = ['boxing', 'mma', 'bareknuckle', 'kickboxing', 'wrestling'];
    const nextSport = sports[(sports.indexOf(sport) + 1 + sports.length) % sports.length];
    const nextLabel = { boxing: 'BOXING', mma: 'MMA', bareknuckle: 'BARE KNUCKLE', kickboxing: 'KICKBOXING', wrestling: 'PRO WRESTLING' }[nextSport];
    const leaveConfirmation = (href) => {
      onSubmitted?.();
      router.push(href);
    };
    return (
      <section style={{ minHeight: '100dvh', padding: 'max(28px, env(safe-area-inset-top)) 14px max(32px, env(safe-area-inset-bottom))', display: 'grid', placeItems: 'center', background: 'radial-gradient(circle at 50% 0%,rgba(34,197,94,.18),transparent 35rem),#05060a', color: '#fff', fontFamily: 'Rajdhani,sans-serif' }}>
        <div style={{ width: 'min(480px,100%)', boxSizing: 'border-box', padding: '24px 18px', borderRadius: 22, border: '1px solid rgba(34,197,94,.45)', background: 'linear-gradient(160deg,rgba(34,197,94,.12),rgba(255,255,255,.035))', boxShadow: '0 0 32px rgba(34,197,94,.16)', textAlign: 'center' }}>
          <div style={{ fontSize: 42 }}>🥊</div>
          <h1 style={{ margin: '4px 0', fontFamily: 'Anton,sans-serif', fontSize: 30, color: '#22c55e' }}>YOU’RE IN</h1>
          <p style={{ margin: '0 0 16px', color: 'rgba(255,255,255,.65)', fontWeight: 700 }}>{getFighterName(match, 'A')} vs {getFighterName(match, 'B')}</p>
          <div style={{ padding: 13, borderRadius: 12, background: 'rgba(255,255,255,.055)', border: '1px solid rgba(255,255,255,.12)', textAlign: 'left', marginBottom: 13 }}>
            <small style={{ display: 'block', color: 'rgba(255,255,255,.45)', fontWeight: 900, letterSpacing: '.08em' }}>YOUR CARD</small>
            <strong style={{ display: 'block', marginTop: 3, color: '#f2b544', overflowWrap: 'anywhere' }}>{confirmation.pickName}</strong>
            <span style={{ display: 'block', marginTop: 4, color: 'rgba(255,255,255,.55)', fontSize: 12 }}>Live scoring starts from official fight data. Your saved values will not be replaced with samples.</span>
          </div>
          <button type="button" onClick={() => leaveConfirmation(`/upcomingfights?category=${nextSport}`)} style={{ width: '100%', minHeight: 50, border: 0, borderRadius: 999, background: 'linear-gradient(90deg,#ffd873,#f2b544)', color: '#2b1b00', fontWeight: 1000, cursor: 'pointer' }}>NOW TRY {nextLabel} ›</button>
          <p style={{ margin: '7px 0 12px', color: 'rgba(255,255,255,.4)', fontSize: 11, fontWeight: 700 }}>Players entering more than one sport can build a broader season score.</p>
          <button type="button" onClick={() => leaveConfirmation(`/fight/${matchId}#fight-leaderboard`)} style={{ width: '100%', minHeight: 46, borderRadius: 999, border: '1px solid rgba(255,255,255,.2)', background: 'rgba(255,255,255,.04)', color: '#fff', fontWeight: 900, cursor: 'pointer' }}>VIEW FIGHT LEADERBOARD</button>
          <button type="button" onClick={() => leaveConfirmation('/YourFights')} style={{ marginTop: 10, border: 0, background: 'transparent', color: '#fff', fontWeight: 800, cursor: 'pointer' }}>VIEW MY ENTRIES</button>
          <button type="button" onClick={() => leaveConfirmation('/')} style={{ marginTop: 10, border: 0, background: 'transparent', color: 'rgba(255,255,255,.55)', fontWeight: 800, cursor: 'pointer' }}>RETURN HOME</button>
        </div>
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
            <h1>{getFighterName(match, 'A')} <em>vs</em> {getFighterName(match, 'B')}</h1>
          <p>{match.matchCategoryTwo || match.matchCategory} · {match.matchType}{isWrestling ? ' · full-match scorecard' : ` · ${roundCount} rounds`}</p>
            <div className="xp-prediction-countdown"><FaClock /> {timeRemaining.hasStarted ? 'Fight has started' : `${timeRemaining.diffHrs}h ${timeRemaining.diffMins}m ${timeRemaining.diffSecs}s until lock`}</div>
          </div>
          <button className="xp-prediction-wallet" type="button" onClick={() => router.push(checkoutUrl)}>
            <FaCoins />
            <span>Fight wallet</span>
            <strong>{user.tokens || 0}</strong>
            <small>FM coins available</small>
          </button>
        </div>

        {entryFee > 0 && <div style={{ maxWidth: 780, margin: '16px auto', padding: 18, border: '1px solid rgba(255,255,255,.25)', borderRadius: 12, color: '#fff' }}>
          <strong>Before you enter: {entryFee} FM coins</strong>
          <p>{eligibility?.eligible ? 'Your paid-entry details are ready.' : eligibility?.message || eligibilityError || 'Checking your paid-entry details…'}</p>
          {eligibility && !eligibility.eligible && !['STATE_BLOCKED', 'UNDERAGE', 'FREE_PLAY_ONLY', 'SELF_EXCLUDED'].includes(eligibility.reason) && <form onSubmit={saveEligibility}>
            <label style={{ display: 'block', marginBottom: 8 }}>State of residence (two letters) <input required maxLength={2} pattern="[A-Za-z]{2}" value={residenceState} onChange={(event) => setResidenceState(event.target.value.toUpperCase())} style={{ color: '#111' }} /></label>
            {!eligibility.hasDateOfBirth && <label style={{ display: 'block', marginBottom: 8 }}>Date of birth <input required type="date" value={dateOfBirth} onChange={(event) => setDateOfBirth(event.target.value)} style={{ color: '#111' }} /></label>}
            <button type="submit" disabled={eligibilityBusy}>{eligibilityBusy ? 'Saving…' : 'Confirm details'}</button>
          </form>}
          {eligibilityError && <p role="alert">{eligibilityError}</p>}
          {eligibility?.eligible && Number(user?.tokens || 0) < entryFee && <p>You need {Math.max(0, entryFee - Number(user?.tokens || 0))} more FM coins. <button type="button" onClick={() => router.push(checkoutUrl)}>Add FM coins</button> Your card will be here when you return.</p>}
        </div>}

        {featuredWinner ? <div style={{ margin: '0 auto 14px', width: 'min(780px,calc(100% - 28px))', padding: '11px 14px', borderRadius: 12, border: '1px solid rgba(242,181,68,.45)', background: 'rgba(242,181,68,.09)', color: '#f2b544', fontWeight: 900, textAlign: 'center' }}>YOUR FEATURED PICK: {featuredWinner === 'b' ? getFighterName(match, 'B') : getFighterName(match, 'A')}. Complete the {sport === 'bareknuckle' ? 'Bare Knuckle' : sport === 'kickboxing' ? 'Kickboxing' : sport === 'wrestling' ? 'Pro Wrestling' : sport === 'boxing' ? 'Boxing' : 'MMA'} scorecard below.</div> : null}

        <div className="xp-prediction-fighters">
          <article>
            <img src={fighterAImage} alt={getFighterName(match, 'A')} />
            <div><span>Blue corner</span><strong>{getFighterName(match, 'A')}</strong></div>
          </article>
          <div className="xp-prediction-vs">VS</div>
          <article>
            <img src={fighterBImage} alt={getFighterName(match, 'B')} />
            <div><span>Red corner</span><strong>{getFighterName(match, 'B')}</strong></div>
          </article>
        </div>

        <div className="xp-prediction-member-strip">
          <img src={user.profileUrl || '/images/fmm-experience/avatar-placeholder.svg'} alt={user.firstName || 'Member'} />
          <div><span>Member</span><strong>{user.firstName} {user.lastName}</strong></div>
          <div><span>Plan</span><strong>{user.currentPlan || 'Player'}</strong></div>
          <div><span>Prediction type</span><strong>{isWrestling ? 'Pro Wrestling metrics' : isBoxing ? `${sport === 'bareknuckle' ? 'Bare Knuckle' : 'Boxing'} metrics` : `${sport === 'kickboxing' ? 'Kickboxing' : 'MMA'} metrics`}</strong></div>
        </div>

        <div className="player-prediction-flow-strip" aria-label="Prediction workflow">
          <span><b>1</b><strong>Review the card</strong><small>Confirm fighters and rules</small></span>
          <i aria-hidden="true" />
          <span><b>2</b><strong>{isWrestling ? 'Score the full match' : 'Call every round'}</strong><small>Enter all available metrics</small></span>
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
                    <img src={fighterAImage} alt={getFighterName(match, 'A')} />
                    <span><small>Blue corner</small><strong>{getFighterName(match, 'A')}</strong></span>
                  </div>
                  <div className="player-round-number">
                    <small>Prediction card</small>
                    <strong>{isWrestling ? 'Full match' : `Round ${round.round}`}</strong>
                    <span>{isWrestling ? 'Pro Wrestling' : isBoxing ? (sport === 'bareknuckle' ? 'Bare Knuckle' : 'Boxing') : (sport === 'kickboxing' ? 'Kickboxing' : 'MMA')} scoring</span>
                  </div>
                  <div className="player-round-corner is-b">
                    <span><small>Red corner</small><strong>{getFighterName(match, 'B')}</strong></span>
                    <img src={fighterBImage} alt={getFighterName(match, 'B')} />
                  </div>
                </header>

                <div className="player-round-score-table">
                  <div className="player-round-score-head">
                    <span>{getFighterName(match, 'A')}</span>
                    <strong>Predicted action</strong>
                    <span>{getFighterName(match, 'B')}</span>
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
                          aria-label={`${metric.title} for ${getFighterName(match, 'A')}`}
                        />
                        <small>{getFighterName(match, 'A')}</small>
                      </label>
                      <div>
                        <FaFistRaised aria-hidden="true" className="player-round-metric-icon" />
                        <span><b>{metric.code}</b><strong>{metric.title}</strong></span>
                      </div>
                      <label className="is-b">
                        <input
                          type="number"
                          min="0"
                          inputMode="numeric"
                          value={round[metric.right]}
                          onChange={(event) => handlePredictionChange(event, roundIndex, metric.right)}
                          aria-label={`${metric.title} for ${getFighterName(match, 'B')}`}
                        />
                        <small>{getFighterName(match, 'B')}</small>
                      </label>
                    </div>
                  ))}
                </div>

                <div className="player-round-outcome-grid">
                  <section>
                    <header><span>{isWrestling ? 'Match result' : 'Round result'}</span><strong>{isWrestling ? 'Pick the match winner' : 'Pick the round winner'}</strong></header>
                    <div>
                      <button
                        type="button"
                        className={`is-a ${winnerSide === 'A' ? 'is-active' : ''}`}
                        onClick={() => selectRoundWinner(roundIndex, 'A')}
                        aria-pressed={winnerSide === 'A'}
                      >
                        <img src={fighterAImage} alt="" />
                        <span><small>{getFighterName(match, 'A')}</small><strong>{winnerSide === 'B' ? 'RL' : 'RW'}</strong><em>{winnerSide === 'A' ? (isWrestling ? 'Match winner' : 'Round winner') : winnerSide === 'B' ? (isWrestling ? 'Match loss' : 'Round loss') : 'Select corner'}</em></span>
                        {winnerSide === 'A' && <FaCheck />}
                      </button>
                      <button
                        type="button"
                        className={`is-b ${winnerSide === 'B' ? 'is-active' : ''}`}
                        onClick={() => selectRoundWinner(roundIndex, 'B')}
                        aria-pressed={winnerSide === 'B'}
                      >
                        <img src={fighterBImage} alt="" />
                        <span><small>{getFighterName(match, 'B')}</small><strong>{winnerSide === 'A' ? 'RL' : 'RW'}</strong><em>{winnerSide === 'B' ? (isWrestling ? 'Match winner' : 'Round winner') : winnerSide === 'A' ? (isWrestling ? 'Match loss' : 'Round loss') : 'Select corner'}</em></span>
                        {winnerSide === 'B' && <FaCheck />}
                      </button>
                    </div>
                  </section>

                  {!isWrestling && <section>
                    <header><span>Finish call</span><strong>Pick a KO, or survival points (SP) if the fight continues</strong></header>
                    <div>
                      <button
                        type="button"
                        className={`is-a ${finishSide === 'A' ? 'is-active' : ''}`}
                        onClick={() => selectFinish(roundIndex, 'A')}
                        aria-pressed={finishSide === 'A'}
                      >
                        <img src={fighterAImage} alt="" />
                        <span><small>{getFighterName(match, 'A')}</small><strong>{finishSide === 'B' ? 'SP' : 'KO'}</strong><em>{finishSide === 'A' ? 'Knockout pick' : finishSide === 'B' ? 'Survival points' : 'Select corner'}</em></span>
                        {finishSide === 'A' && <FaCheck />}
                      </button>
                      <button
                        type="button"
                        className={`is-b ${finishSide === 'B' ? 'is-active' : ''}`}
                        onClick={() => selectFinish(roundIndex, 'B')}
                        aria-pressed={finishSide === 'B'}
                      >
                        <img src={fighterBImage} alt="" />
                        <span><small>{getFighterName(match, 'B')}</small><strong>{finishSide === 'A' ? 'SP' : 'KO'}</strong><em>{finishSide === 'B' ? 'Knockout pick' : finishSide === 'A' ? 'Survival points' : 'Select corner'}</em></span>
                        {finishSide === 'B' && <FaCheck />}
                      </button>
                    </div>
                  </section>}
                </div>
              </article>
            );
          })}
        </div>

        <div className="xp-prediction-submit-panel">
          {submitError && <p role="alert" style={{ color: '#ff8585', fontWeight: 800 }}>{submitError} {entryFee > 0 && eligibility?.eligible && Number(user?.tokens || 0) < entryFee && <button type="button" onClick={() => router.push(checkoutUrl)}>Add FM coins</button>}</p>}
          <div><FaShieldAlt /><span>Review your picks. {entryFee > 0 ? `Submitting charges ${entryFee} FM coins and saves your predictions.` : 'Submit your free entry and save your predictions.'}</span></div>
          <button type="button" className="theme-btn theme-btn-primary" onClick={handleFinish} disabled={submitting || (entryFee > 0 && !eligibility?.eligible)}>
            <FaTrophy /> {buttonText}
          </button>
        </div>
      </div>
    </section>
  );
};

export default MakePredictions;
