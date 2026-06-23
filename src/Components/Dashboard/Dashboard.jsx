
import React, { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter } from 'next/router';
import { toast } from 'react-toastify';
import { FaArrowRight, FaCoins, FaFistRaised, FaHistory, FaStar, FaTimes, FaTrophy, FaUserCircle } from 'react-icons/fa';
import { fetchMatches } from '../../Redux/matchSlice';
import FightCosting from './FightCosting';
import FightLeaderboard from '../GlobalLeaderboard/FightLeaderboard';
import PurchaseTokensIntimation from './PurchaseTokensIntimation';
import FinishedFightUserBoard from '../FinishedFightUserBoard/FinishedFightUserBoard';
import { getFightCategory, getFightId, getFighterImage } from '@/Utils/fightExperience';

const safePredictions = (match) => Array.isArray(match?.userPredictions) ? match.userPredictions : [];
const isSameId = (a, b) => String(a || '') === String(b || '');

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
  const pendingMatches = useMemo(() => upcomingMatches.filter((match) => safePredictions(match) && !safePredictions(match).some((prediction) => isSameId(prediction.userId, user?._id) && prediction.predictionStatus === 'submitted') && !removedMatches.includes(match._id)), [removedMatches, upcomingMatches, user?._id]);
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

  if (!user || !user.firstName) {
    return <section className="xp-dashboard-page player-dashboard-rich-page"><div className="theme-container"><div className="xp-empty-card">Loading player dashboard...</div></div></section>;
  }

  if (selectedMatchId) {
    const selectedMatch = (Array.isArray(matches) ? matches : []).find((match) => match._id === selectedMatchId);
    if (!selectedMatch) {
      return <section className="xp-dashboard-page"><button className="xp-dashboard-back" onClick={() => setSelectedMatchId(null)}>← Back</button><div className="xp-empty-card">Selected match not found.</div></section>;
    }
    return (
      <section className="xp-dashboard-focus-view">
        <button className="xp-dashboard-back dashboard-back-arrow" type="button" onClick={() => setSelectedMatchId(null)}>← Back to dashboard</button>
        {Number(user.tokens || 0) >= Number(selectedMatch.matchTokens || 0) ? <FightCosting matchId={selectedMatchId} /> : <PurchaseTokensIntimation matchId={selectedMatchId} />}
      </section>
    );
  }

  if (completedMatchId) {
    const matchCom = (Array.isArray(matches) ? matches : []).find((match) => match._id === completedMatchId);
    if (!matchCom) {
      return <section className="xp-dashboard-page"><button className="xp-dashboard-back" onClick={() => setCompletedMatchId(null)}>← Back</button><div className="xp-empty-card">Completed match not found.</div></section>;
    }
    return (
      <section className="xp-dashboard-focus-view">
        <button className="xp-dashboard-back" type="button" onClick={() => setCompletedMatchId(null)}>← Back to dashboard</button>
        {matchCom.matchStatus === 'Ongoing' ? <FightLeaderboard matchId={completedMatchId} /> : <FinishedFightUserBoard matchId={completedMatchId} />}
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
      if (match.matchType === 'SHADOW' && match.blurred) {
        toast.error('Affiliate criteria has not been met for this SHADOW match.');
      } else {
        setSelectedMatchId(id);
      }
    };

    return (
      <article
        className={`xp-dashboard-fight-card ${match.blurred ? 'is-blurred' : ''}`}
        key={`${variant}-${id}`}
        onMouseEnter={() => setHoveredMatch(id)}
        onMouseLeave={() => setHoveredMatch(null)}
      >
        {hoveredMatch === id && (
          <button className="xp-dashboard-remove" type="button" onClick={(event) => { event.stopPropagation(); handleRemoveMatch(id); }}>Remove</button>
        )}
        <button className="xp-dashboard-card-main" type="button" onClick={handleOpen} disabled={!canOpen}>
          <div className="xp-dashboard-fighters">
            <img src={getFighterImage(match, 'A', 0)} alt={match.matchFighterA || 'Fighter A'} />
            <span>VS</span>
            <img src={getFighterImage(match, 'B', 1)} alt={match.matchFighterB || 'Fighter B'} />
          </div>
          <div className="xp-dashboard-fight-copy">
            <small>{getFightCategory(match)} · {match.matchType}</small>
            <strong>{match.matchFighterA} vs {match.matchFighterB}</strong>
            <p>{match.matchDate?.split('T')[0] || 'Date TBA'} · {match.matchTime || 'Time TBA'}</p>
            {match.matchDescription && <em>{match.matchDescription}</em>}
          </div>
          <div className="xp-dashboard-card-meta">
            <span><FaFistRaised /> {match.maxRounds || '—'} rounds</span>
            <span><FaTrophy /> {predictionsCount} players</span>
            <span><FaCoins /> {match.matchTokens === null ? 'Free' : `${match.matchTokens || 0} tokens`}</span>
            {remaining && <span>{remaining.hasStarted ? 'Fight has started' : `Begins in ${remaining.diffHrs}h ${remaining.diffMins}m`}</span>}
          </div>
          {canOpen && <b>{variant === 'completed' ? 'Open result' : 'Open prediction'} <FaArrowRight /></b>}
        </button>
      </article>
    );
  };

  return (
    <section className="xp-dashboard-page">
      <div className="theme-container">
        <div className="xp-dashboard-hero player-dashboard-hero-rich">
          <div className="xp-dashboard-profile">
            <img src={user.profileUrl || '/images/fmm-experience/avatar-placeholder.svg'} alt={user.firstName} />
            <div>
              <span>Player dashboard</span>
              <h1>{user.firstName} {user.lastName}</h1>
              <p>{user.currentPlan || 'Member'} plan · control your active entries, pending cards, completed fights, wallet, and testimonials.</p>
            </div>
          </div>
          <button type="button" className="xp-dashboard-wallet" onClick={() => router.push('/checkout')}>
            <FaCoins />
            <span>Fight wallet</span>
            <strong>{user.tokens || 0}</strong>
            <small>tokens remaining</small>
          </button>
        </div>

        <div className="xp-dashboard-stats">
          <article><FaHistory /><strong>{pendingMatches.length}</strong><span>Pending picks</span></article>
          <article><FaTrophy /><strong>{visibleCompleted.length}</strong><span>Submitted cards</span></article>
          <article><FaUserCircle /><strong>{user.currentPlan || 'Player'}</strong><span>Current plan</span></article>
        </div>

        <div className="xp-dashboard-sections">
          <section>
            <div className="xp-dashboard-section-heading"><span>01</span><div><h2>Your completed fights</h2><p>Cards where your prediction status has already been submitted.</p></div></div>
            <div className="xp-dashboard-card-grid">{visibleCompleted.length ? visibleCompleted.map((match) => renderFightCard(match, 'completed')) : <div className="xp-empty-card">No completed matches</div>}</div>
          </section>

          <section>
            <div className="xp-dashboard-section-heading"><span>02</span><div><h2>Your pending fights</h2><p>Open these cards to make or complete your prediction entry.</p></div></div>
            <div className="xp-dashboard-card-grid">{pendingMatches.length ? pendingMatches.map((match) => renderFightCard(match, 'pending')) : <div className="xp-empty-card">No pending matches</div>}</div>
          </section>
        </div>

        {!user.hasSubmittedTestimonial && (
          <button className="xp-dashboard-testimonial" type="button" onClick={() => setIsOpen(true)}>
            <FaStar /> <span>Share your experience</span>
          </button>
        )}
      </div>

      {isOpen && (
        <div className="xp-modal-backdrop">
          <div className="xp-dashboard-modal">
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
    </section>
  );
};

export default Dashboard;
