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
  FaCrown,
  FaFire,
  FaFistRaised,
  FaGlobe,
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
import { fetchPublicPredictionFights } from '@/Utils/publicApi';
import FightCosting from './FightCosting';
import FightLeaderboard from '../GlobalLeaderboard/FightLeaderboard';
import PurchaseTokensIntimation from './PurchaseTokensIntimation';
import FinishedFightUserBoard from '../FinishedFightUserBoard/FinishedFightUserBoard';
import UserWorkspaceNav from '../UserProfile/UserWorkspaceNav';
import { getFightCategory, getFightId, getFighterImage, getFighterName } from '@/Utils/fightExperience';
import { diversifyFightsBySport, getFightSportKey, orderFightsForDisplay } from '@/Utils/fightOrdering';
import { formatWrestlingDate, getWrestlerImage as getPWImage, safeWrestlingArray, wrestlingRequest } from '@/Utils/proWrestling';

const safePredictions = (match) => (Array.isArray(match?.userPredictions) ? match.userPredictions : []);

const MOBILE_DASHBOARD_SPORT_TABS = [
  {
    key: 'boxing',
    label: 'Boxing',
    image: '/images/mobile-home/categories/boxing.png',
  },
  {
    key: 'mma',
    label: 'MMA',
    image: '/images/mobile-home/categories/mma.png',
  },
  {
    key: 'bareknuckle',
    label: 'Bare-knuckle',
    image: '/images/mobile-home/categories/bare-knuckle.png',
  },
  {
    key: 'kickboxing',
    label: 'Kickboxing',
    image: '/images/mobile-home/categories/kickboxing.png',
  },
];

const MOBILE_DASHBOARD_FALLBACK_CARDS = [
  '/images/fmm-experience/fighter-chris-eubank-jr.webp',
  '/images/fmm-experience/fighter-conor-benn.webp',
  '/images/fmm-experience/fighter-anthony-yarde.webp',
  '/images/fmm-experience/fighter-david-benavidez.webp',
];

const padMobileTime = (value) => String(value).padStart(2, '0');

