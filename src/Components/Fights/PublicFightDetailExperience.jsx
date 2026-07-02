import React, { useEffect, useMemo, useState } from 'react';
import Head from 'next/head';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter } from 'next/router';
import Link from 'next/link';
import {
  FaArrowLeft,
  FaArrowRight,
  FaCalendarAlt,
  FaCheckCircle,
  FaClock,
  FaCoins,
  FaFistRaised,
  FaMapMarkerAlt,
  FaPlay,
  FaShieldAlt,
  FaTrophy,
  FaUsers,
} from 'react-icons/fa';
import FightCosting from '@/Components/Dashboard/FightCosting';
import FightLeaderboard from '@/Components/GlobalLeaderboard/FightLeaderboard';
import { fetchMatches } from '@/Redux/matchSlice';
import {
  formatFightDate,
  getFightCategory,
  getFightId,
  getFightName,
  getFightPlayerCount,
  getFightPrize,
  getFightRounds,
  getFightStatus,
  getFightStatusLabel,
  getFighterImage,
  getFighterName,
  safeArray,
} from '@/Utils/fightExperience';
import { fetchPublicPredictionFights } from '@/Utils/publicApi';
import { SITE_URL } from '@/Utils/seoConfig';

const sameId = (left, right) => String(left || '') === String(right || '');

const hasUserSubmittedFight = (fight, userId) => {
  if (!fight || !userId) return false;
  const directStatus = String(fight?.userPredictionStatus || fight?.predictionStatus || '').toLowerCase();
  if (fight?.userPredictionSubmitted || directStatus === 'submitted') return true;
  return safeArray(fight?.userPredictions).some((prediction) => (
    sameId(prediction?.userId, userId) && String(prediction?.predictionStatus || '').toLowerCase() === 'submitted'
  ));
};

const getFightHeroImage = (fight) => (
  fight?.promotionBackground || getFighterImage(fight, 'A', 0) || '/images/hero-fight-original.webp'
);

