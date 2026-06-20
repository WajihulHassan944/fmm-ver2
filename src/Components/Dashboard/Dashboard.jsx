import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter } from 'next/router';
import { toast } from 'react-toastify';
import {
  FaArrowLeft,
  FaArrowRight,
  FaBolt,
  FaCoins,
  FaCommentDots,
  FaFistRaised,
  FaMedal,
  FaPlus,
  FaStar,
  FaTrophy,
  FaUserCircle,
} from 'react-icons/fa';
import { fetchMatches } from '@/Redux/matchSlice';
import FightCosting from './FightCosting';
import FightLeaderboard from '@/Components/GlobalLeaderboard/FightLeaderboard';
import PurchaseTokensIntimation from './PurchaseTokensIntimation';
import FinishedFightUserBoard from '@/Components/FinishedFightUserBoard/FinishedFightUserBoard';
import { ExperienceEmptyState, ExperienceSectionHeading } from '@/Components/Theme/ExperiencePrimitives';
import { FightTimelineRow, FightVisualCard } from '@/Components/Theme/FightVisuals';
import {
  FMM_ASSET_BASE,
  getFightId,
  getFightStatus,
  getFighterImage,
  safeArray,
  sortFights,
} from '@/Utils/fightExperience';

const API_BASE = 'https://fantasymmadness-game-server-three.vercel.app';
const queryValue = (value) => Array.isArray(value) ? value[0] : value;

