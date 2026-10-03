import Head from 'next/head';
import Link from 'next/link';
import { FaCoins, FaTrophy, FaArrowRight, FaFistRaised } from 'react-icons/fa';
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

export default function PlayPage({ fights = [] }) {
  return <main className="fmm-play-page">
    <Head><title>Play Now | FANTASY MMADNESS</title><meta name="description" content="Choose an open combat sports fight, make predictions, and join the leaderboard." /></Head>
    <section className="fmm-play-hero">
      <div className="fmm-play-shell">
        <Link href="/" className="fmm-play-back">← FANTASY MMADNESS</Link>
        <span className="fmm-play-kicker"><FaFistRaised /> LIVE PLAYER LOBBY</span>
        <h1>PICK A FIGHT.<br/><em>PREDICT THE ACTION.</em></h1>
        <p>Choose an open matchup below. We guide you from entry through your predictions and straight to the leaderboard.</p>
        <div className="fmm-play-journey" aria-label="How to play">
          <span><b>1</b><strong>PICK</strong><small>Choose a fight</small></span>
          <span><b>2</b><strong>ENTER</strong><small>See FM COINS entry</small></span>
          <span><b>3</b><strong>PREDICT</strong><small>Call the action</small></span>
          <span><b>4</b><strong>SUBMIT</strong><small>Lock your picks</small></span>
          <span><b>5</b><strong>CLIMB</strong><small>Track leaderboard</small></span>
        </div>
      </div>
    </section>
    <section className="fmm-play-shell fmm-play-open">
      <header><div><span>OPEN CONTESTS</span><h2>PLAY NOW</h2></div><p>Select a fight to enter the prediction room.</p></header>
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
              <span><FaCoins/><small>ENTRY</small><strong>{Number(fight.matchTokens || 0).toLocaleString()}</strong><b>FM COINS</b></span>
              <span><FaTrophy/><small>PRIZE</small><strong>{getFightPrize(fight)}</strong></span>
            </div>
            <Link href={`/fight/${encodeURIComponent(getFightId(fight))}?play=1`} className="fmm-play-button">PLAY THIS FIGHT <FaArrowRight /></Link>
            <p>Next: verify eligibility, make your predictions, then submit your card.</p>
          </div>
        </article>)}
      </div> : <div className="fmm-play-empty">No fights are open for new predictions right now. Check back for the next card.</div>}
    </section>
  </main>;
}

export async function getServerSideProps({ res }) {
  res.setHeader('Cache-Control', 'no-store');
  try {
    const rows = await fetchPublicPredictionFights({ limit: 100, hydrateImages: false });
    const fights = rows.filter((fight) => getFightId(fight) && fight.sourceType !== 'shadow' && entryIsOpen(fight));
    return { props: { fights: JSON.parse(JSON.stringify(fights)) } };
  } catch (error) {
    console.error('Play Now fights unavailable:', error);
    return { props: { fights: [] } };
  }
}
