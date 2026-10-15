import Head from 'next/head';
import Link from 'next/link';
import { FaTrophy, FaBullseye, FaChartLine, FaCheckCircle } from 'react-icons/fa';
import { FMCoin as FaCoins } from '@/Components/Common/FMCoin';

const steps = [
  ['1','PICK A FIGHT','Choose an open combat-sports contest and review the matchup, entry, and prize.'],
  ['2','VERIFY & ENTER','For paid contests, confirm required eligibility details before entering.'],
  ['3','MAKE PREDICTIONS','Call the action round by round: punches, kicks, knees, elbows, round winners, finishes, and other available metrics.'],
  ['4','SUBMIT YOUR CARD','Review your scorecard and lock in your predictions before the contest closes.'],
  ['5','WATCH & SCORE','Follow the fight. Your predictions are converted into fantasy points from the scored fight data.'],
  ['6','CLIMB THE LEADERBOARD','Track your score against the field and compete for the prizes shown for that contest.'],
];

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

export default function HowToPlayPage(){
  return <main className="fmm-how-page"><PlayerNav />
    <Head><title>How to Play | FANTASY MMADNESS</title><meta name="description" content="Learn how to play FANTASY MMADNESS combat sports prediction contests." /></Head>
    <section className="fmm-how-page-hero"><div>
      <span>FANTASY MMADNESS PLAYER GUIDE</span><h1>HOW TO PLAY</h1>
      <p>Don’t just watch the fight. Predict it. Follow this path from choosing a matchup to the leaderboard.</p>
      <Link href="/play">PLAY A FIGHT →</Link>
    </div></section>
    <section className="fmm-how-page-steps">
      {steps.map(([n,title,copy])=><article key={n}><b>{n}</b><div><h2>{title}</h2><p>{copy}</p></div></article>)}
    </section>
    <section className="fmm-how-page-info">
      <article><FaCoins/><h2>FM COINS</h2><p>Each contest shows its entry requirement before you commit. Your wallet balance stays visible throughout the player flow.</p></article>
      <article><FaBullseye/><h2>PREDICT THE ACTION</h2><p>The available prediction metrics depend on the combat sport. The scorecard labels each metric before you submit.</p></article>
      <article><FaChartLine/><h2>SCORE & RANK</h2><p>Your submitted predictions are scored and reflected on the contest leaderboard.</p></article>
      <article><FaTrophy/><h2>PRIZES</h2><p>Review the displayed contest prize information and entry terms before playing.</p></article>
    </section>
    <section className="fmm-how-page-final"><FaCheckCircle/><h2>READY TO PLAY?</h2><p>Choose an open fight and we’ll guide you through each step.</p><Link href="/play">PLAY A FIGHT →</Link></section>
  </main>;
}
