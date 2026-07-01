import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import {
  FaArrowLeft,
  FaArrowRight,
  FaBullhorn,
  FaCheckCircle,
  FaCoins,
  FaComments,
  FaLink,
  FaMoneyCheckAlt,
  FaShieldAlt,
  FaTrophy,
  FaUserCheck,
  FaUsers,
} from 'react-icons/fa';
import AffiliateExperienceNav from './AffiliateExperienceNav';
import { ExperienceHero, ExperienceSectionHeading } from '@/Components/Theme/ExperiencePrimitives';
import { FMM_ASSET_BASE } from '@/Utils/fightExperience';

const WORKFLOW = [
  {
    icon: FaUserCheck,
    number: '01',
    title: 'Register and get approved',
    copy: 'Affiliate registration is separate from player registration. The affiliate account must be approved by an administrator before promotions can be published.',
  },
  {
    icon: FaTrophy,
    number: '02',
    title: 'Choose a shadow template',
    copy: 'Open the affiliate dashboard, select an approved shadow fight, and continue through the existing promotion creation form.',
  },
  {
    icon: FaCoins,
    number: '03',
    title: 'Configure the campaign',
    copy: 'Set the fight buy-in and prize pot using the fields already available in the promotion workflow.',
  },
  {
    icon: FaLink,
    number: '04',
    title: 'Share the unique fight URL',
    copy: 'Every promoted fight provides a dedicated link that can be distributed through social channels, email, or your own community.',
  },
  {
    icon: FaUsers,
    number: '05',
    title: 'Grow the league',
    copy: 'Players join through your affiliate experience, enter predictions, and become part of the audience you can activate for future cards.',
  },
  {
    icon: FaMoneyCheckAlt,
    number: '06',
    title: 'Track earnings and request payout',
    copy: 'Eligible affiliate earnings appear in the wallet and payout requests continue through PayPal, Venmo, or Cash App settings.',
  },
];

const HowItWorks = () => {
  const router = useRouter();

  return (
    <>
      <Head><title>How Affiliate Promotions Work | Fantasy MMAdness</title></Head>
      <div className="experience-page affiliate-how-page-final">
        <ExperienceHero
          eyebrow="Affiliate operating guide"
          title="Create. Promote."
          accent="Build the crowd."
          description="A clear fight-night workflow for approved creators: configure shadow fights, bring players into your league, and manage promotion earnings without changing the existing platform flow."
          backgroundImage="/images/fmm-pages/premium-affiliate-banner.webp"
          actions={[
            { href: '/AffiliateDashboard', label: 'Open dashboard' },
            { href: '/affiliate-guides', label: 'Affiliate guides', variant: 'secondary' },
          ]}
          stats={[
            { value: '6', label: 'Creator workflow stages', icon: FaBullhorn },
            { value: '1', label: 'Unique URL per campaign', icon: FaLink },
            { value: '3', label: 'Payout methods', icon: FaMoneyCheckAlt },
          ]}
        >
        </ExperienceHero>

        <AffiliateExperienceNav />

        <main className="xp-page-main affiliate-how-main-final">
          <div className="theme-container">
            <button type="button" className="affiliate-inline-back" onClick={() => router.back()}>
              <FaArrowLeft /> Return to previous page
            </button>

            <section className="xp-page-section">
              <ExperienceSectionHeading
                eyebrow="From approval to payout"
                title="The affiliate fight cycle"
                description="Each stage below mirrors the existing affiliate process and organizes it into one consistent operating playbook."
              />
              <div className="affiliate-how-step-grid">
                {WORKFLOW.map(({ icon: Icon, number, title, copy }) => (
                  <article key={number}>
                    <div><Icon /><span>{number}</span></div>
                    <h3>{title}</h3>
                    <p>{copy}</p>
                  </article>
                ))}
              </div>
            </section>

            <section className="affiliate-how-rules-panel">
              <div className="affiliate-how-rules-copy">
                <p className="xp-eyebrow"><FaShieldAlt /> Campaign safeguards</p>
                <h2>What happens around the prize pot.</h2>
                <p>
                  The platform keeps the existing campaign rules visible so creators can communicate them clearly before asking their audience to enter a fight.
                </p>
                <ul>
                  <li><FaCheckCircle /> If the required fight budget is not met, the fight is cancelled and participant tokens are returned.</li>
                  <li><FaCheckCircle /> When the campaign reaches its required budget, eligible profit beyond the configured amount contributes to the affiliate wallet under the existing split.</li>
                  <li><FaCheckCircle /> Affiliates promote and manage the event but do not participate in their own promoted fight.</li>
                  <li><FaCheckCircle /> Fight chat keeps the creator connected with members while predictions and results remain handled by the existing platform.</li>
                </ul>
              </div>
              <div className="affiliate-how-rules-art" aria-hidden="true">
                <img src={`${FMM_ASSET_BASE}/fighter-action-red.jpg`} alt="" />
                <div><FaComments /><strong>Community first</strong><span>Promote, engage, and keep the crowd informed.</span></div>
              </div>
            </section>

            <section className="affiliate-how-cta-final">
              <div>
                <p className="xp-eyebrow">Ready for the next card?</p>
                <h2>Turn an approved template into your next promotion.</h2>
                <p>Use the same creation, league, campaign, and payout functionality already connected to your affiliate account.</p>
              </div>
              <div>
                <Link href="/AffiliateDashboard" className="theme-btn theme-btn-primary">Create a promotion <FaArrowRight /></Link>
                <Link href="/AffiliateProfile" className="theme-btn theme-btn-secondary">Creator profile</Link>
              </div>
            </section>
          </div>
        </main>
      </div>
    </>
  );
};

export default HowItWorks;
