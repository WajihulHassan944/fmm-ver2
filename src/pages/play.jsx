import Head from 'next/head';
import Link from 'next/link';
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
  return <main style={{ minHeight: '100vh', background: '#080b13', color: '#fff', padding: '30px max(18px, 5vw) 90px' }}>
    <Head><title>Play Now | FANTASY MMADNESS</title><meta name="description" content="Choose an open combat sports fight, make predictions, and join the leaderboard." /></Head>
    <div style={{ maxWidth: 1200, margin: 'auto' }}>
      <Link href="/" style={{ color: '#f5a623' }}>← FANTASY MMADNESS</Link>
      <h1 style={{ fontSize: 'clamp(36px, 6vw, 68px)', marginBottom: 8 }}>PLAY NOW</h1>
      <p style={{ color: '#bec7d7', maxWidth: 680 }}>Pick an open fight. Sign in or create a player account, make your predictions, and compete on its leaderboard. You can join directly without an affiliate link.</p>
      {fights.length ? <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))', gap: 18, marginTop: 30 }}>
        {fights.map((fight) => <article key={getFightId(fight)} style={{ border: '1px solid #46526b', borderRadius: 16, overflow: 'hidden', background: '#111827' }}>
          <div style={{ display: 'flex', height: 'clamp(230px, 25vw, 300px)', background: 'radial-gradient(ellipse at center bottom, #1c263b, #080b13 75%)' }}>
            <img src={getFighterImage(fight, 'A', 0)} alt="" style={{ display: 'block', width: '50%', height: '100%', objectFit: 'contain', objectPosition: 'center bottom' }} />
            <img src={getFighterImage(fight, 'B', 1)} alt="" style={{ display: 'block', width: '50%', height: '100%', objectFit: 'contain', objectPosition: 'center bottom' }} />
          </div>
          <div style={{ padding: 20 }}>
            <small style={{ color: '#f5a623' }}>{getFightCategory(fight)} · {formatFightDate(fight)}</small>
            <h2 style={{ fontSize: 24, margin: '12px 0' }}>{getFightName(fight)}</h2>
            <p>Entry: {Number(fight.matchTokens || 0).toLocaleString()} FM coins · Prize: {getFightPrize(fight)}</p>
            <Link href={`/fight/${encodeURIComponent(getFightId(fight))}?play=1`} style={{ display: 'inline-block', padding: '12px 20px', borderRadius: 8, background: '#f5a623', color: '#150b08', fontWeight: 800 }}>PLAY THIS FIGHT →</Link>
          </div>
        </article>)}
      </div> : <div style={{ padding: 32, border: '1px solid #46526b', borderRadius: 12, marginTop: 30 }}>No fights are open for new predictions right now. Check back for the next card.</div>}
    </div>
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
