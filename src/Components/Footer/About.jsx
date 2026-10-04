import Link from 'next/link';
import { FaArrowRight, FaBolt, FaChartLine, FaFistRaised, FaTrophy } from 'react-icons/fa';

export default function About() {
  return (
    <main className="experience-page about-experience-page">
      <section className="theme-container player-command-hero" style={{marginTop:'28px'}}>
        <div className="player-command-hero-copy">
          <p className="xp-eyebrow"><FaBolt /> COMBAT SPORTS · NOW INTERACTIVE</p>
          <h1>We don't pick winners. We predict the game.</h1>
          <p>FANTASY MMADNESS turns fight night into an interactive prediction experience across boxing, MMA, kickboxing, bare knuckle and pro wrestling. Predict the action, score points, climb leaderboards and compete for prizes.</p>
          <div className="player-command-hero-actions"><Link href="/play">Play now <FaArrowRight /></Link><Link href="/how-to-play" className="is-secondary">How to play</Link></div>
        </div>
      </section>
      <section className="theme-container user-reward-card-grid" style={{paddingTop:'32px',paddingBottom:'56px'}}>
        <article className="user-reward-card"><div className="user-reward-card-copy"><FaFistRaised /><h2>Predict the action</h2><p>Build a prediction card around the fight itself—not simply the winner.</p></div></article>
        <article className="user-reward-card"><div className="user-reward-card-copy"><FaChartLine /><h2>Score every fight</h2><p>Follow the official FANTASY MMADNESS scoring experience and see how your calls perform.</p></div></article>
        <article className="user-reward-card"><div className="user-reward-card-copy"><FaTrophy /><h2>Climb the leaderboard</h2><p>Turn fight IQ into points, rankings, league competition and prize opportunities.</p></div></article>
      </section>
    </main>
  );
}
