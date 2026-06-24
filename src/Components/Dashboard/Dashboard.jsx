import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter } from 'next/router';
import { toast } from 'react-toastify';
import {
  FaArrowLeft,
  FaArrowRight,
  FaBolt,
  FaCalendarAlt,
  FaChartLine,
  FaCoins,
  FaFire,
  FaFistRaised,
  FaHistory,
  FaMedal,
  FaShieldAlt,
  FaStar,
  FaTimes,
  FaTrophy,
  FaUserCircle,
  FaUserCog,
  FaUsers,
} from 'react-icons/fa';
import { fetchMatches } from '../../Redux/matchSlice';
import FightCosting from './FightCosting';
import FightLeaderboard from '../GlobalLeaderboard/FightLeaderboard';
import PurchaseTokensIntimation from './PurchaseTokensIntimation';
import FinishedFightUserBoard from '../FinishedFightUserBoard/FinishedFightUserBoard';
import UserWorkspaceNav from '../UserProfile/UserWorkspaceNav';
import { getFightCategory, getFightId, getFighterImage } from '@/Utils/fightExperience';

const safePredictions = (match) => (Array.isArray(match?.userPredictions) ? match.userPredictions : []);
const isSameId = (left, right) => String(left || '') === String(right || '');

const Dashboard = () => {
  const router = useRouter();
  const dispatch = useDispatch();
  const matches = useSelector((state) => state.matches.data);
  const matchStatus = useSelector((state) => state.matches.status);
  const user = useSelector((state) => state.user);

  const [isOpen, setIsOpen] = useState(false);
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedMatchId, setSelectedMatchId] = useState(null);
  const [completedMatchId, setCompletedMatchId] = useState(null);
  const [hoveredMatch, setHoveredMatch] = useState(null);
  const [upcomingMatches, setUpcomingMatches] = useState([]);
  const [removedMatches, setRemovedMatches] = useState([]);

  useEffect(() => {
    if (!user?._id) return;
    const fetchRemovedMatches = async () => {
      try {
        const response = await fetch('https://fantasymmadness-game-server-three.vercel.app/users/removed-matches');
        const data = await response.json();
        const userMatches = Array.isArray(data) ? data.filter((item) => isSameId(item.userId, user._id)) : [];
        if (userMatches.length > 0) setRemovedMatches(userMatches[0].removedMatchesIds || []);
      } catch (error) {
        console.error('Error fetching removed matches:', error);
      }
    };
    fetchRemovedMatches();
  }, [user?._id]);

  useEffect(() => {
    if (matchStatus === 'idle') dispatch(fetchMatches());
  }, [matchStatus, dispatch]);

  useEffect(() => {
    const today = new Date();
    const currentTime = new Date();
    const filteredMatches = (Array.isArray(matches) ? matches : []).map((match) => {
      const matchDateTime = new Date(`${match?.matchDate?.split('T')[0]}T${match?.matchTime || '00:00'}:00`);
      if (match.matchType === 'LIVE') {
        if (matchDateTime >= today.setHours(0, 0, 0, 0) && currentTime < matchDateTime) return { ...match, blurred: false };
      } else if (match.matchType === 'SHADOW') {
        if (match.affiliateId && match.shadowFightId && match.matchShadowStatus === 'active') return { ...match, blurred: false };
      }
      return null;
    }).filter(Boolean);
    setUpcomingMatches(filteredMatches);
  }, [matches]);

  const getRemainingTime = (matchDate, matchTime) => {
    const [year, month, day] = String(matchDate || '').split('T')[0].split('-');
    const [hours = '00', minutes = '00'] = String(matchTime || '00:00').split(':');
    const matchDateTime = new Date(`${year}-${month}-${day}T${hours}:${minutes}`);
    const diffMs = matchDateTime - new Date();
    const hasStarted = diffMs <= 0 || Number.isNaN(diffMs);
    return {
      diffHrs: hasStarted ? 0 : Math.floor(diffMs / (1000 * 60 * 60)),
      diffMins: hasStarted ? 0 : Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60)),
      hasStarted,
    };
  };

  const completedMatches = useMemo(() => (Array.isArray(matches) ? matches : []).filter((match) => safePredictions(match).some((prediction) => isSameId(prediction.userId, user?._id) && prediction.predictionStatus === 'submitted')), [matches, user?._id]);
  const pendingMatches = useMemo(() => upcomingMatches.filter((match) => !safePredictions(match).some((prediction) => isSameId(prediction.userId, user?._id) && prediction.predictionStatus === 'submitted') && !removedMatches.includes(match._id)), [removedMatches, upcomingMatches, user?._id]);
  const visibleCompleted = useMemo(() => completedMatches.filter((match) => !removedMatches.includes(match._id)), [completedMatches, removedMatches]);

  const handleRemoveMatch = async (matchId) => {
    try {
      const response = await fetch('https://fantasymmadness-game-server-three.vercel.app/remove-match-from-my-dashboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user._id, matchId }),
      });
      const data = await response.json();
      if (response.ok) {
        alert('Match removed from dashboard successfully');
        window.location.reload();
      } else {
        alert(data.message);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const closePopup = () => {
    setIsOpen(false);
    setDescription('');
  };

  const handleSubmit = async () => {
    if (!description.trim()) {
      alert('Description cannot be empty!');
      return;
    }
    setIsSubmitting(true);
    try {
      const response = await fetch('https://fantasymmadness-game-server-three.vercel.app/testimonials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user._id, author: user.firstName, description }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to submit testimonial');
      }
      alert('Testimonial submitted successfully!');
      closePopup();
      window.location.reload();
    } catch (error) {
      console.error(error.message);
      alert('Failed to submit testimonial.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user?.firstName) {
    return <section className="player-command-page"><div className="theme-container"><div className="player-dynamic-empty"><FaFistRaised /><h2>Loading player command center…</h2></div></div></section>;
  }

  if (selectedMatchId) {
    const selectedMatch = (Array.isArray(matches) ? matches : []).find((match) => match._id === selectedMatchId);
    if (!selectedMatch) {
      return <section className="player-dynamic-route-view"><div className="theme-container player-dynamic-back-row"><button type="button" onClick={() => setSelectedMatchId(null)}><FaArrowLeft /> Back to dashboard</button></div><div className="player-dynamic-empty"><FaShieldAlt /><h2>Selected fight not found</h2></div></section>;
    }
    return (
      <section className="player-dynamic-route-view">
        <div className="theme-container player-dynamic-back-row"><button type="button" onClick={() => setSelectedMatchId(null)}><FaArrowLeft /> Back to dashboard</button></div>
        {Number(user.tokens || 0) >= Number(selectedMatch.matchTokens || 0)
          ? <FightCosting matchId={selectedMatchId} />
          : <PurchaseTokensIntimation matchId={selectedMatchId} />}
      </section>
    );
  }

  if (completedMatchId) {
    const completedMatch = (Array.isArray(matches) ? matches : []).find((match) => match._id === completedMatchId);
    if (!completedMatch) {
      return <section className="player-dynamic-route-view"><div className="theme-container player-dynamic-back-row"><button type="button" onClick={() => setCompletedMatchId(null)}><FaArrowLeft /> Back to dashboard</button></div><div className="player-dynamic-empty"><FaShieldAlt /><h2>Completed fight not found</h2></div></section>;
    }
    return (
      <section className="player-dynamic-route-view">
        <div className="theme-container player-dynamic-back-row"><button type="button" onClick={() => setCompletedMatchId(null)}><FaArrowLeft /> Back to dashboard</button></div>
        {completedMatch.matchStatus === 'Ongoing'
          ? <FightLeaderboard matchId={completedMatchId} />
          : <FinishedFightUserBoard matchId={completedMatchId} />}
      </section>
    );
  }

  const renderFightCard = (match, variant = 'active') => {
    const id = getFightId(match);
    const remaining = match.matchType === 'LIVE' ? getRemainingTime(match.matchDate, match.matchTime) : null;
    const predictionsCount = safePredictions(match).length;
    const canOpen = variant === 'pending' || variant === 'completed';
    const handleOpen = () => {
      if (!canOpen) return;
      if (variant === 'completed') {
        setCompletedMatchId(id);
        return;
      }
      if (match.matchType === 'SHADOW' && match.blurred) toast.error('Affiliate criteria has not been met for this SHADOW match.');
      else setSelectedMatchId(id);
    };

    return (
      <article
        className={`player-command-fight-card ${match.blurred ? 'is-blurred' : ''}`}
        key={`${variant}-${id}`}
        onMouseEnter={() => setHoveredMatch(id)}
        onMouseLeave={() => setHoveredMatch(null)}
      >
        {hoveredMatch === id && <button className="player-command-remove" type="button" onClick={(event) => { event.stopPropagation(); handleRemoveMatch(id); }}>Remove</button>}
        <button type="button" onClick={handleOpen} disabled={!canOpen}>
          <div className="player-command-fight-art">
            <figure><img src={getFighterImage(match, 'A', 0)} alt={match.matchFighterA || 'Fighter A'} /><figcaption>{match.matchFighterA}</figcaption></figure>
            <span>VS</span>
            <figure><img src={getFighterImage(match, 'B', 1)} alt={match.matchFighterB || 'Fighter B'} /><figcaption>{match.matchFighterB}</figcaption></figure>
          </div>
          <div className="player-command-fight-copy">
            <p><span>{getFightCategory(match)}</span><b>{match.matchType}</b></p>
            <h3>{match.matchFighterA} <em>vs</em> {match.matchFighterB}</h3>
            <div>
              <span><FaCalendarAlt /> {match.matchDate?.split('T')[0] || 'Date TBA'}</span>
              <span><FaUsers /> {predictionsCount} players</span>
              <span><FaCoins /> {match.matchTokens === null ? 'Free' : `${match.matchTokens || 0} tokens`}</span>
            </div>
            {match.matchDescription && <small>{match.matchDescription}</small>}
          </div>
          <div className="player-command-fight-action">
            {remaining && <span>{remaining.hasStarted ? 'Fight has started' : `${remaining.diffHrs}h ${remaining.diffMins}m to lock`}</span>}
            <strong>{variant === 'completed' ? 'View result' : 'Make predictions'} <FaArrowRight /></strong>
          </div>
        </button>
      </article>
    );
  };

  const nextMission = pendingMatches[0];
  const currentRankEstimate = visibleCompleted.length ? Math.max(1, 100 - visibleCompleted.length * 3) : '—';
  const quickActions = [
    { href: '/YourFights', label: 'My fight library', copy: 'All completed and pending cards', icon: FaFistRaised },
    { href: '/myLeagueRecords', label: 'My leagues', copy: 'Creator communities and records', icon: FaUsers },
    { href: '/fighter-performance-tracker', label: 'Fighter tracker', copy: 'Research form and performance', icon: FaChartLine },
    { href: '/account-settings', label: 'Account settings', copy: 'Preferences and payment details', icon: FaUserCog },
  ];

  return (
    <div className="player-command-page">
      <section className="player-command-hero">
        <div className="player-command-hero-grid" aria-hidden="true" />
        <div className="theme-container player-command-hero-layout">
          <div className="player-command-hero-copy">
            <p><FaFire /> Player command center</p>
            <h1>Read the card. <span>Own the round.</span></h1>
            <p>Welcome back, {user.firstName}. Your dashboard now brings every pending pick, completed result, league, wallet, and research tool into one premium fight-night workspace.</p>
            <div className="player-command-hero-actions">
              {nextMission ? (
                <button type="button" onClick={() => setSelectedMatchId(getFightId(nextMission))}>Make next prediction <FaArrowRight /></button>
              ) : (
                <Link href="/upcomingfights">Explore upcoming fights <FaArrowRight /></Link>
              )}
              <Link href="/mock-game" className="is-secondary">Practice in mock game <FaBolt /></Link>
            </div>
            <div className="player-command-hero-proof">
              <span><FaShieldAlt /><strong>Original flow intact</strong><small>Every API and prediction action remains connected.</small></span>
              <span><FaTrophy /><strong>{visibleCompleted.length} submitted</strong><small>Your completed prediction cards.</small></span>
            </div>
          </div>

          <aside className="player-command-spotlight">
            <header>
              <img src={user.profileUrl || '/images/fmm-experience/avatar-placeholder.svg'} alt={user.firstName} />
              <span><small>Fight identity</small><strong>{user.firstName} {user.lastName}</strong><em>{user.currentPlan || 'Member'} plan</em></span>
              <i><FaMedal /></i>
            </header>
            {nextMission ? (
              <div className="player-command-next-card">
                <p>Next prediction mission</p>
                <div>
                  <figure><img src={getFighterImage(nextMission, 'A', 0)} alt={nextMission.matchFighterA || 'Fighter A'} /></figure>
                  <b>VS</b>
                  <figure><img src={getFighterImage(nextMission, 'B', 1)} alt={nextMission.matchFighterB || 'Fighter B'} /></figure>
                </div>
                <h2>{nextMission.matchFighterA} <span>vs</span> {nextMission.matchFighterB}</h2>
                <button type="button" onClick={() => setSelectedMatchId(getFightId(nextMission))}>Open scorecard <FaArrowRight /></button>
              </div>
            ) : (
              <div className="player-command-next-empty"><FaTrophy /><h2>You are caught up.</h2><p>No pending cards require a prediction right now.</p></div>
            )}
          </aside>
        </div>
      </section>

      <UserWorkspaceNav className="player-workspace-nav-dashboard-home" />

      <main className="theme-container player-command-main">
        <section className="player-command-stat-grid">
          <article><FaHistory /><span><strong>{pendingMatches.length}</strong><small>Pending picks</small></span></article>
          <article><FaTrophy /><span><strong>{visibleCompleted.length}</strong><small>Submitted cards</small></span></article>
          <article onClick={() => router.push('/checkout')} role="button" tabIndex={0}><FaCoins /><span><strong>{user.tokens || 0}</strong><small>Wallet tokens</small></span></article>
          <article><FaMedal /><span><strong>{currentRankEstimate}</strong><small>Momentum rank</small></span></article>
        </section>

        <section className="player-command-quick-section">
          <header><div><p>Fight-night tools</p><h2>Move faster from one corner.</h2></div><Link href="/YourFights">Open full fight library <FaArrowRight /></Link></header>
          <div className="player-command-quick-grid">
            {quickActions.map(({ href, label, copy, icon: Icon }) => (
              <Link href={href} key={href}><i><Icon /></i><span><strong>{label}</strong><small>{copy}</small></span><FaArrowRight /></Link>
            ))}
          </div>
        </section>

        <section className="player-command-section">
          <header><span>01</span><div><p>Submitted fight cards</p><h2>Your completed fights</h2><small>Open a card to review live standings or the completed round-by-round report.</small></div></header>
          <div className="player-command-fight-grid">{visibleCompleted.length ? visibleCompleted.map((match) => renderFightCard(match, 'completed')) : <div className="player-dynamic-empty is-inline"><FaTrophy /><h3>No completed matches</h3><p>Your submitted prediction cards will appear here.</p></div>}</div>
        </section>

        <section className="player-command-section">
          <header><span>02</span><div><p>Cards requiring action</p><h2>Your pending fights</h2><small>Open a card to review entry details and submit your predictions.</small></div></header>
          <div className="player-command-fight-grid">{pendingMatches.length ? pendingMatches.map((match) => renderFightCard(match, 'pending')) : <div className="player-dynamic-empty is-inline"><FaShieldAlt /><h3>No pending matches</h3><p>You are fully caught up for the current fight schedule.</p></div>}</div>
        </section>

        {!user.hasSubmittedTestimonial && (
          <button className="player-command-testimonial" type="button" onClick={() => setIsOpen(true)}>
            <FaStar /><span><strong>Share your Fantasy MMAdness experience</strong><small>Your approved story may be featured on the public testimonials page.</small></span><FaArrowRight />
          </button>
        )}
      </main>

      {isOpen && (
        <div className="xp-modal-backdrop">
          <div className="xp-dashboard-modal player-command-modal">
            <button className="xp-modal-close" type="button" onClick={closePopup}><FaTimes /></button>
            <h2>Submit your testimonial</h2>
            <p>Share a short note about your Fantasy MMAdness experience.</p>
            <textarea placeholder="Enter your testimonial..." value={description} onChange={(event) => setDescription(event.target.value)} />
            <div>
              <button className="theme-btn theme-btn-primary" type="button" onClick={handleSubmit} disabled={isSubmitting}>{isSubmitting ? 'Submitting...' : 'Submit'}</button>
              <button className="theme-btn theme-btn-secondary" type="button" onClick={closePopup}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
