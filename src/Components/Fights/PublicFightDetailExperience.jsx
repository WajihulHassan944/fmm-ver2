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
import { fetchPublicPredictionFights, normalizePublicFightRow } from '@/Utils/publicApi';
import { SITE_URL } from '@/Utils/seoConfig';
import { FMCoin, FMCoinAmount } from '@/Components/Common/FMCoin';
import { REVENUE_EVENTS, trackRevenueEvent } from '@/Utils/revenueAnalytics';

const sameId = (left, right) => String(left || '') === String(right || '');

const entryOpen = (fight) => {
  const status = `${fight?.matchStatus || ''} ${fight?.matchShadowOpenStatus || ''}`.toLowerCase();
  const rawDate = fight?.matchDate || fight?.date || '';
  const rawTime = String(fight?.matchTime || fight?.time || '').trim();
  const isTimeTba = fight?.timeTba === true || fight?.matchTimeTba === true || !rawTime || rawTime === '00:00' || rawTime.toUpperCase() === '12:00 AM';
  const explicitLock = fight?.lockAt ? new Date(fight.lockAt).getTime() : NaN;
  let scheduledLock = NaN;
  if (rawDate) {
    const parsedDate = new Date(rawDate);
    if (!Number.isNaN(parsedDate.getTime())) {
      if (isTimeTba) {
        parsedDate.setHours(23, 59, 59, 999);
      } else {
        const twelveHour = rawTime.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
        const twentyFour = rawTime.match(/^(\d{1,2}):(\d{2})/);
        if (twelveHour) {
          let hours = Number(twelveHour[1]) % 12;
          if (twelveHour[3].toUpperCase() === 'PM') hours += 12;
          parsedDate.setHours(hours, Number(twelveHour[2]), 0, 0);
        } else if (twentyFour) {
          parsedDate.setHours(Number(twentyFour[1]), Number(twentyFour[2]), 0, 0);
        } else {
          parsedDate.setHours(23, 59, 59, 999);
        }
      }
      scheduledLock = parsedDate.getTime();
    }
  }
  const lock = Number.isFinite(explicitLock) ? explicitLock : scheduledLock;

  // The actual schedule is authoritative. A future published fight must stay
  // playable even if an older registry/shadow status still says "closed".
  if (Number.isFinite(lock)) return lock > Date.now();
  if (/finished|completed|cancelled/.test(status)) return false;
  if (typeof fight?.entryOpen === 'boolean') return fight.entryOpen;
  return !/closed|draft/.test(status);
};

const hasUsableDetailImage = (value) => {
  const text = typeof value === 'string' ? value.trim() : '';
  return Boolean(text && !['null', 'undefined', 'none', 'n/a'].includes(text.toLowerCase()));
};

const getNestedDetailImage = (value) => {
  if (!value || typeof value === 'string') return '';
  return [
    value.primaryImage,
    value.resolvedImage,
    value.imageUrl,
    value.profileImage,
    value.fighterImage,
    value.avatar,
    value.image,
    value.imageHealth?.url,
    value.imageHealth?.secure_url,
  ].find(hasUsableDetailImage) || '';
};

const pickDetailImage = (...values) => values.find(hasUsableDetailImage) || '';

