import Head from 'next/head';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { FaTrophy, FaArrowRight } from 'react-icons/fa';
import { formatFMCoinUsd } from '@/Components/Common/FMCoin';
import { fetchPublicPredictionFights, fetchPublicFights, fetchPublicFighters, resolvePublicMediaUrl } from '@/Utils/publicApi';
import { formatFightDate, getFightCategory, getFightId, getFightName } from '@/Utils/fightExperience';

const entryIsOpen = (fight) => {
  if (typeof fight.entryOpen === 'boolean') return fight.entryOpen;
  const status = `${fight.matchStatus || ''} ${fight.matchShadowOpenStatus || ''}`.toLowerCase();
  if (/finished|closed|draft|completed|cancelled/.test(status)) return false;
  const date = String(fight.matchDate || '').slice(0, 10);
  const time = /^\d{1,2}:\d{2}/.test(String(fight.matchTime || '')) ? String(fight.matchTime).slice(0, 5) : '23:59';
  const lock = fight.lockAt ? new Date(fight.lockAt).getTime() : date ? new Date(`${date}T${time}:00`).getTime() : NaN;
  return Number.isFinite(lock) && lock > Date.now();
};

const contestAmount = (...values) => { for (const value of values) { if (value === null || value === undefined || value === '') continue; const number = Number(String(value).replace(/[^0-9.-]/g, '')); if (Number.isFinite(number) && number >= 0) return number; } return null; };
const entryUsd = (fight) => { const dollars = contestAmount(fight.entryFeeUsd, fight.entryFeeDollars, fight.buyInUsd); if (dollars !== null) return `${dollars.toLocaleString('en-US', { maximumFractionDigits: 2 })}`; const coins = contestAmount(fight.matchTokens, fight.entryFeeTokens, fight.entryFee); return coins === null ? 'TBA' : formatFMCoinUsd(coins); };
const prizeUsd = (fight) => { const dollars = contestAmount(fight.prizePoolUsd, fight.prizePoolDollars, fight.potUsd); if (dollars !== null) return `${dollars.toLocaleString('en-US', { maximumFractionDigits: 2 })}`; const coins = contestAmount(fight.pot, fight.currentPot, fight.prizePool, fight.prize, fight.rewardAmount, fight.entryPrize); return coins === null ? 'TBA' : formatFMCoinUsd(coins); };

function FightFighterPhoto({ fight, side }) {
  const isA = side === 'A';
  const record = isA ? fight.fighterA : fight.fighterB;
  const ref = isA ? fight.fighterAId : fight.fighterBId;
  // Try the actual stored fighter photographs before ever using a generic placeholder.
  const verifiedLibraryImage = record?.imageHealth?.status === 'valid' && record?.primaryImage
    ? record.primaryImage
    : null;
  const navarreteLibraryImage = isA && String(fight.matchFighterA || '').trim().toUpperCase() === 'EMANUEL NAVARRETE'
    && String(fight.matchFighterB || '').trim().toUpperCase() === "O'SHAQUIE FOSTER"
    ? 'https://res.cloudinary.com/dq2fwh1ui/image/upload/v1792512163/fighterAImages/dmpnih4rcp3vb8lk3uxt.png'
    : null;
  const raw = [
    navarreteLibraryImage,
    verifiedLibraryImage,
    isA ? fight.fighterAPrimaryImage : fight.fighterBPrimaryImage,
    isA ? fight.fighterAResolvedImage : fight.fighterBResolvedImage,
    isA ? fight.resolvedFighterAImage : fight.resolvedFighterBImage,
    isA ? fight.featuredFightFighterAImage : fight.featuredFightFighterBImage,
    record?.primaryImage, record?.resolvedImage, record?.imageUrl, record?.profileImage, record?.image, record?.imageHealth?.url, record?.imageHealth?.secure_url,
    ref?.primaryImage, ref?.resolvedImage, ref?.imageUrl, ref?.profileImage, ref?.image, ref?.imageHealth?.url, ref?.imageHealth?.secure_url,
    isA ? fight.fighterAImage : fight.fighterBImage,
    isA ? fight.fighterAImageUrl : fight.fighterBImageUrl,
    isA ? fight.matchFighterAImage : fight.matchFighterBImage,
    isA ? fight.fighterOneImage : fight.fighterTwoImage,
    isA ? fight.imageA : fight.imageB,
  ];
  const candidates = [...new Set(raw.filter((value) => typeof value === 'string' && value.trim() && !['null', 'undefined', 'none', 'n/a'].includes(value.trim().toLowerCase())).map((value) => resolvePublicMediaUrl(value)))];
  const [position, setPosition] = useState(0);
  useEffect(() => setPosition(0), [side, candidates.join('|')]);
  const source = candidates[position];
  return source
    ? <img src={source} alt="" onError={() => setPosition(current => current + 1)} />
    : <div role="img" aria-label="Fighter photograph unavailable" style={{width:'100%',height:'100%',background:'linear-gradient(140deg,#171e2b,#2c1721)'}} />;
}

function PlayerNav() {
  return <nav aria-label="Player navigation" style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:16,flexWrap:'wrap',padding:'18px clamp(16px,4vw,48px)',background:'#090b11',borderBottom:'1px solid rgba(239,38,56,.35)',color:'#fff'}}>
    <Link href="/" style={{fontWeight:900,color:'#fff',textDecoration:'none',letterSpacing:'.06em',fontSize:20}}>FANTASY <span style={{color:'#ed1b2f'}}>MMADNESS</span></Link>
    <div style={{display:'flex',gap:18,alignItems:'center',flexWrap:'wrap',fontWeight:800,fontSize:13}}>
      <Link href="/" style={{color:'#fff'}}>HOME</Link>
      <Link href="/how-to-play" style={{color:'#fff'}}>HOW TO PLAY</Link>
      <Link href="/play" style={{color:'#fff'}}>OPEN FIGHTS</Link>
      <Link href="/founder" style={{color:'#fff'}}>OUR STORY</Link>
    </div>
  </nav>;
}

