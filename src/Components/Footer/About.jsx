import Link from 'next/link';
import { FaArrowRight, FaBolt, FaChartLine, FaFistRaised, FaTrophy } from 'react-icons/fa';

export default function About() {
  return (
    <main className="experience-page about-experience-page">
      <section className="theme-container player-command-hero" style={{marginTop:'28px'}}>
        <div className="player-command-hero-copy">
          <p className="xp-eyebrow"><FaBolt /> COMBAT SPORTS · NOW INTERACTIVE</p>
          <h1>WE DON'T PICK WINNERS. WE PREDICT HISTORY.</h1>
          <p>FANTASY MMADNESS turns fight night into an interactive prediction experience across boxing, MMA, kickboxing, bare knuckle and pro wrestling. Predict the action, score points, climb leaderboards and compete for prizes.</p>
          <div className="player-command-hero-actions"><Link href="/play">Play now <FaArrowRight /></Link><Link href="/how-to-play" className="is-secondary">How to play</Link></div>
        </div>
      </section>
      <section className="theme-container" style={{paddingTop:32, maxWidth:1000, margin:'0 auto'}}>
        <p className="xp-eyebrow">OUR STORY · FOUNDER KELLY DAVIS</p>
        <h2>FROM THE CHAMPIONSHIP CORNER TO INTERACTIVE FIGHT NIGHT</h2>
        <p>Kelly Davis began amateur boxing in Reno, Nevada, alongside his brother Kelvin, developing their craft through the Boys &amp; Girls Club and University of Nevada boxing community. Kelly went on to train and manage Kelvin “Koncrete” Davis, who won the IBF Cruiserweight World Championship in 2004.</p>
        <p>The brothers' journey was documented in <em>The Ring</em> magazine's multi-page feature <strong>“Brothers-In-Arms: How Kelvin &amp; Kelly Davis Took Their Two-Man Bandwagon to the Top,”</strong> written by Mike Houser, with photography credited to Tom Casino / Showtime.</p>
        <p>Across more than three decades in combat sports, Kelly has worked as a trainer, manager, gym owner and ringside professional in boxing, MMA, kickboxing and bare-knuckle competition. His experience with the details of each round shaped FANTASY MMADNESS: a platform where fans predict the action instead of merely selecting a winner.</p>
        <p>Our longer-term mission includes helping fighters build stronger connections with fans and explore opportunities beyond their competitive careers.</p>
      </section>
      <section className="theme-container user-reward-card-grid" style={{paddingTop:'32px',paddingBottom:'56px'}}>
        <article className="user-reward-card"><div className="user-reward-card-copy"><FaFistRaised /><h2>Predict the action</h2><p>Build a prediction card around the fight itself—not simply the winner.</p></div></article>
        <article className="user-reward-card"><div className="user-reward-card-copy"><FaChartLine /><h2>Score every fight</h2><p>Follow the official FANTASY MMADNESS scoring experience and see how your calls perform.</p></div></article>
        <article className="user-reward-card"><div className="user-reward-card-copy"><FaTrophy /><h2>Climb the leaderboard</h2><p>Turn fight IQ into points, rankings, league competition and prize opportunities.</p></div></article>
      </section>
    </main>
  );
}
