import React from 'react';
import Link from 'next/link';
import {
  FaArrowRight,
  FaBullhorn,
  FaChartLine,
  FaCheckCircle,
  FaCoins,
  FaFistRaised,
  FaGift,
  FaMicrophone,
  FaQrcode,
  FaShareAlt,
  FaShieldAlt,
  FaUserCircle,
  FaWallet,
} from 'react-icons/fa';

const quickSteps = [
  {
    icon: FaUserCircle,
    title: 'Set up your affiliate profile',
    copy: 'Add your display name, profile image, contact details, and payment preference so your league looks trustworthy.',
  },
  {
    icon: FaFistRaised,
    title: 'Create or promote a fight',
    copy: 'Choose the fight, confirm the entry tokens, set the reward structure, and publish the promotion when it is ready.',
  },
  {
    icon: FaShareAlt,
    title: 'Share the campaign link',
    copy: 'Use the public campaign link, QR code, and social-ready promo content to bring players into your fight room.',
  },
  {
    icon: FaChartLine,
    title: 'Track players and results',
    copy: 'Watch signups, player activity, and fight performance from your dashboard before requesting a payout.',
  },
];

const guideCards = [
  {
    icon: FaBullhorn,
    title: 'Promotion fights',
    points: ['Open Affiliate Dashboard', 'Create or select a fight promotion', 'Confirm the fight, reward, and entry details', 'Publish only when the campaign is ready'],
  },
  {
    icon: FaQrcode,
    title: 'Promo links and QR',
    points: ['Open a promoted fight', 'Copy the public campaign link', 'Download or share the QR/promo asset', 'Send users directly to the fight page'],
  },
  {
    icon: FaCoins,
    title: 'Tokens and rewards',
    points: ['Check entry-token requirements', 'Confirm the reward/pot setup', 'Make sure enough players join before lock time', 'Review final outcome after scoring'],
  },
  {
    icon: FaWallet,
    title: 'Payout workflow',
    points: ['Keep payment details updated', 'Review available balance', 'Submit payout request from profile', 'Wait for admin processing and confirmation'],
  },
  {
    icon: FaMicrophone,
    title: 'Podcast/promo content',
    points: ['Open fight details', 'Record a short fight preview', 'Save it to the campaign', 'Use it to make the promotion feel more personal'],
  },
  {
    icon: FaGift,
    title: 'League growth',
    points: ['Invite users consistently', 'Share fresh fights quickly', 'Use bonuses/rewards where available', 'Keep the league active with new opportunities'],
  },
];

const AffiliateGuide = () => {
  return (
    <main className="affiliate-guide-premium-page">
      <section className="affiliate-guide-premium-hero">
        <div className="affiliate-guide-premium-orb is-one" />
        <div className="affiliate-guide-premium-orb is-two" />
        <div className="theme-container affiliate-guide-premium-hero-grid">
          <div className="affiliate-guide-premium-copy">
            <p className="affiliate-guide-premium-eyebrow"><FaShieldAlt /> Affiliate playbook</p>
            <h1>Promote fights. Build a league. <span>Get players moving.</span></h1>
            <p>
              A shorter affiliate guide for the real workflow: create the campaign, share the fight, track activity, and request payouts without scrolling through long screenshot tutorials.
            </p>
            <div className="affiliate-guide-premium-actions">
              <Link href="/AffiliateDashboard">Open affiliate dashboard <FaArrowRight /></Link>
              <Link href="/AffiliatePromotion" className="is-secondary">Create promotion</Link>
            </div>
          </div>
          <aside className="affiliate-guide-premium-card">
            <FaFistRaised />
            <strong>Fast affiliate checklist</strong>
            <span>Profile · Promotion · Share · Track · Payout</span>
            <small>No long screenshots. Just the steps affiliates need to take action.</small>
          </aside>
        </div>
      </section>

      <section className="theme-container affiliate-guide-premium-steps">
        {quickSteps.map(({ icon: Icon, title, copy }, index) => (
          <article key={title}>
            <span>{String(index + 1).padStart(2, '0')}</span>
            <i><Icon /></i>
            <h2>{title}</h2>
            <p>{copy}</p>
          </article>
        ))}
      </section>

      <section className="theme-container affiliate-guide-premium-section">
        <header>
          <p><FaBullhorn /> Affiliate operations</p>
          <h2>Everything affiliates need, grouped by action.</h2>
          <span>Use this page as a clean reference while managing fight promotions.</span>
        </header>
        <div className="affiliate-guide-premium-grid">
          {guideCards.map(({ icon: Icon, title, points }) => (
            <article key={title}>
              <div><Icon /></div>
              <h3>{title}</h3>
              <ul>
                {points.map((point) => <li key={point}><FaCheckCircle /> {point}</li>)}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <section className="theme-container affiliate-guide-premium-reminder">
        <div>
          <p><FaWallet /> Payout reminder</p>
          <h2>Keep account and payment details current.</h2>
          <span>Affiliate payout requests depend on correct profile, balance, and payment information. Review profile settings before requesting a payout.</span>
        </div>
        <Link href="/AffiliateProfile">Update affiliate profile <FaArrowRight /></Link>
      </section>
    </main>
  );
};

export default AffiliateGuide;