export default function PlayPage({ fights = [] }) {
  return <main className="fmm-play-page"><PlayerNav />
    <Head><title>Play Now | FANTASY MMADNESS</title><meta name="description" content="Choose an open combat sports fight, make predictions, and join the leaderboard." /></Head>
    <section className="fmm-play-shell fmm-play-open" style={{ paddingTop: 24 }}>
      <header><div><span>OPEN CONTESTS</span><h1 style={{ fontSize: 28, lineHeight: 1.2, margin: 0 }}>PICK A FIGHT</h1></div><p>Select a fight to enter the prediction room.</p></header>
      {fights.length ? <div className="fmm-play-grid">
        {fights.map((fight) => <article className="fmm-play-card" key={getFightId(fight)}>
          <div className="fmm-play-card-visual">
            <FightFighterPhoto fight={fight} side="A" index={0} />
            <b>VS</b>
            <FightFighterPhoto fight={fight} side="B" index={1} />
            <span>{getFightCategory(fight)}</span>
          </div>
          <div className="fmm-play-card-copy">
            <small>{formatFightDate(fight)}{fight.entryOpen === false ? ' · ENTRY CLOSED' : ''}</small>
            <h2>{getFightName(fight)}</h2>
            <div className="fmm-play-money">
              <span><small>ENTRY FEE</small><strong>{entryUsd(fight)}</strong></span>
              <span><FaTrophy/><small>PRIZE POOL</small><strong>{prizeUsd(fight)}</strong></span>
            </div>
            <Link href={`/fight/${encodeURIComponent(getFightId(fight))}?play=1`} className="fmm-play-button" onClick={() => { if (typeof window !== "undefined" && typeof window.gtag === "function") window.gtag("event", "select_fight", { fight_id: String(getFightId(fight)).slice(0, 100), fight_category: String(getFightCategory(fight)).slice(0, 40), send_to: "G-TP1C9005WD" }); }}>{fight.entryOpen === false ? 'VIEW FIGHT' : 'PLAY THIS FIGHT'} <FaArrowRight /></Link>
            <p>Next: verify eligibility, make your predictions, then submit your card.</p>
          </div>
        </article>)}
      </div> : <div className="fmm-play-empty">No fights are open for new predictions right now. <Link href="/">VIEW UPCOMING FIGHTS →</Link></div>}
    </section>
  </main>;
}

export async function getServerSideProps({ res }) {
  res.setHeader('Cache-Control', 'no-store');
  try {
    // The prediction feed can omit a newly registered fight even when the public
    // fight registry already contains it. Reconcile both feeds by immutable ID.
    const [predictionRows, registryRows, fighterLibrary] = await Promise.all([
      fetchPublicPredictionFights({ limit: 100, hydrateImages: true }),
      fetchPublicFights({ limit: 100, hydrateImages: true }),
      fetchPublicFighters({ limit: 240 }).catch(() => []),
    ]);
    const byId = new Map();
    for (const fight of [...registryRows, ...predictionRows]) {
      const id = String(getFightId(fight) || '');
      if (!id || fight.sourceType === 'shadow' || !entryIsOpen(fight)) continue;
      byId.set(id, { ...(byId.get(id) || {}), ...fight });
    }
    const normalizeName = (name) => String(name || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    const libraryImageFor = (name) => {
      const key = normalizeName(name);
      const fighter = fighterLibrary.find((item) => key && [item.displayName, item.name, item.fighterName, item.fullName].some((candidate) => normalizeName(candidate) === key));
      return fighter?.primaryImage || fighter?.imageUrl || fighter?.profileImage || fighter?.image || '';
    };
    // The fifth homepage fight is a completed BKFC card; preserve it as a
    // visible historical card without falsely offering a new paid entry.
    const historicId = '6acd29b83671964e932b55d8';
    if (!byId.has(historicId)) {
      const historic = [...registryRows, ...predictionRows].find((fight) => String(getFightId(fight)) === historicId);
      if (historic) byId.set(historicId, { ...historic, entryOpen: false });
    }
    const fights = [...byId.values()].map((fight) => {
      const imageA = libraryImageFor(fight.matchFighterA);
      const imageB = libraryImageFor(fight.matchFighterB);
      const isNavarreteFoster = normalizeName(fight.matchFighterA) === 'emanuelnavarrete' && normalizeName(fight.matchFighterB) === 'oshaquiefoster';
      const actualImageA = isNavarreteFoster
        ? 'https://res.cloudinary.com/dq2fwh1ui/image/upload/v1792512163/fighterAImages/dmpnih4rcp3vb8lk3uxt.png'
        : imageA;
      return {
        ...fight,
        ...(actualImageA ? { fighterAPrimaryImage: actualImageA, fighterAImage: actualImageA, resolvedFighterAImage: actualImageA } : {}),
        ...(imageB ? { fighterBPrimaryImage: imageB } : {}),
      };
    });
    return { props: { fights: JSON.parse(JSON.stringify(fights)) } };
  } catch (error) {
    console.error('Play Now fights unavailable:', error);
    return { props: { fights: [] } };
  }
}
