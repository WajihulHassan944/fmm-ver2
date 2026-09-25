import React, { useEffect, useMemo, useState } from 'react';
import Head from 'next/head'; import Link from 'next/link'; import { useRouter } from 'next/router';
import { FaCheckCircle, FaShareAlt, FaTrophy } from 'react-icons/fa';
import { fullCardRequest, getStoredToken } from '@/Utils/fullCardApi';
import { PUBLIC_API_BASE_URL } from '@/Utils/publicApi';

export async function getServerSideProps({ params, res }) {
  const slug = String(params?.slug || '');
  const promoterCode = String(params?.promoterCode || '');
  if (!/^[a-z0-9-]{1,140}$/i.test(slug) || !/^[a-f0-9]{10}$/i.test(promoterCode)) return { notFound: true };
  res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
  try {
    const response = await fetch(`${PUBLIC_API_BASE_URL}/api/full-cards/${encodeURIComponent(slug)}/${encodeURIComponent(promoterCode)}`, { signal: AbortSignal.timeout(8000) });
    if (response.ok) {
      const { card } = await response.json();
      if (card) return { props: { initialCard: card } };
    }
  } catch (error) {
    console.error('Could not pre-render full card preview:', error);
  }
  // Keep the page available for a client retry if the API is briefly unavailable.
  return { props: { initialCard: null } };
}