const parseDashboardMatchDate = (match = {}) => {
  const rawDate = String(match?.matchDate || match?.date || '').split('T')[0];
  if (!rawDate) return null;

  const rawTime = String(match?.matchTime || match?.time || '00:00').trim() || '00:00';
  const timeMatch = rawTime.match(/^(\d{1,2}):(\d{2})/);
  const hour = padMobileTime(timeMatch?.[1] || '00');
  const minute = timeMatch?.[2] || '00';
  const parsed = new Date(`${rawDate}T${hour}:${minute}:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const formatDashboardMobileDate = (match = {}) => {
  const date = parseDashboardMatchDate(match);
  if (!date) return 'SCHEDULE TBA';

  const datePart = date
    .toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    .replace(',', '');
  const timePart = date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
  return `${datePart} • ${timePart} EST`.toUpperCase();
};

const getDashboardMobileLock = (match = {}) => {
  const date = parseDashboardMatchDate(match);
  if (!date) return match?.matchStatus || 'Open';

  const diff = date.getTime() - Date.now();
  const status = String(match?.matchStatus || match?.status || '').toLowerCase();
  if (diff <= 0) {
    if (status.includes('finished') || status.includes('closed')) return 'Final';
    if (status.includes('live') || status.includes('ongoing')) return 'Live now';
    return 'Open';
  }

  const totalMinutes = Math.floor(diff / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours >= 24) return `${Math.floor(hours / 24)}d ${hours % 24}h`;
  return `${hours}h ${padMobileTime(minutes)}m`;
};

const getDashboardMobilePlayerCount = (match = {}) => {
  const explicit = Number(match?.playerCount || match?.players || match?.totalPlayers || 0);
  if (explicit > 0) return explicit;
  return safePredictions(match).length;
};

const getDashboardMobileEntry = (match = {}) => {
  if (match?.entryFee != null) {
    const entry = Number(match.entryFee);
    return entry > 0 ? `$${entry.toLocaleString()}` : 'Free';
  }

  if (match?.matchTokens == null) return 'Free';
  const tokens = Number(match.matchTokens || 0);
  return tokens > 0 ? `${tokens.toLocaleString()} tokens` : 'Free';
};

const getDashboardMobilePrize = (match = {}) => {
  const amount = Number(match?.pot ?? match?.currentPot ?? match?.prizePool ?? match?.prize ?? 0);
  return amount > 0 ? `$${amount.toLocaleString()}` : 'Prize TBA';
};

const getDashboardMobileFightTitle = (match = {}) =>
  match?.matchName || `${getFighterName(match, 'A')} vs ${getFighterName(match, 'B')}`;

const getDashboardMobileImage = (match = {}, side = 'A', index = 0) =>
  getFighterImage(match, side, index) || MOBILE_DASHBOARD_FALLBACK_CARDS[index % MOBILE_DASHBOARD_FALLBACK_CARDS.length];

const getWrestlingMobileTitle = (match = {}) =>
  match?.eventName || match?.matchName || match?.name || 'Pro Wrestling Card';

const getWrestlingMobileName = (match = {}, side = 'A') => {
  const isA = String(side).toUpperCase() === 'A';
  const competitor = isA ? match?.competitorA || match?.wrestlerA : match?.competitorB || match?.wrestlerB;
  return competitor?.displayName || competitor?.name || (isA ? match?.wrestlerAName : match?.wrestlerBName) || (isA ? 'Wrestler A' : 'Wrestler B');
};

const MobileDashboardFightCard = ({ match, variant = 'pending', onOpen }) => {
  const isCompleted = variant === 'completed';
  return (
    <article className={`player-mobile-fight-card ${isCompleted ? 'is-completed' : ''}`}>
      <button type="button" onClick={() => onOpen(match)}>
        <div className="player-mobile-fight-topline">
          <span>{getFightCategory(match)}</span>
          <small>{formatDashboardMobileDate(match)}</small>
        </div>
        <div className="player-mobile-fighter-row">
          <figure className="player-mobile-fighter-avatar">
            <img src={getDashboardMobileImage(match, 'A', 0)} alt={getFighterName(match, 'A')} />
          </figure>
          <b>VS</b>
          <figure className="player-mobile-fighter-avatar">
            <img src={getDashboardMobileImage(match, 'B', 1)} alt={getFighterName(match, 'B')} />
          </figure>
        </div>
        <div className="player-mobile-fight-names">
          <strong>{getFighterName(match, 'A')}</strong>
          <strong>{getFighterName(match, 'B')}</strong>
        </div>
        <div className="player-mobile-fight-meta">
          <span><small>{isCompleted ? 'Result' : 'Locks in'}</small><strong>{isCompleted ? 'Review' : getDashboardMobileLock(match)}</strong></span>
          <span><small>Players</small><strong>{getDashboardMobilePlayerCount(match).toLocaleString()}</strong></span>
          <span><small>Entry</small><strong>{getDashboardMobileEntry(match)}</strong></span>
        </div>
        <div className="player-mobile-card-action">
          {isCompleted ? 'View Result' : 'Make Picks'} <FaArrowRight aria-hidden="true" />
        </div>
      </button>
    </article>
  );
};

const MobileDashboardContestRow = ({ match, index = 0, onOpen }) => (
  <article className="player-mobile-contest-row">
    <button type="button" onClick={() => onOpen(match)}>
      <div className="player-mobile-contest-visual">
        <span>{index === 0 ? 'Live' : index === 1 ? 'Featured' : 'Top Prize'}</span>
        <div>
          <figure className="player-mobile-fighter-avatar">
            <img src={getDashboardMobileImage(match, 'A', index)} alt={getFighterName(match, 'A')} />
          </figure>
          <figure className="player-mobile-fighter-avatar">
            <img src={getDashboardMobileImage(match, 'B', index + 1)} alt={getFighterName(match, 'B')} />
          </figure>
        </div>
      </div>
      <div className="player-mobile-contest-copy">
        <h3>{getDashboardMobileFightTitle(match)}</h3>
        <div>
          <span><small>Prize Pool</small><strong>{getDashboardMobilePrize(match)}</strong></span>
          <span><small>Players</small><strong>{getDashboardMobilePlayerCount(match).toLocaleString()}</strong></span>
        </div>
      </div>
      <strong className="player-mobile-contest-cta">Join</strong>
    </button>
  </article>
);

const MobileWrestlingContestRow = ({ match, index = 0 }) => {
  const href = match?._id ? `/pro-wrestling/matches/${match._id}` : '/pro-wrestling';
  return (
    <article className="player-mobile-contest-row is-wrestling">
      <Link href={href}>
        <div className="player-mobile-contest-visual">
          <span>{index === 0 ? 'Live' : index === 1 ? 'Featured' : 'Top Prize'}</span>
          <div>
            <figure className="player-mobile-fighter-avatar">
              <img src={getPWImage(match?.competitorA || match?.wrestlerA, 'A')} alt={getWrestlingMobileName(match, 'A')} />
            </figure>
            <figure className="player-mobile-fighter-avatar">
              <img src={getPWImage(match?.competitorB || match?.wrestlerB, 'B')} alt={getWrestlingMobileName(match, 'B')} />
            </figure>
          </div>
        </div>
        <div className="player-mobile-contest-copy">
          <h3>{getWrestlingMobileTitle(match)}</h3>
          <div>
            <span><small>Entry</small><strong>{match?.entryFeeTokens || 0} tokens</strong></span>
            <span><small>Status</small><strong>{match?.status || 'Open'}</strong></span>
          </div>
        </div>
        <strong className="player-mobile-contest-cta">Open</strong>
      </Link>
    </article>
  );
};

const MobilePlayerDashboard = ({
  activeSport,
  categorySections,
  completedMatches,
  currentRankEstimate,
  dashboardOpportunities,
  nextMission,
  onCompletedOpen,
  onPendingOpen,
  onSportChange,
  onTestimonialOpen,
  pendingMatches,
  quickActions,
  user,
  wrestlingHistory,
  wrestlingMatches,
}) => {
  const activeSection = categorySections.find((section) => section.key === activeSport) || categorySections[0];
  const selectedFights = activeSection?.fights?.length ? activeSection.fights.slice(0, 5) : dashboardOpportunities.slice(0, 5);
  const primaryMission = nextMission || selectedFights[0] || null;
  const contestRows = pendingMatches.length ? pendingMatches.slice(0, 3) : dashboardOpportunities.slice(0, 3);
  const visibleWrestlingRows = Array.isArray(wrestlingMatches) ? wrestlingMatches.slice(0, 3) : [];
  const visibleCompleted = completedMatches.slice(0, 3);

  return (
    <div className="player-command-mobile-app" aria-label="Fantasy MMAdness mobile user dashboard">
      <section className="player-mobile-hero-card">
        <div className="player-mobile-hero-bg" aria-hidden="true" />
        <div className="player-mobile-profile-row">
          <img src={user.profileUrl || '/images/fmm-experience/avatar-placeholder.svg'} alt={user.firstName} />
          <span>
            <small>Good evening, {user.firstName}</small>
            <strong>{user.currentPlan || 'Member'} Plan</strong>
          </span>
          <i><FaCrown aria-hidden="true" /></i>
        </div>
        <h1>Player Command Center</h1>
        <p>Track pending picks, open fight cards, wallet tokens, and completed results from one phone-first fight-night view.</p>

        {primaryMission ? (
          <div className="player-mobile-featured-mission">
            <span className="player-mobile-featured-label">Next Prediction</span>
            <div className="player-mobile-featured-fighters">
              <figure className="player-mobile-fighter-avatar is-large">
                <img src={getDashboardMobileImage(primaryMission, 'A', 0)} alt={getFighterName(primaryMission, 'A')} />
              </figure>
              <b>VS</b>
              <figure className="player-mobile-fighter-avatar is-large">
                <img src={getDashboardMobileImage(primaryMission, 'B', 1)} alt={getFighterName(primaryMission, 'B')} />
              </figure>
            </div>
            <h2>{getFighterName(primaryMission, 'A')} <em>vs</em> {getFighterName(primaryMission, 'B')}</h2>
            <div className="player-mobile-countdown-row">
              <span><small>Date</small><strong>{formatDashboardMobileDate(primaryMission)}</strong></span>
              <span><small>Locks</small><strong>{getDashboardMobileLock(primaryMission)}</strong></span>
              <span><small>Entry</small><strong>{getDashboardMobileEntry(primaryMission)}</strong></span>
            </div>
            <button type="button" className="player-mobile-primary-btn" onClick={() => onPendingOpen(primaryMission)}>
              Make Next Prediction <FaArrowRight aria-hidden="true" />
            </button>
          </div>
        ) : (
          <div className="player-mobile-empty-panel">
            <FaTrophy aria-hidden="true" />
            <strong>You are caught up.</strong>
            <span>New prediction cards will appear here as soon as they are opened.</span>
            <Link href="/upcomingfights">Browse Events <FaArrowRight aria-hidden="true" /></Link>
          </div>
        )}
      </section>

      <section className="player-mobile-stat-grid" aria-label="Dashboard summary">
        <article><FaHistory aria-hidden="true" /><strong>{pendingMatches.length}</strong><span>Pending Picks</span></article>
        <article><FaTrophy aria-hidden="true" /><strong>{completedMatches.length}</strong><span>Submitted Cards</span></article>
        <article><FaCoins aria-hidden="true" /><strong>{user.tokens || 0}</strong><span>Wallet Tokens</span></article>
        <article><FaMedal aria-hidden="true" /><strong>{currentRankEstimate}</strong><span>Momentum Rank</span></article>
      </section>

      <section className="player-mobile-category-row" aria-label="Fight categories">
        {categorySections.map((section) => (
          <button
            type="button"
            key={section.key}
            className={activeSection?.key === section.key ? 'is-active' : ''}
            onClick={() => onSportChange(section.key)}
          >
            <img src={section.image} alt="" loading="lazy" />
            <strong>{section.label}</strong>
            <span>{section.count.toLocaleString()} fights</span>
          </button>
        ))}
      </section>

      <section className="player-mobile-section">
        <div className="player-mobile-section-heading">
          <h2>{activeSection?.label || 'Fight'} Cards</h2>
          <Link href={`/upcomingfights?status=all&category=${encodeURIComponent(activeSection?.key || 'all')}`}>
            View All <FaArrowRight aria-hidden="true" />
          </Link>
        </div>
        <div className="player-mobile-fight-rail">
          {selectedFights.length ? selectedFights.map((match, index) => (
            <MobileDashboardFightCard key={getFightId(match) || `${activeSection?.key}-${index}`} match={match} onOpen={onPendingOpen} />
          )) : (
            <div className="player-mobile-inline-empty">No {activeSection?.label || 'fight'} cards are open right now.</div>
          )}
        </div>
      </section>

      <section className="player-mobile-section">
        <div className="player-mobile-section-heading">
          <h2>Open Contests</h2>
          <Link href="/YourFights">View All <FaArrowRight aria-hidden="true" /></Link>
        </div>
        <div className="player-mobile-contest-list">
          {contestRows.length ? contestRows.map((match, index) => (
            <MobileDashboardContestRow key={getFightId(match) || `contest-${index}`} match={match} index={index} onOpen={onPendingOpen} />
          )) : (
            <div className="player-mobile-inline-empty">No open contest rows yet.</div>
          )}
        </div>
      </section>

      <section className="player-mobile-section">
        <div className="player-mobile-section-heading">
          <h2>Fight-Night Tools</h2>
          <Link href="/YourFights">Library <FaArrowRight aria-hidden="true" /></Link>
        </div>
        <div className="player-mobile-tools-grid">
          {quickActions.slice(0, 4).map(({ href, label, icon: Icon }) => (
            <Link href={href} key={href}>
              <Icon aria-hidden="true" />
              <span>{label}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="player-mobile-wrestling-banner">
        <div>
          <h2>Pro Wrestling Is Now Part Of Your Dashboard.</h2>
          <p>{wrestlingHistory.length} wrestling entries saved. Predict power moves, finishers, and winners from the dedicated lobby.</p>
          <Link href="/pro-wrestling">Explore Wrestling <FaArrowRight aria-hidden="true" /></Link>
        </div>
      </section>

      {visibleWrestlingRows.length > 0 && (
        <section className="player-mobile-section">
          <div className="player-mobile-section-heading">
            <h2>Wrestling Cards</h2>
            <Link href="/pro-wrestling">View All <FaArrowRight aria-hidden="true" /></Link>
          </div>
          <div className="player-mobile-contest-list">
            {visibleWrestlingRows.map((match, index) => (
              <MobileWrestlingContestRow key={match?._id || `wrestling-${index}`} match={match} index={index} />
            ))}
          </div>
        </section>
      )}

      <section className="player-mobile-section">
        <div className="player-mobile-section-heading">
          <h2>Completed Cards</h2>
          <Link href="/YourFights">View Full <FaArrowRight aria-hidden="true" /></Link>
        </div>
        <div className="player-mobile-completed-list">
          {visibleCompleted.length ? visibleCompleted.map((match, index) => (
            <MobileDashboardFightCard key={getFightId(match) || `completed-${index}`} match={match} variant="completed" onOpen={onCompletedOpen} />
          )) : (
            <div className="player-mobile-inline-empty">Submitted prediction cards will appear here.</div>
          )}
        </div>
      </section>

      {!user.hasSubmittedTestimonial && (
        <button className="player-mobile-testimonial" type="button" onClick={onTestimonialOpen}>
          <FaStar aria-hidden="true" />
          <span><strong>Share your experience</strong><small>Your story may be featured publicly.</small></span>
          <FaArrowRight aria-hidden="true" />
        </button>
      )}
    </div>
  );
};

const isSameId = (left, right) => String(left || '') === String(right || '');
const isSubmittedByUser = (match, userId) => {
  const status = String(match?.userPredictionStatus || match?.predictionStatus || '').toLowerCase();
  const bucket = String(match?.userFightBucket || '').toLowerCase();
  return Boolean(
    match?.predictionSubmitted === true ||
    match?.userPredictionSubmitted === true ||
    bucket === 'completed' ||
    ['submitted', 'complete', 'completed'].includes(status) ||
    safePredictions(match).some((prediction) => isSameId(prediction.userId, userId) && prediction.predictionStatus === 'submitted')
  );
};

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
  const [playableMatches, setPlayableMatches] = useState([]);
  const [removedMatches, setRemovedMatches] = useState([]);
  const [wrestlingHistory, setWrestlingHistory] = useState([]);
  const [wrestlingMatches, setWrestlingMatches] = useState([]);
  const [activeMobileSport, setActiveMobileSport] = useState('boxing');

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
        console.warn('Prediction-ready fight feed unavailable:', error.message);
        if (active) setPlayableMatches([]);
      });
    return () => { active = false; };
  }, [user?._id]);

  useEffect(() => {
    if (!user?._id) return;
    let active = true;
    Promise.all([
      wrestlingRequest('/api/users/me/wrestling-history?limit=6', { auth: true }),
      wrestlingRequest('/api/wrestling/matches?limit=4&status=OPEN,LIVE,SCORING'),
    ]).then(([historyPayload, matchPayload]) => {
      if (!active) return;
      setWrestlingHistory(safeWrestlingArray(historyPayload?.data));
      setWrestlingMatches(safeWrestlingArray(matchPayload?.data));
    }).catch((requestError) => {
      console.info('Pro Wrestling dashboard module is not available yet:', requestError.message);
    });
    return () => { active = false; };
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

  const allFightRows = useMemo(() => {
    const seen = new Set();
    return orderFightsForDisplay([...(Array.isArray(matches) ? matches : []), ...(Array.isArray(playableMatches) ? playableMatches : [])]).filter((match) => {
      const id = getFightId(match);
      if (!id || seen.has(id)) return false;
      seen.add(id);
      return true;
    });
  }, [matches, playableMatches]);

  const completedMatches = useMemo(() => orderFightsForDisplay(allFightRows.filter((match) => isSubmittedByUser(match, user?._id))), [allFightRows, user?._id]);
  const pendingMatches = useMemo(() => orderFightsForDisplay(upcomingMatches.filter((match) => !isSubmittedByUser(match, user?._id) && !removedMatches.includes(getFightId(match)))), [removedMatches, upcomingMatches, user?._id]);
  const visibleCompleted = useMemo(() => orderFightsForDisplay(completedMatches.filter((match) => !removedMatches.includes(getFightId(match)))), [completedMatches, removedMatches]);
  const dashboardOpportunities = useMemo(() => {
    const seen = new Set();
    const merged = orderFightsForDisplay([...pendingMatches, ...upcomingMatches]).filter((match) => {
      const id = getFightId(match);
      if (!id || seen.has(id) || removedMatches.includes(id)) return false;
      seen.add(id);
      return true;
    });
    return diversifyFightsBySport(merged, 4);
  }, [pendingMatches, removedMatches, upcomingMatches]);

  const mobileDashboardSections = useMemo(() => {
    const uniqueRows = [];
    const seen = new Set();
    orderFightsForDisplay([...pendingMatches, ...dashboardOpportunities, ...upcomingMatches]).forEach((match) => {
      const id = getFightId(match);
      if (!id || seen.has(id) || removedMatches.includes(id)) return;
      seen.add(id);
      uniqueRows.push(match);
    });

    return MOBILE_DASHBOARD_SPORT_TABS.map((tab) => {
      const fights = uniqueRows.filter((match) => getFightSportKey(match) === tab.key);
      return {
        ...tab,
        count: fights.length,
        fights,
      };
    });
  }, [dashboardOpportunities, pendingMatches, removedMatches, upcomingMatches]);

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
    const selectedMatch = allFightRows.find((match) => getFightId(match) === selectedMatchId);
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
    const completedMatch = allFightRows.find((match) => getFightId(match) === completedMatchId);
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
            <figure><img src={getFighterImage(match, 'A', 0)} alt={getFighterName(match, 'A')} /><figcaption>{getFighterName(match, 'A')}</figcaption></figure>
            <span>VS</span>
            <figure><img src={getFighterImage(match, 'B', 1)} alt={getFighterName(match, 'B')} /><figcaption>{getFighterName(match, 'B')}</figcaption></figure>
          </div>
          <div className="player-command-fight-copy">
            <p><span>{getFightCategory(match)}</span><b>{match.matchType}</b></p>
            <h3>{getFighterName(match, 'A')} <em>vs</em> {getFighterName(match, 'B')}</h3>
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

  const handleOpenPendingMatch = (match) => {
    const id = getFightId(match);
    if (!id) return;
    if (match.matchType === 'SHADOW' && match.blurred) {
      toast.error('Affiliate criteria has not been met for this SHADOW match.');
      return;
    }
    setSelectedMatchId(id);
  };

  const handleOpenCompletedMatch = (match) => {
    const id = getFightId(match);
    if (id) setCompletedMatchId(id);
  };

  const nextMission = pendingMatches[0];
  const currentRankEstimate = visibleCompleted.length ? Math.max(1, 100 - visibleCompleted.length * 3) : '—';
  const quickActions = [
    { href: '/YourFights', label: 'My fight library', copy: 'All completed and pending cards', icon: FaFistRaised },
    { href: '/pro-wrestling', label: 'Pro Wrestling', copy: 'Full-match action prediction mode', icon: FaCrown },
    { href: '/myLeagueRecords', label: 'My leagues', copy: 'Creator communities and records', icon: FaUsers },
    { href: '/fighter-performance-tracker', label: 'Fighter tracker', copy: 'Research form and performance', icon: FaChartLine },
    { href: '/account-settings', label: 'Account settings', copy: 'Preferences and payment details', icon: FaUserCog },
  ];

  return (
    <div className="player-command-page">
      <MobilePlayerDashboard
        activeSport={activeMobileSport}
        categorySections={mobileDashboardSections}
        completedMatches={visibleCompleted}
        currentRankEstimate={currentRankEstimate}
        dashboardOpportunities={dashboardOpportunities}
        nextMission={nextMission}
        onCompletedOpen={handleOpenCompletedMatch}
        onPendingOpen={handleOpenPendingMatch}
        onSportChange={setActiveMobileSport}
        onTestimonialOpen={() => setIsOpen(true)}
        pendingMatches={pendingMatches}
        quickActions={quickActions}
        user={user}
        wrestlingHistory={wrestlingHistory}
        wrestlingMatches={wrestlingMatches}
      />

      <div className="player-command-desktop-shell">
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
        <section className="player-command-fight-night-strip" aria-label="Fresh fight opportunities">
          <div>
            <p><FaBolt /> Fresh fight opportunities</p>
            <h2>Tonight, live, featured, and newly updated fights stay in front.</h2>
            <span>Your dashboard keeps changing with new MMA, Boxing, and Pro Wrestling opportunities so there is always something fresh to play.</span>
          </div>
          <div className="player-command-fight-night-actions">
            <Link href="/upcomingfights" className="player-command-play-tonight"><FaFistRaised /> Play tonight</Link>
            <Link href="/calendar-of-fights"><FaCalendarAlt /> Fight calendar</Link>
            <Link href="/pro-wrestling"><FaCrown /> Pro wrestling</Link>
            <Link href="/fights-news"><FaGlobe /> Fight news</Link>
          </div>
        </section>
        <section className="player-command-stat-grid">
          <article><FaHistory /><span><strong>{pendingMatches.length}</strong><small>Pending picks</small></span></article>
          <article><FaTrophy /><span><strong>{visibleCompleted.length}</strong><small>Submitted cards</small></span></article>
          <article onClick={() => router.push('/checkout')} role="button" tabIndex={0}><FaCoins /><span><strong>{user.tokens || 0}</strong><small>Wallet tokens</small></span></article>
          <article><FaMedal /><span><strong>{currentRankEstimate}</strong><small>Momentum rank</small></span></article>
          <article onClick={() => router.push('/pro-wrestling/history')} role="button" tabIndex={0}><FaCrown /><span><strong>{wrestlingHistory.length}</strong><small>Wrestling entries</small></span></article>
        </section>

        <section className="player-command-quick-section">
          <header><div><p>Fight-night tools</p><h2>Move faster from one corner.</h2></div><Link href="/YourFights">Open full fight library <FaArrowRight /></Link></header>
          <div className="player-command-quick-grid">
            {quickActions.map(({ href, label, copy, icon: Icon }) => (
              <Link href={href} key={href}><i><Icon /></i><span><strong>{label}</strong><small>{copy}</small></span><FaArrowRight /></Link>
            ))}
          </div>
        </section>

        <section className="player-command-section player-command-opportunity-section">
          <header><span>01</span><div><p>New fight opportunities</p><h2>Fresh cards to play now</h2><small>Featured, live, tonight, newly added, and recently updated fights rotate to the top of your dashboard.</small></div><Link href="/upcomingfights">View all <FaArrowRight /></Link></header>
          <div className="player-command-fight-grid">{dashboardOpportunities.length ? dashboardOpportunities.map((match) => renderFightCard(match, 'pending')) : <div className="player-dynamic-empty is-inline"><FaShieldAlt /><h3>No fresh fights yet</h3><p>New fight opportunities will appear here as soon as they are published.</p></div>}</div>
        </section>

        <section className="player-command-wrestling-feature">
          <div className="player-command-wrestling-copy">
            <p><FaCrown /> Additional game mode</p>
            <h2>Pro Wrestling is now inside your command center.</h2>
            <span>Predict head punches, body punches, kicks, power moves, finishers, and the official winner across the full match.</span>
            <div><Link href="/pro-wrestling" className="pw-btn pw-btn-primary">Open wrestling lobby <FaArrowRight /></Link><Link href="/pro-wrestling/history" className="pw-btn pw-btn-secondary">My wrestling record</Link></div>
          </div>
          <div className="player-command-wrestling-card">
            {wrestlingMatches[0] ? <>
              <header><small>{wrestlingMatches[0].status}</small><strong>{wrestlingMatches[0].eventName}</strong></header>
              <div><figure><img src={getPWImage(wrestlingMatches[0].competitorA, 'A')} alt={wrestlingMatches[0].competitorA?.displayName} /><figcaption>{wrestlingMatches[0].competitorA?.displayName}</figcaption></figure><b>VS</b><figure><img src={getPWImage(wrestlingMatches[0].competitorB, 'B')} alt={wrestlingMatches[0].competitorB?.displayName} /><figcaption>{wrestlingMatches[0].competitorB?.displayName}</figcaption></figure></div>
              <p>{formatWrestlingDate(wrestlingMatches[0].matchDate)} · {wrestlingMatches[0].entryFeeTokens || 0} token entry</p>
              <Link href={`/pro-wrestling/matches/${wrestlingMatches[0]._id}`}>Open featured card <FaArrowRight /></Link>
            </> : <div className="player-command-wrestling-empty"><FaCrown /><strong>Wrestling cards will appear here.</strong><span>The public game-mode guide and roster are already available.</span></div>}
          </div>
        </section>

        <section className="player-command-section">
          <header><span>02</span><div><p>Submitted fight cards</p><h2>Your completed fights</h2><small>Open a card to review live standings or the completed round-by-round report.</small></div></header>
          <div className="player-command-fight-grid">{visibleCompleted.length ? visibleCompleted.map((match) => renderFightCard(match, 'completed')) : <div className="player-dynamic-empty is-inline"><FaTrophy /><h3>No completed matches</h3><p>Your submitted prediction cards will appear here.</p></div>}</div>
        </section>

        <section className="player-command-section">
          <header><span>03</span><div><p>Cards requiring action</p><h2>Your pending fights</h2><small>Open a card to review entry details and submit your predictions.</small></div></header>
          <div className="player-command-fight-grid">{pendingMatches.length ? pendingMatches.map((match) => renderFightCard(match, 'pending')) : <div className="player-dynamic-empty is-inline"><FaShieldAlt /><h3>No prediction-ready fights yet</h3><p>Fresh playable fight cards will appear here as soon as admin opens predictions.</p></div>}</div>
        </section>

        {!user.hasSubmittedTestimonial && (
          <button className="player-command-testimonial" type="button" onClick={() => setIsOpen(true)}>
            <FaStar /><span><strong>Share your Fantasy MMAdness experience</strong><small>Your approved story may be featured on the public testimonials page.</small></span><FaArrowRight />
          </button>
        )}
      </main>
      </div>

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
