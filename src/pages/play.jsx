import Head from 'next/head';
import Link from 'next/link';
import { FaTrophy, FaArrowRight } from 'react-icons/fa';
import { FMCoin as FaCoins } from '@/Components/Common/FMCoin';
import { fetchPublicPredictionFights } from '@/Utils/publicApi';
import { formatFightDate, getFightCategory, getFightId, getFightName, getFighterImage, getFightPrize } from '@/Utils/fightExperience';

const entryIsOpen = (fight) => {
  if (typeof fight.entryOpen === 'boolean') return fight.entryOpen;
  const status = `${fight.matchStatus || ''} ${fight.matchShadowOpenStatus || ''}`.toLowerCase();
  if (/finished|closed|draft|completed|cancelled/.test(status)) return false;
  const date = String(fight.matchDate || '').slice(0, 10);
  const time = /^\d{1,2}:\d{2}/.test(String(fight.matchTime || '')) ? String(fight.matchTime).slice(0, 5) : '23:59';
  const lock = fight.lockAt ? new Date(fight.lockAt).getTime() : date ? new Date(`${date}T${time}:00`).getTime() : NaN;
  return Number.isFinite(lock) && lock > Date.now();
};

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
            <img src={getFighterImage(fight, 'A', 0)} alt="" />
            <b>VS</b>
            <img src={getFighterImage(fight, 'B', 1)} alt="" />
            <span>{getFightCategory(fight)}</span>
          </div>
          <div className="fmm-play-card-copy">
            <small>{formatFightDate(fight)}</small>
            <h2>{getFightName(fight)}</h2>
            <div className="fmm-play-money">
              <span><FaCoins/><small>ENTRY · FM COINS</small><strong>{Number(fight.matchTokens || 0).toLocaleString()}</strong></span>
              <span><FaTrophy/><small>PRIZE</small><strong>{getFightPrize(fight)}</strong></span>
            </div>
            <Link href={`/fight/${encodeURIComponent(getFightId(fight))}?play=1`} className="fmm-play-button" onClick={() => { if (typeof window !== "undefined" && typeof window.gtag === "function") window.gtag("event", "select_fight", { fight_id: String(getFightId(fight)).slice(0, 100), fight_category: String(getFightCategory(fight)).slice(0, 40), send_to: "G-TP1C9005WD" }); }}>PLAY THIS FIGHT <FaArrowRight /></Link>
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
    const rows = await fetchPublicPredictionFights({ limit: 100, hydrateImages: true });
    const fights = rows.filter((fight) => getFightId(fight) && fight.sourceType !== 'shadow' && entryIsOpen(fight));
    return { props: { fights: JSON.parse(JSON.stringify(fights)) } };
  } catch (error) {
    console.error('Play Now fights unavailable:', error);
    return { props: { fights: [] } };
  }
}
