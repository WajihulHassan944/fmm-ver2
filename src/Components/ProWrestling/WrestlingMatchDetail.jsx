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
  FaCalendarAlt,
  FaCheckCircle,
  FaCoins,
  FaCrown,
  FaFistRaised,
  FaLock,
  FaShieldAlt,
  FaTrophy,
  FaUsers,
} from 'react-icons/fa';
import {
  WrestlingEmptyState,
  WrestlingModeNav,
  WrestlingStatusBadge,
} from './WrestlingPrimitives';
import {
  WRESTLING_STATS,
  canEditWrestlingPrediction,
  formatTokenAmount,
  formatWrestlingCountdown,
  formatWrestlingDate,
  getWrestlerImage,
  hasWrestlingResults,
  isWrestlingLive,
  wrestlingRequest,
} from '@/Utils/proWrestling';

const WrestlingMatchDetail = () => {
  const router = useRouter();
  const { matchId } = router.query;
  const isAuthenticated = useSelector((state) => Boolean(state.auth?.isAuthenticated));
  const user = useSelector((state) => state.user);
  const [match, setMatch] = useState(null);
  const [entry, setEntry] = useState(null);
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState('');
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 30000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!router.isReady || !matchId) return;
    let active = true;
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const matchPayload = await wrestlingRequest(`/api/wrestling/matches/${matchId}`);
        if (!active) return;
        setMatch(matchPayload);
        if (isAuthenticated) {
          try {
            const entryPayload = await wrestlingRequest(`/api/wrestling/matches/${matchId}/my-entry`, { auth: true });
            if (active) {
              setEntry(entryPayload?.entry || null);
              setPrediction(entryPayload?.prediction || null);
            }
          } catch (entryError) {
            if (entryError.status !== 404) console.error(entryError);
          }
        }
      } catch (requestError) {
        console.error(requestError);
        if (active) setError(requestError.message || 'This wrestling contest could not be loaded.');
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => { active = false; };
  }, [isAuthenticated, matchId, router.isReady]);

  const joinContest = async () => {
    if (!isAuthenticated) {
      router.push(`/auth?mode=login&role=player&next=${encodeURIComponent(router.asPath)}`);
      return;
    }
    if (!match?._id) return;
    setJoining(true);
    try {
      const payload = await wrestlingRequest(`/api/wrestling/matches/${match._id}/join`, {
        auth: true,
        method: 'POST',
        headers: { 'Idempotency-Key': `wrestling-ui:${match._id}:${user?._id || 'player'}` },
        body: {
          affiliateId: typeof router.query.affiliateId === 'string' ? router.query.affiliateId : undefined,
          referralCode: typeof router.query.referralCode === 'string'
            ? router.query.referralCode
            : typeof router.query.ref === 'string'
              ? router.query.ref
              : undefined,
        },
      });
      setEntry(payload?.entry || null);
      if (payload?.match) setMatch(payload.match);
      toast.success('You are officially entered in this Pro Wrestling contest.');
    } catch (requestError) {
      toast.error(requestError.message || 'The contest entry could not be completed.');
    } finally {
      setJoining(false);
    }
  };

  const action = useMemo(() => {
    if (!match) return null;
    if (String(match.status || '').toUpperCase() === 'FINALIZED') return { href: `/pro-wrestling/leaderboard/${match._id}`, label: 'View final results', icon: FaTrophy };
    if (isWrestlingLive(match)) return { href: `/pro-wrestling/live/${match._id}`, label: 'Open live scoring', icon: FaBolt };
    if (hasWrestlingResults(match)) return { href: `/pro-wrestling/leaderboard/${match._id}`, label: 'View scoring board', icon: FaTrophy };
    if (entry) return { href: `/pro-wrestling/play/${match._id}`, label: prediction ? 'Edit prediction card' : 'Make predictions', icon: FaArrowRight };
    return null;
  }, [entry, match, prediction]);

  if (loading) return <div className="pw-page pw-state-page"><div className="pw-state-card"><FaBolt /><h1>Loading wrestling contest…</h1></div></div>;
  if (error || !match) return <div className="pw-page pw-state-page"><WrestlingEmptyState title="Contest unavailable" description={error} action={{ href: '/pro-wrestling', label: 'Return to wrestling lobby' }} /></div>;

  const canJoin = match.status === 'OPEN' && new Date(match.lockAt).getTime() > now;
  const competitorA = match.competitorA || {};
  const competitorB = match.competitorB || {};
  const ActionIcon = action?.icon || FaArrowRight;

  return (
    <>
      <Head><title>{match.matchTitle} | Pro Wrestling | Fantasy MMADNESS</title></Head>
      <div className="pw-page pw-match-detail-page">
        <section className="pw-detail-hero" style={{ '--pw-detail-bg': `url(${match.bannerImage || '/images/pro-wrestling/wrestling-match-premium.webp'})` }}>
          <div className="pw-detail-hero-grid" />
          <div className="theme-container pw-detail-hero-inner">
            <Link href="/pro-wrestling" className="pw-inline-back"><FaArrowLeft /> Wrestling lobby</Link>
            <div className="pw-detail-title-row">
              <div><p>{match.promotionName || 'Fantasy MMADNESS Wrestling'} · {match.eventName}</p><h1>{match.matchTitle}</h1><span>{match.description || 'Predict the full action across both competitors and lock in the official winner.'}</span></div>
              <WrestlingStatusBadge status={match.status} />
            </div>
            <div className="pw-detail-fight-stage">
              <article className="is-a"><img src={getWrestlerImage(competitorA, 'A')} alt={competitorA.displayName} /><span><small>Red corner</small><strong>{competitorA.displayName}</strong><em>{competitorA.promotion || match.promotionName || 'Pro Wrestling'}</em></span></article>
              <div><small>{match.matchFormat?.replaceAll?.('_', ' ') || 'Singles match'}</small><b>VS</b><span>{formatWrestlingDate(match.matchDate)}</span></div>
              <article className="is-b"><img src={getWrestlerImage(competitorB, 'B')} alt={competitorB.displayName} /><span><small>Blue corner</small><strong>{competitorB.displayName}</strong><em>{competitorB.promotion || match.promotionName || 'Pro Wrestling'}</em></span></article>
            </div>
          </div>
        </section>

        <WrestlingModeNav active="contests" />

        <main className="theme-container pw-main pw-detail-main">
          <section className="pw-contest-command-card">
            <div className="pw-contest-command-metrics">
              <article><FaCoins /><span><small>Entry fee</small><strong>{formatTokenAmount(match.entryFeeTokens)} tokens</strong></span></article>
              <article><FaTrophy /><span><small>Current pot</small><strong>{formatTokenAmount(match.currentPot)} tokens</strong></span></article>
              <article><FaUsers /><span><small>Players entered</small><strong>{formatTokenAmount(match.participantCount)}</strong></span></article>
              <article><FaLock /><span><small>Prediction lock</small><strong>{formatWrestlingCountdown(match.lockAt, now)}</strong></span></article>
            </div>
            <div className="pw-contest-command-action">
              {entry ? (
                <div className="pw-entry-confirmation"><FaCheckCircle /><span><strong>Contest entry confirmed</strong><small>{prediction ? `Prediction ${prediction.predictionStatus?.toLowerCase() || 'saved'}` : 'Build your prediction card before lock time.'}</small></span></div>
              ) : <div><small>Your fight wallet</small><strong>{formatTokenAmount(user?.tokens)} tokens available</strong></div>}
              {action ? (
                <Link href={action.href} className="pw-btn pw-btn-primary">{action.label} {ActionIcon && <ActionIcon />}</Link>
              ) : canJoin ? (
                <button type="button" className="pw-btn pw-btn-primary" onClick={joinContest} disabled={joining}>{joining ? 'Entering contest…' : `Enter for ${formatTokenAmount(match.entryFeeTokens)} tokens`} <FaArrowRight /></button>
              ) : (
                <span className="pw-closed-action"><FaLock /> This contest is not accepting new entries.</span>
              )}
            </div>
          </section>

          <section className="pw-detail-grid">
            <div className="pw-detail-panel">
              <p className="pw-eyebrow"><FaFistRaised /> Prediction scorecard</p>
              <h2>Forecast every major action.</h2>
              <p>Enter a full-match total for each category on both wrestlers. Your score is based on category accuracy, category weight, and the winner bonus.</p>
              <div className="pw-detail-category-list">
                {WRESTLING_STATS.map((stat) => {
                  const weight = match?.scoringRules?.categories?.[stat.key]?.weight ?? match?.scoringRules?.categories?.find?.((item) => item.key === stat.key)?.weight;
                  return <article key={stat.key}><strong>{stat.short}</strong><span><b>{stat.label}</b><small>{stat.description}</small></span><em>{weight ? `${weight}× weight` : 'Accuracy scored'}</em></article>;
                })}
              </div>
            </div>
            <aside className="pw-detail-panel is-rules">
              <p className="pw-eyebrow"><FaShieldAlt /> Contest safeguards</p>
              <h2>Entry and scoring rules.</h2>
              <ul>
                <li><FaCheckCircle /> One entry per user for this wrestling contest.</li>
                <li><FaCheckCircle /> Predictions can be edited only while the contest remains open.</li>
                <li><FaCheckCircle /> The server enforces the published lock time.</li>
                <li><FaCheckCircle /> Live rankings remain provisional until the match is finalized.</li>
                <li><FaCheckCircle /> Cancelled or no-contest cards follow the configured refund workflow.</li>
              </ul>
              <Link href="/pro-wrestling/how-to-play">Read full scoring guide <FaArrowRight /></Link>
            </aside>
          </section>

          <section className="pw-versus-research">
            <article><img src={getWrestlerImage(competitorA, 'A')} alt={competitorA.displayName} /><div><small>Competitor A</small><h3>{competitorA.displayName}</h3><p>Open the roster profile to review historical action totals and move information.</p>{competitorA.wrestlerId && <Link href={`/pro-wrestling/wrestlers/${competitorA.wrestlerId}`}>View wrestler intelligence <FaArrowRight /></Link>}</div></article>
            <div className="pw-versus-research-mark"><FaCrown /><span>Research both corners</span></div>
            <article><img src={getWrestlerImage(competitorB, 'B')} alt={competitorB.displayName} /><div><small>Competitor B</small><h3>{competitorB.displayName}</h3><p>Compare styles, finishing moves, records, and recent match context before submitting.</p>{competitorB.wrestlerId && <Link href={`/pro-wrestling/wrestlers/${competitorB.wrestlerId}`}>View wrestler intelligence <FaArrowRight /></Link>}</div></article>
          </section>
        </main>
      </div>
    </>
  );
};

export default WrestlingMatchDetail;
