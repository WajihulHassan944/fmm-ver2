import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useRouter } from 'next/router';
import {
  FaArrowLeft,
  FaArrowRight,
  FaClock,
  FaLock,
  FaShieldAlt,
} from 'react-icons/fa';
import AddTokensToWallet from '../UserProfile/AddTokensToWallet';
import { getFighterImage, getFighterName } from '@/Utils/fightExperience';
import { FMCoin, FMCoinAmount } from '@/Components/Common/FMCoin';

const PurchaseTokensIntimation = ({ matchId }) => {
  const router = useRouter();
  const user = useSelector((state) => state.user);
  const matches = useSelector((state) => state.matches.data);
  const match = Array.isArray(matches) ? matches.find((item) => item._id === matchId) : null;
  const [timeRemaining, setTimeRemaining] = useState({ diffHrs: 0, diffMins: 0, diffSecs: 0, hasStarted: false });
  const [showPurchase, setShowPurchase] = useState(false);

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

  if (!match) return <div className="player-dynamic-empty"><FaShieldAlt /><h2>Match not found</h2></div>;

  if (showPurchase) {
    return (
      <section className="player-account-nested-view">
        <div className="theme-container player-dynamic-back-row"><button type="button" onClick={() => setShowPurchase(false)}><FaArrowLeft /> Back to fight entry</button></div>
        <AddTokensToWallet matchId={matchId} />
      </section>
    );
  }

  return (
    <section className="player-wallet-gate">
      <div className="player-wallet-gate-backdrop" aria-hidden="true" />
      <div className="theme-container player-wallet-gate-shell">
        <header>
          <div><p><FaLock /> Wallet requirement</p><h1>Add FM COINS. <span>Enter the fight.</span></h1><small>Your FM COINS balance is below this fight card&apos;s entry requirement.</small></div>
          <button type="button" onClick={() => router.push('/checkout')}><FMCoin size="lg" motion="shine" /><span><small>Current wallet</small><strong>{Number(user.tokens || 0).toLocaleString()}</strong><em>FM COINS</em></span></button>
        </header>

        <section className="player-wallet-gate-fight">
          <article><img src={getFighterImage(match, 'A', 0)} alt={getFighterName(match, 'A')} /><strong>{getFighterName(match, 'A')}</strong></article>
          <div><b>VS</b><span><FaClock /> {timeRemaining.hasStarted ? 'Fight has started' : `${timeRemaining.diffHrs}h ${timeRemaining.diffMins}m ${timeRemaining.diffSecs}s`}</span></div>
          <article><img src={getFighterImage(match, 'B', 1)} alt={getFighterName(match, 'B')} /><strong>{getFighterName(match, 'B')}</strong></article>
        </section>

        <section className="player-wallet-gate-summary">
          <article><small>Fight entry</small><FMCoinAmount amount={match.matchTokens || 0} size="sm" /></article>
          <article><small>Your wallet</small><FMCoinAmount amount={user.tokens || 0} size="sm" /></article>
          <article><small>Additional requirement</small><FMCoinAmount amount={Math.max(0, Number(match.matchTokens || 0) - Number(user.tokens || 0))} size="sm" motion="bounce" /></article>
        </section>

        <div className="player-wallet-gate-action">
          <span><FaShieldAlt /> Predictions should be completed at least 10 minutes before the fight starts.</span>
          <button type="button" onClick={() => setShowPurchase(true)}>Get FM COINS <FaArrowRight /></button>
        </div>
      </div>
    </section>
  );
};

export default PurchaseTokensIntimation;