const mergeFightForDetail = (base = {}, candidate = {}) => {
  if (!candidate || typeof candidate !== 'object') return normalizePublicFightRow(base || {});

  const positiveNumber = (...values) => {
    for (const value of values) {
      if (value === undefined || value === null || value === '') continue;
      const parsed = Number(String(value).replace(/[^0-9.-]/g, ''));
      if (Number.isFinite(parsed) && parsed > 0) return parsed;
    }
    return 0;
  };

  const merged = {
    ...base,
    ...candidate,
    // Never let a sparse list/feed row erase economics already loaded for
    // this exact fight.
    pot: positiveNumber(candidate.pot, candidate.currentPot, candidate.prizePool, base.pot, base.currentPot, base.prizePool, base.potTarget),
    prizePool: positiveNumber(candidate.prizePool, candidate.pot, candidate.currentPot, base.prizePool, base.pot, base.currentPot, base.potTarget),
    matchTokens: positiveNumber(candidate.matchTokens, candidate.entryTokens, candidate.entryFee, base.matchTokens, base.entryTokens, base.entryFee),
    matchDescription: candidate.matchDescription || base.matchDescription,
    matchVideoUrl: candidate.matchVideoUrl || base.matchVideoUrl,
    fightPosterImage: candidate.fightPosterImage || base.fightPosterImage,
    promotionBackground: candidate.promotionBackground || base.promotionBackground,
    BoxingMatch: candidate.BoxingMatch || base.BoxingMatch,
    MMAMatch: candidate.MMAMatch || base.MMAMatch,
    AffiliateIds: candidate.AffiliateIds || base.AffiliateIds,
    userPredictions: candidate.userPredictions || base.userPredictions,
  };

  const fighterAImage = pickDetailImage(
    candidate.fighterAPrimaryImage,
    candidate.resolvedFighterAImage,
    candidate.fighterAResolvedImage,
    getNestedDetailImage(candidate.fighterA),
    getNestedDetailImage(candidate.fighterAId),
    candidate.fighterAImage,
    base.fighterAPrimaryImage,
    base.resolvedFighterAImage,
    base.fighterAResolvedImage,
    getNestedDetailImage(base.fighterA),
    getNestedDetailImage(base.fighterAId),
    base.fighterAImage,
  );

  const fighterBImage = pickDetailImage(
    candidate.fighterBPrimaryImage,
    candidate.resolvedFighterBImage,
    candidate.fighterBResolvedImage,
    getNestedDetailImage(candidate.fighterB),
    getNestedDetailImage(candidate.fighterBId),
    candidate.fighterBImage,
    base.fighterBPrimaryImage,
    base.resolvedFighterBImage,
    base.fighterBResolvedImage,
    getNestedDetailImage(base.fighterB),
    getNestedDetailImage(base.fighterBId),
    base.fighterBImage,
  );

  return normalizePublicFightRow({
    ...merged,
    fighterAPrimaryImage: fighterAImage || merged.fighterAPrimaryImage || '',
    fighterBPrimaryImage: fighterBImage || merged.fighterBPrimaryImage || '',
    resolvedFighterAImage: fighterAImage || merged.resolvedFighterAImage || '',
    resolvedFighterBImage: fighterBImage || merged.resolvedFighterBImage || '',
    fighterAImage: fighterAImage || merged.fighterAImage,
    fighterBImage: fighterBImage || merged.fighterBImage,
  });
};

const hasUserSubmittedFight = (fight, userId) => {
  if (!fight || !userId) return false;
  const directStatus = String(fight?.userPredictionStatus || fight?.predictionStatus || '').toLowerCase();
  if (fight?.userPredictionSubmitted || directStatus === 'submitted') return true;
  return safeArray(fight?.userPredictions).some((prediction) => (
    sameId(prediction?.userId, userId) && String(prediction?.predictionStatus || '').toLowerCase() === 'submitted'
  ));
};

