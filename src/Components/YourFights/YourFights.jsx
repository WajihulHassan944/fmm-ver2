import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter } from 'next/router';
import {
  FaArrowLeft,
  FaArrowRight,
  FaCalendarAlt,
  FaCoins,
  FaCrown,
  FaFistRaised,
  FaHistory,
  FaShieldAlt,
  FaTrashAlt,
  FaTrophy,
  FaUsers,
} from 'react-icons/fa';
import { fetchMatches } from '../../Redux/matchSlice';
import { fetchPublicPredictionFights } from '@/Utils/publicApi';
import FightLeaderboard from '../GlobalLeaderboard/FightLeaderboard';
import FightCosting from '../Dashboard/FightCosting';
import useLeaderboardData from '../../CustomFunctions/useLeaderboardData';
import UserWorkspaceNav from '../UserProfile/UserWorkspaceNav';
import { getFightCategory, getFightId, getFighterImage, getFighterName } from '@/Utils/fightExperience';
import { orderFightsForDisplay } from '@/Utils/fightOrdering';
import { formatWrestlingDate, getWrestlerImage as getPWImage, safeWrestlingArray, wrestlingRequest } from '@/Utils/proWrestling';

const safePredictions = (match) => (Array.isArray(match?.userPredictions) ? match.userPredictions : []);
const sameId = (left, right) => String(left || '') === String(right || '');
const isSubmittedByUser = (match, userId) => {
  const status = String(match?.userPredictionStatus || match?.predictionStatus || '').toLowerCase();
  const bucket = String(match?.userFightBucket || '').toLowerCase();
  return Boolean(
    match?.predictionSubmitted === true ||
    match?.userPredictionSubmitted === true ||
    bucket === 'completed' ||
    ['submitted', 'complete', 'completed'].includes(status) ||
    safePredictions(match).some((prediction) => sameId(prediction.userId, userId) && prediction.predictionStatus === 'submitted')
  );
};

