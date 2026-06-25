import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { FaArrowLeft, FaArrowRight, FaBolt, FaCrown, FaFistRaised, FaGlobe, FaMedal, FaTrophy } from 'react-icons/fa';
import { WrestlingEmptyState, WrestlingMatchCard, WrestlingModeNav } from './WrestlingPrimitives';
import { WRESTLING_STATS, safeWrestlingArray, wrestlingRequest } from '@/Utils/proWrestling';

const WrestlingWrestlerDetailPage = () => {
  const router = useRouter();
  const { idOrSlug } = router.query;
  const [wrestler, setWrestler] = useState(null);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useEffect(() => {
    if (!router.isReady || !idOrSlug) return;
    let active = true;
    wrestlingRequest(`/api/wrestling/wrestlers/${idOrSlug}`)
      .then((payload) => { if (active) { setWrestler(payload?.wrestler || null); setMatches(safeWrestlingArray(payload?.recentMatches)); } })
      .catch((requestError) => { if (active) setError(requestError.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [idOrSlug, router.isReady]);
  if (loading) return <div className="pw-page pw-state-page"><div className="pw-state-card"><FaBolt /><h1>Loading wrestler intelligence…</h1></div></div>;
  if (error || !wrestler) return <div className="pw-page pw-state-page"><WrestlingEmptyState title="Wrestler profile unavailable" description={error} action={{ href: '/pro-wrestling/wrestlers', label: 'Return to roster' }} /></div>;
  const totalActions = WRESTLING_STATS.reduce((sum, stat) => sum + Number(wrestler.historicalStatistics?.[stat.key] || 0), 0);
  return <><Head><title>{wrestler.displayName} | Pro Wrestling | Fantasy MMADNESS</title></Head><div className="pw-page pw-wrestler-detail-page">
    <section className="pw-wrestler-profile-hero" style={{ '--pw-wrestler-banner': `url(${wrestler.bannerImage || '/images/pro-wrestling/pro-wrestling-hero.jpg'})` }}><div className="theme-container"><Link href="/pro-wrestling/wrestlers" className="pw-inline-back"><FaArrowLeft /> Wrestling roster</Link><div className="pw-wrestler-profile-layout"><div className="pw-wrestler-profile-image"><img src={wrestler.profileImage || '/images/pro-wrestling/wrestler-placeholder-a.jpg'} alt={wrestler.displayName} />{wrestler.featured && <span><FaCrown /> Featured wrestler</span>}</div><div><p>{wrestler.promotion || 'Pro Wrestling'} · {wrestler.country || 'Global roster'}</p><h1>{wrestler.displayName}</h1><strong>{wrestler.wrestlingStyle || 'All-around competitor'}</strong><span>{wrestler.biography || 'Profile intelligence and action history for Fantasy MMADNESS Pro Wrestling predictions.'}</span><div><Link href="/pro-wrestling" className="pw-btn pw-btn-primary">View open contests <FaArrowRight /></Link></div></div></div></div></section>
    <WrestlingModeNav active="wrestlers" />
    <main className="theme-container pw-main pw-wrestler-profile-main">
      <section className="pw-wrestler-metric-grid"><article><FaTrophy /><span><small>Career record</small><strong>{wrestler.careerRecord?.wins || 0}-{wrestler.careerRecord?.losses || 0}-{wrestler.careerRecord?.draws || 0}</strong></span></article><article><FaFistRaised /><span><small>Tracked matches</small><strong>{wrestler.historicalStatistics?.matches || 0}</strong></span></article><article><FaBolt /><span><small>Total tracked actions</small><strong>{totalActions}</strong></span></article><article><FaGlobe /><span><small>Promotion</small><strong>{wrestler.promotion || 'Independent'}</strong></span></article></section>
      <section className="pw-wrestler-intel-grid"><article><p>Historical action profile</p><h2>Prediction intelligence</h2><div>{WRESTLING_STATS.map((stat) => <span key={stat.key}><b>{stat.short}</b><strong>{wrestler.historicalStatistics?.[stat.key] || 0}</strong><small>{stat.label}</small></span>)}</div></article><article><p>Move library</p><h2>Signature offense</h2><div className="pw-move-lists"><section><strong>Signature moves</strong>{safeWrestlingArray(wrestler.signatureMoves).length ? wrestler.signatureMoves.map((move) => <span key={move}><FaMedal /> {move}</span>) : <span>No signature moves listed.</span>}</section><section><strong>Finishing moves</strong>{safeWrestlingArray(wrestler.finishingMoves).length ? wrestler.finishingMoves.map((move) => <span key={move}><FaCrown /> {move}</span>) : <span>No finishers listed.</span>}</section></div></article></section>
      <section className="pw-section"><header className="pw-section-heading"><div><p>Contest history</p><h2>Recent wrestling cards</h2><span>Open a contest to review the match, predictions, live scoring, or final leaderboard.</span></div></header>{matches.length ? <div className="pw-match-grid">{matches.map((match) => <WrestlingMatchCard key={match._id} match={match} compact />)}</div> : <WrestlingEmptyState title="No published matches for this wrestler yet" />}</section>
    </main>
  </div></>;
};
export default WrestlingWrestlerDetailPage;
