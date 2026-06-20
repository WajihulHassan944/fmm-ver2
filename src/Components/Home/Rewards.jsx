import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { FaArrowRight, FaCoins, FaCrown, FaGift, FaMedal, FaShieldAlt, FaTrophy } from 'react-icons/fa';
import { ExperienceHero, ExperienceSectionHeading } from '@/Components/Theme/ExperiencePrimitives';
import { FMM_ASSET_BASE } from '@/Utils/fightExperience';

const rewards = [
  {
    icon: FaCrown,
    amount: 'Up to $10,000',
    label: 'Winner award',
    copy: 'Premium contest rewards configured for selected fight cards and announced before entry.',
    accent: 'gold',
  },
  {
    icon: FaTrophy,
    amount: 'Up to $200',
    label: 'Admin award',
    copy: 'Special challenge rewards and administrator-selected incentives when specified on a contest.',
    accent: 'blue',
  },
  {
    icon: FaCoins,
    amount: '$20 in tokens',
    label: 'New player starter',
    copy: 'A starting token balance tied to eligible account creation and active membership rules.',
    accent: 'red',
  },
];

const Rewards = () => (
  <>
    <Head>
      <title>Rewards & Fight Tokens | Fantasy MMAdness</title>
      <meta name="description" content="Learn how Fantasy MMAdness fight tokens, contest rewards, and prediction performance connect across the platform." />
    </Head>
    <div className="experience-page rewards-experience-page">
      <ExperienceHero
        eyebrow="The reward corner"
        title="Every sharp prediction"
        accent="should feel valuable."
        description="Fight tokens power contest entry. Accurate picks build points. Selected cards add announced prizes and special rewards to the competition."
        backgroundImage={`${FMM_ASSET_BASE}/fighter-duel-arena.jpg`}
        actions={[
          { href: '/fights?status=upcoming', label: 'Find a contest' },
          { href: '/guides', label: 'Understand scoring', variant: 'secondary' },
        ]}
        stats={[
          { value: '$10K', label: 'Top advertised tier', icon: FaCrown },
          { value: '250', label: 'Perfect-fight points', icon: FaTrophy },
          { value: '$20', label: 'Starter token value', icon: FaCoins },
        ]}
      >
        <div className="xp-reward-hero-card">
          <div className="xp-reward-ring"><FaTrophy /></div>
          <div className="xp-reward-ticket">
            <span>Fantasy MMAdness</span>
            <strong>Fight rewards</strong>
            <small>Predict · Score · Climb · Win</small>
            <i />
          </div>
          <img src={`${FMM_ASSET_BASE}/fighter-anthony-yarde.png`} alt="Fantasy fight contender" />
        </div>
      </ExperienceHero>

      <main className="xp-page-main">
        <div className="theme-container">
          <section className="xp-page-section">
            <ExperienceSectionHeading
              eyebrow="Reward formats"
              title="More reasons to stay until the final bell"
              description="Reward availability varies by fight card. Always review the contest details and eligibility information displayed before entry."
            />
            <div className="xp-reward-grid">
              {rewards.map(({ icon: Icon, amount, label, copy, accent }, index) => (
                <article className={`xp-reward-card is-${accent}`} key={label}>
                  <div className="xp-reward-card-index">0{index + 1}</div>
                  <div className="xp-reward-card-icon"><Icon /></div>
                  <span>{label}</span>
                  <h3>{amount}</h3>
                  <p>{copy}</p>
                  <Link href="/fights?status=upcoming">Explore eligible fights <FaArrowRight /></Link>
                </article>
              ))}
            </div>
          </section>

          <section className="xp-page-section">
            <ExperienceSectionHeading
              eyebrow="The reward path"
              title="From prediction card to payout moment"
              description="A clear four-step path keeps the focus on the contest rather than on confusing mechanics."
            />
            <div className="xp-reward-path">
              {[
                { icon: FaCoins, title: 'Load your wallet', copy: 'Use the token balance attached to your player account for eligible contest entry.' },
                { icon: FaMedal, title: 'Submit your card', copy: 'Make round-by-round picks before the fight lock and confirm the entry.' },
                { icon: FaShieldAlt, title: 'Scores are verified', copy: 'Completed fight statistics are processed against the submitted prediction card.' },
                { icon: FaGift, title: 'Rewards are applied', copy: 'Points, tokens, and announced contest rewards follow the configured contest rules.' },
              ].map(({ icon: Icon, title, copy }, index) => (
                <article key={title}>
                  <span>{index + 1}</span><Icon /><h3>{title}</h3><p>{copy}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="xp-wallet-banner">
            <div className="xp-wallet-banner-art">
              <img src={`${FMM_ASSET_BASE}/fighter-action-blue.jpg`} alt="Fight arena lighting" loading="lazy" />
            </div>
            <div>
              <p className="xp-eyebrow">Fight wallet</p>
              <h2>Your token balance, contest entries, and rewards—one corner.</h2>
              <p>Sign in to review your current wallet or create a player account to enter the next eligible fight card.</p>
              <div>
                <Link href="/auth?mode=login&role=player" className="theme-btn theme-btn-secondary">Open my wallet</Link>
                <Link href="/auth?mode=signup&role=player" className="theme-btn theme-btn-primary">Create player account</Link>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  </>
);

export default Rewards;