const YourFights = () => {
  const dispatch = useDispatch();
  const router = useRouter();
  const matches = useSelector((state) => state.matches.data);
  const matchStatus = useSelector((state) => state.matches.status);
  const user = useSelector((state) => state.user);
  const { leaderboard } = useLeaderboardData(matches);

  const [selectedMatchId, setSelectedMatchId] = useState(null);
  const [completedMatchId, setCompletedMatchId] = useState(null);
  const [upcomingMatches, setUpcomingMatches] = useState([]);
  const [playableMatches, setPlayableMatches] = useState([]);
  const [removedMatches, setRemovedMatches] = useState([]);
  const [wrestlingHistory, setWrestlingHistory] = useState([]);

  useEffect(() => {
    if (matchStatus === 'idle') dispatch(fetchMatches());
  }, [matchStatus, dispatch]);

  useEffect(() => {
    let active = true;
    const requestQuery = { limit: 120 };
    if (user?._id) {
      requestQuery.userId = user._id;
      requestQuery.playerId = user._id;
    }
    fetchPublicPredictionFights(requestQuery)
      .then((rows) => {
        if (active) setPlayableMatches(Array.isArray(rows) ? rows : []);
      })
      .catch((error) => {
        console.warn('Prediction-ready fight library feed unavailable:', error.message);
        if (active) setPlayableMatches([]);
      });
    return () => { active = false; };
  }, [user?._id]);

  useEffect(() => {
    if (!user?._id) return;
    let active = true;
    wrestlingRequest('/api/users/me/wrestling-history?limit=20', { auth: true })
      .then((payload) => { if (active) setWrestlingHistory(safeWrestlingArray(payload?.data)); })
      .catch((requestError) => console.info('Wrestling history unavailable:', requestError.message));
    return () => { active = false; };
  }, [user?._id]);

  useEffect(() => {
    if (!user?._id) return;
    const fetchRemovedMatches = async () => {
      try {
        const response = await fetch('https://fantasymmadness-game-server-three.vercel.app/users/removed-matches');
        const data = await response.json();
        const userMatches = Array.isArray(data) ? data.filter((item) => sameId(item.userId, user._id)) : [];
        setRemovedMatches(userMatches[0]?.removedMatchesIds || []);
      } catch (error) {
        console.error('Error fetching removed matches:', error);
      }
    };
    fetchRemovedMatches();
  }, [user?._id]);

  useEffect(() => {
    const sourceRows = playableMatches.length ? playableMatches : (Array.isArray(matches) ? matches : []);
    const filteredMatches = orderFightsForDisplay(sourceRows)
      .filter(Boolean)
      .map((match) => ({
        ...match,
        blurred: Boolean(match.blurred || match.entryLocked || match.isLocked || match.requiresMorePlayers),
      }));
    setUpcomingMatches(filteredMatches);
  }, [matches, playableMatches]);


  const allFightRows = useMemo(() => {
    const seen = new Set();
    return orderFightsForDisplay([...(Array.isArray(matches) ? matches : []), ...(Array.isArray(playableMatches) ? playableMatches : [])]).filter((match) => {
      const id = getFightId(match);
      if (!id || seen.has(id)) return false;
      seen.add(id);
      return true;
    });
  }, [matches, playableMatches]);

  const completedMatches = useMemo(() => allFightRows.filter((match) => (
    isSubmittedByUser(match, user?._id)
    && !removedMatches.includes(getFightId(match))
  )), [allFightRows, removedMatches, user?._id]);

  const pendingMatches = useMemo(() => upcomingMatches.filter((match) => (
    !isSubmittedByUser(match, user?._id)
    && !removedMatches.includes(getFightId(match))
  )), [upcomingMatches, removedMatches, user?._id]);

  const currentUserData = Array.isArray(leaderboard) ? leaderboard.find((player) => sameId(player._id, user?._id)) : null;
  const totalPoints = currentUserData?.totalPoints || 0;

  const getRemainingTime = (matchDate, matchTime) => {
    const matchDateTime = new Date(`${String(matchDate || '').split('T')[0]}T${matchTime || '00:00'}`);
    const diffMs = matchDateTime - new Date();
    const hasStarted = diffMs <= 0 || Number.isNaN(diffMs);
    return {
      diffHrs: hasStarted ? 0 : Math.floor(diffMs / (1000 * 60 * 60)),
      diffMins: hasStarted ? 0 : Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60)),
      hasStarted,
    };
  };

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

  if (!user?.firstName) {
    return <div className="player-dynamic-empty"><FaFistRaised /><h2>Loading your fights…</h2></div>;
  }

  if (selectedMatchId) {
    return (
      <section className="player-dynamic-route-view">
        <div className="theme-container player-dynamic-back-row"><button type="button" onClick={() => setSelectedMatchId(null)}><FaArrowLeft /> Back to My Fights</button></div>
        <FightCosting matchId={selectedMatchId} />
      </section>
    );
  }

  if (completedMatchId) {
    return (
      <section className="player-dynamic-route-view">
        <div className="theme-container player-dynamic-back-row"><button type="button" onClick={() => setCompletedMatchId(null)}><FaArrowLeft /> Back to My Fights</button></div>
        <FightLeaderboard matchId={completedMatchId} />
      </section>
    );
  }

  const renderFightCard = (match, type) => {
    const matchId = getFightId(match);
    const remaining = getRemainingTime(match.matchDate, match.matchTime);
    const isCompleted = type === 'completed';
    const metricCodes = String(match.matchCategory || '').toLowerCase() === 'boxing'
      ? ['HP', 'BP', 'TP', 'RW', 'KO']
      : ['ST', 'KI', 'KN', 'RW', 'KO'];

    const openFight = () => {
      if (!isCompleted && match.matchType === 'SHADOW' && match.blurred) {
        alert('Affiliate criteria has not been met for this SHADOW match.');
        return;
      }
      if (isCompleted) setCompletedMatchId(matchId);
      else setSelectedMatchId(matchId);
    };

    return (
      <article className={`player-fight-library-card ${match.blurred ? 'is-locked' : ''}`} key={`${type}-${matchId}`}>
        <button type="button" className="player-fight-library-remove" onClick={() => handleRemoveMatch(matchId)}><FaTrashAlt /> Remove</button>
        <div className="player-fight-library-art">
          <figure><img src={getFighterImage(match, 'A', 0)} alt={getFighterName(match, 'A')} /><figcaption>{getFighterName(match, 'A')}</figcaption></figure>
          <span>VS</span>
          <figure><img src={getFighterImage(match, 'B', 1)} alt={getFighterName(match, 'B')} /><figcaption>{getFighterName(match, 'B')}</figcaption></figure>
        </div>
        <div className="player-fight-library-copy">
          <div className="player-fight-library-kicker"><span>{getFightCategory(match)}</span><b>{match.matchType}</b></div>
          <h3>{getFighterName(match, 'A')} <em>vs</em> {getFighterName(match, 'B')}</h3>
          <div className="player-fight-library-meta">
            <span><FaCalendarAlt /> {match.matchDate?.split('T')[0] || 'Date TBA'}</span>
            <span><FaUsers /> {safePredictions(match).length} players</span>
            <span><FaCoins /> {match.matchTokens === null ? 'Free entry' : `${match.matchTokens || 0} tokens`}</span>
          </div>
          <div className="player-fight-library-metrics">{metricCodes.map((code) => <span key={code}>{code}</span>)}</div>
          <p>{isCompleted ? 'Your predictions are submitted. Open the live/result score center.' : remaining.hasStarted ? 'Fight has started' : `Predictions lock in ${remaining.diffHrs}h ${remaining.diffMins}m`}</p>
        </div>
        <button type="button" className="player-fight-library-open" onClick={openFight}>
          {isCompleted ? 'View result' : match.blurred ? 'Entry locked' : 'Make predictions'} <FaArrowRight />
        </button>
      </article>
    );
  };

  return (
    <div className="player-fights-page">
      <section className="player-fights-hero">
        <div className="theme-container player-fights-hero-layout">
          <div>
            <p><FaFistRaised /> Personal fight library</p>
            <h1>Every card. <span>Every prediction.</span></h1>
            <p>Review completed entries, reopen live results, and move directly into every pending scorecard without losing any existing fight controls.</p>
            <div className="player-fights-hero-actions">
              <Link href="/upcomingfights">Explore fight cards <FaArrowRight /></Link>
              <button type="button" onClick={() => router.back()}><FaArrowLeft /> Previous page</button>
            </div>
          </div>
          <aside>
            <img src={user.profileUrl || '/images/fmm-experience/avatar-placeholder.svg'} alt={user.firstName} />
            <span><small>Player</small><strong>{user.firstName} {user.lastName}</strong><em>{user.currentPlan || 'Member'} plan</em></span>
            <div><b>{totalPoints}</b><small>Total points</small></div>
          </aside>
        </div>
      </section>

      <UserWorkspaceNav />

      <main className="theme-container player-fights-main">
        <section className="player-fights-stat-grid">
          <article><FaHistory /><span><strong>{completedMatches.length}</strong><small>Completed entries</small></span></article>
          <article><FaFistRaised /><span><strong>{pendingMatches.length}</strong><small>Pending cards</small></span></article>
          <article onClick={() => router.push('/checkout')} role="button" tabIndex={0}><FaCoins /><span><strong>{user.tokens || 0}</strong><small>Wallet tokens</small></span></article>
          <article><FaTrophy /><span><strong>{totalPoints}</strong><small>Leaderboard points</small></span></article>
          <article onClick={() => router.push('/pro-wrestling/history')} role="button" tabIndex={0}><FaCrown /><span><strong>{wrestlingHistory.length}</strong><small>Wrestling cards</small></span></article>
        </section>

        <section className="player-fights-wrestling-section">
          <header><span>PW</span><div><p>Additional game mode</p><h2>My Pro Wrestling cards</h2><small>Full-match wrestling entries remain separate from round-based fight predictions while living in the same player workspace.</small></div><Link href="/pro-wrestling">Open wrestling lobby <FaArrowRight /></Link></header>
          {wrestlingHistory.length ? <div className="player-fights-wrestling-grid">{wrestlingHistory.slice(0, 4).map(({ entry, match, prediction }) => {
            const href = ['LIVE','SCORING'].includes(match?.status) ? `/pro-wrestling/live/${match._id}` : match?.status === 'FINALIZED' ? `/pro-wrestling/leaderboard/${match._id}` : `/pro-wrestling/play/${match._id}`;
            return <Link href={href} key={entry?._id}><div><figure><img src={getPWImage(match?.competitorA,'A')} alt="" /><figcaption>{match?.competitorA?.displayName}</figcaption></figure><b>VS</b><figure><img src={getPWImage(match?.competitorB,'B')} alt="" /><figcaption>{match?.competitorB?.displayName}</figcaption></figure></div><p>{match?.status} · {formatWrestlingDate(match?.matchDate)}</p><h3>{match?.matchTitle}</h3><span>{prediction?.predictionStatus || 'Entry confirmed'}{prediction?.rank ? ` · Rank #${prediction.rank}` : ''}</span><strong>Open wrestling card <FaArrowRight /></strong></Link>;
          })}</div> : <div className="player-dynamic-empty is-inline"><FaCrown /><h3>No Pro Wrestling entries yet</h3><p>Enter an open wrestling contest to add the new game mode to your fight library.</p><Link href="/pro-wrestling">Browse wrestling contests</Link></div>}
        </section>

        <section className="player-fights-section">
          <header><span>01</span><div><p>Submitted fight cards</p><h2>Completed fights</h2><small>Open a result card to review the live leaderboard and posted fight data.</small></div></header>
          <div className="player-fight-library-grid">
            {completedMatches.length ? completedMatches.map((match) => renderFightCard(match, 'completed')) : <div className="player-dynamic-empty is-inline"><FaTrophy /><h3>No completed fights</h3><p>Your submitted prediction cards will appear here.</p></div>}
          </div>
        </section>

        <section className="player-fights-section">
          <header><span>02</span><div><p>Cards requiring action</p><h2>Pending fights</h2><small>Open an available card to review entry cost and submit every prediction field.</small></div></header>
          <div className="player-fight-library-grid">
            {pendingMatches.length ? pendingMatches.map((match) => renderFightCard(match, 'pending')) : <div className="player-dynamic-empty is-inline"><FaShieldAlt /><h3>No prediction-ready fights yet</h3><p>Fresh playable fight cards will appear here as soon as admin opens predictions.</p></div>}
          </div>
        </section>
      </main>
    </div>
  );
};

export default YourFights;