const PublicFightDetailExperience = ({ fight: initialFight = {}, relatedBlogs = [] }) => {
  const router = useRouter();
  const dispatch = useDispatch();
  const user = useSelector((state) => state.user || {});
  const matches = useSelector((state) => state.matches.data);
  const matchStatus = useSelector((state) => state.matches.status);
  const matchId = getFightId(initialFight) || router.query?.matchId;
  const liveMatch = useMemo(() => (
    safeArray(matches).find((item) => sameId(getFightId(item), matchId)) || null
  ), [matches, matchId]);
  const fight = liveMatch || initialFight || {};
  const userId = user?._id || user?.id;
  const [showEntryRoom, setShowEntryRoom] = useState(false);
  const [submittedOverride, setSubmittedOverride] = useState(false);
  const [userScopedFight, setUserScopedFight] = useState(null);

  useEffect(() => {
    if (matchStatus === 'idle') dispatch(fetchMatches({ limit: 200 }));
  }, [dispatch, matchStatus]);


  useEffect(() => {
    if (!userId || !matchId) return undefined;
    let active = true;
    fetchPublicPredictionFights({ limit: 200, playerId: userId, userId })
      .then((rows) => {
        if (!active) return;
        const scoped = safeArray(rows).find((item) => sameId(getFightId(item), matchId));
        if (scoped) setUserScopedFight(scoped);
      })
      .catch((error) => console.info('User-scoped fight state unavailable:', error.message));
    return () => { active = false; };
  }, [matchId, userId]);

  const resolvedFight = userScopedFight || fight;
  const hasSubmitted = submittedOverride || hasUserSubmittedFight(resolvedFight, userId);
  const status = getFightStatus(resolvedFight);
  const playable = status !== 'past' && !hasSubmitted;
  const title = getFightName(resolvedFight);
  const category = getFightCategory(resolvedFight);
  const heroImage = getFightHeroImage(resolvedFight);
  const playerCount = getFightPlayerCount(resolvedFight);

  useEffect(() => {
    if (!router.isReady || !userId || hasSubmitted) return;
    const requestedFight = router.query?.fight;
    const requestedPlay = router.query?.play;
    if (String(requestedFight || '') === String(matchId || '') || String(requestedPlay || '') === '1') {
      setShowEntryRoom(true);
    }
  }, [hasSubmitted, matchId, router.isReady, router.query?.fight, router.query?.play, userId]);

  const handleEnterFight = () => {
    if (hasSubmitted) return;
    if (!userId) {
      router.push({
        pathname: '/auth',
        query: {
          mode: 'login',
          role: 'player',
          next: `/fight/${matchId}`,
          fight: matchId,
        },
      });
      return;
    }
    setShowEntryRoom(true);
    setTimeout(() => {
      document.getElementById('fight-entry-room')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 40);
  };

  if (showEntryRoom && playable) {
    return (
      <main className="public-fight-detail-page public-fight-entry-mode">
        <div className="theme-container public-fight-entry-topbar">
          <button type="button" onClick={() => setShowEntryRoom(false)}>
            <FaArrowLeft /> Back to fight details
          </button>
          <span>{title}</span>
        </div>
        <div id="fight-entry-room">
          <FightCosting matchId={matchId} matchOverride={resolvedFight} onSubmitted={() => setSubmittedOverride(true)} />
        </div>
      </main>
    );
  }

  return (
    <main className="public-fight-detail-page">
      <Head>
        <title>{title} | Fantasy MMAdness Fight Details</title>
        <meta name="description" content={`${title} fight details, category, schedule, leaderboard, and prediction entry on Fantasy MMAdness.`} />
        <meta property="og:title" content={`${title} | Fantasy MMAdness`} />
        <meta property="og:description" content={`Open ${title}, view the leaderboard, and enter the prediction flow.`} />
        <meta property="og:image" content={heroImage?.startsWith?.('http') ? heroImage : `${SITE_URL}${heroImage}`} />
      </Head>

      <section className="public-fight-detail-hero">
        <div className="public-fight-detail-bg" style={{ backgroundImage: `url(${heroImage})` }} aria-hidden="true" />
        <div className="theme-container public-fight-detail-hero-grid">
          <div className="public-fight-detail-copy">
            <Link href="/upcomingfights" className="public-fight-back-link"><FaArrowLeft /> Fight cards</Link>
            <p className="public-fight-eyebrow"><FaFistRaised /> {category} fight card</p>
            <h1>{getFighterName(resolvedFight, 'A')} <span>vs</span> {getFighterName(resolvedFight, 'B')}</h1>
            <p>{resolvedFight?.matchDescription || `${title} is available on Fantasy MMAdness with fight details, player activity, and the prediction entry flow.`}</p>
            <div className="public-fight-detail-pills">
              <span><FaCalendarAlt /> {formatFightDate(resolvedFight)}</span>
              <span><FaClock /> {getFightRounds(resolvedFight)}</span>
              <span><FaMapMarkerAlt /> {resolvedFight?.location || resolvedFight?.venue || 'Venue TBA'}</span>
              <span><FaTrophy /> {getFightStatusLabel(resolvedFight)}</span>
            </div>
            <div className="public-fight-detail-actions">
              <button type="button" className="theme-btn theme-btn-primary" onClick={handleEnterFight} disabled={hasSubmitted || status === 'past'}>
                {hasSubmitted ? 'Predictions submitted' : status === 'past' ? 'Entry closed' : userId ? 'Enter fight' : 'Login to enter'} <FaArrowRight />
              </button>
              <a href="#fight-leaderboard" className="theme-btn theme-btn-secondary">View leaderboard <FaTrophy /></a>
            </div>
            {hasSubmitted && (
              <div className="public-fight-submitted-note"><FaCheckCircle /> You have already submitted predictions for this fight.</div>
            )}
          </div>

          <div className="public-fight-detail-card">
            <div className="public-fight-corner is-blue">
              <img src={getFighterImage(resolvedFight, 'A', 0)} alt={getFighterName(resolvedFight, 'A')} />
              <span><small>Blue corner</small><strong>{getFighterName(resolvedFight, 'A')}</strong></span>
            </div>
            <div className="public-fight-vs-badge">VS</div>
            <div className="public-fight-corner is-red">
              <img src={getFighterImage(resolvedFight, 'B', 1)} alt={getFighterName(resolvedFight, 'B')} />
              <span><small>Red corner</small><strong>{getFighterName(resolvedFight, 'B')}</strong></span>
            </div>
          </div>
        </div>
      </section>

      <section className="theme-container public-fight-data-strip" aria-label="Fight data">
        <article><FaUsers /><span><strong>{playerCount}</strong><small>Players</small></span></article>
        <article><FaCoins /><span><strong>{getFightPrize(resolvedFight)}</strong><small>Prize pool</small></span></article>
        <article><FaShieldAlt /><span><strong>{resolvedFight?.matchType || 'Public'}</strong><small>Fight type</small></span></article>
        <article><FaClock /><span><strong>{resolvedFight?.matchStatus || 'Open'}</strong><small>Status</small></span></article>
      </section>

      <section className="theme-container public-fight-detail-content-grid">
        <article className="public-fight-info-card">
          <p className="public-fight-eyebrow"><FaPlay /> Fight overview</p>
          <h2>{resolvedFight?.matchName || 'Fantasy MMAdness Fight Night'}</h2>
          <ul>
            <li><strong>Category</strong><span>{category}</span></li>
            <li><strong>Schedule</strong><span>{formatFightDate(resolvedFight)}</span></li>
            <li><strong>Rounds</strong><span>{getFightRounds(resolvedFight)}</span></li>
            <li><strong>Venue</strong><span>{resolvedFight?.location || resolvedFight?.venue || 'Venue TBA'}</span></li>
          </ul>
        </article>

        <article className="public-fight-info-card public-fight-entry-card-mini">
          <p className="public-fight-eyebrow"><FaShieldAlt /> Prediction access</p>
          <h2>{hasSubmitted ? 'Entry already confirmed' : playable ? 'Ready to participate' : 'Entry not available'}</h2>
          <p>{hasSubmitted ? 'Your prediction card is already submitted for this fight.' : playable ? 'Log in or continue as a player to open the fight entry room and make predictions.' : 'This card is no longer open for new predictions.'}</p>
          <button type="button" onClick={handleEnterFight} disabled={hasSubmitted || !playable}>
            {hasSubmitted ? 'Already played' : userId ? 'Start predictions' : 'Login and play'} <FaArrowRight />
          </button>
        </article>
      </section>

      <section className="public-fight-leaderboard-shell" id="fight-leaderboard">
        <FightLeaderboard matchId={matchId} matchOverride={resolvedFight} />
      </section>

      {safeArray(relatedBlogs).length > 0 && (
        <section className="theme-container public-fight-related-stories">
          <p className="public-fight-eyebrow"><FaTrophy /> Related stories</p>
          <h2>Build context before making picks</h2>
          <div>
            {safeArray(relatedBlogs).slice(0, 3).map((blog) => (
              <article key={blog?._id || blog?.id || blog?.title}>
                <h3>{blog?.title || blog?.blogTitle || 'Fight story'}</h3>
                <p>{blog?.description || blog?.excerpt || blog?.content?.slice?.(0, 120) || 'Read more fight context from Fantasy MMAdness.'}</p>
                <Link href={`/blog-details/${blog?._id || blog?.id}`}>Read story <FaArrowRight /></Link>
              </article>
            ))}
          </div>
        </section>
      )}
    </main>
  );
};

export default PublicFightDetailExperience;