const getFightHeroImage = (fight) => (
  fight?.fightPosterImage || fight?.promotionBackground || getFighterImage(fight, 'A', 0) || '/images/hero-fight-original.webp'
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
  const fight = useMemo(() => mergeFightForDetail(initialFight || {}, liveMatch || null), [initialFight, liveMatch]);
  const userId = user?._id || user?.id;
  const [showEntryRoom, setShowEntryRoom] = useState(false);
  const [submittedOverride, setSubmittedOverride] = useState(false);
  const [userScopedFight, setUserScopedFight] = useState(null);

  useEffect(() => {
    if (matchStatus === 'idle') dispatch(fetchMatches({ limit: 200 }));
  }, [dispatch, matchStatus]);

  useEffect(() => {
    if (!matchId) return;
    trackRevenueEvent(REVENUE_EVENTS.FIGHT_VIEW, { fightId: String(matchId), affiliateRef: String(router.query.ref || '') });
  }, [matchId, router.query.ref]);


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

  const resolvedFight = useMemo(() => mergeFightForDetail(fight || {}, userScopedFight || null), [fight, userScopedFight]);
  const hasSubmitted = submittedOverride || hasUserSubmittedFight(resolvedFight, userId);
  const status = getFightStatus(resolvedFight);
  const playable = entryOpen(resolvedFight) && !hasSubmitted;
  const title = getFightName(resolvedFight);
  const category = getFightCategory(resolvedFight);
  const heroImage = getFightHeroImage(resolvedFight);
  const affiliateShareImage = /^[a-f\d]{24}$/i.test(String(router.query.ref || '')) && /^[a-f\d]{24}$/i.test(String(matchId || ''))
    ? `${SITE_URL}/api/fight-share-image?fightId=${encodeURIComponent(matchId)}&affiliateId=${encodeURIComponent(router.query.ref)}&v=3`
    : '';
  const socialImage = affiliateShareImage || (heroImage?.startsWith?.('http') ? heroImage : `${SITE_URL}${heroImage}`);
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
    if (!playable) return;
    trackRevenueEvent(REVENUE_EVENTS.PLAY_CLICK, { fightId: String(matchId), affiliateRef: String(router.query.ref || ''), signedIn: Boolean(userId) });
    // Let visitors enter the prediction experience before asking for an account.
    // Submission/payment remains protected inside the prediction flow.
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
        <meta key="description" name="description" content={`${title} fight details, category, schedule, leaderboard, and prediction entry on Fantasy MMAdness.`} />
        <meta key="og:title" property="og:title" content={`${title} | Fantasy MMAdness`} />
        <meta key="og:description" property="og:description" content={`Open ${title}, view the leaderboard, and enter the prediction flow.`} />
        {router.query.ref && <meta key="og:url" property="og:url" content={`${SITE_URL}${router.asPath.split('#')[0]}`} />}
        <meta key="og:image" property="og:image" content={socialImage} />
        <meta key="og:image:alt" property="og:image:alt" content={affiliateShareImage ? 'Personal fight poster with affiliate QR and league invitation' : `${title} fight poster`} />
        <meta key="twitter:image" name="twitter:image" content={socialImage} />
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
              <span><FaMapMarkerAlt /> {resolvedFight?.location || resolvedFight?.venue || 'Online fight card'}</span>
              <span><FaTrophy /> {getFightStatusLabel(resolvedFight)}</span>
            </div>
            {playable && <div style={{display:'inline-flex',alignItems:'center',gap:8,margin:'0 0 12px',padding:'8px 12px',borderRadius:999,background:'rgba(225,29,46,.14)',border:'1px solid rgba(225,29,46,.45)',fontWeight:900,fontSize:12,letterSpacing:'.06em'}}>● FIGHT NIGHT MODE · PICKS OPEN</div>}
            <div style={{display:'flex',flexWrap:'wrap',gap:10,margin:'0 0 14px'}}>
              <div style={{minWidth:150,padding:'12px 14px',borderRadius:12,background:'rgba(242,181,68,.10)',border:'1px solid rgba(242,181,68,.45)'}}>
                <small style={{display:'block',opacity:.72,fontWeight:800,letterSpacing:'.06em'}}>PRIZE POOL</small>
                <strong style={{display:'block',marginTop:3,fontSize:20,color:'#f2b544'}}><FMCoinAmount amount={Number(resolvedFight?.pot || resolvedFight?.currentPot || resolvedFight?.prizePool || resolvedFight?.potTarget || 0)} size="sm" motion="shine" /></strong>
              </div>
              <div style={{minWidth:135,padding:'12px 14px',borderRadius:12,background:'rgba(242,181,68,.10)',border:'1px solid rgba(242,181,68,.30)'}}>
                <small style={{display:'block',opacity:.72,fontWeight:800,letterSpacing:'.06em'}}>BUY-IN</small>
                <strong style={{display:'block',marginTop:3,fontSize:20,color:'#f2b544'}}>{Number(resolvedFight?.matchTokens || 0) > 0 ? <FMCoinAmount amount={Number(resolvedFight.matchTokens)} size="sm" motion="shine" /> : 'FREE'}</strong>
              </div>
            </div>
            <div className="public-fight-detail-actions">
              <button type="button" className="theme-btn theme-btn-primary public-fight-predict-cta" onClick={handleEnterFight} disabled={!playable}>
                {hasSubmitted ? 'Predictions submitted' : !playable ? 'Entry closed' : 'START YOUR PREDICTIONS'} <FaArrowRight />
              </button>
              <a href="#fight-leaderboard" className="theme-btn theme-btn-secondary">View leaderboard <FaTrophy /></a>
            </div>
            {playable && <p style={{margin:'10px 0 0',fontSize:13,fontWeight:700,opacity:.82}}>Make your picks first. Create or sign in to your account only when you are ready to lock in your official entry.</p>}
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
        <article><FaUsers /><span><strong>{playerCount > 0 ? playerCount : 'Open'}</strong><small>{playerCount > 0 ? 'Players' : 'Entries'}</small></span></article>
        <article className="public-fight-fm-coins"><span><strong><FMCoinAmount amount={Number(resolvedFight?.pot || resolvedFight?.currentPot || resolvedFight?.prizePool || resolvedFight?.potTarget || 0)} size="lg" motion="shine" /></strong><small>FM COINS PRIZE POOL</small></span></article>
        <article className="public-fight-fm-coins"><span><strong>{Number(resolvedFight?.matchTokens || 0) > 0 ? <FMCoinAmount amount={Number(resolvedFight.matchTokens)} size="lg" motion="shine" /> : 'FREE'}</strong><small>BUY-IN</small></span></article>
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
            <li><strong>Venue</strong><span>{resolvedFight?.location || resolvedFight?.venue || 'Online fight card'}</span></li>
          </ul>
        </article>

        <article className="public-fight-info-card public-fight-entry-card-mini">
          <p className="public-fight-eyebrow"><FaShieldAlt /> Prediction access</p>
          <h2>{hasSubmitted ? 'Entry already confirmed' : playable ? 'Start your picks now' : 'Entry not available'}</h2>
          <p>{hasSubmitted ? 'Your prediction card is already submitted for this fight.' : playable ? 'Make your picks first. You will create or sign in to your player account before locking an official entry.' : 'This card is no longer open for new predictions.'}</p>
          <button type="button" onClick={handleEnterFight} disabled={!playable}>
            {hasSubmitted ? 'Already played' : !playable ? 'Entry closed' : 'START PREDICTING'} <FaArrowRight />
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