const Dashboard = () => {
  const router = useRouter();
  const dispatch = useDispatch();
  const matches = useSelector((state) => state.matches.data);
  const matchStatus = useSelector((state) => state.matches.status);
  const authLoading = useSelector((state) => state.auth.loading);
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);
  const user = useSelector((state) => state.user);
  const [selectedMatchId, setSelectedMatchId] = useState(null);
  const [completedMatchId, setCompletedMatchId] = useState(null);
  const [removedMatches, setRemovedMatches] = useState([]);
  const [isTestimonialOpen, setIsTestimonialOpen] = useState(false);
  const [testimonial, setTestimonial] = useState('');
  const [isSubmittingTestimonial, setIsSubmittingTestimonial] = useState(false);
  const [testimonialSubmitted, setTestimonialSubmitted] = useState(false);

  useEffect(() => {
    if (matchStatus === 'idle') dispatch(fetchMatches());
  }, [dispatch, matchStatus]);

  useEffect(() => {
    if (!router.isReady || authLoading) return;
    const hasToken = typeof window !== 'undefined' && Boolean(localStorage.getItem('authToken'));
    if (!isAuthenticated && !hasToken && !user?._id) {
      router.replace({ pathname: '/auth', query: { mode: 'login', role: 'player', next: '/UserDashboard' } });
    }
  }, [authLoading, isAuthenticated, router, router.isReady, user?._id]);

  useEffect(() => {
    if (!user?._id) return;
    let cancelled = false;
    fetch(`${API_BASE}/users/removed-matches`)
      .then((response) => response.ok ? response.json() : [])
      .then((data) => {
        if (cancelled) return;
        const record = safeArray(data).find((item) => String(item?.userId) === String(user._id));
        setRemovedMatches(safeArray(record?.removedMatchesIds).map(String));
      })
      .catch((error) => console.error('Error fetching removed matches:', error));
    return () => { cancelled = true; };
  }, [user?._id]);

  const hasSubmittedPrediction = useCallback((match) => safeArray(match?.userPredictions).some((prediction) => (
    prediction?.userId && user?._id && String(prediction.userId) === String(user._id) && prediction?.predictionStatus === 'submitted'
  )), [user?._id]);

  const isAvailableFight = useCallback((match) => {
    if (match?.matchType === 'SHADOW') {
      return Boolean(match?.affiliateId && match?.shadowFightId && match?.matchShadowStatus === 'active');
    }
    const status = getFightStatus(match);
    return status === 'upcoming' || status === 'live';
  }, []);

  const activeFights = useMemo(() => sortFights(safeArray(matches).filter((match) => isAvailableFight(match)), 'asc'), [isAvailableFight, matches]);
  const submittedFights = useMemo(() => sortFights(safeArray(matches).filter((match) => hasSubmittedPrediction(match) && !removedMatches.includes(String(getFightId(match)))), 'desc'), [hasSubmittedPrediction, matches, removedMatches]);
  const pendingFights = useMemo(() => activeFights.filter((match) => !hasSubmittedPrediction(match) && !removedMatches.includes(String(getFightId(match)))), [activeFights, hasSubmittedPrediction, removedMatches]);

  useEffect(() => {
    if (!router.isReady || !safeArray(matches).length || selectedMatchId || completedMatchId) return;
    const requestedFight = queryValue(router.query.fight);
    if (!requestedFight) return;
    const match = safeArray(matches).find((item) => String(getFightId(item)) === String(requestedFight));
    if (!match) return;
    if (hasSubmittedPrediction(match)) setCompletedMatchId(getFightId(match));
    else setSelectedMatchId(getFightId(match));
  }, [completedMatchId, hasSubmittedPrediction, matches, router.isReady, router.query.fight, selectedMatchId]);

  const clearSelectedView = () => {
    setSelectedMatchId(null);
    setCompletedMatchId(null);
    if (queryValue(router.query.fight)) router.replace('/UserDashboard', undefined, { shallow: true });
  };

  const selectedMatch = safeArray(matches).find((match) => String(getFightId(match)) === String(selectedMatchId));
  const completedMatch = safeArray(matches).find((match) => String(getFightId(match)) === String(completedMatchId));

  if (selectedMatchId) {
    const hasEnoughTokens = selectedMatch && Number(user?.tokens || 0) >= Number(selectedMatch?.matchTokens || 0);
    return (
      <div className="experience-page xp-dashboard-detail-view">
        <button type="button" className="xp-dashboard-back" onClick={clearSelectedView}><FaArrowLeft /> Back to dashboard</button>
        {selectedMatch ? (hasEnoughTokens ? <FightCosting matchId={selectedMatchId} /> : <PurchaseTokensIntimation matchId={selectedMatchId} />) : <ExperienceEmptyState title="Fight not found" description="This fight card may have been removed or rescheduled." />}
      </div>
    );
  }

  if (completedMatchId) {
    return (
      <div className="experience-page xp-dashboard-detail-view">
        <button type="button" className="xp-dashboard-back" onClick={clearSelectedView}><FaArrowLeft /> Back to dashboard</button>
        {completedMatch ? (String(completedMatch.matchStatus).toLowerCase() === 'ongoing' ? <FightLeaderboard matchId={completedMatchId} /> : <FinishedFightUserBoard matchId={completedMatchId} />) : <ExperienceEmptyState title="Fight record not found" />}
      </div>
    );
  }

  const handleOpenFight = (match) => {
    const id = getFightId(match);
    if (!id) return;
    if (hasSubmittedPrediction(match)) setCompletedMatchId(id);
    else setSelectedMatchId(id);
  };

  const handleRemoveMatch = async (event, matchId) => {
    event.stopPropagation();
    try {
      const response = await fetch(`${API_BASE}/remove-match-from-my-dashboard`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user._id, matchId }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || 'Unable to remove fight');
      setRemovedMatches((current) => [...new Set([...current, String(matchId)])]);
      toast.success('Fight removed from your dashboard.');
    } catch (error) {
      toast.error(error.message || 'Unable to remove this fight.');
    }
  };

  const submitTestimonial = async (event) => {
    event.preventDefault();
    if (!testimonial.trim()) return;
    setIsSubmittingTestimonial(true);
    try {
      const response = await fetch(`${API_BASE}/testimonials`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user._id, author: user.firstName, description: testimonial.trim() }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || 'Unable to submit testimonial');
      toast.success('Thank you for sharing your experience.');
      setTestimonialSubmitted(true);
      setIsTestimonialOpen(false);
      setTestimonial('');
    } catch (error) {
      toast.error(error.message || 'Unable to submit your testimonial.');
    } finally {
      setIsSubmittingTestimonial(false);
    }
  };

  if (!user?.firstName) {
    return <div className="experience-page xp-route-loading">Preparing your fight room...</div>;
  }

  const nextFight = pendingFights[0] || submittedFights[0];
  const displayName = user.playerName || `${user.firstName} ${user.lastName || ''}`.trim();
  const profileImage = user.profileUrl || `${FMM_ASSET_BASE}/fighter-jadden-addison.png`;

  return (
    <>
      <Head><title>Player Dashboard | Fantasy MMAdness</title></Head>
      <div className="experience-page dashboard-experience-page">
        <section className="xp-dashboard-hero">
          <div className="xp-dashboard-hero-grid" />
          <div className="theme-container xp-dashboard-hero-layout">
            <div className="xp-dashboard-profile">
              <div className="xp-dashboard-avatar"><img src={profileImage} alt={displayName} /></div>
              <div>
                <p className="xp-eyebrow"><FaBolt /> Player command center</p>
                <h1>Welcome back, <span>{user.firstName}.</span></h1>
                <p>Manage your fight wallet, complete pending cards, and follow every submitted prediction from one focused dashboard.</p>
                <div className="xp-dashboard-profile-meta">
                  <span><FaUserCircle /> {displayName}</span>
                  <span><FaMedal /> {user.currentPlan || 'Member'} plan</span>
                </div>
              </div>
            </div>
            <div className="xp-dashboard-next-fight">
              {nextFight ? (
                <>
                  <div className="xp-dashboard-next-label">Next in your corner</div>
                  <div className="xp-dashboard-next-art">
                    <img src={getFighterImage(nextFight, 'A', 0)} alt={nextFight.matchFighterA || 'Fighter A'} />
                    <span>VS</span>
                    <img src={getFighterImage(nextFight, 'B', 0)} alt={nextFight.matchFighterB || 'Fighter B'} />
                  </div>
                  <h2>{nextFight.matchFighterA} <em>VS</em> {nextFight.matchFighterB}</h2>
                  <button type="button" className="theme-btn theme-btn-primary" onClick={() => handleOpenFight(nextFight)}>{hasSubmittedPrediction(nextFight) ? 'Follow my card' : 'Make predictions'} <FaArrowRight /></button>
                </>
              ) : (
                <div className="xp-dashboard-next-empty"><FaFistRaised /><h2>Your next card is waiting.</h2><Link href="/fights" className="theme-btn theme-btn-primary">Browse fights</Link></div>
              )}
            </div>
          </div>
        </section>

        <main className="xp-page-main xp-dashboard-main">
          <div className="theme-container">
            <section className="xp-dashboard-stat-grid" aria-label="Player overview">
              <button type="button" onClick={() => router.push('/checkout')}><FaCoins /><span><strong>{Number(user.tokens || 0).toLocaleString()}</strong><small>Fight-wallet tokens</small></span><FaPlus /></button>
              <div><FaFistRaised /><span><strong>{pendingFights.length}</strong><small>Cards waiting</small></span></div>
              <div><FaTrophy /><span><strong>{submittedFights.length}</strong><small>Submitted fights</small></span></div>
              <div><FaMedal /><span><strong>{user.currentPlan || 'Free'}</strong><small>Current plan</small></span></div>
            </section>

            <section className="xp-page-section">
              <ExperienceSectionHeading
                eyebrow="Action required"
                title="Pending fight cards"
                description="Complete these entries before they lock. Every fight card includes the paired fighter imagery and contest context used across the public experience."
                action={{ href: '/fights?status=upcoming', label: 'Find more fights' }}
              />
              {matchStatus === 'loading' ? <div className="xp-loading-grid"><div className="xp-loading-card" /><div className="xp-loading-card" /></div> : pendingFights.length ? (
                <div className="xp-fight-card-grid xp-dashboard-fight-grid">
                  {pendingFights.map((match, index) => (
                    <FightVisualCard
                      match={match}
                      index={index}
                      onAction={handleOpenFight}
                      key={getFightId(match)}
                      footerAction={<button type="button" className="xp-dashboard-remove-fight" onClick={(event) => handleRemoveMatch(event, getFightId(match))}>Remove from dashboard</button>}
                    />
                  ))}
                </div>
              ) : (
                <ExperienceEmptyState title="No pending cards" description="You are fully caught up. Open the fight hub to enter another eligible contest." action={{ href: '/fights?status=upcoming', label: 'Explore upcoming fights' }} />
              )}
            </section>

            <section className="xp-page-section">
              <ExperienceSectionHeading
                eyebrow="Your fight portfolio"
                title="Submitted & completed fights"
                description="Open a live entry to follow the leaderboard or revisit a completed contest to inspect your final performance."
              />
              {submittedFights.length ? (
                <div className="xp-dashboard-portfolio">
                  {submittedFights.map((match, index) => (
                    <div className="xp-dashboard-timeline-wrap" key={getFightId(match)}>
                      <FightTimelineRow match={match} index={index} onAction={handleOpenFight} />
                      <button type="button" className="xp-dashboard-remove-inline" onClick={(event) => handleRemoveMatch(event, getFightId(match))}>Remove</button>
                    </div>
                  ))}
                </div>
              ) : <ExperienceEmptyState title="Your fight portfolio is empty" description="Submitted cards will appear here as soon as your first prediction is confirmed." />}
            </section>

            <section className="xp-dashboard-actions-panel">
              <div className="xp-dashboard-action-art"><img src={`${FMM_ASSET_BASE}/fighter-duel-panel.jpg`} alt="Fantasy MMAdness arena" /></div>
              <div>
                <p className="xp-eyebrow">Keep your corner ready</p>
                <h2>Wallet, profile, standings, and support—one click away.</h2>
                <div className="xp-dashboard-quick-actions">
                  <Link href="/checkout"><FaCoins /> Add tokens</Link>
                  <Link href="/profile"><FaUserCircle /> Edit profile</Link>
                  <Link href="/leaderboard"><FaTrophy /> Leaderboard</Link>
                  <Link href="/FantasyLeagues"><FaMedal /> Join a league</Link>
                </div>
              </div>
              {!user.hasSubmittedTestimonial && !testimonialSubmitted && <button type="button" className="theme-btn theme-btn-secondary" onClick={() => setIsTestimonialOpen(true)}><FaStar /> Share experience</button>}
            </section>
          </div>
        </main>

        {isTestimonialOpen && (
          <div className="xp-modal-backdrop" role="presentation" onMouseDown={() => setIsTestimonialOpen(false)}>
            <form className="xp-modal" onSubmit={submitTestimonial} onMouseDown={(event) => event.stopPropagation()}>
              <div className="xp-modal-icon"><FaCommentDots /></div>
              <p className="xp-eyebrow">Player feedback</p>
              <h2>Share your Fantasy MMAdness experience.</h2>
              <textarea value={testimonial} onChange={(event) => setTestimonial(event.target.value)} placeholder="Tell the community what you enjoy about the fight-night experience..." required />
              <div><button type="button" className="theme-btn theme-btn-secondary" onClick={() => setIsTestimonialOpen(false)}>Cancel</button><button type="submit" className="theme-btn theme-btn-primary" disabled={isSubmittingTestimonial}>{isSubmittingTestimonial ? 'Submitting...' : 'Submit testimonial'}</button></div>
            </form>
          </div>
        )}
      </div>
    </>
  );
};

export default Dashboard;