export default function PublicFullCard({ initialCard = null }) {
  const router = useRouter(); const { slug, promoterCode } = router.query;
  const [card, setCard] = useState(initialCard); const [leaderboard, setLeaderboard] = useState([]); const [progress, setProgress] = useState(null); const [error, setError] = useState('');
  useEffect(() => { if (!slug || !promoterCode) return; const visitor = localStorage.getItem('fmmVisitorId') || `${Date.now()}-${Math.random()}`; localStorage.setItem('fmmVisitorId', visitor); fullCardRequest(`/api/full-cards/${slug}/${promoterCode}`, { headers: { 'x-fmm-visitor': visitor } }).then(({ card: value }) => {
    setCard(value);
    // The event is still shareable if leaderboard or account progress is unavailable.
    fullCardRequest(`/api/full-cards/${value.id}/leaderboard`).then((x) => setLeaderboard(x.leaderboard || [])).catch(() => {});
    if (getStoredToken('player')) fullCardRequest(`/api/full-cards/${value.id}/progress`, { kind: 'player' }).then(setProgress).catch(() => {});
  }).catch((e) => { if (!initialCard) setError(e.message); }); }, [slug, promoterCode]);
  const active = useMemo(() => (card?.bouts || []).filter((b) => !['CANCELLED', 'REMOVED'].includes(b.status)), [card]);
  // League enrollment records the promoter relationship for both new and existing players.
  // A direct fight link only carries a referral during signup and can skip enrollment.
  const fightEntryUrl = (fightId) => card?.promoter?.id
    ? `/league/${encodeURIComponent(String(card.promoter.id))}?fightId=${encodeURIComponent(String(fightId))}`
    : `/fight/${encodeURIComponent(String(fightId))}`;
  const share = async () => { const url = location.href; await fullCardRequest(`/api/full-cards/${card.id}/track`, { method: 'POST', body: { type: 'share' } }).catch(() => {}); if (navigator.share) navigator.share({ title: card.eventName, url }); else navigator.clipboard.writeText(url); };
  if (error) return <main className="public-card-state"><h1>Full Card unavailable</h1><p>{error}</p></main>;
  if (!card) return <main className="public-card-state"><h1>Loading fight card…</h1></main>;
  const previewTitle = `${card.eventName} Full Fight Card | FANTASY MMADNESS`;
  const previewDescription = `Explore ${active.length} fights on the ${card.eventName} card, promoted by ${card.promoter?.name || 'a FANTASY MMADNESS promoter'}. Predict the action and follow the full-card leaderboard.`;
  const previewImage = card.eventPoster || 'https://www.fantasymmadness.com/images/social/fantasy-mmadness-og-2026.jpg';
  const previewUrl = `https://www.fantasymmadness.com/card/${encodeURIComponent(card.slug)}/${encodeURIComponent(card.promoterCode)}`;
  return <div className="public-full-card"><Head>
    <title key="title">{previewTitle}</title>
    <meta key="description" name="description" content={previewDescription} />
    <meta key="og:title" property="og:title" content={previewTitle} />
    <meta key="og:description" property="og:description" content={previewDescription} />
    <meta key="og:url" property="og:url" content={previewUrl} />
    <meta key="og:image" property="og:image" content={previewImage} />
    <meta key="og:image:alt" property="og:image:alt" content={`${card.eventName} full fight card poster`} />
    <meta key="twitter:title" name="twitter:title" content={previewTitle} />
    <meta key="twitter:description" name="twitter:description" content={previewDescription} />
    <meta key="twitter:image" name="twitter:image" content={previewImage} />
  </Head>
    <header className="public-card-hero" style={{ backgroundImage: `linear-gradient(90deg,rgba(2,5,10,.98),rgba(2,5,10,.5)),url(${card.eventPoster || '/images/fmm-pages/premium-duel-banner.webp'})` }}><div><p>FANTASY MMADNESS · FULL CARD</p><h1>{card.eventName}</h1><h2>{active.length} FIGHTS · {active.length * 2} FIGHTERS · ONE NIGHT</h2><span>Promoted by {card.promoter?.name} · Verified FANTASY MMADNESS Promoter</span><button onClick={share}><FaShareAlt /> Share this card</button></div></header>
    <main className="public-card-main">
      <section className="public-card-progress"><div><p>CARD PROGRESS</p><h2>{progress ? `${progress.predicted} OF ${progress.total} FIGHTS PREDICTED` : 'PREDICT THE FULL CARD'}</h2></div><strong>{progress?.percent || 0}%</strong><i><span style={{ width: `${progress?.percent || 0}%` }} /></i>{progress?.lockedIn ? <b><FaCheckCircle /> FULL CARD LOCKED IN</b> : progress?.nextFightId ? <Link href={fightEntryUrl(progress.nextFightId)}>Predict next fight</Link> : !getStoredToken('player') ? <Link href="/auth">Sign in to track progress</Link> : null}</section>
      <div className="public-card-layout"><section className="public-card-bouts">{active.map((bout) => <article key={bout._id || bout.order}><div className="public-card-label"><span>{bout.cardSection.replace('_', ' ')}</span><strong>{bout.boutLabel}</strong></div><div className="public-card-faceoff"><figure>{bout.fighterAImage && <img src={bout.fighterAImage} alt={bout.fighterAName} />}<figcaption>{bout.fighterAName}</figcaption></figure><b>VS</b><figure>{bout.fighterBImage && <img src={bout.fighterBImage} alt={bout.fighterBName} />}<figcaption>{bout.fighterBName}</figcaption></figure></div><div className="public-card-bout-footer"><span>{bout.category} · POT {Number(bout.pot || 0).toLocaleString()} FM</span>{bout.fightId && <Link href={fightEntryUrl(bout.fightId)}>Make predictions</Link>}</div></article>)}</section>
      <aside className="public-card-leaderboard"><header><FaTrophy /><div><p>FULL CARD LEADERBOARD</p><h2>Across the entire event</h2></div></header>{leaderboard.length ? leaderboard.slice(0, 10).map((row) => <div key={row.userId}><b>#{row.rank}</b>{row.profileUrl && <img src={row.profileUrl} alt="" />}<span><strong>{row.name}</strong><small>{row.fightsScored} fights scored</small></span><em>{row.totalPoints.toLocaleString()}</em></div>) : <p>No scored predictions yet.</p>}</aside></div>
    </main></div>;
}
