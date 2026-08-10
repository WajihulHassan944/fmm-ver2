import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { FaArrowRight, FaBolt, FaCheckCircle, FaCoins, FaLock, FaShieldAlt, FaTrophy, FaUsers } from 'react-icons/fa';
import { WrestlingHero, WrestlingModeNav, WrestlingSectionHeading } from './WrestlingPrimitives';
import { WRESTLING_STATS, wrestlingRequest } from '@/Utils/proWrestling';

const WrestlingHowToPlayPage = () => {
  const [config, setConfig] = useState(null);
  useEffect(() => { wrestlingRequest('/api/wrestling/config').then(setConfig).catch(console.error); }, []);
  const categories = config?.categories || {};
  const categoryWeight = (key) => categories?.[key]?.weight ?? (Array.isArray(categories) ? categories.find((item) => item.key === key)?.weight : null);
  return <><Head><title>How Pro Wrestling Works | Fantasy MMAdness</title></Head><div className="pw-page pw-how-page">
    <WrestlingHero eyebrow="Pro Wrestling player guide" title="Predict the whole match." accent="Not only the winner." description="Learn the finalized Pro Wrestling lifecycle: one 25-minute match, five action categories, two-way winner pick, 100-point winner bonus, 500-point finish market, and 25-point survival result." actions={[{ href: '/pro-wrestling', label: 'Open wrestling lobby', icon: FaArrowRight }, { href: '/pro-wrestling/wrestlers', label: 'Research wrestlers', secondary: true, icon: FaUsers }]} stats={[{ value: '5', label: 'Action categories', icon: FaBolt }, { value: '2', label: 'Competitor scorecards', icon: FaUsers }, { value: '100', label: 'Winner bonus', icon: FaTrophy }]} background="/images/pro-wrestling/prediction-mockup.webp" />
    <WrestlingModeNav active="rules" />
    <main className="theme-container pw-main">
      <section className="pw-section"><WrestlingSectionHeading eyebrow="Six-stage game flow" title="From contest lobby to payout" description="The wrestling mode uses the same Fantasy MMAdness account and fight wallet while applying a dedicated full-match scoring engine." /><div className="pw-how-flow-grid">{[
        ['01', FaUsers, 'Enter a contest', 'Review the pot, entry fee, participant limits, and prediction lock time.'],
        ['02', FaCoins, 'Commit wallet tokens', 'Your entry fee is deducted once through the existing fight wallet.'],
        ['03', FaBolt, 'Predict both wrestlers', 'Forecast HP, BP, K, PM, and FM totals for each competitor.'],
        ['04', FaTrophy, 'Pick the winner', 'Choose Wrestler A or Wrestler B only. There is no public draw pick.'],
        ['05', FaLock, 'Predictions lock', 'The backend closes scorecard editing at the published lock time.'],
        ['06', FaCheckCircle, 'Track and settle', 'Follow live scoring across the 25-minute match, then review final rank and payout.'],
      ].map(([number, Icon, title, copy]) => <article key={number}><span>{number}</span><Icon /><h3>{title}</h3><p>{copy}</p></article>)}</div></section>

      <section className="pw-section"><WrestlingSectionHeading eyebrow="Full-match action categories" title="What you predict" description="Each value represents the predicted total for the complete match—not a round-by-round estimate." /><div className="pw-rule-category-grid">{WRESTLING_STATS.map((stat) => <article key={stat.key}><strong>{stat.short}</strong><div><h3>{stat.label}</h3><p>{stat.description}</p></div><span>{categoryWeight(stat.key) ? `${categoryWeight(stat.key)}× category weight` : 'Weighted accuracy'}</span></article>)}</div></section>

      <section className="pw-scoring-explainer"><div><p className="pw-eyebrow"><FaShieldAlt /> Final scoring</p><h2>Finalized scoring is simple and consistent.</h2><p>Wrestling uses the official finalized model: a flat 100-point bonus for the correct match winner, a 500-point bonus for the correctly called pinfall/submission finish market, and a 25-point survival result when the finish market misses. Stats for HP, BP, K, PM, and FM are tracked live through the full 25-minute match.</p><div className="pw-accuracy-bands"><span><strong>100</strong><small>Winner bonus</small></span><span><strong>500</strong><small>Finish market</small></span><span><strong>25</strong><small>Survival result</small></span><span><strong>25:00</strong><small>Full match</small></span></div></div><aside><FaTrophy /><small>Correct winner bonus</small><strong>100 points</strong><p>The public winner pick is two-way only: Wrestler A or Wrestler B. Draw/no-contest handling stays an admin settlement state, not a user winner pick.</p></aside></section>

      <section className="pw-section pw-how-rules"><WrestlingSectionHeading eyebrow="Competitive safeguards" title="How ties, cancellations, and payouts work" /><div>{[
        ['Tie-break order', 'Highest score, lowest normalized prediction error, most exact categories, closest finisher prediction, then earliest valid submission.'],
        ['Live standings', 'Scores and rank changes remain provisional until the official result is set and the contest is finalized.'],
        ['Payouts', 'The configured top percentage of players receives the player pot. Settlement is idempotent and cannot pay twice.'],
        ['Cancellation and no contest', 'Eligible entry fees are refunded exactly once through the wrestling wallet ledger.'],
      ].map(([title, copy]) => <article key={title}><FaCheckCircle /><span><strong>{title}</strong><p>{copy}</p></span></article>)}</div></section>

      <section className="pw-final-cta"><div><p>Ready to build a scorecard?</p><h2>Enter the next Pro Wrestling contest.</h2><span>Research both competitors, predict every action category, and see where your fight IQ lands.</span></div><Link href="/pro-wrestling" className="pw-btn pw-btn-primary">Browse wrestling cards <FaArrowRight /></Link></section>
    </main>
  </div></>;
};
export default WrestlingHowToPlayPage;
