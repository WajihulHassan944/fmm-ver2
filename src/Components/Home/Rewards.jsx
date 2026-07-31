import React from 'react';
import Link from 'next/link';
import {
  FaArrowRight,
  FaCoins,
  FaCrown,
  FaGift,
  FaShieldAlt,
  FaTrophy,
} from 'react-icons/fa';

const REWARDS = [
  {
    icon: FaCrown,
    eyebrow: 'Fight-card prize pools',
    value: 'Shown before entry',
    copy: 'Each eligible fight card displays its current prize pool and entry details before a player submits predictions.',
    image: 'https://res.cloudinary.com/dqi6vk2vn/image/upload/v1743522314/home/nrarejwnri8cdalxtlgo.png',
    accent: 'gold',
  },
  {
    icon: FaTrophy,
    eyebrow: 'Bonus challenges',
    value: 'Event-based rewards',
    copy: 'Selected events can include bonus token or prize challenges configured by the platform team.',
    image: 'https://res.cloudinary.com/dqi6vk2vn/image/upload/v1743522401/home/t5vvnlqqu57vgpeumtj2.png',
    accent: 'red',
  },
  {
    icon: FaCoins,
    eyebrow: 'Free and demo entries',
    value: 'Marked on card',
    copy: 'Free-play and demo fight cards are labelled clearly before entry so users know when no coins are needed.',
    image: 'https://res.cloudinary.com/dqi6vk2vn/image/upload/v1743522571/home/hbkim5wxsjmhryavrat0.png',
    accent: 'blue',
  },
];

const Rewards = () => (
  <div className="user-rewards-page">
    <section className="user-rewards-hero">
      <div className="user-rewards-hero-grid" aria-hidden="true" />
      <div className="theme-container user-rewards-hero-layout">
        <div>
          <p><FaGift /> Fight-night member rewards</p>
          <h1>Predict more. <span>Earn the moment.</span></h1>
          <p>Membership keeps every existing reward category intact while presenting the benefits like the premium fight-night program they are.</p>
          <div className="user-rewards-hero-actions">
            <Link href="/upcomingfights">Explore fight cards <FaArrowRight /></Link>
            <Link href="/checkout" className="is-secondary">Open fight wallet <FaCoins /></Link>
          </div>
        </div>
        <aside>
          <FaTrophy />
          <span>Member advantage</span>
          <strong>Compete. Predict. Win.</strong>
          <p>Use the same account, token, and prize flows already available across Fantasy MMAdness.</p>
        </aside>
      </div>
    </section>

    <main className="theme-container user-rewards-main">
      <header className="user-rewards-heading">
        <div><p>Membership has its perks</p><h2>Rewards built for the fight community.</h2></div>
        <span><FaShieldAlt /> Existing eligibility and award rules remain unchanged.</span>
      </header>

      <section className="user-reward-card-grid">
        {REWARDS.map(({ icon: Icon, eyebrow, value, copy, image, accent }, index) => (
          <article className={`user-reward-card is-${accent}`} key={eyebrow}>
            <div className="user-reward-card-number">0{index + 1}</div>
            <div className="user-reward-card-art"><img src={image} alt={eyebrow} /><i><Icon /></i></div>
            <div className="user-reward-card-copy">
              <p>{eyebrow}</p>
              <h3>{value}</h3>
              <span>Live terms on each card</span>
              <small>{copy}</small>
            </div>
          </article>
        ))}
      </section>

      <section className="user-rewards-cta">
        <div><p>Ready for the next card?</p><h2>Put your fight knowledge into play.</h2><span>Browse eligible fights, practice in the mock game, or top up your existing fight wallet.</span></div>
        <div><Link href="/mock-game">Practice free <FaArrowRight /></Link><Link href="/checkout" className="is-secondary">Add wallet tokens</Link></div>
      </section>
    </main>
  </div>
);

export default Rewards;
