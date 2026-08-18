import React from 'react';
import Link from 'next/link';
import {
  FaArrowRight,
  FaBolt,
  FaCoins,
  FaCrosshairs,
  FaFistRaised,
  FaGift,
  FaLayerGroup,
  FaSearch,
  FaShieldAlt,
  FaTrophy,
} from 'react-icons/fa';

const TIPS = [
  {
    icon: FaCoins,
    title: 'Maximize Your Free Signup Tokens',
    copy: 'Start strong by using your 20 free tokens wisely. Test different games, explore various fantasy formats, and familiarize yourself with the platform before spending real money.',
  },
  {
    icon: FaGift,
    title: 'Use the Spin Wheel',
    copy: 'Spin the wheel for a free shot at earning bonus tokens or exclusive perks. It’s a quick, risk-free way to keep your token stash growing.',
  },
  {
    icon: FaTrophy,
    title: 'Try the Slot Machine for Bonus Tokens',
    copy: 'The slot machine isn’t just for fun — it’s a great chance to win extra tokens you can reinvest in your fantasy picks. Take a shot when you have extras!',
  },
  {
    icon: FaSearch,
    title: 'Research Before You Pick',
    copy: 'Solid research leads to smarter picks. Check stats, recent performances, and matchups to back your fantasy lineups with strategy, not luck.',
  },
  {
    icon: FaLayerGroup,
    title: 'Diversify Your Picks',
    copy: 'Spread your picks across different games or matchups to reduce risk. A balanced token strategy helps maximize long-term wins.',
  },
  {
    icon: FaCrosshairs,
    title: 'Play the Odds, Not the Hype',
    copy: 'Skip the popular hype trains. Go for underrated players or fighters with strong stats and value potential — they often offer better returns.',
  },
  {
    icon: FaShieldAlt,
    title: 'Join Low-Entry Games to Learn',
    copy: 'If you’re new, start with low-stake fantasy games to test strategies without burning through tokens. Practice smart and grow with confidence.',
  },
  {
    icon: FaBolt,
    title: 'Watch for Token Multipliers',
    copy: 'Keep an eye out for token multiplier events. Playing during these windows can double your rewards and help you climb the ranks faster.',
  },
  {
    icon: FaFistRaised,
    title: 'Check Platform-Specific Perks',
    copy: 'Each site — like BetFMMA.com or BetCombatSports.com or FantasyMmadness.com — may offer exclusive perks. Explore them all to discover unique games, token bonuses, and fantasy formats.',
  },
  {
    icon: FaTrophy,
    title: 'Use Fantasy for Fun, Not Just Profit',
    copy: 'Fantasy gaming is about fun, community, and clever strategy. Use your free and earned tokens to enjoy the experience while sharpening your game sense.',
  },
];

const FantasyTips = () => (
  <section className="premium-tips-phase-two">
    <div className="premium-tips-phase-two-glow" aria-hidden="true" />
    <div className="theme-container premium-tips-phase-two-shell">
      <header className="premium-tips-phase-two-header">
        <div>
          <p className="xp-eyebrow"><FaCrosshairs /> Prediction playbook</p>
          <h2>Ten habits for a sharper fight-night strategy.</h2>
          <p>
            Whether you’re on Fantasy MMAdness, Bet Fantasy Madness, BetFMMA.com, or
            BetCombatSports.com, these original tips remain intact—now organized as a premium,
            scan-friendly fight camp.
          </p>
        </div>
        <aside>
          <span><FaShieldAlt /> Practice first</span>
          <strong>Research. Predict. Review.</strong>
          <p>Use the mock game to test ideas before entering live fight cards.</p>
          <Link href="/mock-game">Open mock game <FaArrowRight /></Link>
        </aside>
      </header>

      <div className="premium-tips-phase-two-grid">
        {TIPS.map(({ icon: Icon, title, copy }, index) => (
          <article key={title}>
            <div className="premium-tips-phase-two-number">{String(index + 1).padStart(2, '0')}</div>
            <div className="premium-tips-phase-two-icon"><Icon /></div>
            <h3>{title}</h3>
            <p>{copy}</p>
          </article>
        ))}
      </div>

      <footer className="premium-tips-phase-two-cta">
        <div>
          <p className="xp-eyebrow">Put the playbook into action</p>
          <h2>Study the next card, then make the pick.</h2>
        </div>
        <div>
          <Link href="/upcomingfights" className="theme-btn theme-btn-primary">Browse upcoming fights <FaArrowRight /></Link>
          <Link href="/fighter-performance-tracker" className="theme-btn theme-btn-secondary">Open fighter tracker</Link>
        </div>
      </footer>
    </div>
  </section>
);

export default FantasyTips;
