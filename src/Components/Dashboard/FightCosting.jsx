import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useRouter } from 'next/router';
import {
  FaArrowLeft,
  FaArrowRight,
  FaCalendarAlt,
  FaClock,
  FaCoins,
  FaFistRaised,
  FaLock,
  FaShieldAlt,
  FaTrophy,
  FaUsers,
} from 'react-icons/fa';
import MakePredictions from '../MakePredictions/MakePredictions';
import { getFightCategory, getFighterImage } from '@/Utils/fightExperience';

const FightCosting = ({ matchId }) => {
  const router = useRouter();
  const user = useSelector((state) => state.user);
  const matches = useSelector((state) => state.matches.data);
  const match = Array.isArray(matches) ? matches.find((item) => item._id === matchId) : null;

  const [timeRemaining, setTimeRemaining] = useState({
    diffHrs: 0,
    diffMins: 0,
    diffSecs: 0,
    hasStarted: false,
  });
  const [showPredictions, setShowPredictions] = useState(false);
  const [isEntering, setIsEntering] = useState(false);

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

  if (!match) {
    return (
      <section className="player-dynamic-empty">
        <FaShieldAlt />
        <h2>Fight details unavailable</h2>
        <p>The selected fight could not be found in the current match directory.</p>
      </section>
    );
  }

  const handleMatchClick = async () => {
    setIsEntering(true);
    try {
      const response = await fetch('https://fantasymmadness-game-server-three.vercel.app/api/deduct-tokens', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user._id,
          matchTokens: match.matchTokens,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        setShowPredictions(true);
      } else {
        alert(data.message || 'Could not deduct tokens. Please try again.');
      }
    } catch (error) {
      console.error('Error in deducting tokens:', error);
      alert('An error occurred. Please try again later.');
    } finally {
      setIsEntering(false);
    }
  };

  if (showPredictions) {
    return (
      <section className="player-prediction-dynamic-view">
        <div className="theme-container player-dynamic-back-row">
          <button type="button" onClick={() => setShowPredictions(false)}>
            <FaArrowLeft /> Back to fight details
          </button>
        </div>
        <MakePredictions matchId={matchId} />
      </section>
    );
  }

  const fighterAImage = getFighterImage(match, 'A', 0);
  const fighterBImage = getFighterImage(match, 'B', 1);
  const tokenCost = Number(match.matchTokens || 0);
  const walletTokens = Number(user?.tokens || 0);
  const enoughTokens = walletTokens >= tokenCost;
  const players = Array.isArray(match.userPredictions) ? match.userPredictions.length : 0;

  return (
    <section className="player-fight-entry premium-fight-costing">
      <div className="player-fight-entry-backdrop" aria-hidden="true" />
      <div className="theme-container player-fight-entry-shell">
        <header className="player-fight-entry-header">
          <div className="player-fight-entry-member">
            <img src={user?.profileUrl || '/images/fmm-experience/avatar-placeholder.svg'} alt={user?.firstName || 'Player'} />
            <span>
              <small>Player corner</small>
              <strong>{user?.firstName} {user?.lastName}</strong>
              <em>{user?.currentPlan || 'Member'} plan</em>
            </span>
          </div>
          <button type="button" className="player-fight-entry-wallet" onClick={() => router.push('/checkout')}>
            <FaCoins />
            <span><small>Fight wallet</small><strong>{walletTokens}</strong><em>tokens available</em></span>
          </button>
        </header>

        <section className="player-fight-entry-hero">
          <div className="player-fight-entry-copy">
            <p><FaFistRaised /> Prediction entry room</p>
            <h1>Enter the fight. <span>Call every round.</span></h1>
            <div className="player-fight-entry-meta">
              <span><FaCalendarAlt /> {match.matchDate?.split('T')[0] || 'Date TBA'}</span>
              <span><FaClock /> {match.matchTime || 'Time TBA'}</span>
              <span><FaTrophy /> {getFightCategory(match)}</span>
              <span><FaUsers /> {players} players</span>
            </div>
            <div className={`player-fight-entry-countdown ${timeRemaining.hasStarted ? 'is-live' : ''}`}>
              <FaClock />
              <span>
                <small>{timeRemaining.hasStarted ? 'Fight status' : 'Predictions lock in'}</small>
                <strong>{timeRemaining.hasStarted ? 'Fight has started' : `${timeRemaining.diffHrs}h ${timeRemaining.diffMins}m ${timeRemaining.diffSecs}s`}</strong>
              </span>
            </div>
          </div>

          <div className="player-fight-entry-cost-card">
            <FaLock />
            <span>Entry requirement</span>
            <strong>{tokenCost === 0 ? 'Free' : tokenCost}</strong>
            <small>{tokenCost === 0 ? 'No tokens required' : 'tokens to enter'}</small>
            <i className={enoughTokens ? 'is-ready' : 'is-low'}>{enoughTokens ? 'Wallet ready' : 'Add tokens required'}</i>
          </div>
        </section>

        <section className="player-fight-entry-card">
          <article className="is-blue">
            <div className="player-fight-entry-fighter-art"><img src={fighterAImage} alt={match.matchFighterA || 'Fighter A'} /></div>
            <div><small>Blue corner</small><h2>{match.matchFighterA || 'Fighter A'}</h2></div>
          </article>
          <div className="player-fight-entry-vs"><span>VS</span><small>{match.maxRounds || '—'} rounds</small></div>
          <article className="is-red">
            <div className="player-fight-entry-fighter-art"><img src={fighterBImage} alt={match.matchFighterB || 'Fighter B'} /></div>
            <div><small>Red corner</small><h2>{match.matchFighterB || 'Fighter B'}</h2></div>
          </article>
        </section>

        <section className="player-fight-entry-action-bar">
          <div>
            <FaShieldAlt />
            <span><strong>Original entry flow preserved</strong><small>Token deduction and prediction submission use the existing endpoints.</small></span>
          </div>
          <button type="button" onClick={handleMatchClick} disabled={isEntering}>
            {isEntering ? 'Opening scorecard…' : 'Make predictions'} <FaArrowRight />
          </button>
        </section>
      </div>
    </section>
  );
};

export default FightCosting;
