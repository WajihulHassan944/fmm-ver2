import React, { useEffect, useMemo, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import {
  FaArrowLeft,
  FaArrowRight,
  FaBolt,
  FaCheck,
  FaCoins,
  FaExclamationTriangle,
  FaLock,
  FaSave,
  FaShieldAlt,
  FaTrophy,
} from 'react-icons/fa';
import { WrestlingModeNav, WrestlingStatusBadge } from './WrestlingPrimitives';
import {
  EMPTY_WRESTLING_STATS,
  WRESTLING_STATS,
  WRESTLING_FINISH_TYPES,
  WRESTLING_TIME_RANGES,
  canEditWrestlingPrediction,
  formatWrestlingCountdown,
  formatWrestlingDate,
  getWrestlerImage,
  normalizeWrestlingStats,
  wrestlingRequest,
} from '@/Utils/proWrestling';

const cloneStats = (value) => ({ ...EMPTY_WRESTLING_STATS, ...normalizeWrestlingStats(value) });

const WrestlingPredictionPage = () => {
  const router = useRouter();
  const { matchId } = router.query;
  const isAuthenticated = useSelector((state) => Boolean(state.auth?.isAuthenticated));
  const user = useSelector((state) => state.user);
  const [match, setMatch] = useState(null);
  const [entry, setEntry] = useState(null);
  const [existingPrediction, setExistingPrediction] = useState(null);
  const [competitorA, setCompetitorA] = useState(cloneStats());
  const [competitorB, setCompetitorB] = useState(cloneStats());
  const [winnerPrediction, setWinnerPrediction] = useState('');
  const [finishTypePrediction, setFinishTypePrediction] = useState('');
  const [matchTimeRangePrediction, setMatchTimeRangePrediction] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!router.isReady || !matchId) return;
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    let active = true;
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const [matchPayload, entryPayload] = await Promise.all([
          wrestlingRequest(`/api/wrestling/matches/${matchId}`),
          wrestlingRequest(`/api/wrestling/matches/${matchId}/my-entry`, { auth: true }),
        ]);
        if (!active) return;
        setMatch(matchPayload);
        setEntry(entryPayload?.entry || null);
        const prediction = entryPayload?.prediction || null;
        setExistingPrediction(prediction);
        if (prediction) {
          setCompetitorA(cloneStats(prediction.competitorA));
          setCompetitorB(cloneStats(prediction.competitorB));
          setWinnerPrediction(prediction.winnerPrediction || '');
          setFinishTypePrediction(prediction.finishTypePrediction || '');
          setMatchTimeRangePrediction(prediction.matchTimeRangePrediction || '');
        }
      } catch (requestError) {
        console.error(requestError);
        if (active) setError(requestError.message || 'The wrestling prediction card could not be loaded.');
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => { active = false; };
  }, [isAuthenticated, matchId, router.isReady]);

  const updateStat = (side, key, value) => {
    const parsed = Math.max(0, Math.round(Number(value) || 0));
    if (side === 'A') setCompetitorA((current) => ({ ...current, [key]: parsed }));
    else setCompetitorB((current) => ({ ...current, [key]: parsed }));
  };

  const savePrediction = async (predictionStatus) => {
    if (!winnerPrediction) {
      toast.error('Select a predicted match winner before saving the scorecard.');
      return;
    }
    if (predictionStatus !== 'DRAFT' && !finishTypePrediction) {
      toast.error('Select how you expect the match to finish.');
      return;
    }
    if (predictionStatus !== 'DRAFT' && !matchTimeRangePrediction) {
      toast.error('Select a non-overlapping match time range.');
      return;
    }
    setSaving(predictionStatus);
    try {
      const payload = await wrestlingRequest(`/api/wrestling/matches/${matchId}/prediction`, {
        auth: true,
        method: existingPrediction ? 'PUT' : 'POST',
        body: { competitorA, competitorB, winnerPrediction, finishTypePrediction, matchTimeRangePrediction, predictionStatus },
      });
      setExistingPrediction(payload?.prediction || existingPrediction);
      toast.success(predictionStatus === 'DRAFT' ? 'Wrestling prediction draft saved.' : 'Wrestling prediction submitted.');
      if (predictionStatus !== 'DRAFT') router.push(`/pro-wrestling/matches/${matchId}`);
    } catch (requestError) {
      toast.error(requestError.message || 'The wrestling scorecard could not be saved.');
    } finally {
      setSaving('');
    }
  };

  const totalActions = useMemo(() => (
    WRESTLING_STATS.reduce((sum, stat) => sum + Number(competitorA[stat.key] || 0) + Number(competitorB[stat.key] || 0), 0)
  ), [competitorA, competitorB]);

  if (!isAuthenticated) {
    return (
      <div className="pw-page pw-state-page">
        <div className="pw-state-card"><FaShieldAlt /><h1>Player login required</h1><p>Sign in with your Fantasy MMADNESS player account to enter and edit a Pro Wrestling scorecard.</p><Link href={`/auth?mode=login&role=player&next=${encodeURIComponent(router.asPath)}`} className="pw-btn pw-btn-primary">Player login <FaArrowRight /></Link></div>
      </div>
    );
  }
  if (loading) return <div className="pw-page pw-state-page"><div className="pw-state-card"><FaBolt /><h1>Loading your scorecard…</h1></div></div>;
  if (error || !match || !entry) return <div className="pw-page pw-state-page"><div className="pw-state-card"><FaExclamationTriangle /><h1>Prediction card unavailable</h1><p>{error || 'Join the wrestling contest before making predictions.'}</p><Link href={`/pro-wrestling/matches/${matchId}`} className="pw-btn pw-btn-secondary">Return to contest <FaArrowRight /></Link></div></div>;

  const editable = canEditWrestlingPrediction(match) && ['JOINED', 'PREDICTION_SUBMITTED'].includes(entry.status);

  return (
    <>
      <Head><title>Make Wrestling Predictions | {match.matchTitle}</title></Head>
      <div className="pw-page pw-prediction-page">
        <section className="pw-prediction-hero">
          <div className="theme-container pw-prediction-hero-inner">
            <Link href={`/pro-wrestling/matches/${match._id}`} className="pw-inline-back"><FaArrowLeft /> Contest overview</Link>
            <div><p className="pw-eyebrow"><FaTrophy /> Full-match prediction card</p><h1>Call every move. <span>Own the result.</span></h1><p>{match.matchTitle} · {formatWrestlingDate(match.matchDate)}</p></div>
            <aside><WrestlingStatusBadge status={match.status} /><span><FaLock /> {formatWrestlingCountdown(match.lockAt)}</span><strong>{user.tokens || 0} wallet tokens</strong></aside>
          </div>
        </section>
        <WrestlingModeNav active="contests" />

        <main className="theme-container pw-main pw-prediction-main">
          {!editable && <div className="pw-lock-alert"><FaLock /><span><strong>This scorecard is locked.</strong><small>You can review the submitted values, but the backend no longer accepts edits for this contest.</small></span></div>}

          <section className="pw-prediction-board">
            <header>
              <div><p>Prediction status</p><strong>{existingPrediction?.predictionStatus || 'New scorecard'}</strong></div>
              <div><p>Total predicted actions</p><strong>{totalActions}</strong></div>
              <div><p>Entry fee committed</p><strong>{entry.entryFeeTokens} tokens</strong></div>
            </header>

            <div className="pw-prediction-competitors">
              <article className="is-a"><img src={getWrestlerImage(match.competitorA, 'A')} alt={match.competitorA.displayName} /><span><small>Competitor A</small><strong>{match.competitorA.displayName}</strong><em>{match.competitorA.promotion || match.promotionName}</em></span></article>
              <div><small>{match.matchFormat?.replaceAll?.('_', ' ')}</small><b>VS</b><em>Predict full-match totals</em></div>
              <article className="is-b"><img src={getWrestlerImage(match.competitorB, 'B')} alt={match.competitorB.displayName} /><span><small>Competitor B</small><strong>{match.competitorB.displayName}</strong><em>{match.competitorB.promotion || match.promotionName}</em></span></article>
            </div>

            <div className="pw-stat-table" role="table" aria-label="Pro Wrestling prediction inputs">
              <div className="pw-stat-table-head" role="row"><span>{match.competitorA.displayName}</span><strong>Action category</strong><span>{match.competitorB.displayName}</span></div>
              {WRESTLING_STATS.map((stat) => (
                <div className="pw-stat-input-row" role="row" key={stat.key}>
                  <label><small>{stat.short}</small><input type="number" min="0" step="1" value={competitorA[stat.key]} disabled={!editable} onChange={(event) => updateStat('A', stat.key, event.target.value)} aria-label={`${match.competitorA.displayName} ${stat.label}`} /></label>
                  <div><strong>{stat.label}</strong><span>{stat.short}</span><p>{stat.description}</p></div>
                  <label><small>{stat.short}</small><input type="number" min="0" step="1" value={competitorB[stat.key]} disabled={!editable} onChange={(event) => updateStat('B', stat.key, event.target.value)} aria-label={`${match.competitorB.displayName} ${stat.label}`} /></label>
                </div>
              ))}
            </div>

            <section className="pw-winner-pick">
              <div><p className="pw-eyebrow"><FaTrophy /> Headline prediction</p><h2>Who wins the match?</h2><span>The correct official winner receives the configured scoring bonus.</span></div>
              <div className="pw-winner-options">
                {[
                  ['A', match.competitorA.displayName, getWrestlerImage(match.competitorA, 'A')],
                  ['DRAW', 'The match ends in a draw', null],
                  ['B', match.competitorB.displayName, getWrestlerImage(match.competitorB, 'B')],
                ].map(([value, label, image]) => (
                  <button type="button" key={value} className={winnerPrediction === value ? 'is-selected' : ''} disabled={!editable} onClick={() => setWinnerPrediction(value)}>
                    {image ? <img src={image} alt="" /> : <FaTrophy />}<span><small>{value === 'DRAW' ? 'Draw pick' : `Wrestler ${value}`}</small><strong>{label}</strong></span>{winnerPrediction === value && <FaCheck />}
                  </button>
                ))}
              </div>
            </section>

            <section className="pw-outcome-picks">
              <div className="pw-outcome-pick-card">
                <div><p className="pw-eyebrow"><FaBolt /> Finish prediction</p><h2>How will the match end?</h2><span>Choose one official finish type. This pick is locked when the match starts.</span></div>
                <div className="pw-outcome-options">
                  {WRESTLING_FINISH_TYPES.map((option) => (
                    <button type="button" key={option.value} className={finishTypePrediction === option.value ? 'is-selected' : ''} disabled={!editable} onClick={() => setFinishTypePrediction(option.value)}>
                      <span><small>Finish type</small><strong>{option.label}</strong></span>{finishTypePrediction === option.value && <FaCheck />}
                    </button>
                  ))}
                </div>
              </div>
              <div className="pw-outcome-pick-card">
                <div><p className="pw-eyebrow"><FaBolt /> Match time range</p><h2>When will the match finish?</h2><span>Ranges never overlap, so the official duration always maps to exactly one selection.</span></div>
                <div className="pw-time-range-options">
                  {WRESTLING_TIME_RANGES.map((option) => (
                    <button type="button" key={option.value} className={matchTimeRangePrediction === option.value ? 'is-selected' : ''} disabled={!editable} onClick={() => setMatchTimeRangePrediction(option.value)}>
                      <small>Match duration</small><strong>{option.label}</strong>{matchTimeRangePrediction === option.value && <FaCheck />}
                    </button>
                  ))}
                </div>
              </div>
            </section>

            <footer className="pw-prediction-actions">
              <div><FaShieldAlt /><span><strong>Server-enforced lock</strong><small>Saving in the browser cannot bypass the contest lock time.</small></span></div>
              <div>
                <button type="button" className="pw-btn pw-btn-secondary" disabled={!editable || Boolean(saving)} onClick={() => savePrediction('DRAFT')}><FaSave /> {saving === 'DRAFT' ? 'Saving…' : 'Save draft'}</button>
                <button type="button" className="pw-btn pw-btn-primary" disabled={!editable || Boolean(saving)} onClick={() => savePrediction('SUBMITTED')}><FaCheck /> {saving === 'SUBMITTED' ? 'Submitting…' : existingPrediction?.predictionStatus === 'SUBMITTED' ? 'Update submitted card' : 'Submit predictions'}</button>
              </div>
            </footer>
          </section>

          <section className="pw-prediction-help">
            <img src="/images/pro-wrestling/prediction-mockup.webp" alt="Fantasy MMADNESS wrestling scorecard visual" />
            <div><p className="pw-eyebrow"><FaCoins /> Scoring mindset</p><h2>Accuracy beats volume.</h2><p>Do not simply enter the highest possible numbers. Exact values earn the strongest multiplier, with reduced credit as the prediction moves farther from the official total.</p><Link href="/pro-wrestling/how-to-play">Review category weights and tie-breaks <FaArrowRight /></Link></div>
          </section>
        </main>
      </div>
    </>
  );
};

export default WrestlingPredictionPage;
